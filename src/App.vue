<template>
  <h1>World Cup 2026 Heat Bracket</h1>
  <p class="subtitle">
    Tap any team to toggle winner highlight &nbsp;·&nbsp;
    Right-click or long-press a bracket slot to assign a team
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
  </nav>

  <BracketView  v-show="activeTab === 'bracket'"  :scores="scores" />
  <ScheduleView v-show="activeTab === 'schedule'" :scores="scores" />
</template>

<script>
import BracketView  from './components/BracketView.vue'
import ScheduleView from './components/ScheduleView.vue'

const SCORES_URL = import.meta.env.VITE_SCORES_URL

export default {
  components: { BracketView, ScheduleView },

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
