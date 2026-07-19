<template>
  <div class="glow glow-gold"></div>
  <div class="glow glow-green"></div>
  <div class="glow glow-amber"></div>
  <div class="glow glow-blue"></div>

  <nav class="top-nav">
    <div class="nav-mark">
      <span class="nav-ball"></span>
      <span class="nav-mark-text">
        <span class="nav-mark-eyebrow">FIFA World Cup 2026</span>
        <span class="nav-mark-title">Heat Bracket</span>
      </span>
    </div>

    <button
      class="nav-menu-toggle"
      :class="{ open: mobileMenuOpen }"
      :aria-expanded="mobileMenuOpen"
      aria-label="Menu"
      @click="mobileMenuOpen = !mobileMenuOpen"
    >
      <span class="nav-menu-bar"></span>
      <span class="nav-menu-bar"></span>
      <span class="nav-menu-bar"></span>
    </button>

    <div class="nav-tabs" :class="{ open: mobileMenuOpen }">
      <div class="nav-tabs-inner">
        <button
          class="tab-button"
          :class="{ active: activeTab === 'bracket' }"
          @click="selectTab('bracket')"
        >Knockout Bracket</button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'schedule' }"
          @click="selectTab('schedule')"
        >Group Stage Schedule</button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'insights' }"
          @click="selectTab('insights')"
        >Insights</button>
        <button
          class="tab-button"
          :class="{ active: activeTab === 'about' }"
          @click="selectTab('about')"
        >About</button>
      </div>
    </div>
  </nav>

  <header v-if="activeTab === 'bracket' || activeTab === 'schedule'" class="app-header">
    <h1>{{ activeTab === 'bracket' ? 'Knockout Bracket' : 'Group Stage Schedule' }}</h1>
    <p class="subtitle">Are factors such as heat and elevation making teams under- or over-perform at the World Cup? Let's see what the data shows us.</p>
  </header>

  <div v-if="activeTab === 'bracket' || activeTab === 'schedule'" class="toggles-bar shine">
    <DisplayToggles
      :show-elevation="showElevation"
      :show-timezone="showTimezone"
      :show-pot="showPot"
      @toggle="toggleDisplay"
    />
  </div>

  <BracketView   v-show="activeTab === 'bracket'"  :scores="scores" :show-elevation="showElevation" :show-timezone="showTimezone" :show-pot="showPot" />
  <ScheduleView  v-show="activeTab === 'schedule'" :scores="scores" :show-elevation="showElevation" :show-timezone="showTimezone" :show-pot="showPot" />
  <InsightsView  v-show="activeTab === 'insights'" :scores="scores" />
  <AboutView     v-show="activeTab === 'about'" />

  <footer class="site-footer">
    <p>Copyright © 2026 Neel Dhanesha and Vikas Bhatia. All rights reserved. No part of this site may be reproduced without permission.</p>
  </footer>
</template>

<script>
import BracketView    from './components/BracketView.vue'
import ScheduleView   from './components/ScheduleView.vue'
import InsightsView   from './components/InsightsView.vue'
import AboutView      from './components/AboutView.vue'
import DisplayToggles from './components/DisplayToggles.vue'

const SCORES_URL = import.meta.env.VITE_SCORES_URL
const DISPLAY_PREFS_KEY = 'wc26DisplayPrefs'

export default {
  components: { BracketView, ScheduleView, InsightsView, AboutView, DisplayToggles },

  data() {
    return {
      activeTab:     'bracket',
      scores:        {},
      // All default to on — nothing changes for anyone until they
      // actually reach for a toggle.
      showElevation: true,
      showTimezone:  true,
      showPot:       true,
      // Only actually used below the mobile breakpoint — .nav-tabs is a
      // static inline pill on desktop regardless of this value.
      mobileMenuOpen: false,
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

    document.addEventListener('mousemove', this.handleShineMove)
    document.addEventListener('click', this.handleOutsideMenuClick)
  },

  beforeUnmount() {
    clearInterval(this._scoreTimer)
    document.removeEventListener('mousemove', this.handleShineMove)
    document.removeEventListener('click', this.handleOutsideMenuClick)
  },

  methods: {
    async refreshScores() {
      try {
        const res = await fetch(SCORES_URL)
        if (res.ok) this.scores = await res.json()
      } catch { /* network error — keep showing last known scores */ }
    },

    selectTab(tab) {
      this.activeTab = tab
      this.mobileMenuOpen = false
    },

    // Tapping anywhere outside the open mobile menu (or its toggle button)
    // closes it — mirrors the same closest()-based pattern the export
    // dropdowns in InsightsView.vue already use.
    handleOutsideMenuClick(e) {
      if (this.mobileMenuOpen && !e.target.closest('.nav-tabs') && !e.target.closest('.nav-menu-toggle')) {
        this.mobileMenuOpen = false
      }
    },

    // Cursor-tracking shine on any .shine card: a single delegated listener
    // rather than one per card, since cards mount/unmount across tabs.
    handleShineMove(e) {
      const el = e.target.closest('.shine')
      if (!el) return
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--x', `${e.clientX - rect.left}px`)
      el.style.setProperty('--y', `${e.clientY - rect.top}px`)
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
