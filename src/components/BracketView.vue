<template>
  <div class="bracket-wrap">
    <div class="scroll-hint-row">
      <div class="scroll-hint" :class="{ 'is-hidden': !showScrollHint }">
        <svg class="scroll-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        Scroll for more
      </div>
    </div>

    <div class="bracket" ref="bracketEl" @scroll="onBracketScroll">
      <section class="round" v-for="round in bracketData" :key="round.id">
        <h2 class="round-title">{{ round.name }}</h2>
        <div class="round-dates">{{ round.dateRange }}</div>
        <KnockoutMatch
          v-for="match in round.matches"
          :key="match.matchNumber"
          :match="match"
          :assignments="assignments"
          :scores="scores"
          :show-elevation="showElevation"
          :show-timezone="showTimezone"
          :show-pot="showPot"
        />
      </section>
    </div>
  </div>
</template>

<script>
import { bracketData }       from '../data/bracket.js'
import { deriveAssignments } from '../utils/bracketProgression.js'
import KnockoutMatch          from './KnockoutMatch.vue'

export default {
  components: { KnockoutMatch },

  props: {
    scores:        { type: Object,  default: () => ({}) },
    showElevation: { type: Boolean, default: true },
    showTimezone:  { type: Boolean, default: true },
    showPot:       { type: Boolean, default: true },
  },

  data() {
    return {
      bracketData,
      // Only worth showing at all if there's actually somewhere to
      // scroll to — set once on mount, then dropped for good the moment
      // the user scrolls, so it never lingers as a nag.
      showScrollHint: false,
    }
  },

  computed: {
    // Every slot is derived straight from real results now — see
    // deriveAssignments() in bracketProgression.js.
    assignments() {
      return deriveAssignments(this.scores)
    },
  },

  mounted() {
    // nextTick rather than checking immediately — layout needs to have
    // actually settled for scrollWidth/clientWidth to be trustworthy.
    this.$nextTick(() => {
      const el = this.$refs.bracketEl
      if (el && el.scrollWidth > el.clientWidth + 1) {
        this.showScrollHint = true
      }
    })
  },

  methods: {
    onBracketScroll() {
      if (this.showScrollHint) this.showScrollHint = false
    },
  },
}
</script>
