<template>
  <article class="match group-match shine" :class="{ past: isPast }" :data-match-id="match.matchId">
    <div class="match-top">
      <span class="match-top-left">
        <span v-if="elevationLabel" class="elevation-chip">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 20 L9 8 L13 14 L16 9 L21 20 Z"/></svg>
          {{ elevationLabel }}
        </span>
      </span>
      <span v-if="isLive" class="status-chip status-live">Live</span>
      <span v-else class="match-date">{{ match.fullDate }}</span>
    </div>

    <div class="teams-row">
      <div class="team-col">
        <div class="team-crest" :class="{ 'crest-winner': showHomeWinner }">
          <div v-if="flagFor(match.home)" class="team-flag" :style="flagStyle(match.home)"></div>
          <span v-else class="team-crest-fallback">{{ initials(match.home) }}</span>
        </div>
        <div v-if="potFor(match.home) || rankFor(match.home)" class="pot-badge">
          <template v-if="potFor(match.home)">P{{ potFor(match.home) }}</template>
          <span v-if="potFor(match.home) && rankFor(match.home)" class="badge-dot">·</span>
          <template v-if="rankFor(match.home)">#{{ rankFor(match.home) }}</template>
        </div>
        <div class="team-col-name" :class="{ 'name-winner': showHomeWinner }" :title="match.home">{{ match.home }}</div>
        <div v-if="climateLine(match.home)" class="team-col-climate has-temp" :style="climateStyle(match.home)">{{ climateLine(match.home) }}</div>
      </div>

      <div class="match-score-mid" :class="{ 'score-vs': !matchScore }">
        <template v-if="matchScore">{{ matchScore.home ?? '–' }}<span class="sep">–</span>{{ matchScore.away ?? '–' }}</template>
        <template v-else>vs</template>
      </div>

      <div class="team-col">
        <div class="team-crest" :class="{ 'crest-winner': showAwayWinner }">
          <div v-if="flagFor(match.away)" class="team-flag" :style="flagStyle(match.away)"></div>
          <span v-else class="team-crest-fallback">{{ initials(match.away) }}</span>
        </div>
        <div v-if="potFor(match.away) || rankFor(match.away)" class="pot-badge">
          <template v-if="potFor(match.away)">P{{ potFor(match.away) }}</template>
          <span v-if="potFor(match.away) && rankFor(match.away)" class="badge-dot">·</span>
          <template v-if="rankFor(match.away)">#{{ rankFor(match.away) }}</template>
        </div>
        <div class="team-col-name" :class="{ 'name-winner': showAwayWinner }" :title="match.away">{{ match.away }}</div>
        <div v-if="climateLine(match.away)" class="team-col-climate has-temp" :style="climateStyle(match.away)">{{ climateLine(match.away) }}</div>
      </div>
    </div>

    <div class="match-bottom">
      <span class="meta-left">
        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span class="meta-lines">
          <span class="meta-line">{{ match.city }}</span>
        </span>
      </span>
      <span class="meta-right">
        <span class="meta-lines meta-lines-right">
          <span v-if="avgTempLine" class="meta-line">{{ avgTempLine }}</span>
          <span v-if="matchDayTempLine" class="meta-line">{{ matchDayTempLine }}</span>
        </span>
        <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0z"/></svg>
      </span>
    </div>
  </article>
</template>

<script>
import { TRAINING_CLIMATE, HOST_CITY_TEMPS_JULY, HOST_CITY_COORDS, HOST_CITY_ELEVATION, HOST_CITY_TIMEZONE, TEAM_TIMEZONE } from '../data/climate.js'
import { tempToColor, isPastDate, tzDiffHours } from '../utils/temperature.js'
import { shouldFetchLiveTemp, fetchLiveTemp } from '../utils/openMeteo.js'
import { teamPot } from '../data/seeding.js'
import { teamRank } from '../data/rankings.js'
import { flagUrl } from '../data/teamFlags.js'

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

    // Split into two short lines (avg, then match-day if we have it) rather
    // than one long parenthetical — same treatment as KnockoutMatch.vue.
    avgTempLine() {
      const julyTemp = HOST_CITY_TEMPS_JULY[this.match.city] ?? null
      return julyTemp != null ? `${julyTemp}°C avg` : null
    },

    matchDayTempLine() {
      return this.liveTemp != null ? `${this.liveTemp.toFixed(1)}°C match day` : null
    },

    elevationLabel() {
      if (!this.showElevation) return null
      const e = HOST_CITY_ELEVATION[this.match.city]
      if (e == null) return null
      return `${e.toLocaleString('en-US')}m`
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

    potFor(name) {
      return this.showPot ? teamPot(name) : null
    },

    rankFor(name) {
      return this.showPot ? teamRank(name) : null
    },

    flagFor(name) {
      return flagUrl(name)
    },

    // Building the style as an object (rather than a `url(${...})` string
    // straight in the template) is what lets the value be safely quoted —
    // some of the flag SVGs get inlined as data: URIs by Vite, and an
    // unquoted `url(...)` breaks the moment that data URI contains a
    // character CSS treats as special unquoted (e.g. a literal '"').
    flagStyle(name) {
      const url = flagUrl(name)
      return url ? { backgroundImage: `url("${url}")` } : {}
    },

    // Both teams in a group match are always known upfront (unlike the
    // bracket, nothing here is ever an unresolved slot), so this is just
    // real initials — "South Korea" → "SK".
    initials(name) {
      const words = name.split(/\s+/).filter(Boolean)
      const letters = words.length > 1
        ? words.slice(0, 3).map(w => w[0])
        : [name.slice(0, 3)]
      return letters.join('').toUpperCase().slice(0, 3)
    },

    climateLine(name) {
      const climate = TRAINING_CLIMATE[name]
      const diff    = this.showTimezone ? this.tzDiff(name) : 0
      const tzStr   = diff !== 0 ? `${diff > 0 ? '+' : ''}${diff}h` : ''
      if (climate && tzStr) return `${climate.tempC}°C · ${tzStr}`
      if (climate) return `${climate.tempC}°C`
      return tzStr || null
    },

    climateStyle(name) {
      const climate = TRAINING_CLIMATE[name]
      return climate ? { '--temp-bg': tempToColor(climate.tempC) } : {}
    },
  },
}
</script>
