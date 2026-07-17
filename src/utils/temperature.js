// Four-segment blue→green→yellow→orange→red scale, anchored to real
// training-climate temperatures rather than a straight two-colour RGB
// lerp — the old cyan→red-via-gold version still capped out orange-ish
// at the very top of the range and never actually reached red. This
// spends most of the 15-30°C band easing through blue/green/yellow (the
// range most training climates actually fall in), then compresses
// orange→red into the last few degrees so it's visibly red by 34°C and
// stays there for anything hotter.
const TEMP_STOPS = [
  { t: 15, c: { r: 96,  g: 165, b: 250 } }, // lighter blue
  { t: 24, c: { r: 34,  g: 197, b: 94  } }, // green
  { t: 28, c: { r: 250, g: 204, b: 21  } }, // yellow
  { t: 32, c: { r: 249, g: 115, b: 22  } }, // orange
  { t: 34, c: { r: 239, g: 68,  b: 68  } }, // red
]

export function tempToColor(tempC) {
  const clamped = Math.max(TEMP_STOPS[0].t, Math.min(TEMP_STOPS[TEMP_STOPS.length - 1].t, tempC))
  for (let i = 0; i < TEMP_STOPS.length - 1; i++) {
    const a = TEMP_STOPS[i]
    const b = TEMP_STOPS[i + 1]
    if (clamped < a.t || clamped > b.t) continue
    const localT = (clamped - a.t) / (b.t - a.t)
    const r  = Math.round(a.c.r + (b.c.r - a.c.r) * localT)
    const g  = Math.round(a.c.g + (b.c.g - a.c.g) * localT)
    const bl = Math.round(a.c.b + (b.c.b - a.c.b) * localT)
    return `rgb(${r},${g},${bl})`
  }
  const last = TEMP_STOPS[TEMP_STOPS.length - 1].c
  return `rgb(${last.r},${last.g},${last.b})`
}

// Full multi-stop CSS gradient stop-list between two temperatures, so a
// bar spanning a range actually sweeps through every colour tempToColor()
// passes through along the way — a plain two-point `linear-gradient(a, b)`
// only samples the two endpoint colours and lets the browser lerp
// straight between them in RGB space, which cuts through hues the scale
// never uses (e.g. blue mixing directly to orange looks like it passes
// through purple, skipping green/yellow entirely). Passing every anchor
// the range crosses as its own stop keeps the bar's sweep true to the
// same scale a single tempToColor() call produces.
export function tempGradientStops(fromTemp, toTemp) {
  if (toTemp <= fromTemp) return `${tempToColor(fromTemp)} 0%, ${tempToColor(toTemp)} 100%`
  const crossed = TEMP_STOPS.filter(s => s.t > fromTemp && s.t < toTemp)
  const temps = [fromTemp, ...crossed.map(s => s.t), toTemp]
  return temps
    .map(t => `${tempToColor(t)} ${((t - fromTemp) / (toTemp - fromTemp)) * 100}%`)
    .join(', ')
}

export function toISODate(dateString) {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return null
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Weekday abbreviation for an ISO date ("2026-06-28" -> "Sun"). Deliberately
// pure UTC date-part arithmetic rather than `new Date(isoDate).getDay()` —
// a bare "YYYY-MM-DD" string parses as UTC midnight, but .getDay() reads
// local time, so that combination silently shifts the weekday by one in
// any timezone behind UTC (most of the Americas).
export function weekdayAbbrev(isoDate) {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
}

function getUtcOffsetHours(timezone, date) {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(date)
    const s = parts.find(p => p.type === 'timeZoneName')?.value ?? 'GMT+0'
    const m = s.match(/GMT([+-])(\d+)(?::(\d+))?/)
    if (!m) return 0
    return (m[1] === '+' ? 1 : -1) * (parseInt(m[2], 10) + parseInt(m[3] ?? '0', 10) / 60)
  } catch {
    return 0
  }
}

// Returns home timezone offset minus venue timezone offset, rounded to nearest 0.5h.
// Positive = team's home is ahead of the venue (e.g. France +6h vs New York).
export function tzDiffHours(teamTz, cityTz, isoDate) {
  if (!teamTz || !cityTz || !isoDate) return 0
  const date = new Date(`${isoDate}T12:00:00Z`)
  if (isNaN(date.getTime())) return 0
  const raw = getUtcOffsetHours(teamTz, date) - getUtcOffsetHours(cityTz, date)
  return Math.round(raw * 2) / 2
}

export function isPastDate(isoDate) {
  if (!isoDate) return false
  const [y, m, d] = isoDate.split('-').map(Number)
  const matchDate = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return matchDate < today
}
