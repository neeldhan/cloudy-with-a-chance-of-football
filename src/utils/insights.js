import { groupStageData }  from '../data/groupStage.js'
import {
  TRAINING_CLIMATE, HOST_CITY_TEMPS_JULY,
  HOST_CITY_ELEVATION, TEAM_TIMEZONE, HOST_CITY_TIMEZONE,
} from '../data/climate.js'
import { TEAM_POT }     from '../data/seeding.js'
import { TEAM_RANK }    from '../data/rankings.js'
import { tzDiffHours } from './temperature.js'

// A team counts as playing in "comfortable" conditions for a given match if
// the gap between their home training temperature and the matchday venue
// temperature is under this many °C. Used both for the climate-comfort
// win-rate headline stat and to sort the climate comfort chart.
const COMFORT_THRESHOLD = 8 // °C delta below which a team is "in comfortable conditions"

// Venue elevation buckets used for the altitude chart and the "Altitude
// Suppresses Scoring" Core Finding. Guadalajara (1,566m) falls in "Mid";
// Mexico City (2,240m, the highest World Cup venue ever hosted) falls in
// "High" — see HOST_CITY_ELEVATION in data/climate.js for the raw numbers.
const ELEV_TIERS = [
  { label: 'Sea level',  range: '< 100m',       min: 0,    max: 100   },
  { label: 'Low',        range: '100 – 600m',    min: 100,  max: 600   },
  { label: 'Mid',        range: '600 – 1,600m',  min: 600,  max: 1600  },
  { label: 'High',       range: '> 1,600m',      min: 1600, max: Infinity },
]

// Simulates group standings from whatever matches have finished so far, and
// returns the set of team names currently sitting in the top 2 of their
// group (i.e. "qualified"). This runs continuously as results come in — it
// is NOT gated on a group's matches all being finished, so early in the
// tournament the "qualified" flag reflects a provisional, still-changing
// standings table rather than a final locked-in result.
function groupStandings(scores) {
  const qualifiers = new Set()
  for (const group of groupStageData) {
    // Points/goal-difference/goals-for table for this one group, keyed by
    // team name. Every team in the group starts at 0 across the board —
    // this ensures a team gets ranked (least dead-last) even if none of
    // their matches have finished yet.
    const s = {}
    for (const m of group.matches) {
      for (const n of [m.home, m.away]) if (!s[n]) s[n] = { P: 0, GD: 0, GF: 0 }
      const sc = scores[`${m.home}|${m.away}`]
      if (!sc || sc.status !== 'FINISHED') continue
      const hg = sc.home ?? 0, ag = sc.away ?? 0
      s[m.home].GF += hg; s[m.home].GD += hg - ag
      s[m.away].GF += ag; s[m.away].GD += ag - hg
      // Standard 3/1/0 group-stage points, using the API's own `winner`
      // field when present (covers penalty-shootout-decided draws etc.)
      // and falling back to comparing goals otherwise.
      if (sc.winner === 'HOME_TEAM' || hg > ag) s[m.home].P += 3
      else if (sc.winner === 'AWAY_TEAM' || ag > hg) s[m.away].P += 3
      else { s[m.home].P += 1; s[m.away].P += 1 }
    }
    // Standard tiebreak order: points, then goal difference, then goals for.
    const ranked = Object.entries(s).sort(([, a], [, b]) =>
      b.P !== a.P ? b.P - a.P : b.GD !== a.GD ? b.GD - a.GD : b.GF - a.GF)
    if (ranked[0]) qualifiers.add(ranked[0][0])
    if (ranked[1]) qualifiers.add(ranked[1][0])
  }
  return qualifiers
}

// Plain arithmetic mean; 0 for an empty array rather than NaN, so downstream
// .toFixed() calls never blow up before any matches have been played.
function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

// The single source of truth for the whole Insights tab — every chart,
// headline stat, callout, and Core Finding is derived from this one
// function's return value. Nothing here calls an API; it's pure arithmetic
// over the live `scores` map (see the Live Scores Flow in the README) and
// the static per-team/per-city data files in src/data/.
export function computeInsights(scores) {
  // No scores yet (e.g. VITE_SCORES_URL unset, or the initial fetch hasn't
  // landed) → null tells InsightsView.vue to show "Waiting for match data…"
  // instead of a tab full of zeros.
  if (!scores || Object.keys(scores).length === 0) return null

  const qualifiers = groupStandings(scores)
  // Per-team running totals, built up incrementally below as we walk every
  // match — keyed by team name, filled in lazily the first time each team
  // is seen in a finished match.
  const teamMap    = {}
  // A working copy of ELEV_TIERS with per-tier running totals attached
  // (games played, combined goals scored) — ELEV_TIERS itself is a shared
  // module-level constant, so we copy rather than mutate it directly.
  const tiers      = ELEV_TIERS.map(t => ({ ...t, games: 0, goals: 0 }))

  // Running counts for the climate comfort win-rate headline: how many
  // individual match-sides were played "comfortable" (gap < COMFORT_THRESHOLD)
  // vs. "uncomfortable", and how many of each were actually won.
  let comfortWins = 0, comfortTotal = 0
  let discomfortWins = 0, discomfortTotal = 0

  // The main pass: every group stage match, both sides, once each. This is
  // the only place in the file that reads the live scores map — everything
  // after this loop just reshapes/aggregates what got collected here.
  for (const group of groupStageData) {
    for (const m of group.matches) {
      const sc = scores[`${m.home}|${m.away}`]
      if (!sc || sc.status !== 'FINISHED') continue // skip unplayed/in-progress matches entirely

      const hg = sc.home ?? 0, ag = sc.away ?? 0
      const elev    = HOST_CITY_ELEVATION[m.city] ?? 0
      const venueT  = HOST_CITY_TEMPS_JULY[m.city] ?? null
      // Which elevation tier this match's host city falls into, so its
      // goals count toward that tier's goals-per-game average.
      const tier    = tiers.find(t => elev >= t.min && elev < t.max)
      if (tier) { tier.games++; tier.goals += hg + ag }

      // Process both sides of the match identically — everything below runs
      // once for the home team and once for the away team, with `gf`/`ga`
      // (goals for/against) flipped accordingly.
      for (const [side, team] of [['home', m.home], ['away', m.away]]) {
        const gf = side === 'home' ? hg : ag
        const ga = side === 'home' ? ag : hg
        const trainT = TRAINING_CLIMATE[team]?.tempC ?? null

        // First time we've seen this team in a finished match — start their
        // running totals. `qualified` is captured once here rather than
        // recomputed per-match since it doesn't vary within a single
        // computeInsights() call.
        if (!teamMap[team]) {
          teamMap[team] = {
            name: team, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0,
            deltas: [], tzAbsDiffs: [], qualified: qualifiers.has(team), trainTemp: trainT,
            pot: TEAM_POT[team] ?? null,
            rank: TEAM_RANK[team] ?? null,
          }
        }
        const ts = teamMap[team]
        ts.GF += gf; ts.GA += ga
        if (gf > ga)       { ts.W++; ts.P += 3 }
        else if (gf === ga) { ts.D++; ts.P += 1 }
        else                   ts.L++

        // Climate gap = |training temp − matchday venue temp|, in °C. Only
        // computed when both figures are known (some teams/cities are
        // missing from the static climate data files).
        if (trainT != null && venueT != null) {
          const delta = Math.abs(trainT - venueT)
          ts.deltas.push(delta)
          if (delta < COMFORT_THRESHOLD) {
            comfortTotal++
            if (gf > ga) comfortWins++
          } else {
            discomfortTotal++
            if (gf > ga) discomfortWins++
          }
        }

        // Timezone gap: absolute hours between the team's home timezone and
        // the host city's, accounting for the specific match date (DST etc.
        // — see tzDiffHours() in ./temperature.js).
        const tz = Math.abs(tzDiffHours(TEAM_TIMEZONE[team], HOST_CITY_TIMEZONE[m.city], m.isoDate))
        ts.tzAbsDiffs.push(tz)
      }
    }
  }
  // ── End of the main pass — everything below reshapes/summarises teamMap
  // and tiers into the final return shape. No more reads from `scores`. ──

  // Collapse teamMap into a flat array, computing each team's final
  // averages (deltas/tzAbsDiffs were accumulated as raw arrays above,
  // one entry per match played) and goal difference.
  const teams = Object.values(teamMap).map(ts => ({
    ...ts,
    avgDelta:   mean(ts.deltas),
    avgTzDiff:  mean(ts.tzAbsDiffs),
    GD: ts.GF - ts.GA,
  }))

  // Finalise each elevation tier's goals-per-game now that all matches have
  // been counted.
  const elevTiers = tiers.map(t => ({
    ...t,
    goalsPerGame: t.games > 0 ? t.goals / t.games : 0,
  }))

  // Feeds the "Timezone Fatigue" headline stat (qualifiers' average gap vs.
  // eliminated teams' average gap).
  const tzQualified  = teams.filter(t => t.qualified).map(t => t.avgTzDiff)
  const tzEliminated = teams.filter(t => !t.qualified).map(t => t.avgTzDiff)

  // Returns whichever team in `arr` has the largest value at `key`, or null
  // for an empty array — used below to pick out the three tzSpotlight teams.
  const maxBy = (arr, key) => arr.reduce((best, t) => (!best || t[key] > best[key]) ? t : best, null)

  // Powers both the timezone hero stat and the three callout cards, so the
  // "Japan qualified despite 14h of travel" style story stays in sync with
  // whichever teams actually have the biggest/smallest gaps as results come in.
  const qualifiedTeams  = teams.filter(t => t.qualified)
  const eliminatedTeams = teams.filter(t => !t.qualified)
  const tzSpotlight = {
    // Qualified team with the largest average timezone gap — travelled furthest and still advanced.
    resilient: maxBy(qualifiedTeams, 'avgTzDiff'),
    // Smallest average timezone gap of any team, ties broken by points — effectively played at home.
    homeComfort: [...teams].sort((a, b) => a.avgTzDiff - b.avgTzDiff || b.P - a.P)[0] ?? null,
    // Largest gap among eliminated teams; falls back to the overall max early in the tournament
    // when no team has been eliminated yet.
    furthest: maxBy(eliminatedTeams, 'avgTzDiff') ?? maxBy(teams, 'avgTzDiff'),
  }

  // Average group-stage points per FIFA draw pot (1 = strongest seed, 4 =
  // weakest) — see TEAM_POT in data/seeding.js. Answers the question the
  // seeding toggle exists for: did the December 2025 draw actually predict
  // who'd do well? Only counts teams with at least one finished match, same
  // as everything else on this tab.
  const teamsWithPot = teams.filter(t => t.pot != null)
  const potTiers = [1, 2, 3, 4].map(pot => {
    const potTeams = teamsWithPot.filter(t => t.pot === pot)
    return {
      pot,
      teamCount: potTeams.length,
      avgPoints: mean(potTeams.map(t => t.P)),
      qualifiedCount: potTeams.filter(t => t.qualified).length,
    }
  })

  // Spotlights the biggest single-team upsets in each direction, the same
  // "let an extreme case tell the story" approach as tzSpotlight above,
  // rather than inventing a per-team "expected points" model.
  const seedingSpotlight = {
    // Qualified team from the weakest pot it can find — ties broken by
    // points, so among several pot-4 survivors the highest-scoring one wins.
    biggestRiser: [...qualifiedTeams].filter(t => t.pot != null)
      .sort((a, b) => b.pot - a.pot || b.P - a.P)[0] ?? null,
    // Eliminated team from the strongest pot it can find — ties broken by
    // fewest points, the most dramatic version of "didn't live up to the seed".
    biggestFaller: [...eliminatedTeams].filter(t => t.pot != null)
      .sort((a, b) => a.pot - b.pot || a.P - b.P)[0] ?? null,
  }

  // The full shape consumed by InsightsView.vue — every chart, hero stat,
  // and Core Finding on the tab reads from this one object.
  return {
    // sorted for the climate chart
    teamsByDelta: [...teams].sort((a, b) => a.avgDelta - b.avgDelta),
    // sorted for the timezone chart
    teamsByTz: [...teams].sort((a, b) => b.avgTzDiff - a.avgTzDiff),
    elevTiers,
    potTiers,
    comfortThreshold: COMFORT_THRESHOLD,
    tzSpotlight,
    seedingSpotlight,
    headlines: {
      comfortWinPct:     comfortTotal    > 0 ? (comfortWins    / comfortTotal)    * 100 : 0,
      discomfortWinPct:  discomfortTotal > 0 ? (discomfortWins / discomfortTotal) * 100 : 0,
      // Indices here rely on ELEV_TIERS' declared order (sea level, low,
      // mid, high) — [0]=sea level, [2]=mid, [3]=high. "low" (index 1) has
      // no dedicated headline stat of its own.
      seaLevelGoals:     elevTiers[0].goalsPerGame,
      midAltGoals:       elevTiers[2].goalsPerGame,
      highAltGoals:      elevTiers[3].goalsPerGame,
      tzQualifiedAvg:    mean(tzQualified),
      tzEliminatedAvg:   mean(tzEliminated),
    },
  }
}
