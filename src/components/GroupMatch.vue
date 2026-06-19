<template>
  <article class="match group-match" :class="{ past: isPast }" :data-match-id="match.matchId">
    <div class="match-header">
      <span class="match-date">{{ match.fullDate }}</span>
      <span class="city-label">{{ cityLabel }}</span>
    </div>

    <div v-if="matchScore" class="match-score">
      <span>{{ matchScore.home ?? '–' }}</span>
      <span class="score-sep">–</span>
      <span>{{ matchScore.away ?? '–' }}</span>
      <span v-if="isLive" class="score-live">LIVE</span>
    </div>

    <div class="teams">
      <div
        class="team-name"
        :class="teamClass(match.home, showHomeWinner)"
        :style="teamStyle(match.home)"
        @click="handleClick('home')"
      >{{ teamText(match.home) }}</div>
      <div
        class="team-name"
        :class="teamClass(match.away, showAwayWinner)"
        :style="teamStyle(match.away)"
        @click="handleClick('away')"
      >{{ teamText(match.away) }}</div>
    </div>
  </article>
</template>

<script>
import { TRAINING_CLIMATE, HOST_CITY_TEMPS_JULY, HOST_CITY_COORDS } from '../data/climate.js'
import { tempToColor, isPastDate } from '../utils/temperature.js'
import { shouldFetchLiveTemp, fetchLiveTemp } from '../utils/openMeteo.js'
import { getWinner, toggleWinner } from '../utils/winnerStorage.js'

export default {
  props: {
    match:  { type: Object, required: true },
    scores: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      homeWinner: false,
      awayWinner: false,
      liveTemp:   null,
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

    showHomeWinner() {
      if (this.isFinished) return (this.matchScore.home ?? 0) > (this.matchScore.away ?? 0)
      return this.homeWinner
    },

    showAwayWinner() {
      if (this.isFinished) return (this.matchScore.away ?? 0) > (this.matchScore.home ?? 0)
      return this.awayWinner
    },
  },

  async mounted() {
    this.homeWinner = getWinner(this.match.matchId, 'home')
    this.awayWinner = getWinner(this.match.matchId, 'away')

    if (shouldFetchLiveTemp(this.match.isoDate)) {
      const coords = HOST_CITY_COORDS[this.match.city]
      if (coords) {
        this.liveTemp = await fetchLiveTemp(this.match.city, this.match.isoDate, coords)
      }
    }
  },

  methods: {
    handleClick(side) {
      if (this.matchScore) return  // API score is authoritative; no manual toggle
      if (side === 'home') {
        this.homeWinner = toggleWinner(this.match.matchId, 'home')
      } else {
        this.awayWinner = toggleWinner(this.match.matchId, 'away')
      }
    },

    teamText(name) {
      const climate = TRAINING_CLIMATE[name]
      return climate ? `${name} (${climate.tempC}°C)` : name
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
