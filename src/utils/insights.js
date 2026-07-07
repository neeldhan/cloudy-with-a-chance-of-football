import { groupStageData }  from '../data/groupStage.js'
import {
  TRAINING_CLIMATE, HOST_CITY_TEMPS_JULY,
  HOST_CITY_ELEVATION, TEAM_TIMEZONE, HOST_CITY_TIMEZONE,
} from '../data/climate.js'
import { tzDiffHours } from './temperature.js'

const COMFORT_THRESHOLD = 8 // °C delta below which a team is "in comfortable conditions"

const ELEV_TIERS = [
  { label: 'Sea level',  range: '< 100m',       min: 0,    max: 100   },
  { label: 'Low',        range: '100 – 600m',    min: 100,  max: 600   },
  { label: 'Mid',        range: '600 – 1,600m',  min: 600,  max: 1600  },
  { label: 'High',       range: '> 1,600m',      min: 1600, max: Infinity },
]

function groupStandings(scores) {
  const qualifiers = new Set()
  for (const group of groupStageData) {
    const s = {}
    for (const m of group.matches) {
      for (const n of [m.home, m.away]) if (!s[n]) s[n] = { P: 0, GD: 0, GF: 0 }
      const sc = scores[`${m.home}|${m.away}`]
      if (!sc || sc.status !== 'FINISHED') continue
      const hg = sc.home ?? 0, ag = sc.away ?? 0
      s[m.home].GF += hg; s[m.home].GD += hg - ag
      s[m.away].GF += ag; s[m.away].GD += ag - hg
      if (sc.winner === 'HOME_TEAM' || hg > ag) s[m.home].P += 3
      else if (sc.winner === 'AWAY_TEAM' || ag > hg) s[m.away].P += 3
      else { s[m.home].P += 1; s[m.away].P += 1 }
    }
    const ranked = Object.entries(s).sort(([, a], [, b]) =>
      b.P !== a.P ? b.P - a.P : b.GD !== a.GD ? b.GD - a.GD : b.GF - a.GF)
    if (ranked[0]) qualifiers.add(ranked[0][0])
    if (ranked[1]) qualifiers.add(ranked[1][0])
  }
  return qualifiers
}

function mean(arr) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
}

export function computeInsights(scores) {
  if (!scores || Object.keys(scores).length === 0) return null

  const qualifiers = groupStandings(scores)
  const teamMap    = {}
  const tiers      = ELEV_TIERS.map(t => ({ ...t, games: 0, goals: 0 }))

  let comfortWins = 0, comfortTotal = 0
  let discomfortWins = 0, discomfortTotal = 0

  for (const group of groupStageData) {
    for (const m of group.matches) {
      const sc = scores[`${m.home}|${m.away}`]
      if (!sc || sc.status !== 'FINISHED') continue

      const hg = sc.home ?? 0, ag = sc.away ?? 0
      const elev    = HOST_CITY_ELEVATION[m.city] ?? 0
      const venueT  = HOST_CITY_TEMPS_JULY[m.city] ?? null
      const tier    = tiers.find(t => elev >= t.min && elev < t.max)
      if (tier) { tier.games++; tier.goals += hg + ag }

      for (const [side, team] of [['home', m.home], ['away', m.away]]) {
        const gf = side === 'home' ? hg : ag
        const ga = side === 'home' ? ag : hg
        const trainT = TRAINING_CLIMATE[team]?.tempC ?? null

        if (!teamMap[team]) {
          teamMap[team] = {
            name: team, P: 0, W: 0, D: 0, L: 0, GF: 0, GA: 0,
            deltas: [], tzAbsDiffs: [], qualified: qualifiers.has(team), trainTemp: trainT,
          }
        }
        const ts = teamMap[team]
        ts.GF += gf; ts.GA += ga
        if (gf > ga)       { ts.W++; ts.P += 3 }
        else if (gf === ga) { ts.D++; ts.P += 1 }
        else                   ts.L++

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

        const tz = Math.abs(tzDiffHours(TEAM_TIMEZONE[team], HOST_CITY_TIMEZONE[m.city], m.isoDate))
        ts.tzAbsDiffs.push(tz)
      }
    }
  }

  const teams = Object.values(teamMap).map(ts => ({
    ...ts,
    avgDelta:   mean(ts.deltas),
    avgTzDiff:  mean(ts.tzAbsDiffs),
    GD: ts.GF - ts.GA,
  }))

  const elevTiers = tiers.map(t => ({
    ...t,
    goalsPerGame: t.games > 0 ? t.goals / t.games : 0,
  }))

  const tzQualified  = teams.filter(t => t.qualified).map(t => t.avgTzDiff)
  const tzEliminated = teams.filter(t => !t.qualified).map(t => t.avgTzDiff)

  return {
    // sorted for the climate chart
    teamsByDelta: [...teams].sort((a, b) => a.avgDelta - b.avgDelta),
    // sorted for the timezone chart
    teamsByTz: [...teams].sort((a, b) => b.avgTzDiff - a.avgTzDiff),
    elevTiers,
    comfortThreshold: COMFORT_THRESHOLD,
    headlines: {
      comfortWinPct:     comfortTotal    > 0 ? (comfortWins    / comfortTotal)    * 100 : 0,
      discomfortWinPct:  discomfortTotal > 0 ? (discomfortWins / discomfortTotal) * 100 : 0,
      seaLevelGoals:     elevTiers[0].goalsPerGame,
      midAltGoals:       elevTiers[2].goalsPerGame,
      highAltGoals:      elevTiers[3].goalsPerGame,
      tzQualifiedAvg:    mean(tzQualified),
      tzEliminatedAvg:   mean(tzEliminated),
    },
  }
}
