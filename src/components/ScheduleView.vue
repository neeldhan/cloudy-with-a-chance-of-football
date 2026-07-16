<template>
  <div class="schedule-grid">
    <GroupSection
      v-for="group in groupStageData"
      :key="group.group"
      :group="group"
      :scores="scores"
      :show-elevation="showElevation"
      :show-timezone="showTimezone"
      :show-pot="showPot"
    />
  </div>
</template>

<script>
import { groupStageData } from '../data/groupStage.js'
import GroupSection from './GroupSection.vue'

export default {
  components: { GroupSection },

  props: {
    scores:        { type: Object,  default: () => ({}) },
    showElevation: { type: Boolean, default: true },
    showTimezone:  { type: Boolean, default: true },
    showPot:       { type: Boolean, default: true },
  },

  data() {
    return { groupStageData }
  },
}
</script>
