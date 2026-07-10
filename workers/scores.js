// Cloudflare Worker — proxies football-data.org scores for WC 2026
// Secrets: FOOTBALL_DATA_API_KEY

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
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    return handleScores(request, env, ctx)
  },
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
  // request that hits this same edge location. A fixed, made-up URL as
  // the cache key works fine since this endpoint
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
      // GROUP_STAGE / LAST_32 / LAST_16 / QUARTER_FINALS / ... — needed to
      // resolve "best 3rd place" bracket slots correctly (see
      // resolveThirdPlaceSlot in bracketProgression.js). A 3rd-place team's
      // candidate group letters can legitimately overlap between two
      // different Round of 32 slots, and if both teams then advance, they
      // can end up playing EACH OTHER AGAIN in a later round — so "have
      // these two teams ever played" isn't a safe enough check on its own;
      // it has to specifically be their Round of 32 meeting.
      stage:  m.stage ?? null,
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
