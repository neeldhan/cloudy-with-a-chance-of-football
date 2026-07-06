import { groupStageData } from '../data/groupStage.js'
import { bracketData }    from '../data/bracket.js'

// Compute 1st and 2nd place for each group from finished scores.
// Returns { A: ['Mexico', 'South Korea'], B: [...], ... }
// Tiebreakers: points → overall GD → overall GF → alphabetical (last resort)
function computeGroupTops(scores) {
  const tops = {}

  for (const group of groupStageData) {
    const stats = {}

    for (const m of group.matches) {
      for (const name of [m.home, m.away]) {
        if (!stats[name]) stats[name] = { team: name, P: 0, GD: 0, GF: 0 }
      }

      const sc = scores[`${m.home}|${m.away}`]
      if (!sc || sc.status !== 'FINISHED') continue

      const hg = sc.home ?? 0
      const ag = sc.away ?? 0

      stats[m.home].GF += hg
      stats[m.home].GD += hg - ag
      stats[m.away].GF += ag
      stats[m.away].GD += ag - hg

      if (sc.winner === 'HOME_TEAM' || hg > ag) {
        stats[m.home].P += 3
      } else if (sc.winner === 'AWAY_TEAM' || ag > hg) {
        stats[m.away].P += 3
      } else {
        stats[m.home].P += 1
        stats[m.away].P += 1
      }
    }

    const sorted = Object.values(stats).sort((a, b) =>
      b.P  !== a.P  ? b.P  - a.P  :
      b.GD !== a.GD ? b.GD - a.GD :
      b.GF !== a.GF ? b.GF - a.GF :
      a.team.localeCompare(b.team)
    )

    tops[group.group] = sorted.map(s => s.team)
  }

  return tops
}

// Resolve which team won a finished match, accounting for penalties.
function resolveWinner(score, homeTeam, awayTeam) {
  if (!score) return null
  const finished = score.status === 'FINISHED' || score.status === 'AWARDED'
  if (!finished) return null

  if (score.winner === 'HOME_TEAM') return { winner: homeTeam, loser: awayTeam }
  if (score.winner === 'AWAY_TEAM') return { winner: awayTeam, loser: homeTeam }

  // Fallback to FT score when winner field is absent
  const hg = score.home ?? 0
  const ag = score.away ?? 0
  if (hg > ag) return { winner: homeTeam, loser: awayTeam }
  if (ag > hg) return { winner: awayTeam, loser: homeTeam }

  return null // genuinely unresolvable (draw in a group match is fine, draw in KO shouldn't happen)
}

// Returns a slot-assignment map derived entirely from real match results.
// Keys: '1A', '2A', 'W73', 'L101', etc.
// Consumers should merge this with manual assignments so manual fills any gaps.
export function deriveAssignments(scores) {
  if (!scores || Object.keys(scores).length === 0) return {}

  const assignments = {}

  // Step 1: group stage tops → 1X / 2X slots
  const tops = computeGroupTops(scores)
  for (const [group, teams] of Object.entries(tops)) {
    if (teams[0]) assignments[`1${group}`] = teams[0]
    if (teams[1]) assignments[`2${group}`] = teams[1]
  }

  // Step 2: chain through knockout rounds in order
  for (const round of bracketData) {
    for (const match of round.matches) {
      const homeTeam = assignments[match.home]
      const awayTeam = assignments[match.away]
      if (!homeTeam || !awayTeam) continue

      const sc = scores[`${homeTeam}|${awayTeam}`]
        ?? scores[`${awayTeam}|${homeTeam}`] // try reversed in case API flipped teams
      const result = resolveWinner(sc, homeTeam, awayTeam)
      if (!result) continue

      assignments[`W${match.matchNumber}`] = result.winner
      assignments[`L${match.matchNumber}`] = result.loser
    }
  }

  return assignments
}
