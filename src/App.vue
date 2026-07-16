<template>
  <header class="app-header">
    <h1>World Cup 2026 Heat Bracket</h1>
    <p class="subtitle">
      Are factors like heat and elevation making teams under- or over-perform at the World Cup?
      Let's see what the data shows us.
    </p>
  </header>

  <div class="toolbar">
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

    <template v-if="activeTab !== 'insights'">
      <div class="toolbar-divider"></div>
      <div class="display-toggles">
        <label class="switch-row">
          <span class="switch-label">Elevation</span>
          <button
            type="button"
            role="switch"
            :aria-checked="showElevation"
            class="ios-switch"
            :class="{ on: showElevation }"
            @click="toggleDisplay('showElevation')"
          ><span class="ios-switch-knob"></span></button>
        </label>
        <label class="switch-row">
          <span class="switch-label">Timezone</span>
          <button
            type="button"
            role="switch"
            :aria-checked="showTimezone"
            class="ios-switch"
            :class="{ on: showTimezone }"
            @click="toggleDisplay('showTimezone')"
          ><span class="ios-switch-knob"></span></button>
        </label>
        <label class="switch-row">
          <span class="switch-label">FIFA Seeding</span>
          <button
            type="button"
            role="switch"
            :aria-checked="showPot"
            class="ios-switch"
            :class="{ on: showPot }"
            @click="toggleDisplay('showPot')"
          ><span class="ios-switch-knob"></span></button>
        </label>
      </div>
    </template>
  </div>

  <BracketView
    v-show="activeTab === 'bracket'"
    :scores="scores"
    :show-elevation="showElevation"
    :show-timezone="showTimezone"
    :show-pot="showPot"
  />
  <ScheduleView
    v-show="activeTab === 'schedule'"
    :scores="scores"
    :show-elevation="showElevation"
    :show-timezone="showTimezone"
    :show-pot="showPot"
  />
  <InsightsView  v-show="activeTab === 'insights'" :scores="scores" />
</template>

<script>
import BracketView   from './components/BracketView.vue'
import ScheduleView  from './components/ScheduleView.vue'
import InsightsView  from './components/InsightsView.vue'

const SCORES_URL = import.meta.env.VITE_SCORES_URL
const DISPLAY_PREFS_KEY = 'wc26DisplayPrefs'

export default {
  components: { BracketView, ScheduleView, InsightsView },

  data() {
    return {
      activeTab:     'bracket',
      scores:        {},
      // All default to on — nothing changes for anyone until they
      // actually reach for a toggle.
      showElevation: true,
      showTimezone:  true,
      showPot:       true,
    }
  },

  mounted() {
    try {
      const raw = localStorage.getItem(DISPLAY_PREFS_KEY)
      const prefs = raw ? JSON.parse(raw) : {}
      if (typeof prefs.showElevation === 'boolean') this.showElevation = prefs.showElevation
      if (typeof prefs.showTimezone  === 'boolean') this.showTimezone  = prefs.showTimezone
      if (typeof prefs.showPot       === 'boolean') this.showPot       = prefs.showPot
    } catch { /* storage unavailable — stick with the defaults */ }

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

    toggleDisplay(key) {
      this[key] = !this[key]
      try {
        localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify({
          showElevation: this.showElevation,
          showTimezone:  this.showTimezone,
          showPot:       this.showPot,
        }))
      } catch { /* storage unavailable */ }
    },
  },
}
</script>
