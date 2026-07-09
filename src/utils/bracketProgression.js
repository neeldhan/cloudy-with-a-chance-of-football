import { groupStageData } from '../data/groupStage.js'
import { bracketData }    from '../data/bracket.js'

// Full sorted standings for every group (all 4 teams, not just the top 2),
// from finished scores. Returns { A: ['Mexico', 'South Korea', 'Belgium',
// 'Egypt'], B: [...], ... } — index 0/1/2 are used below for 1st/2nd/3rd.
// Tiebreakers: points → overall GD → overall GF → alphabetical (last resort)
function computeGroupStandings(scores) {
  const standings = {}

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

    standings[group.group] = sorted.map(s => s.team)
  }

  return standings
}

// "Best 3rd place" bracket slots (e.g. "3A/B/C/D/F" — the winner of match 74
// plays whichever of groups A/B/C/D/F's 3rd-place team is one of the 8 best
// 3rd-place finishers overall) can't be resolved from our own group
// standings alone: which SPECIFIC one of those groups' 3rd-place teams
// actually qualifies depends on FIFA's official cross-group ranking of all
// twelve 3rd-place finishers, using tiebreakers (like fair play points) we
// don't have data for. Rather than reimplement that ranking ourselves, we
// let the real-world result resolve it for us — once football-data.org
// shows the actual Round of 32 fixture as scheduled/played, we just check
// which of the candidate 3rd-place teams has a recorded Round of 32 match
// against this fixture's other (already-known) team, and use that.
//
// Must specifically be their ROUND OF 32 meeting, not just any match between
// them — a 3rd-place team's candidate group letters can legitimately overlap
// between two different Round of 32 slots (e.g. group F might be a candidate
// for both "3A/B/C/D/F" and "3C/D/F/G/H"), and if both teams then advance,
// they can end up playing EACH OTHER AGAIN in a later round. Without the
// stage check, that later-round rematch looks identical to the real Round of
// 32 pairing, and resolves the wrong slot.
function resolveThirdPlaceSlot(slot, knownOpponent, thirdPlaceByGroup, scores) {
  if (!slot.startsWith('3') || !slot.includes('/')) return null // not this kind of slot
  if (!knownOpponent) return null // opponent not resolved yet — nothing to match against

  const candidates = slot.slice(1).split('/').map(g => thirdPlaceByGroup[g]).filter(Boolean)
  for (const candidate of candidates) {
    const sc = scores[`${knownOpponent}|${candidate}`] ?? scores[`${candidate}|${knownOpponent}`]
    if (sc && sc.stage === 'LAST_32') return candidate
  }
  return null // none of the candidates have a recorded Round of 32 match against this opponent yet
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

  // Step 1: group stage standings → 1X / 2X slots, and stash each group's
  // 3rd-place team for resolving "best 3rd place" Round of 32 slots below.
  const standings = computeGroupStandings(scores)
  const thirdPlaceByGroup = {}
  for (const [group, teams] of Object.entries(standings)) {
    if (teams[0]) assignments[`1${group}`] = teams[0]
    if (teams[1]) assignments[`2${group}`] = teams[1]
    if (teams[2]) thirdPlaceByGroup[group] = teams[2]
  }

  // Step 2: chain through knockout rounds in order
  for (const round of bracketData) {
    for (const match of round.matches) {
      // Try to resolve "best 3rd place" slots (see resolveThirdPlaceSlot)
      // before the normal lookup below — cheap no-op for every other slot,
      // since it bails out immediately for anything that isn't this format.
      if (!assignments[match.home]) {
        const resolved = resolveThirdPlaceSlot(match.home, assignments[match.away], thirdPlaceByGroup, scores)
        if (resolved) assignments[match.home] = resolved
      }
      if (!assignments[match.away]) {
        const resolved = resolveThirdPlaceSlot(match.away, assignments[match.home], thirdPlaceByGroup, scores)
        if (resolved) assignments[match.away] = resolved
      }

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
