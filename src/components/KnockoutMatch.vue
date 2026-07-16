<template>
  <article class="match" :class="{ past: isPast }" :data-match-id="match.matchId">
    <div class="match-header">
      <span class="match-number">Match {{ match.matchNumber }}</span>
      <span class="match-date">{{ match.date }}</span>
    </div>

    <div v-if="matchScore" class="match-score">
      <span>{{ matchScore.home ?? '–' }}</span>
      <span class="score-sep">–</span>
      <span>{{ matchScore.away ?? '–' }}</span>
      <span v-if="isLive" class="score-live">LIVE</span>
    </div>

    <div class="teams">
      <div class="team">
        <span
          class="team-slot"
          :class="slotClass(match.home, showHomeWinner)"
          :style="slotStyle(match.home)"
        >{{ slotText(match.home) }}</span>
      </div>
      <div class="team">
        <span
          class="team-slot"
          :class="slotClass(match.away, showAwayWinner)"
          :style="slotStyle(match.away)"
        >{{ slotText(match.away) }}</span>
      </div>
    </div>

    <div class="meta">
      <div class="meta-line">{{ match.stadium }}</div>
      <div class="meta-line">{{ cityLabel }}</div>
      <div v-if="elevationLabel" class="meta-line elevation-label">{{ elevationLabel }}</div>
    </div>
  </article>
</template>

<script>
import { TRAINING_CLIMATE, HOST_CITY_TEMPS_JULY, HOST_CITY_COORDS, HOST_CITY_ELEVATION, HOST_CITY_TIMEZONE, TEAM_TIMEZONE } from '../data/climate.js'
import { tempToColor, isPastDate, tzDiffHours } from '../utils/temperature.js'
import { shouldFetchLiveTemp, fetchLiveTemp } from '../utils/openMeteo.js'

export default {
  props: {
    match:       { type: Object, required: true },
    assignments: { type: Object, required: true },
    scores:      { type: Object, default: () => ({}) },
  },

  data() {
    return {
      liveTemp: null,
    }
  },

  computed: {
    isPast() {
      return isPastDate(this.match.isoDate)
    },

    cityLabel() {
      const julyTemp = HOST_CITY_TEMPS_JULY[this.match.city] ?? null
      if (julyTemp == null) return this.match.city
      const base = `${this.match.city} (${julyTemp}°C avg Jul`
      return this.liveTemp != null
        ? `${base}, ${this.liveTemp.toFixed(1)}°C match-day)`
        : `${base})`
    },

    elevationLabel() {
      const e = HOST_CITY_ELEVATION[this.match.city]
      if (e == null) return null
      return `${e.toLocaleString('en-US')}m elevation`
    },

    matchScore() {
      const home = this.assignments[this.match.home]
      const away = this.assignments[this.match.away]
      if (!home || !away) return null
      return this.scores[`${home}|${away}`] ?? null
    },

    isLive() {
      const s = this.matchScore?.status
      return s === 'IN_PLAY' || s === 'PAUSED' || s === 'EXTRA_TIME' || s === 'PENALTY_SHOOTOUT'
    },

    isFinished() {
      const s = this.matchScore?.status
      return s === 'FINISHED' || s === 'AWARDED'
    },

    // Winner highlighting only ever reflects a real result now — there's
    // no manual fallback, since the bracket auto-populates from live scores.
    showHomeWinner() {
      return this.isFinished && (this.matchScore.home ?? 0) > (this.matchScore.away ?? 0)
    },

    showAwayWinner() {
      return this.isFinished && (this.matchScore.away ?? 0) > (this.matchScore.home ?? 0)
    },
  },

  async mounted() {
    if (shouldFetchLiveTemp(this.match.isoDate)) {
      const coords = HOST_CITY_COORDS[this.match.city]
      if (coords) {
        this.liveTemp = await fetchLiveTemp(this.match.city, this.match.isoDate, coords)
      }
    }
  },

  methods: {
    tzDiff(team) {
      if (!team) return 0
      return tzDiffHours(TEAM_TIMEZONE[team], HOST_CITY_TIMEZONE[this.match.city], this.match.isoDate)
    },

    getClimate(slot) {
      const team = this.assignments[slot]
      return team ? (TRAINING_CLIMATE[team] ?? null) : null
    },

    slotText(slot) {
      const team  = this.assignments[slot]
      if (!team) return slot
      const climate = TRAINING_CLIMATE[team]
      const diff    = this.tzDiff(team)
      const tzStr   = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff}h)` : ''
      return climate ? `${team} (${climate.tempC}°C)${tzStr}` : `${team}${tzStr}`
    },

    slotClass(slot, isWinner) {
      const team    = this.assignments[slot]
      const climate = team ? TRAINING_CLIMATE[team] : null
      return {
        assigned:   !!team,
        'has-temp': !!climate,
        winner:     isWinner,
      }
    },

    slotStyle(slot) {
      const climate = this.getClimate(slot)
      return climate ? { '--temp-bg': tempToColor(climate.tempC) } : {}
    },
  },
}
</script>
