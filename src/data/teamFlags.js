// Maps each of the 48 team names (same exact strings TEAM_POT in seeding.js
// uses) to the country/subdivision code the flag-icons package ships an SVG
// for. England and Scotland aren't ISO 3166-1 countries, so flag-icons uses
// its own gb-eng/gb-sct subdivision codes for those two.
const TEAM_CODE = {
  'United States': 'us',
  'Mexico':        'mx',
  'Canada':        'ca',
  'Spain':         'es',
  'Argentina':     'ar',
  'France':        'fr',
  'England':       'gb-eng',
  'Brazil':        'br',
  'Portugal':      'pt',
  'Netherlands':   'nl',
  'Belgium':       'be',
  'Germany':       'de',

  'Croatia':       'hr',
  'Morocco':       'ma',
  'Colombia':      'co',
  'Uruguay':       'uy',
  'Switzerland':   'ch',
  'Japan':         'jp',
  'Senegal':       'sn',
  'Iran':          'ir',
  'South Korea':   'kr',
  'Ecuador':       'ec',
  'Austria':       'at',
  'Australia':     'au',

  'Norway':        'no',
  'Panama':        'pa',
  'Egypt':         'eg',
  'Algeria':       'dz',
  'Scotland':      'gb-sct',
  'Paraguay':      'py',
  'Tunisia':       'tn',
  'Ivory Coast':   'ci',
  'Uzbekistan':    'uz',
  'Qatar':         'qa',
  'Saudi Arabia':  'sa',
  'South Africa':  'za',

  'Jordan':                 'jo',
  'Cape Verde':             'cv',
  'Ghana':                  'gh',
  'Curacao':                'cw',
  'Haiti':                  'ht',
  'New Zealand':            'nz',
  'Bosnia and Herzegovina': 'ba',
  'Czechia':                'cz',
  'Sweden':                 'se',
  'Turkiye':                'tr',
  'DR Congo':               'cd',
  'Iraq':                   'iq',
}

// Eagerly resolved at build time to real asset URLs (hashed, bundled) —
// keyed by the source path glob produced, not by our own code strings.
// import.meta.glob needs literal patterns (Vite statically analyses the
// call, it can't evaluate a computed string), so this list is spelled
// out by hand rather than built from TEAM_CODE's values — it must be
// kept in sync with the codes above. One explicit pattern per code
// rather than a bare `*.svg`, which would otherwise bundle all ~250
// flags flag-icons ships instead of just the 48 teams this app needs.
const flagModules = import.meta.glob(
  [
    '../../node_modules/flag-icons/flags/1x1/us.svg',
    '../../node_modules/flag-icons/flags/1x1/mx.svg',
    '../../node_modules/flag-icons/flags/1x1/ca.svg',
    '../../node_modules/flag-icons/flags/1x1/es.svg',
    '../../node_modules/flag-icons/flags/1x1/ar.svg',
    '../../node_modules/flag-icons/flags/1x1/fr.svg',
    '../../node_modules/flag-icons/flags/1x1/gb-eng.svg',
    '../../node_modules/flag-icons/flags/1x1/br.svg',
    '../../node_modules/flag-icons/flags/1x1/pt.svg',
    '../../node_modules/flag-icons/flags/1x1/nl.svg',
    '../../node_modules/flag-icons/flags/1x1/be.svg',
    '../../node_modules/flag-icons/flags/1x1/de.svg',
    '../../node_modules/flag-icons/flags/1x1/hr.svg',
    '../../node_modules/flag-icons/flags/1x1/ma.svg',
    '../../node_modules/flag-icons/flags/1x1/co.svg',
    '../../node_modules/flag-icons/flags/1x1/uy.svg',
    '../../node_modules/flag-icons/flags/1x1/ch.svg',
    '../../node_modules/flag-icons/flags/1x1/jp.svg',
    '../../node_modules/flag-icons/flags/1x1/sn.svg',
    '../../node_modules/flag-icons/flags/1x1/ir.svg',
    '../../node_modules/flag-icons/flags/1x1/kr.svg',
    '../../node_modules/flag-icons/flags/1x1/ec.svg',
    '../../node_modules/flag-icons/flags/1x1/at.svg',
    '../../node_modules/flag-icons/flags/1x1/au.svg',
    '../../node_modules/flag-icons/flags/1x1/no.svg',
    '../../node_modules/flag-icons/flags/1x1/pa.svg',
    '../../node_modules/flag-icons/flags/1x1/eg.svg',
    '../../node_modules/flag-icons/flags/1x1/dz.svg',
    '../../node_modules/flag-icons/flags/1x1/gb-sct.svg',
    '../../node_modules/flag-icons/flags/1x1/py.svg',
    '../../node_modules/flag-icons/flags/1x1/tn.svg',
    '../../node_modules/flag-icons/flags/1x1/ci.svg',
    '../../node_modules/flag-icons/flags/1x1/uz.svg',
    '../../node_modules/flag-icons/flags/1x1/qa.svg',
    '../../node_modules/flag-icons/flags/1x1/sa.svg',
    '../../node_modules/flag-icons/flags/1x1/za.svg',
    '../../node_modules/flag-icons/flags/1x1/jo.svg',
    '../../node_modules/flag-icons/flags/1x1/cv.svg',
    '../../node_modules/flag-icons/flags/1x1/gh.svg',
    '../../node_modules/flag-icons/flags/1x1/cw.svg',
    '../../node_modules/flag-icons/flags/1x1/ht.svg',
    '../../node_modules/flag-icons/flags/1x1/nz.svg',
    '../../node_modules/flag-icons/flags/1x1/ba.svg',
    '../../node_modules/flag-icons/flags/1x1/cz.svg',
    '../../node_modules/flag-icons/flags/1x1/se.svg',
    '../../node_modules/flag-icons/flags/1x1/tr.svg',
    '../../node_modules/flag-icons/flags/1x1/cd.svg',
    '../../node_modules/flag-icons/flags/1x1/iq.svg',
  ],
  { eager: true, query: '?url', import: 'default' },
)

export function flagUrl(team) {
  const code = TEAM_CODE[team]
  if (!code) return null
  return flagModules[`../../node_modules/flag-icons/flags/1x1/${code}.svg`] ?? null
}
