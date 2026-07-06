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
          @click="handleClick('home')"
          @contextmenu.prevent="$emit('edit-slot', match.home)"
          @touchstart.passive="onTouchStart(match.home)"
          @touchend="onTouchEnd"
          @touchmove.passive="onTouchEnd"
        >
          <span class="slot-main">{{ slotText(match.home) }}</span>
          <span v-if="slotNote(match.home)" class="slot-note">{{ slotNote(match.home) }}</span>
        </span>
      </div>
      <div class="team">
        <span
          class="team-slot"
          :class="slotClass(match.away, showAwayWinner)"
          :style="slotStyle(match.away)"
          @click="handleClick('away')"
          @contextmenu.prevent="$emit('edit-slot', match.away)"
          @touchstart.passive="onTouchStart(match.away)"
          @touchend="onTouchEnd"
          @touchmove.passive="onTouchEnd"
        >
          <span class="slot-main">{{ slotText(match.away) }}</span>
          <span v-if="slotNote(match.away)" class="slot-note">{{ slotNote(match.away) }}</span>
        </span>
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
import { describeSlot } from '../utils/slots.js'
import { getWinner, toggleWinner } from '../utils/winnerStorage.js'

export default {
  emits: ['edit-slot'],

  props: {
    match:       { type: Object, required: true },
    assignments: { type: Object, required: true },
    scores:      { type: Object, default: () => ({}) },
  },

  data() {
    return {
      homeWinner:      false,
      awayWinner:      false,
      liveTemp:        null,
      pressTimer:      null,
      pendingSlot:     null,
      longPressActive: false,
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
      if (this.longPressActive) {
        this.longPressActive = false
        return
      }
      if (this.matchScore) return
      if (side === 'home') {
        this.homeWinner = toggleWinner(this.match.matchId, 'home')
      } else {
        this.awayWinner = toggleWinner(this.match.matchId, 'away')
      }
    },

    onTouchStart(slot) {
      this.longPressActive = false
      this.pendingSlot = slot
      this.pressTimer = setTimeout(() => {
        this.longPressActive = true
        this.$emit('edit-slot', slot)
        this.pressTimer = null
      }, 500)
    },

    onTouchEnd() {
      if (this.pressTimer) {
        clearTimeout(this.pressTimer)
        this.pressTimer = null
      }
    },

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

    slotNote(slot) {
      const team = this.assignments[slot]
      const desc = describeSlot(slot)
      return (team && desc) ? `${desc} (${slot})` : desc
    },
  },
}
</script>
