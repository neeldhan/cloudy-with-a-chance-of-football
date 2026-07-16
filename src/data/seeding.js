// Official 2026 FIFA World Cup draw pots (1 = strongest), from the December
// 5, 2025 draw based on the FIFA Men's World Ranking of November 19, 2025.
// Pot 1 is the three co-hosts plus the nine highest-ranked qualifiers; Pots
// 2 and 3 fill in by ranking; Pot 4 holds the lowest-ranked qualifiers plus
// six slots that were still playoff-pending at draw time (four UEFA
// play-off winners, two inter-confederation play-off winners), all seeded
// as anonymous Pot 4 slots regardless of the eventual winner's own ranking.
// Those six resolved in March 2026: Bosnia and Herzegovina, Czechia,
// Sweden, and Turkiye from the UEFA path; DR Congo and Iraq from the
// inter-confederation path.
//
// Sources: FIFA's official pots/procedures page and the 2026 FIFA World Cup
// draw article (Wikipedia), cross-checked against every team name in
// groups.js for an exact match.
export const TEAM_POT = {
  // Pot 1
  'United States': 1,
  'Mexico':        1,
  'Canada':        1,
  'Spain':         1,
  'Argentina':     1,
  'France':        1,
  'England':       1,
  'Brazil':        1,
  'Portugal':      1,
  'Netherlands':   1,
  'Belgium':       1,
  'Germany':       1,

  // Pot 2
  'Croatia':       2,
  'Morocco':       2,
  'Colombia':      2,
  'Uruguay':       2,
  'Switzerland':   2,
  'Japan':         2,
  'Senegal':       2,
  'Iran':          2,
  'South Korea':   2,
  'Ecuador':       2,
  'Austria':       2,
  'Australia':     2,

  // Pot 3
  'Norway':        3,
  'Panama':        3,
  'Egypt':         3,
  'Algeria':       3,
  'Scotland':      3,
  'Paraguay':      3,
  'Tunisia':       3,
  'Ivory Coast':   3,
  'Uzbekistan':    3,
  'Qatar':         3,
  'Saudi Arabia':  3,
  'South Africa':  3,

  // Pot 4 (includes the six teams that qualified via playoff after the
  // draw, all originally seeded as anonymous Pot 4 placeholder slots)
  'Jordan':                 4,
  'Cape Verde':             4,
  'Ghana':                  4,
  'Curacao':                4,
  'Haiti':                  4,
  'New Zealand':            4,
  'Bosnia and Herzegovina': 4,
  'Czechia':                4,
  'Sweden':                 4,
  'Turkiye':                4,
  'DR Congo':               4,
  'Iraq':                   4,
}

export function teamPot(team) {
  return TEAM_POT[team] ?? null
}
