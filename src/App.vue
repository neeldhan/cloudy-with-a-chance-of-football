<template>
  <h1>World Cup 2026 Heat Bracket</h1>
  <p class="subtitle">
    Are factors like heat and elevation making teams under- or over-perform at the World Cup?
    Let's see what the data shows us.
  </p>

  <nav class="main-nav">
    <button
      class="tab-button"
      :class="{ active: activeTab === 'bracket' }"
      @click="activeTab = 'bracket'"
    >Knockout Bracket</button>
    <button
      class="tab-button"
      :class="{ active: activeTab === 'schedule' }"
      @click="activeTab = 'schedule'"
    >Group Stage Schedule</button>
    <button
      class="tab-button"
      :class="{ active: activeTab === 'insights' }"
      @click="activeTab = 'insights'"
    >Insights</button>
  </nav>

  <BracketView   v-show="activeTab === 'bracket'"  :scores="scores" />
  <ScheduleView  v-show="activeTab === 'schedule'" :scores="scores" />
  <InsightsView  v-show="activeTab === 'insights'" :scores="scores" />
</template>

<script>
import BracketView   from './components/BracketView.vue'
import ScheduleView  from './components/ScheduleView.vue'
import InsightsView  from './components/InsightsView.vue'

const SCORES_URL = import.meta.env.VITE_SCORES_URL

export default {
  components: { BracketView, ScheduleView, InsightsView },

  data() {
    return {
      activeTab: 'bracket',
      scores:    {},
    }
  },

  mounted() {
    if (SCORES_URL) {
      this.refreshScores()
      this._scoreTimer = setInterval(this.refreshScores, 60_000)
    }
  },

  beforeUnmount() {
    clearInterval(this._scoreTimer)
  },

  methods: {
    async refreshScores() {
      try {
        const res = await fetch(SCORES_URL)
        if (res.ok) this.scores = await res.json()
      } catch { /* network error — keep showing last known scores */ }
    },
  },
}
</script>
