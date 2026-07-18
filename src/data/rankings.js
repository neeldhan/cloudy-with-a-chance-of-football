// Current FIFA Men's World Ranking position for each qualified team, as of
// the 11 June 2026 official update (the next scheduled update is 20 July
// 2026). Deliberately separate from TEAM_POT in seeding.js — pots are a
// historical fact fixed at the December 2025 draw off the November 2025
// ranking snapshot and shouldn't change after the fact, whereas this is
// meant to track the current, ongoing ranking. Only the 48 qualified teams
// are included, per issue #14 — non-qualified teams (e.g. Italy at #15)
// are left out rather than ranked among a field they're not part of.
//
// Source: transcribed directly off the official FIFA ranking table
// (inside.fifa.com/fifa-world-ranking/men), 11 June 2026 update.
export const TEAM_RANK = {
  'Argentina':               1,
  'Spain':                   2,
  'France':                  3,
  'England':                 4,
  'Brazil':                  5,
  'Morocco':                 6,
  'Portugal':                7,
  'Belgium':                 8,
  'Netherlands':             9,
  'Mexico':                  10,
  'Colombia':                11,
  'Germany':                 12,
  'Croatia':                 13,
  'Switzerland':             14,
  'United States':           16,
  'Japan':                   17,
  'Senegal':                 18,
  'Norway':                  19,
  'Uruguay':                 20,
  'Iran':                    22,
  'Austria':                 23,
  'Egypt':                   24,
  'Ecuador':                 25,
  'Turkiye':                 27,
  'Australia':               28,
  'Algeria':                 29,
  'Canada':                  30,
  'Ivory Coast':             31,
  'South Korea':             32,
  'Paraguay':                34,
  'Sweden':                  37,
  'DR Congo':                41,
  'Scotland':                42,
  'Panama':                  44,
  'Czechia':                 48,
  'South Africa':            54,
  'Tunisia':                 57,
  'Saudi Arabia':            58,
  'Qatar':                   59,
  'Uzbekistan':              60,
  'Bosnia and Herzegovina':  61,
  'Iraq':                    63,
  'Cape Verde':              64,
  'Ghana':                   65,
  'Jordan':                  73,
  'Curacao':                 82,
  'New Zealand':             86,
  'Haiti':                   88,
}

export function teamRank(team) {
  return TEAM_RANK[team] ?? null
}
