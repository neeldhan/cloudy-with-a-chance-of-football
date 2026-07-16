<template>
  <div class="bracket">
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
    }
  },

  computed: {
    // Every slot is derived straight from real results now — see
    // deriveAssignments() in bracketProgression.js.
    assignments() {
      return deriveAssignments(this.scores)
    },
  },
}
</script>
