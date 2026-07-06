const KEY = 'wc26WinnerStates'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

export function getWinner(matchId, side) {
  return !!load()[`${matchId}-${side}`]
}

export function toggleWinner(matchId, side) {
  const state = load()
  const key = `${matchId}-${side}`
  const otherKey = `${matchId}-${side === 'home' ? 'away' : 'home'}`
  if (state[key]) {
    delete state[key]
  } else {
    state[key] = true
    delete state[otherKey] // only one winner per match
  }
  save(state)
  return !!state[key]
}
