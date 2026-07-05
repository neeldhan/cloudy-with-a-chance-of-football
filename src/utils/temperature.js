export function tempToColor(tempC) {
  const minT = 15
  const maxT = 40
  const t = (Math.max(minT, Math.min(maxT, tempC)) - minT) / (maxT - minT)
  const cold = { r: 56,  g: 189, b: 248 }
  const hot  = { r: 185, g: 28,  b: 28  }
  const r = Math.round(cold.r + (hot.r - cold.r) * t)
  const g = Math.round(cold.g + (hot.g - cold.g) * t)
  const b = Math.round(cold.b + (hot.b - cold.b) * t)
  return `rgb(${r},${g},${b})`
}

export function toISODate(dateString) {
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return null
  const year  = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
