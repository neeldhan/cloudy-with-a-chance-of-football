<template>
  <article class="match group-match" :class="{ past: isPast }" :data-match-id="match.matchId">
    <div class="match-header">
      <span class="match-date">{{ match.fullDate }}</span>
      <span class="city-label">{{ cityLabel }}</span>
      <span v-if="elevationLabel" class="elevation-label">{{ elevationLabel }}</span>
    </div>

    <div v-if="matchScore" class="match-score">
      <span>{{ matchScore.home ?? '–' }}</span>
      <span class="score-sep">–</span>
      <span>{{ matchScore.away ?? '–' }}</span>
      <span v-if="isLive" class="score-live">LIVE</span>
    </div>

    <div class="teams">
      <div class="team-row">
        <span
          class="team-name"
          :class="teamClass(match.home, showHomeWinner)"
          :style="teamStyle(match.home)"
        ><span v-if="teamPot(match.home)" class="pot-badge">P{{ teamPot(match.home) }}</span>{{ teamText(match.home) }}</span>
      </div>
      <div class="team-row">
        <span
          class="team-name"
          :class="teamClass(match.away, showAwayWinner)"
          :style="teamStyle(match.away)"
        ><span v-if="teamPot(match.away)" class="pot-badge">P{{ teamPot(match.away) }}</span>{{ teamText(match.away) }}</span>
      </div>
    </div>
  </article>
</template>

<script>
import { TRAINING_CLIMATE, HOST_CITY_TEMPS_JULY, HOST_CITY_COORDS, HOST_CITY_ELEVATION, HOST_CITY_TIMEZONE, TEAM_TIMEZONE } from '../data/climate.js'
import { tempToColor, isPastDate, tzDiffHours } from '../utils/temperature.js'
import { shouldFetchLiveTemp, fetchLiveTemp } from '../utils/openMeteo.js'
import { teamPot as lookupPot } from '../data/seeding.js'

export default {
  props: {
    match:         { type: Object,  required: true },
    scores:        { type: Object,  default: () => ({}) },
    showElevation: { type: Boolean, default: true },
    showTimezone:  { type: Boolean, default: true },
    showPot:       { type: Boolean, default: true },
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
      if (!this.showElevation) return null
      const e = HOST_CITY_ELEVATION[this.match.city]
      if (e == null) return null
      return `${e.toLocaleString('en-US')}m elevation`
    },

    matchScore() {
      return this.scores[`${this.match.home}|${this.match.away}`] ?? null
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
    // no manual fallback, since scores come straight from the live API.
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
    tzDiff(name) {
      return tzDiffHours(TEAM_TIMEZONE[name], HOST_CITY_TIMEZONE[this.match.city], this.match.isoDate)
    },

    teamPot(name) {
      return this.showPot ? lookupPot(name) : null
    },

    teamText(name) {
      const climate = TRAINING_CLIMATE[name]
      const diff    = this.showTimezone ? this.tzDiff(name) : 0
      const tzStr   = diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff}h)` : ''
      return climate ? `${name} (${climate.tempC}°C)${tzStr}` : `${name}${tzStr}`
    },

    teamClass(name, isWinner) {
      return {
        'has-temp': !!TRAINING_CLIMATE[name],
        winner:    isWinner,
      }
    },

    teamStyle(name) {
      const climate = TRAINING_CLIMATE[name]
      return climate ? { '--temp-bg': tempToColor(climate.tempC) } : {}
    },
  },
}
</script>
