<template>
  <div class="schedule-grid">
    <GroupSection
      v-for="group in groupStageData"
      :key="group.group"
      :group="group"
      :scores="scores"
    />
  </div>
</template>

<script>
import { groupStageData } from '../data/groupStage.js'
import GroupSection from './GroupSection.vue'

export default {
  components: { GroupSection },

  props: {
    scores: { type: Object, default: () => ({}) },
  },

  data() {
    return { groupStageData }
  },
}
</script>
