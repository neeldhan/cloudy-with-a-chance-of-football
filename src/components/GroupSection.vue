<template>
  <section class="group-section">
    <h2 class="group-title">Group {{ group.group }}</h2>
    <div class="group-teams">{{ teamNames.join(' · ') }}</div>
    <GroupMatch
      v-for="match in group.matches"
      :key="match.matchId"
      :match="match"
      :scores="scores"
      :show-elevation="showElevation"
      :show-timezone="showTimezone"
      :show-pot="showPot"
    />
  </section>
</template>

<script>
import { GROUP_TEAMS } from '../data/groups.js'
import GroupMatch from './GroupMatch.vue'

export default {
  components: { GroupMatch },

  props: {
    group:         { type: Object,  required: true },
    scores:        { type: Object,  default: () => ({}) },
    showElevation: { type: Boolean, default: true },
    showTimezone:  { type: Boolean, default: true },
    showPot:       { type: Boolean, default: true },
  },

  computed: {
    teamNames() {
      return GROUP_TEAMS[this.group.group] || []
    },
  },
}
</script>
