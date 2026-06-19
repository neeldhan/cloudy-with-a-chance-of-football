// Cloudflare Worker — proxies football-data.org scores for WC 2026
// API key lives as a Cloudflare secret: wrangler secret put FOOTBALL_DATA_API_KEY

// football-data.org uses various name forms; normalise to our team names
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
}

function norm(name) {
  return NAME_MAP[name] ?? name
}

const LIVE = new Set(['IN_PLAY', 'PAUSED', 'EXTRA_TIME', 'PENALTY_SHOOTOUT'])
const DONE = new Set(['FINISHED', 'AWARDED'])

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() })
    }

    // 60-second edge cache so multiple users don't each hit the API
    const cache = caches.default
    const cacheKey = new Request('https://wc26-scores.internal/v1')
    const hit = await cache.match(cacheKey)
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
      }
    }

    const miss = new Response(JSON.stringify(scores), {
      headers: {
        'Content-Type':  'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    })
    ctx.waitUntil(cache.put(cacheKey, miss.clone()))
    return withCors(miss, 'MISS')
  },
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  }
}

function withCors(response, cacheStatus) {
  const r = new Response(response.body, response)
  r.headers.set('Access-Control-Allow-Origin', '*')
  r.headers.set('X-Cache', cacheStatus)
  return r
}
