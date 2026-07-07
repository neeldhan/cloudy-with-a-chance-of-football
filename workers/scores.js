// Cloudflare Worker — proxies football-data.org scores for WC 2026
// Secrets: FOOTBALL_DATA_API_KEY, GROQ_API_KEY

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

function norm(name) {
  return NAME_MAP[name] ?? name
}

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'])
const DONE = new Set(['FINISHED', 'AWARDED'])

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    if (url.pathname === '/analysis' && request.method === 'POST') {
      return handleAnalysis(request, env, ctx)
    }

    return handleScores(request, env, ctx)
  },
}

// ── AI insights endpoint (synchronous generate + KV cache) ─────────────────
//
// Insights are generated inline within the request, then cached in KV:
//   • cache hit  → return the stored insights instantly
//   • cache miss → generate now (fast instruct models only, hard-capped at
//                  ~28s), cache the result, and return it
//
// The cache key is a hash of the *tournament* data only, so it stays stable
// across clicks and busts only when new match results arrive — meaning the
// slow first generation happens once per data change, and every repeat click
// is instant.
//
// We deliberately do NOT use the `openrouter/free` random router here: it
// sometimes lands on 60–90s reasoning models. A curated fast-model list keeps
// generation in the ~15–25s range, which holds a single connection fine.

const RESULT_TTL   = 86400   // seconds a finished result stays cached (1 day)
const GEN_TIMEOUT  = 30000   // ms cap on the OpenRouter call before we bail with a retryable error (the frontend retries)

async function handleAnalysis(request, env, ctx) {
  const h = { ...corsHeaders(), 'Content-Type': 'application/json' }

  try {
    let stats
    try { stats = await request.json() }
    catch { return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers: h }) }

    const key = 'insights:' + await hashStats(stats)

    // Cache hit → instant.
    const cachedRaw = await env.INSIGHTS.get(key)
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw)
      if (cached?.status === 'done' && Array.isArray(cached.insights)) {
        return new Response(JSON.stringify(cached.insights), { headers: h })
      }
    }

    // Cache miss → generate synchronously.
    let insights
    try {
      insights = await generateInsights(env, buildPrompt(stats))
    } catch (e) {
      // Nothing cached on failure — the user can simply click again.
      return new Response(JSON.stringify({ error: 'generation_failed', detail: e.message }), { status: 502, headers: h })
    }

    await env.INSIGHTS.put(key, JSON.stringify({ status: 'done', insights }), { expirationTtl: RESULT_TTL })
    return new Response(JSON.stringify(insights), { headers: h })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'worker_crash', detail: e.message }), { status: 500, headers: h })
  }
}

// Hash only the tournament data (teams, elevation, headlines) so the cache key
// is stable across clicks and busts only when new match results arrive. The
// per-session `alreadyCovered` list is deliberately excluded.
async function hashStats(stats) {
  const stable = {
    teams:            stats.teams,
    elevTiers:        stats.elevTiers,
    headlines:        stats.headlines,
    comfortThreshold: stats.comfortThreshold,
  }
  const bytes  = new TextEncoder().encode(JSON.stringify(stable))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// Calls Groq (fast, free, OpenAI-compatible), capped at GEN_TIMEOUT so a slow
// response fails fast (retryable) instead of hanging the request. Groq's
// separate infra isn't throttled from Cloudflare's egress the way OpenRouter's
// free tier is. Returns a 4-element insights array or throws.
async function generateInsights(env, prompt) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GEN_TIMEOUT)
  try {
    const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    })

    if (!aiRes.ok) {
      const body = await aiRes.text().catch(() => '')
      throw new Error(`groq ${aiRes.status}: ${body.slice(0, 200)}`)
    }

    const data = await aiRes.json()
    const text = data.choices?.[0]?.message?.content ?? ''
    const parsed = JSON.parse(text)
    const insights = Array.isArray(parsed) ? parsed : parsed.insights
    if (!Array.isArray(insights) || insights.length === 0) throw new Error('bad shape')
    return insights.slice(0, 4)
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('generation timed out — please try again')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

function buildPrompt(stats) {
  const teams = stats.teams
    .map(t => `${t.name} | ${t.avgDelta.toFixed(1)}°C gap | ${t.avgTzDiff.toFixed(1)}h tz | ${t.P}pts | ${t.qualified ? 'qualified' : 'eliminated'}`)
    .join('\n')

  const elev = stats.elevTiers
    .map(t => `${t.label} (${t.range}): ${t.goalsPerGame.toFixed(2)} goals/game (${t.games} matches)`)
    .join('\n')

  const covered = (stats.alreadyCovered || []).join(', ') || 'none'

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

DO NOT repeat or overlap with these already-covered topics: ${covered}

TASK: Find 4 distinct, specific, interesting patterns in this data. Prioritise surprising or counterintuitive findings — things that cut against the obvious narrative. Mix individual team stories with broader aggregate patterns. Use a variety of tag types.

SELF-CHECK: After drafting each insight, re-read it and verify every number you cited exists exactly in the data above. If any number doesn't match, correct or remove it before responding.

Return ONLY a valid JSON object with an "insights" key holding an array of exactly 4 objects — no markdown, no surrounding text:
{"insights":[{"tag":"...","team":"...","stat":"...","body":"..."},...]}

tag must be one of: Resilient | Cautionary | Outlier | Pattern | Record | Surprising
stat: one key figure, under 45 characters
body: 2–3 sentences, specific and grounded only in the provided data`
}

// ── Scores endpoint ────────────────────────────────────────────────────────

async function handleScores(request, env, ctx) {
  const cache    = caches.default
  const cacheKey = new Request('https://wc26-scores.internal/v1')
  const hit      = await cache.match(cacheKey)
  if (hit) return withCors(hit, 'HIT')

  const apiRes = await fetch(
    'https://api.football-data.org/v4/competitions/WC/matches?season=2026',
    { headers: { 'X-Auth-Token': env.FOOTBALL_DATA_API_KEY } }
  )

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
  ctx.waitUntil(cache.put(cacheKey, miss.clone()))
  return withCors(miss, 'MISS')
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function withCors(response, cacheStatus) {
  const r = new Response(response.body, response)
  r.headers.set('Access-Control-Allow-Origin', '*')
  r.headers.set('X-Cache', cacheStatus)
  return r
}
