// Cloudflare Worker — proxies football-data.org scores for WC 2026
// Secrets: FOOTBALL_DATA_API_KEY, GROQ_API_KEY
//
// Two unrelated jobs live in this one file, split by URL path in the
// `fetch` handler below:
//   GET  /            → handleScores()   live match scores (public, no auth)
//   POST /analysis    → handleAnalysis() AI-generated insights (this app's
//                        frontend only, but the endpoint itself has no auth
//                        beyond CORS — see corsHeaders())

// football-data.org spells some countries differently than this app does.
// Every score response gets run through norm() so both sides agree on a
// single canonical name (e.g. "IR Iran" from the API becomes "Iran" here).
const NAME_MAP = {
  "Côte d'Ivoire":               'Ivory Coast',
  "Turkey":                       'Turkiye',
  "Türkiye":                      'Turkiye',
  "IR Iran":                      'Iran',
  "United States of America":     'United States',
  "USA":                          'United States',
  "Democratic Republic of Congo": 'DR Congo',
  "Congo DR":                     'DR Congo',
  "Korea Republic":               'South Korea',
  "Republic of Korea":            'South Korea',
  "Czech Republic":               'Czechia',
  "Curaçao":                      'Curacao',
  "Cabo Verde":                   'Cape Verde',
  "Cape Verde Islands":           'Cape Verde',
  "Bosnia-Herzegovina":           'Bosnia and Herzegovina',
  "Bosnia and Herzegovina":       'Bosnia and Herzegovina',
}

// Looks up a name in NAME_MAP; falls through unchanged if it's not a name
// football-data.org spells differently (i.e. most names).
function norm(name) {
  return NAME_MAP[name] ?? name
}

// football-data.org's match `status` field, sorted into the two buckets the
// frontend actually cares about: currently being played, or finished. Every
// other status (SCHEDULED, POSTPONED, ...) is simply not included in the
// scores response — the frontend only ever needs to know about matches that
// are live or done.
const LIVE = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'])
const DONE = new Set(['FINISHED', 'AWARDED'])

export default {
  // Entry point Cloudflare calls for every request to this Worker.
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    // Browsers send a CORS preflight OPTIONS request before the real POST to
    // /analysis (since it's cross-origin and sends a JSON body). Answer it
    // directly here so it never reaches either route handler below.
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    if (url.pathname === '/analysis' && request.method === 'POST') {
      return handleAnalysis(request, env, ctx)
    }

    // Everything else (in practice, just GET /) serves live scores.
    return handleScores(request, env, ctx)
  },
}

// ── AI insights endpoint (synchronous generate + critique + KV cache) ──────
//
// Insights go through two sequential Groq calls, then get cached in KV:
//   • cache hit  → return the stored insights instantly
//   • cache miss → DRAFT: generate 4 candidate insights
//                → CRITIQUE: a second pass reviews each draft against the
//                  full team data and either fixes, replaces, or passes it
//                  through unchanged — see buildCritiquePrompt()
//                → cache the critiqued result, return it
//
// The critique pass exists because a single generation pass would happily
// call two teams with opposite outcomes a "Pattern", or frame a team
// succeeding BECAUSE of a small (i.e. favourable) climate/timezone gap as
// "surprising"/"despite" — technically well-formed JSON, but logically
// wrong. The critique prompt re-checks every draft against the full,
// un-cherry-picked team list before anything is cached or shown.
//
// The cache key is `promptVersion:hash(tournament data):round`. `round`
// (1, 2, 3, ...) lets the frontend request successive fresh batches for the
// *same* underlying data — each round gets its own cache slot, so repeat
// clicks return new insights instead of the same cached array forever, while
// still being instant for every user after the first to reach that round.
// MAX_ROUNDS caps how many rounds exist per data state; keep this in sync
// with MAX_AI_ROUNDS in src/components/InsightsView.vue. PROMPT_VERSION
// ensures a prompt edit isn't masked by stale cached output.
//
// We deliberately do NOT use the `openrouter/free` random router here: it
// sometimes lands on 60–90s reasoning models. A curated fast-model list keeps
// each Groq call in the ~2–3s range typically (30s hard cap), so the two
// sequential calls together are still comfortably within a single request.

// Provider config lives in these two constants only, deliberately — swapping
// AI providers later (as this project already has once) should mean editing
// these two lines and the Authorization header in callAIForInsights(), not
// hunting through the file for a hardcoded URL/model string. See the "Why
// Groq" section of the README for how we ended up here.
const AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const AI_MODEL   = 'llama-3.3-70b-versatile'

const RESULT_TTL     = 86400   // seconds a finished result stays cached (1 day)
const GEN_TIMEOUT    = 30000   // ms cap on EACH AI call (draft, then critique) before it's treated as failed/retryable
const MAX_ROUNDS     = 3       // keep in sync with MAX_AI_ROUNDS in InsightsView.vue
// Bump this whenever buildPrompt() or buildCritiquePrompt() changes
// meaningfully. The cache key is data + round only, so without a version
// tag, editing the prompt would be silently masked by old cached insights
// until the underlying scores data happens to change (which could be a long
// time) — every visitor would keep getting the pre-fix output.
const PROMPT_VERSION = 4

async function handleAnalysis(request, env, ctx) {
  // CORS headers on every branch below (including error responses) — the
  // browser needs them to even read a non-2xx response, not just a success.
  const h = { ...corsHeaders(), 'Content-Type': 'application/json' }

  try {
    // The frontend POSTs the already-computed stats (teams, elevation tiers,
    // headlines, comfortThreshold — see computeInsights() in insights.js),
    // plus `round` and `alreadyCovered` for this specific click. This Worker
    // never talks to football-data.org for this endpoint; all the number-
    // crunching already happened client-side.
    let stats
    try { stats = await request.json() }
    catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: h }) }

    // round defaults to 1 for older/malformed clients; anything past
    // MAX_ROUNDS is rejected outright rather than silently generating more
    // than the frontend's UI is designed to display.
    const round = Number.isInteger(stats.round) && stats.round > 0 ? stats.round : 1
    if (round > MAX_ROUNDS) {
      return new Response(JSON.stringify({ error: 'round_limit', detail: `Only ${MAX_ROUNDS} rounds of insights are available per data state.` }), { status: 400, headers: h })
    }

    // hashStats() only hashes the STABLE parts of `stats` (teams, elevation,
    // headlines) — not `round` or `alreadyCovered` — so the same tournament
    // data always maps to the same hash regardless of who's asking or what
    // they've already seen. `round` is appended separately so each round
    // gets its own cache slot under that hash.
    const key = `insights:v${PROMPT_VERSION}:${await hashStats(stats)}:r${round}`

    // Cache hit → instant, no AI call at all.
    const cachedRaw = await env.INSIGHTS.get(key)
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw)
      if (cached?.status === 'done' && Array.isArray(cached.insights)) {
        return new Response(JSON.stringify(cached.insights), { headers: h })
      }
    }

    // Cache miss → generate a draft, then critique it (two sequential AI
    // calls; see the block comment above and buildCritiquePrompt() below for
    // why the second call exists).
    let insights
    try {
      const draft = await callAIForInsights(env, buildPrompt(stats))
      try {
        insights = await callAIForInsights(env, buildCritiquePrompt(stats, draft))
      } catch {
        // Critique call itself failed (timeout, bad JSON, etc.) — fall back
        // to the uncritiqued draft rather than discarding a perfectly good
        // generation over a hiccup in the second call.
        insights = draft
      }
    } catch (e) {
      // The draft call failed — nothing to fall back to. The user can
      // simply click again.
      return new Response(JSON.stringify({ error: 'generation_failed', detail: e.message }), { status: 502, headers: h })
    }

    // Cache the FINAL (post-critique, or draft-on-fallback) result — never
    // the raw pre-critique draft — so a cache hit later always returns
    // whatever passed review, not a bypassed intermediate step.
    await env.INSIGHTS.put(key, JSON.stringify({ status: 'done', insights }), { expirationTtl: RESULT_TTL })
    return new Response(JSON.stringify(insights), { headers: h })
  } catch (e) {
    // Catch-all so a crash anywhere above still returns a CORS-headered JSON
    // error instead of a raw 500 the browser can't even read cross-origin.
    return new Response(JSON.stringify({ error: 'worker_crash', detail: e.message }), { status: 500, headers: h })
  }
}

// Hash only the tournament data (teams, elevation, headlines) so the cache
// key is stable across clicks and busts only when new match results arrive.
// The per-session `alreadyCovered` list and `round` are deliberately
// excluded — round gets appended to the cache key separately by the caller,
// and alreadyCovered isn't part of "what data is this" at all.
async function hashStats(stats) {
  const stable = {
    teams:            stats.teams,
    elevTiers:        stats.elevTiers,
    headlines:        stats.headlines,
    comfortThreshold: stats.comfortThreshold,
  }
  // SHA-256 the stable JSON, then hex-encode the digest bytes into the
  // familiar 64-character hash string. This never needs to be reversed —
  // it's purely a cache key, so a cryptographic hash is overkill in theory,
  // but the Web Crypto API is already available in Workers for free and this
  // guarantees no accidental collisions between different tournament states.
  const bytes  = new TextEncoder().encode(JSON.stringify(stable))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Calls the AI provider (see AI_API_URL/AI_MODEL above — currently Groq,
// fast, free, OpenAI-compatible chat-completions format) with a single
// prompt, capped at GEN_TIMEOUT so a slow response fails fast (retryable)
// instead of hanging the request. Used for both the draft and critique
// passes — either way, one prompt in, a 4-element insights array out.
// Returns the array or throws.
async function callAIForInsights(env, prompt) {
  // AbortController lets us cancel the in-flight fetch once GEN_TIMEOUT
  // elapses — without this, a hung request would just sit there until the
  // Worker's own platform-level timeout, which is much longer and would
  // leave the user staring at a spinner far past the point of usefulness.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEN_TIMEOUT)
  try {
    const aiRes = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        // Forces the API to return valid JSON matching our schema instead of
        // free-form prose we'd have to parse out of markdown/commentary.
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })

    if (!aiRes.ok) {
      const body = await aiRes.text().catch(() => '')
      throw new Error(`AI provider ${aiRes.status}: ${body.slice(0, 200)}`)
    }

    // Chat-completions responses nest the actual text deep inside
    // choices[0].message.content — that's where our JSON payload lives.
    const data = await aiRes.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(text)
    // The prompt asks for {"insights": [...]}, but tolerate a bare array
    // too in case the model ever drops the wrapper object.
    const insights = Array.isArray(parsed) ? parsed : parsed.insights
    if (!Array.isArray(insights) || insights.length === 0) throw new Error('bad shape')
    // Hard-cap at 4 even if the model returned more/fewer — the frontend's
    // UI (and the "4 more" framing) assumes exactly 4 per round.
    return insights.slice(0, 4)
  } catch (e) {
    // AbortError is what the fetch throws when our own timer cancels it —
    // translate it into a message the frontend's retry logic understands.
    if (e.name === 'AbortError') throw new Error('generation timed out — please try again')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

// Shared between buildPrompt() and buildCritiquePrompt() so the two never
// disagree about what data/facts/coverage the model has to work with. Each
// returned field is a ready-to-interpolate block of plain text (not JSON) —
// these prompts are natural language, not structured API calls, so the
// "data" the model sees is just formatted lines of text.
function buildContext(stats) {
  // One line per team, e.g. "Brazil | 4.2°C gap | 3.1h tz | 7pts | qualified"
  const teams = stats.teams
    .map(t => `${t.name} | ${t.avgDelta.toFixed(1)}°C gap | ${t.avgTzDiff.toFixed(1)}h tz | ${t.P}pts | ${t.qualified ? 'qualified' : 'eliminated'}`)
    .join('\n')

  // One line per elevation tier, e.g. "Sea level (<100m): 2.80 goals/game (20 matches)"
  const elev = stats.elevTiers
    .map(t => `${t.label} (${t.range}): ${t.goalsPerGame.toFixed(2)} goals/game (${t.games} matches)`)
    .join('\n')

  // Listed as individual figures, not just as comparisons — a model will cite
  // ONE side of an "X vs Y" comparison alone (e.g. just the sea-level number)
  // and not recognise it as the same already-shown fact if only the full
  // three-way comparison is described as off-limits.
  const alreadyShown = `- Climate comfort win rate: ${stats.headlines.comfortWinPct.toFixed(1)}%
- Climate discomfort win rate: ${stats.headlines.discomfortWinPct.toFixed(1)}%
- Sea-level (<100m) goals/game: ${stats.headlines.seaLevelGoals.toFixed(2)}
- Mid-altitude (Guadalajara, 600–1,600m) goals/game: ${stats.headlines.midAltGoals.toFixed(2)}
- High-altitude (Mexico City, >1,600m) goals/game: ${stats.headlines.highAltGoals.toFixed(2)}
- Qualifiers' avg timezone gap: ${stats.headlines.tzQualifiedAvg.toFixed(1)}h
- Eliminated teams' avg timezone gap: ${stats.headlines.tzEliminatedAvg.toFixed(1)}h
Citing ANY of the above numbers alone, even rephrased or without the comparison, counts as restating an already-shown fact. Also off-limits in any form: "teams with a smaller climate/timezone gap tend to qualify" and "teams with a bigger climate gap score fewer points" — both are already shown as findings elsewhere on the page.`

  // Shared by both passes — this is the exact logic error that slips through
  // most often: a model rephrasing "despite" as "notably", "impressively", or
  // "the highest among teams below N" while making the same backwards claim
  // (that succeeding WITH a favourable/small gap is somehow noteworthy).
  const logicCheck = `A small climate gap or small timezone gap is an ADVANTAGE (closer to home conditions), not a disadvantage. A team performing well WITH a small gap is the ordinary, expected outcome — it is never noteworthy, an outlier, a record, resilient, or surprising, no matter how the sentence is phrased. This applies regardless of the specific words used — "despite", "notable considering", "impressively", "stands out", "the highest among teams below X°C", and similar phrasings are ALL the same backwards claim if the underlying fact is "small gap + good result". Only highlight a team when they succeeded WITH a large/unfavourable gap, or failed WITH a small/favourable one — that is the direction that is actually surprising. Also do not invent an artificially narrow threshold (e.g. "teams with a gap below 3.0°C") just to make one specific team look like a top performer within it — a highlighted subgroup should be a natural category (a region, an altitude tier, a timezone bucket), not a threshold reverse-engineered from one team's own number.`

  // Team/topic names from this session's earlier rounds (sent by the
  // frontend — see the alreadyCovered array built in generateInsights() in
  // InsightsView.vue), comma-joined into a plain list for the prompt.
  const covered = (stats.alreadyCovered || []).join(', ') || 'none'

  return { teams, elev, alreadyShown, logicCheck, covered }
}

// The DRAFT prompt (first of the two AI calls). Produces 4 candidate
// insights that then get passed to buildCritiquePrompt() for review — this
// prompt is deliberately allowed to be imperfect, since the second pass is
// what's actually responsible for catching mistakes before anything is
// cached or shown to a user.
function buildPrompt(stats) {
  const { teams, elev, alreadyShown, logicCheck, covered } = buildContext(stats)

  return `You are a sports data analyst for the 2026 FIFA World Cup group stage.

STRICT RULE: Every number or statistic you mention MUST appear verbatim in the data below. Do not round differently, invent, or extrapolate any figures.

HEADLINE STATISTICS:
- Climate comfort win rate (<${stats.comfortThreshold}°C gap from home): ${stats.headlines.comfortWinPct.toFixed(1)}%
- Climate discomfort win rate (≥${stats.comfortThreshold}°C gap): ${stats.headlines.discomfortWinPct.toFixed(1)}%
- Goals/game at sea level (<100m): ${stats.headlines.seaLevelGoals.toFixed(2)}
- Goals/game at mid altitude — Guadalajara (600–1,600m): ${stats.headlines.midAltGoals.toFixed(2)}
- Goals/game at high altitude — Mexico City (>1,600m): ${stats.headlines.highAltGoals.toFixed(2)}
- Avg timezone diff for group qualifiers: ${stats.headlines.tzQualifiedAvg.toFixed(1)}h
- Avg timezone diff for eliminated teams: ${stats.headlines.tzEliminatedAvg.toFixed(1)}h

ELEVATION TIERS:
${elev}

TEAM DATA (name | avg climate gap °C | avg timezone diff h | group stage pts | result):
${teams}

ALREADY SHOWN ELSEWHERE ON THIS PAGE:
${alreadyShown}

DO NOT repeat or overlap with these already-covered teams/topics from earlier rounds: ${covered}

TASK: Find 4 distinct, genuinely non-obvious patterns in this data — the kind of thing a careful analyst would find only after actually checking the numbers, not a casual first impression. Your primary goal is uncovering trends that hold up under scrutiny, NOT narrating one team's season or forcing a story where the data doesn't support one.

At least 2 of your 4 insights MUST span multiple teams — a shared region, hemisphere, climate band, altitude exposure, or timezone bucket — and describe how that GROUP behaved as a whole. Use your own knowledge of which teams are geographically or climatically similar (same continent, same hemisphere, comparable training climate) to form these groupings — nothing here needs a label we haven't given you.

RIGOUR REQUIREMENT for any insight tagged "Pattern" or claiming a trend: you must be able to point to AT LEAST 3 teams from the data above that are CONSISTENT with each other, all pointing the same direction. Two examples are a coincidence, not a pattern. If your candidate teams actually show DIFFERENT outcomes from each other (e.g. one qualified, one didn't, despite similar inputs), that is evidence AGAINST a pattern — do not label it "Pattern." Find 3+ teams that genuinely agree, or drop that angle for a different one.

LOGIC CHECK: ${logicCheck}

At most 1 of your 4 insights may be a single-team spotlight, and only if the number is genuinely striking on its own — and it must still pass the logic check above.

For illustration only, do not copy: "European teams training below 15°C had a lower win rate than teams training above 20°C" or "teams facing a fellow high-altitude-trained opponent scored fewer combined goals than average." Invent your own grouping — don't reuse this example.

SELF-CHECK: Before finalising, re-read each insight against the rigour requirement and logic check above, confirm it isn't restating any already-shown figure (even a single one, even rephrased), and verify every number exists exactly in the data. If an insight doesn't hold up, replace it rather than softening the language around it.

Return ONLY a valid JSON object with an "insights" key holding an array of exactly 4 objects — no markdown, no surrounding text:
{"insights":[{"tag":"...","team":"...","stat":"...","body":"..."},...]}

tag must be one of: Resilient | Cautionary | Outlier | Pattern | Record | Surprising
team: for a multi-team pattern, a short descriptive label for the group (e.g. "South American Teams", "High-Altitude Matches") — never "None", "Various", "N/A", or blank. For a single-team spotlight, the team's name.
stat: one key figure, under 45 characters
body: 2–3 sentences, specific and grounded only in the provided data`
}

// Second pass: a skeptical review of the draft insights against the FULL
// team list (not just the teams the draft happened to cite), catching the
// two failure modes a single generation pass tends to produce — a "Pattern"
// built from only 2 (sometimes contradictory) examples, and "surprising"/
// "despite" framing applied backwards to a favourable stat. Fixes or
// replaces anything that fails a check; leaves what already passes alone.
function buildCritiquePrompt(stats, draftInsights) {
  const { teams, elev, alreadyShown, logicCheck, covered } = buildContext(stats)

  return `You are a strict, skeptical editor reviewing a junior analyst's football insights before publication. Your job is to catch weak, contradictory, or mislabeled claims — not to rewrite for style.

FULL TEAM DATA (name | avg climate gap °C | avg timezone diff h | group stage pts | result):
${teams}

ELEVATION TIERS:
${elev}

ALREADY SHOWN ELSEWHERE ON THE PAGE:
${alreadyShown}

ALREADY COVERED IN EARLIER ROUNDS — flag any draft that repeats these teams/topics:
${covered}

DRAFT INSIGHTS TO REVIEW:
${JSON.stringify(draftInsights)}

For EACH draft, check all four:

1. NUMBER ACCURACY — every figure cited must appear verbatim in the team/elevation data above.

2. PATTERN RIGOUR — if the tag is "Pattern" or the body claims a trend across multiple teams, there must be at least 3 teams in the FULL data above (not just the ones the draft happened to mention) that are CONSISTENT with each other, all pointing the same direction. Two teams is a coincidence. If the cited teams actually show DIFFERENT outcomes from each other, that is evidence AGAINST a pattern, and the "Pattern" tag is wrong.

3. TAG LOGIC — ${logicCheck}

4. NOT ALREADY SHOWN — reject any draft that restates a fact from the "ALREADY SHOWN" or "ALREADY COVERED" lists above.

For every draft that FAILS one or more checks, REPLACE it with a corrected version: either fix the tag/stat/body so it's accurate, or substitute a completely different insight that's genuinely grounded in the full data above and passes all four checks. For every draft that already PASSES all four checks, leave it exactly as-is — do not rewrite it just for style or variety.

The final output must always contain exactly 4 insights, each one now passing all four checks.

Return ONLY a valid JSON object with an "insights" key holding an array of exactly 4 objects — no markdown, no surrounding text, no explanation of what you changed:
{"insights":[{"tag":"...","team":"...","stat":"...","body":"..."},...]}

tag must be one of: Resilient | Cautionary | Outlier | Pattern | Record | Surprising
team: for a multi-team pattern, a short descriptive label for the group — never "None", "Various", "N/A", or blank. For a single-team spotlight, the team's name.
stat: one key figure, under 45 characters
body: 2–3 sentences, specific and grounded only in the provided data`
}

// ── Scores endpoint ────────────────────────────────────────────────────────
//
// Fetches every WC 2026 match from football-data.org, keeps only the ones
// that are live or finished, and returns a flat { "Home|Away": {...} } map
// keyed by normalised team names — the shape App.vue polls every 60s and
// every match card looks its own score up from. Cached at Cloudflare's edge
// for 60s so football-data.org (which has its own rate limits) only ever
// sees one request per minute, no matter how many visitors are on the site.

async function handleScores(request, env, ctx) {
  // Cloudflare's edge cache (`caches.default`) is shared across every
  // request that hits this same edge location — unrelated to the Worker's
  // own in-memory state, and unrelated to the KV cache used for AI insights.
  // A fixed, made-up URL as the cache key works fine since this endpoint
  // ignores the request's actual URL/query entirely (there's only one
  // possible response shape).
  const cache    = caches.default
  const cacheKey = new Request('https://wc26-scores.internal/v1')
  const hit      = await cache.match(cacheKey)
  if (hit) return withCors(hit, 'HIT')

  // Cache miss — actually call football-data.org. FOOTBALL_DATA_API_KEY is a
  // Cloudflare secret (see README → Rotating the API Keys); it's the whole
  // reason this proxy exists instead of the frontend calling the API
  // directly, since that key can't be safely shipped to the browser.
  const apiRes = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
    { headers: { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY } }
  )

  // football-data.org reports remaining quota via this header. Bailing out
  // at <2 remaining (rather than 0) leaves a small safety margin instead of
  // racing the limit exactly.
  const remaining = parseInt(apiRes.headers.get('X-RequestsAvailable') ?? '99', 10)
  if (remaining < 2) {
    return new Response(
      JSON.stringify({ error: 'rate_limited' }),
      { status: 429, headers: { ...corsHeaders(), 'Content-Type': 'application/json',
          'Retry-After': apiRes.headers.get('X-RequestCounter-Reset') ?? '60' } }
    )
  }

  if (!apiRes.ok) {
    return new Response(
      JSON.stringify({ error: 'upstream_error', status: apiRes.status }),
      { status: 502, headers: { ...corsHeaders(), 'Content-Type': 'application/json' } }
    )
  }

  const { matches = [] } = await apiRes.json()
  const scores = {}

  // Build the "Home|Away" → score map. Matches that haven't started yet or
  // were postponed etc. are skipped entirely — the frontend has nothing
  // useful to show for those anyway (no score, no live badge).
  for (const m of matches) {
    if (!LIVE.has(m.status) && !DONE.has(m.status)) continue
    const home = norm(m.homeTeam.name)
    const away = norm(m.awayTeam.name)
    scores[`${home}|${away}`] = {
      home:   m.score.fullTime.home,
      away:   m.score.fullTime.away,
      status: m.status,
      winner: m.score.winner ?? null,
    }
  }

  const miss = new Response(JSON.stringify(scores), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  })
  // waitUntil() lets the Worker return the response to the browser
  // immediately without waiting for the cache write to finish — the write
  // happens in the background after the response has already gone out.
  // .clone() is required because a Response body can only be read once, and
  // both the cache and the outgoing response need to read it independently.
  ctx.waitUntil(cache.put(cacheKey, miss.clone()))
  return withCors(miss, 'MISS')
}

// Every response this Worker sends needs these so the browser (running on a
// different origin — the GitHub Pages / custom domain frontend) is allowed
// to read it at all. Wildcard origin is fine here since nothing in either
// endpoint is per-user or sensitive.
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

// Clones a Response (cached or freshly fetched) and layers CORS + a
// diagnostic X-Cache header (HIT/MISS) onto it, without disturbing the
// original body/status. Used for every scores response, cached or not, so
// the browser gets the same headers either way.
function withCors(response, cacheStatus) {
  const r = new Response(response.body, response)
  r.headers.set('Access-Control-Allow-Origin', '*')
  r.headers.set('X-Cache', cacheStatus)
  return r
}
