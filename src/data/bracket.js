import { toISODate, weekdayAbbrev } from '../utils/temperature.js'

const raw = [
  {
    id: 'r32',
    name: 'Round of 32',
    dateRange: 'June 28 – July 3, 2026',
    matches: [
      { matchNumber: 73, home: '2A',  away: '2B',           date: 'June 28, 2026', city: 'Los Angeles, USA',          stadium: 'SoFi Stadium' },
      { matchNumber: 76, home: '1C',  away: '2F',           date: 'June 29, 2026', city: 'Houston, USA',              stadium: 'NRG Stadium' },
      { matchNumber: 74, home: '1E',  away: '3A/B/C/D/F',  date: 'June 29, 2026', city: 'Boston, USA',               stadium: 'Gillette Stadium' },
      { matchNumber: 75, home: '1F',  away: '2C',           date: 'June 29, 2026', city: 'Monterrey, Mexico',         stadium: 'Estadio BBVA' },
      { matchNumber: 78, home: '2E',  away: '2I',           date: 'June 30, 2026', city: 'Dallas, USA',               stadium: 'AT&T Stadium' },
      { matchNumber: 77, home: '1I',  away: '3C/D/F/G/H',  date: 'June 30, 2026', city: 'New York/New Jersey, USA',  stadium: 'MetLife Stadium' },
      { matchNumber: 79, home: '1A',  away: '3C/E/F/H/I',  date: 'June 30, 2026', city: 'Mexico City, Mexico',       stadium: 'Estadio Azteca' },
      { matchNumber: 80, home: '1L',  away: '3E/H/I/J/K',  date: 'July 1, 2026',  city: 'Atlanta, USA',              stadium: 'Mercedes-Benz Stadium' },
      { matchNumber: 82, home: '1G',  away: '3A/E/H/I/J',  date: 'July 1, 2026',  city: 'Seattle, USA',              stadium: 'Lumen Field' },
      { matchNumber: 81, home: '1D',  away: '3B/E/F/I/J',  date: 'July 1, 2026',  city: 'San Francisco Bay Area, USA', stadium: "Levi's Stadium" },
      { matchNumber: 84, home: '1H',  away: '2J',           date: 'July 2, 2026',  city: 'Los Angeles, USA',          stadium: 'SoFi Stadium' },
      { matchNumber: 83, home: '2K',  away: '2L',           date: 'July 2, 2026',  city: 'Toronto, Canada',           stadium: 'BMO Field' },
      { matchNumber: 85, home: '1B',  away: '3E/F/G/I/J',  date: 'July 2, 2026',  city: 'Vancouver, Canada',         stadium: 'BC Place' },
      { matchNumber: 88, home: '2D',  away: '2G',           date: 'July 3, 2026',  city: 'Dallas, USA',               stadium: 'AT&T Stadium' },
      { matchNumber: 86, home: '1J',  away: '2H',           date: 'July 3, 2026',  city: 'Miami, USA',                stadium: 'Hard Rock Stadium' },
      { matchNumber: 87, home: '1K',  away: '3D/E/I/J/L',  date: 'July 3, 2026',  city: 'Kansas City, USA',          stadium: 'GEHA Field at Arrowhead Stadium' },
    ],
  },
  {
    id: 'r16',
    name: 'Round of 16',
    dateRange: 'July 4 – 7, 2026',
    matches: [
      { matchNumber: 90, home: 'W73', away: 'W75', date: 'July 4, 2026', city: 'Houston, USA',             stadium: 'NRG Stadium' },
      { matchNumber: 89, home: 'W74', away: 'W77', date: 'July 4, 2026', city: 'Philadelphia, USA',        stadium: 'Lincoln Financial Field' },
      { matchNumber: 91, home: 'W76', away: 'W78', date: 'July 5, 2026', city: 'New York/New Jersey, USA', stadium: 'MetLife Stadium' },
      { matchNumber: 92, home: 'W79', away: 'W80', date: 'July 5, 2026', city: 'Mexico City, Mexico',      stadium: 'Estadio Azteca' },
      { matchNumber: 93, home: 'W83', away: 'W84', date: 'July 6, 2026', city: 'Dallas, USA',              stadium: 'AT&T Stadium' },
      { matchNumber: 94, home: 'W81', away: 'W82', date: 'July 6, 2026', city: 'Seattle, USA',             stadium: 'Lumen Field' },
      { matchNumber: 95, home: 'W86', away: 'W88', date: 'July 7, 2026', city: 'Atlanta, USA',             stadium: 'Mercedes-Benz Stadium' },
      { matchNumber: 96, home: 'W85', away: 'W87', date: 'July 7, 2026', city: 'Vancouver, Canada',        stadium: 'BC Place' },
    ],
  },
  {
    id: 'qf',
    name: 'Quarterfinals',
    dateRange: 'July 9 – 11, 2026',
    matches: [
      { matchNumber: 97,  home: 'W89', away: 'W90', date: 'July 9, 2026',  city: 'Boston, USA',      stadium: 'Gillette Stadium' },
      { matchNumber: 98,  home: 'W93', away: 'W94', date: 'July 10, 2026', city: 'Los Angeles, USA', stadium: 'SoFi Stadium' },
      { matchNumber: 99,  home: 'W91', away: 'W92', date: 'July 11, 2026', city: 'Miami, USA',       stadium: 'Hard Rock Stadium' },
      { matchNumber: 100, home: 'W95', away: 'W96', date: 'July 11, 2026', city: 'Kansas City, USA', stadium: 'GEHA Field at Arrowhead Stadium' },
    ],
  },
  {
    id: 'sf',
    name: 'Semifinals',
    dateRange: 'July 14 – 15, 2026',
    matches: [
      { matchNumber: 101, home: 'W97',  away: 'W98',  date: 'July 14, 2026', city: 'Dallas, USA',  stadium: 'AT&T Stadium' },
      { matchNumber: 102, home: 'W99',  away: 'W100', date: 'July 15, 2026', city: 'Atlanta, USA', stadium: 'Mercedes-Benz Stadium' },
    ],
  },
  {
    id: 'third',
    name: 'Third Place',
    dateRange: 'July 18, 2026',
    matches: [
      { matchNumber: 103, home: 'L101', away: 'L102', date: 'July 18, 2026', city: 'Miami, USA', stadium: 'Hard Rock Stadium' },
    ],
  },
  {
    id: 'final',
    name: 'Final',
    dateRange: 'July 19, 2026',
    matches: [
      { matchNumber: 104, home: 'W101', away: 'W102', date: 'July 19, 2026', city: 'New York/New Jersey, USA', stadium: 'MetLife Stadium' },
    ],
  },
]

export const bracketData = raw.map(round => ({
  ...round,
  matches: round.matches.map(match => {
    const isoDate = toISODate(match.date)
    return {
      ...match,
      matchId: `K-${match.matchNumber}`,
      isoDate,
      // "June 28, 2026" -> "Sun, June 28, 2026" — matches the group stage
      // schedule's date format, which already leads with the weekday.
      fullDate: `${weekdayAbbrev(isoDate)}, ${match.date}`,
    }
  }),
}))
