<template>
  <div class="insights">
    <div class="ins-header">
      <p class="ins-eyebrow">Data Analysis</p>
      <h2 class="ins-title">Insights</h2>
      <p class="ins-sub">Patterns across 72 group stage matches · 16 host cities · 48 teams</p>
    </div>

    <div v-if="!insights" class="ins-loading">Waiting for match data…</div>

    <template v-else>

      <!-- ── Hero stats ─────────────────────────── -->
      <div class="hero-grid">
        <div class="hero-card">
          <div class="hero-num">{{ insights.headlines.comfortWinPct.toFixed(0) }}&thinsp;<span class="hero-unit">%</span></div>
          <div class="hero-label">win rate within {{ insights.comfortThreshold }}°C of home conditions</div>
          <div class="hero-compare">vs. {{ insights.headlines.discomfortWinPct.toFixed(0) }}% beyond that gap</div>
        </div>
        <div class="hero-card">
          <div class="hero-num">{{ insights.headlines.midAltGoals.toFixed(1) }} <span class="hero-unit">gpg</span></div>
          <div class="hero-label">goals per game at Guadalajara (1,566m)</div>
          <div class="hero-compare">vs. {{ insights.headlines.seaLevelGoals.toFixed(1) }} at sea-level venues</div>
        </div>
        <div class="hero-card">
          <div class="hero-num">{{ insights.tzSpotlight.resilient ? insights.tzSpotlight.resilient.avgTzDiff.toFixed(1) : '—' }} <span class="hero-unit">h</span></div>
          <div class="hero-label">
            <template v-if="insights.tzSpotlight.resilient">{{ insights.tzSpotlight.resilient.name }}'s avg timezone gap per match — and they qualified</template>
            <template v-else>Timezone gap for a qualified team</template>
          </div>
          <div class="hero-compare">
            <template v-if="insights.tzSpotlight.furthest">{{ insights.tzSpotlight.furthest.name }}: {{ insights.tzSpotlight.furthest.avgTzDiff.toFixed(1) }}h avg · {{ ptsLabel(insights.tzSpotlight.furthest.P) }}</template>
            <template v-else>—</template>
          </div>
        </div>
      </div>

      <!-- ── Climate Comfort ────────────────────── -->
      <section class="ins-section">
        <div class="sec-eyebrow">Climate Comfort</div>
        <h3 class="sec-heading">How much did temperature familiarity matter?</h3>
        <p class="sec-body">
          Each bar shows the average gap between a team's training base temperature and the venues they played in.
          Teams with <strong>cool blue bars</strong> played close to home conditions;
          <strong>hot red bars</strong> were far out of their comfort zone.
          Qualified teams are shown in <span style="color:#86efac">green</span>.
        </p>

        <div class="climate-meta">
          <span class="cm-pill cm-comfort">Comfortable (&lt;{{ insights.comfortThreshold }}°C gap) · {{ insights.headlines.comfortWinPct.toFixed(0) }}% win rate</span>
          <span class="cm-pill cm-discomfort">Uncomfortable (≥{{ insights.comfortThreshold }}°C gap) · {{ insights.headlines.discomfortWinPct.toFixed(0) }}% win rate</span>
        </div>

        <div class="climate-chart">
          <div class="cc-colheads">
            <button class="col-sort-btn" :class="{ 'col-active': climateSort.key === 'name' }" @click="setSort(climateSort, 'name')">Team <span class="sort-icon">{{ sortIcon(climateSort, 'name') }}</span></button>
            <button class="col-sort-btn" :class="{ 'col-active': climateSort.key === 'avgDelta' }" @click="setSort(climateSort, 'avgDelta')">Avg temperature gap <span class="sort-icon">{{ sortIcon(climateSort, 'avgDelta') }}</span></button>
            <button class="col-sort-btn col-right" :class="{ 'col-active': climateSort.key === 'P' }" @click="setSort(climateSort, 'P')">Pts <span class="sort-icon">{{ sortIcon(climateSort, 'P') }}</span></button>
          </div>
          <div
            v-for="team in sortedClimate"
            :key="team.name"
            class="cc-row"
          >
            <div class="cc-name" :class="{ 'cc-qualified': team.qualified }">{{ team.name }}</div>
            <div class="cc-track" :style="{ '--bw': Math.min(Math.max(team.avgDelta / 20 * 100, 2), 100) + '%' }">
              <div class="cc-bar" :style="{ background: deltaColor(team.avgDelta) }"></div>
              <span class="cc-delta">{{ team.avgDelta.toFixed(1) }}°C</span>
            </div>
            <div class="cc-pts" :class="ptsClass(team.P)">{{ team.P }}</div>
          </div>
        </div>
      </section>

      <!-- ── Altitude Factor ────────────────────── -->
      <section class="ins-section">
        <div class="sec-eyebrow">The Altitude Factor</div>
        <h3 class="sec-heading">Do high-elevation venues change the game?</h3>
        <p class="sec-body">
          Goals per game across venue elevation tiers.
          Guadalajara (1,566m) produced the most defensive football of any venue —
          just 1.5 goals per game. Mexico City sits even higher at 2,240m,
          the highest World Cup venue in history.
        </p>

        <div class="elev-chart">
          <div class="elev-bars">
            <div v-for="tier in insights.elevTiers" :key="tier.label" class="elev-col">
              <div class="elev-bar-wrap">
                <div class="elev-gpg">{{ tier.goalsPerGame.toFixed(2) }}</div>
                <div class="elev-bar-track">
                  <div
                    class="elev-bar"
                    :style="{ height: (tier.goalsPerGame / 4 * 100) + '%', background: elevColor(tier.min ?? 0) }"
                  ></div>
                </div>
              </div>
              <div class="elev-tier-name">{{ tier.label }}</div>
              <div class="elev-range">{{ tier.range }}</div>
              <div class="elev-games">{{ tier.games }} matches</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Timezone Fatigue ───────────────────── -->
      <section class="ins-section">
        <div class="sec-eyebrow">Timezone Fatigue</div>
        <h3 class="sec-heading">Does crossing time zones take a toll?</h3>
        <p class="sec-body">
          Group qualifiers averaged <strong>{{ insights.headlines.tzQualifiedAvg.toFixed(1) }}h</strong> of timezone adjustment per match;
          eliminated teams averaged <strong>{{ insights.headlines.tzEliminatedAvg.toFixed(1) }}h</strong>.
          The gap is real, though the outliers are the most compelling story.
        </p>

        <div class="tz-callouts">
          <div class="tz-call tz-green">
            <div class="tz-call-label">Most resilient traveller</div>
            <template v-if="insights.tzSpotlight.resilient">
              <div class="tz-call-team">{{ insights.tzSpotlight.resilient.name }}</div>
              <div class="tz-call-stat">{{ insights.tzSpotlight.resilient.avgTzDiff.toFixed(1) }}h avg gap · {{ ptsLabel(insights.tzSpotlight.resilient.P) }} · Qualified</div>
            </template>
            <template v-else>
              <div class="tz-call-team">—</div>
              <div class="tz-call-stat">Not enough data yet</div>
            </template>
          </div>
          <div class="tz-call tz-gold">
            <div class="tz-call-label">Closest to home</div>
            <template v-if="insights.tzSpotlight.homeComfort">
              <div class="tz-call-team">{{ insights.tzSpotlight.homeComfort.name }}</div>
              <div class="tz-call-stat">{{ insights.tzSpotlight.homeComfort.avgTzDiff.toFixed(1) }}h gap · {{ ptsLabel(insights.tzSpotlight.homeComfort.P) }} · {{ insights.tzSpotlight.homeComfort.qualified ? 'Qualified' : 'Eliminated' }}</div>
            </template>
            <template v-else>
              <div class="tz-call-team">—</div>
              <div class="tz-call-stat">Not enough data yet</div>
            </template>
          </div>
          <div class="tz-call tz-red">
            <div class="tz-call-label">Furthest from home</div>
            <template v-if="insights.tzSpotlight.furthest">
              <div class="tz-call-team">{{ insights.tzSpotlight.furthest.name }}</div>
              <div class="tz-call-stat">{{ insights.tzSpotlight.furthest.avgTzDiff.toFixed(1) }}h avg gap · {{ ptsLabel(insights.tzSpotlight.furthest.P) }} · {{ insights.tzSpotlight.furthest.qualified ? 'Qualified' : 'Eliminated' }}</div>
            </template>
            <template v-else>
              <div class="tz-call-team">—</div>
              <div class="tz-call-stat">Not enough data yet</div>
            </template>
          </div>
        </div>

        <div class="tz-chart">
          <div class="tz-colheads">
            <button class="col-sort-btn" :class="{ 'col-active': tzSort.key === 'name' }" @click="setSort(tzSort, 'name')">Team <span class="sort-icon">{{ sortIcon(tzSort, 'name') }}</span></button>
            <button class="col-sort-btn" :class="{ 'col-active': tzSort.key === 'avgTzDiff' }" @click="setSort(tzSort, 'avgTzDiff')">Avg timezone gap <span class="sort-icon">{{ sortIcon(tzSort, 'avgTzDiff') }}</span></button>
            <span></span>
            <button class="col-sort-btn col-right" :class="{ 'col-active': tzSort.key === 'P' }" @click="setSort(tzSort, 'P')">Pts <span class="sort-icon">{{ sortIcon(tzSort, 'P') }}</span></button>
          </div>
          <div
            v-for="team in sortedTz"
            :key="team.name"
            class="tz-row"
          >
            <div class="tz-name" :class="{ 'tz-qualified': team.qualified }">{{ team.name }}</div>
            <div class="tz-track">
              <div class="tz-bar" :style="{ width: (team.avgTzDiff / 20 * 100) + '%' }"></div>
            </div>
            <div class="tz-h">{{ team.avgTzDiff.toFixed(1) }}h</div>
            <div class="tz-pts" :class="ptsClass(team.P)">{{ team.P }}</div>
          </div>
          <p class="tz-note">Qualified teams in <span style="color:#86efac">green</span>.</p>
        </div>
      </section>

      <!-- ── Core Findings ──────────────────────── -->
      <section class="ins-section">
        <div class="sec-eyebrow">Core Findings</div>
        <h3 class="sec-heading">What the data set out to answer</h3>
        <div class="stories-grid">
          <div v-for="ins in permanentInsights()" :key="ins.team" class="story story-core">
            <div class="story-tag">{{ ins.tag }}</div>
            <div class="story-team">{{ ins.team }}</div>
            <div class="story-stat">{{ ins.stat }}</div>
            <p class="story-body">{{ ins.body }}</p>
          </div>
        </div>
      </section>

      <!-- ── AI Insights ────────────────────────── -->
      <section class="ins-section ai-section">
        <div class="ai-section-header">
          <div>
            <div class="sec-eyebrow">AI Insights</div>
            <h3 class="sec-heading" style="margin-bottom:0">Patterns beyond the obvious</h3>
          </div>
          <button
            class="generate-btn"
            :class="{ 'generating': generating }"
            :disabled="generating || !insights"
            @click="generateInsights"
          >
            <svg class="gemini-star" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="gs" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#4285f4"/>
                  <stop offset="100%" stop-color="#a142f4"/>
                </linearGradient>
              </defs>
              <path d="M12 2c0 0 1.2 7.5 4.5 10.5C13.2 15.5 12 22 12 22c0 0-1.2-6.5-4.5-9.5C10.8 9.5 12 2 12 2z" fill="url(#gs)"/>
              <path d="M2 12c0 0 7.5-1.2 10.5-4.5C15.5 10.8 22 12 22 12c0 0-6.5 1.2-9.5 4.5C9.5 13.2 2 12 2 12z" fill="url(#gs)"/>
            </svg>
            {{ generating ? 'Generating…' : 'Generate insights' }}
          </button>
        </div>

        <div class="gemini-badge">
          <svg class="gemini-star-sm" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gs2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#4285f4"/>
                <stop offset="100%" stop-color="#a142f4"/>
              </linearGradient>
            </defs>
            <path d="M12 2c0 0 1.2 7.5 4.5 10.5C13.2 15.5 12 22 12 22c0 0-1.2-6.5-4.5-9.5C10.8 9.5 12 2 12 2z" fill="url(#gs2)"/>
            <path d="M2 12c0 0 7.5-1.2 10.5-4.5C15.5 10.8 22 12 22 12c0 0-6.5 1.2-9.5 4.5C9.5 13.2 2 12 2 12z" fill="url(#gs2)"/>
          </svg>
          Powered by Llama 3.3 (Groq) · AI can make mistakes — always double-check findings
        </div>

        <p v-if="generateError" class="generate-error">{{ generateError }}</p>

        <!-- pinned insights -->
        <div v-if="pinnedInsights.length" class="ai-group">
          <div class="ai-group-label">Pinned</div>
          <div class="stories-grid">
            <div v-for="ins in pinnedInsights" :key="ins.id" class="story story-ai story-pinned">
              <div class="story-header-row">
                <div class="story-tag">{{ ins.tag }}</div>
                <button class="pin-btn pin-btn-active" title="Unpin" @click="unpinInsight(ins.id)">
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/></svg>
                </button>
              </div>
              <div class="story-team">{{ ins.team }}</div>
              <div class="story-stat">{{ ins.stat }}</div>
              <p class="story-body">{{ ins.body }}</p>
            </div>
          </div>
          <p v-if="pinnedInsights.length >= MAX_PINNED" class="pin-limit-note">
            Pinned limit reached ({{ MAX_PINNED }}). Unpin some to save more.
          </p>
        </div>

        <!-- current / seed insights -->
        <div class="ai-group">
          <div v-if="pinnedInsights.length" class="ai-group-label">Current</div>
          <div class="stories-grid">
            <div v-for="ins in currentInsights" :key="ins.id" class="story story-ai">
              <div class="story-header-row">
                <div class="story-tag">{{ ins.tag }}</div>
                <button
                  class="pin-btn"
                  :class="{ 'pin-btn-active': isPinned(ins.id) }"
                  :disabled="isPinned(ins.id) || !canPin()"
                  :title="isPinned(ins.id) ? 'Already pinned' : canPin() ? 'Pin this insight' : 'Pinned limit reached'"
                  @click="pinInsight(ins)"
                >
                  <svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.828.722a.5.5 0 0 1 .354.146l4.95 4.95a.5.5 0 0 1 0 .707c-.48.48-1.072.588-1.503.588-.177 0-.335-.018-.46-.039l-3.134 3.134a5.927 5.927 0 0 1 .16 1.013c.046.702-.032 1.687-.72 2.375a.5.5 0 0 1-.707 0l-2.829-2.828-3.182 3.182c-.195.195-1.219.902-1.414.707-.195-.195.512-1.22.707-1.414l3.182-3.182-2.828-2.829a.5.5 0 0 1 0-.707c.688-.688 1.673-.767 2.375-.72a5.922 5.922 0 0 1 1.013.16l3.134-3.133a2.772 2.772 0 0 1-.04-.461c0-.43.108-1.022.589-1.503a.5.5 0 0 1 .353-.146z"/></svg>
                </button>
              </div>
              <div class="story-team">{{ ins.team }}</div>
              <div class="story-stat">{{ ins.stat }}</div>
              <p class="story-body">{{ ins.body }}</p>
            </div>
          </div>
        </div>
      </section>

    </template>
  </div>
</template>

<script>
import { computeInsights } from '../utils/insights.js'
import { tempToColor }     from '../utils/temperature.js'

const ANALYSIS_URL = import.meta.env.VITE_SCORES_URL
  ? import.meta.env.VITE_SCORES_URL.replace(/\/$/, '') + '/analysis'
  : null

// PERMANENT_INSIGHTS and SEED_INSIGHTS used to be hardcoded here. Both are
// now computed live from `insights` — see the permanentInsights() and
// seedInsights() methods below — so their numbers track actual results
// instead of going stale as the tournament progresses.

function loadPinned() {
  try { return JSON.parse(localStorage.getItem('wc26PinnedInsights') || '[]') }
  catch { return [] }
}

function savePinned(list) {
  try { localStorage.setItem('wc26PinnedInsights', JSON.stringify(list)) }
  catch { /* storage full */ }
}

export default {
  props: {
    scores: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      climateSort:     { key: 'avgDelta', asc: true },
      tzSort:          { key: 'avgTzDiff', asc: true },
      pinnedInsights:  loadPinned(),
      // Seeded from live data by the `insights` watcher below, once match
      // results are available — see seedInsights().
      currentInsights: [],
      generating:      false,
      generateError:   null,
      MAX_PINNED:      12,
    }
  },

  computed: {
    insights() {
      return computeInsights(this.scores)
    },

    sortedClimate() {
      if (!this.insights) return []
      return this.applySort(this.insights.teamsByDelta, this.climateSort)
    },

    sortedTz() {
      if (!this.insights) return []
      return this.applySort(this.insights.teamsByTz, this.tzSort)
    },
  },

  watch: {
    // Seed the placeholder "current" insight cards once live match data first
    // becomes available. Guarded by currentInsights.length so this fires
    // exactly once per session — later score refreshes (every 60s) must never
    // clobber a real AI generation the user is currently looking at.
    insights: {
      immediate: true,
      handler(val) {
        if (val && this.currentInsights.length === 0) {
          this.currentInsights = this.seedInsights()
        }
      },
    },
  },

  methods: {
    applySort(teams, { key, asc }) {
      return [...teams].sort((a, b) => {
        const va = a[key], vb = b[key]
        if (typeof va === 'string') return asc ? va.localeCompare(vb) : vb.localeCompare(va)
        return asc ? va - vb : vb - va
      })
    },

    setSort(state, key) {
      if (state.key === key) {
        state.asc = !state.asc
      } else {
        state.key = key
        state.asc = key !== 'P'  // points default descending; everything else ascending
      }
    },

    sortIcon(state, key) {
      // ︎ = variation selector-15: forces the text glyph so iOS doesn't
      // render these arrows (esp. ↕) as full-colour emoji.
      if (state.key !== key) return '↕︎'
      return state.asc ? '↑︎' : '↓︎'
    },

    ptsLabel(p) {
      return `${p} ${p === 1 ? 'pt' : 'pts'}`
    },

    deltaColor(delta) {
      return tempToColor(15 + Math.min(delta, 25))
    },

    elevColor(minElev) {
      const t = Math.min(minElev / 2000, 1)
      const r = Math.round(56  + (185 - 56)  * t)
      const g = Math.round(189 + (28  - 189) * t)
      const b = Math.round(248 + (28  - 248) * t)
      return `rgb(${r},${g},${b})`
    },

    ptsClass(p) {
      if (p >= 9) return 'pts-9'
      if (p >= 7) return 'pts-7'
      if (p >= 4) return 'pts-4'
      if (p >= 1) return 'pts-1'
      return 'pts-0'
    },

    async generateInsights() {
      if (!this.insights || this.generating || !ANALYSIS_URL) return
      this.generating    = true
      this.generateError = null
      try {
        const stats = {
          teams: this.insights.teamsByDelta.map(t => ({
            name: t.name, avgDelta: t.avgDelta, avgTzDiff: t.avgTzDiff,
            P: t.P, qualified: t.qualified,
          })),
          elevTiers:        this.insights.elevTiers,
          comfortThreshold: this.insights.comfortThreshold,
          headlines:        this.insights.headlines,
          // currentInsights already covers whatever's currently on screen —
          // the seed placeholders before a first generation, or real AI
          // results after one. permanentInsights() is listed separately since
          // the Core Findings cards are always shown alongside, regardless.
          alreadyCovered: [
            ...this.permanentInsights().map(i => i.team),
            ...this.pinnedInsights.map(i => i.team),
            ...this.currentInsights.map(i => i.team),
          ],
        }
        // The worker returns cached insights instantly, or generates them
        // inline (~15–25s on a cache miss). Free-tier generation occasionally
        // exceeds the worker's cap and returns a retryable error, so we give
        // each click a few fresh attempts before giving up. Any success is
        // cached, so this only ever costs the user on a cold, unlucky run.
        let incoming = null
        let lastErr  = null
        for (let attempt = 0; attempt < 3; attempt++) {
          const res = await fetch(ANALYSIS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stats),
          })
          if (res.ok) { incoming = await res.json(); break }
          const body = await res.json().catch(() => ({}))
          lastErr = body.detail || body.error || `HTTP ${res.status}`
          await new Promise(r => setTimeout(r, 1000))
        }
        if (!Array.isArray(incoming)) throw new Error(lastErr || 'please try again')
        this.currentInsights = incoming.map((ins, i) => ({
          ...ins,
          id: `gen-${Date.now()}-${i}`,
        }))
      } catch (e) {
        this.generateError = `Couldn't generate insights: ${e.message}`
      } finally {
        this.generating = false
      }
    },

    pinInsight(insight) {
      if (this.pinnedInsights.length >= this.MAX_PINNED) return
      if (this.pinnedInsights.some(p => p.id === insight.id)) return
      this.pinnedInsights.push({ ...insight })
      savePinned(this.pinnedInsights)
    },

    unpinInsight(id) {
      this.pinnedInsights = this.pinnedInsights.filter(p => p.id !== id)
      savePinned(this.pinnedInsights)
    },

    isPinned(id) {
      return this.pinnedInsights.some(p => p.id === id)
    },

    canPin() {
      return this.pinnedInsights.length < this.MAX_PINNED
    },

    // "Core Findings" cards — always-visible curated analysis, now computed
    // from live headline stats instead of a fixed launch-day snapshot.
    permanentInsights() {
      if (!this.insights) return []
      const { headlines, comfortThreshold, teamsByDelta } = this.insights
      const findings = []

      const comfortRatio = headlines.discomfortWinPct > 0
        ? headlines.comfortWinPct / headlines.discomfortWinPct
        : null
      findings.push({
        tag: 'Finding',
        team: 'Climate Comfort',
        stat: `${headlines.comfortWinPct.toFixed(0)}% vs. ${headlines.discomfortWinPct.toFixed(0)}% win rate`,
        body: `Teams playing within ${comfortThreshold}°C of their home training temperature have won ${headlines.comfortWinPct.toFixed(0)}% of individual match sides, versus ${headlines.discomfortWinPct.toFixed(0)}% for teams in more alien conditions`
          + (comfortRatio ? ` — a ${comfortRatio.toFixed(2)}× advantage across the 48-team field.` : ' across the 48-team field.'),
      })

      // Guadalajara (1,566m) sits in the "mid" elevation tier, Mexico City
      // (2,240m) in "high" — see ELEV_TIERS in utils/insights.js.
      findings.push({
        tag: 'Finding',
        team: 'Altitude Suppresses Scoring',
        stat: `${headlines.midAltGoals.toFixed(2)} gpg vs. ${headlines.seaLevelGoals.toFixed(2)} at sea level`,
        body: `Guadalajara (1,566m) has averaged ${headlines.midAltGoals.toFixed(2)} goals per game so far, versus ${headlines.seaLevelGoals.toFixed(2)} at sea-level venues. Mexico City, at 2,240m, is the highest World Cup venue in history — averaging ${headlines.highAltGoals.toFixed(2)} goals per game there.`,
      })

      const tzGap = Math.abs(headlines.tzQualifiedAvg - headlines.tzEliminatedAvg)
      findings.push({
        tag: 'Finding',
        team: 'Timezone Fatigue',
        stat: `Qualifiers avg ${headlines.tzQualifiedAvg.toFixed(1)}h · Eliminated avg ${headlines.tzEliminatedAvg.toFixed(1)}h`,
        body: `Teams that have advanced from the group stage have averaged ${headlines.tzQualifiedAvg.toFixed(1)}h of timezone adjustment per match, versus ${headlines.tzEliminatedAvg.toFixed(1)}h for eliminated sides — a ${tzGap.toFixed(1)}h gap between the two groups.`,
      })

      // The top quartile by climate gap, rather than a fixed °C cutoff. A
      // hardcoded threshold (e.g. ">15°C") can go quiet early in the
      // tournament if no team happens to have crossed it yet, or stop being
      // the interesting cutoff once more results are in. Floating the cohort
      // as "the worst quartile of gaps, whatever that is right now" keeps
      // this card always populated and always describing the current worst
      // mismatches, at the cost of a less catchy fixed-number headline.
      const byGapDesc  = [...teamsByDelta].sort((a, b) => b.avgDelta - a.avgDelta)
      const cohortSize = Math.max(1, Math.ceil(byGapDesc.length * 0.25))
      const cohort      = byGapDesc.slice(0, cohortSize)
      if (cohort.length > 0) {
        const cohortFloor = cohort[cohort.length - 1].avgDelta
        const pts    = cohort.map(t => t.P)
        const maxPts = Math.max(...pts)
        const minPts = Math.min(...pts)
        const rangeLabel = minPts === maxPts ? this.ptsLabel(maxPts) : `${minPts}–${maxPts} points`
        findings.push({
          tag: 'Finding',
          team: 'Climate Extremes',
          stat: `Worst ${cohort.length} gap${cohort.length === 1 ? '' : 's'} (≥${cohortFloor.toFixed(1)}°C): ${rangeLabel}`,
          body: `The ${cohort.length} team${cohort.length === 1 ? '' : 's'} with the largest average climate mismatch — ${cohortFloor.toFixed(1)}°C or more — ${cohort.length === 1 ? 'has' : 'have'} scored ${rangeLabel} across their group matches so far. `
            + (maxPts <= 1 ? 'A striking tipping point for climate adaptation.' : 'Results at the extreme end have been more mixed than a clean tipping point would suggest.'),
        })
      }

      return findings
    },

    // Placeholder "current insight" cards shown before the user's first
    // real AI generation — see the `insights` watcher above. Reuses
    // tzSpotlight so the "Resilient" card always matches the hero stat and
    // timezone callouts rather than telling a different story.
    seedInsights() {
      if (!this.insights) return []
      const { tzSpotlight, teamsByDelta } = this.insights
      const seeds = []

      if (tzSpotlight.resilient) {
        const t = tzSpotlight.resilient
        seeds.push({
          id: `seed-resilient-${t.name}`,
          tag: 'Resilient',
          team: t.name,
          stat: `${t.avgTzDiff.toFixed(1)}h avg tz gap · ${this.ptsLabel(t.P)} · Qualified`,
          body: `${t.name} faced one of the largest average timezone gaps of any qualifier — ${t.avgTzDiff.toFixed(1)} hours per match — yet advanced with ${this.ptsLabel(t.P)}. Their preparation overcame what the data suggests should be a significant handicap.`,
        })
      }

      // Biggest climate mismatch among eliminated teams; falls back to the
      // overall biggest mismatch early in the tournament before anyone's
      // been eliminated yet.
      const byDeltaDesc = [...teamsByDelta].sort((a, b) => b.avgDelta - a.avgDelta)
      const cautionary = byDeltaDesc.find(t => !t.qualified) ?? byDeltaDesc[0]
      if (cautionary) {
        seeds.push({
          id: `seed-cautionary-${cautionary.name}`,
          tag: 'Cautionary',
          team: cautionary.name,
          stat: `${cautionary.avgDelta.toFixed(1)}°C gap · ${this.ptsLabel(cautionary.P)}`,
          body: `The most extreme climate mismatch of the tournament so far — averaging a ${cautionary.avgDelta.toFixed(1)}°C gap between training and matchday conditions. ${cautionary.name} has taken just ${this.ptsLabel(cautionary.P)} across their group matches: a clear example of climate misalignment costing a side dearly.`,
        })
      }

      // The two qualified teams with the biggest climate gaps — i.e. teams
      // that defied the climate-comfort trend and advanced anyway.
      const qualifiedByDeltaDesc = byDeltaDesc.filter(t => t.qualified)
      const outlier = qualifiedByDeltaDesc[0]
      if (outlier) {
        seeds.push({
          id: `seed-outlier-${outlier.name}`,
          tag: 'Outlier',
          team: outlier.name,
          stat: `${outlier.avgDelta.toFixed(1)}°C gap · ${this.ptsLabel(outlier.P)} · Qualified`,
          body: `${outlier.name} has defied the climate comfort trend, qualifying with ${this.ptsLabel(outlier.P)} despite a ${outlier.avgDelta.toFixed(1)}°C average gap — among the largest mismatches of any team to advance.`,
        })
      }

      const surprising = qualifiedByDeltaDesc[1]
      if (surprising) {
        seeds.push({
          id: `seed-surprising-${surprising.name}`,
          tag: 'Surprising',
          team: surprising.name,
          stat: `${surprising.avgDelta.toFixed(1)}°C gap · ${this.ptsLabel(surprising.P)} · Qualified`,
          body: `Another team defying the climate narrative: ${surprising.name} has qualified with ${this.ptsLabel(surprising.P)} despite a ${surprising.avgDelta.toFixed(1)}°C average climate gap.`,
        })
      }

      return seeds
    },
  },
}
</script>

<style scoped>
/* ── Container ── */
.insights {
  padding: 0.75rem 1.5rem 3rem;
  max-width: 900px;
  margin: 0 auto;
}

/* ── Page header ── */
.ins-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.ins-eyebrow {
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7dd3fc;
  margin: 0 0 0.3rem;
}

.ins-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 0.3rem;
  letter-spacing: -0.01em;
}

.ins-sub {
  font-size: 0.82rem;
  opacity: 0.6;
  margin: 0;
}

.ins-loading {
  text-align: center;
  opacity: 0.5;
  padding: 3rem 0;
  font-size: 0.9rem;
}

/* ── Hero grid ── */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.hero-card {
  background: rgba(5, 20, 10, 0.96);
  border-radius: 8px;
  padding: 1rem 1rem 0.9rem;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 10px 25px rgba(0,0,0,0.45);
  display: flex;
  flex-direction: column;
}

.hero-num {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
  color: #f9fafb;
}

.hero-unit {
  font-size: 1.6rem;
  font-weight: 600;
  opacity: 0.8;
}

.hero-label {
  font-size: 0.78rem;
  opacity: 0.85;
  margin-top: 0.4rem;
  line-height: 1.4;
  flex: 1;
}

.hero-compare {
  font-size: 0.7rem;
  color: #7dd3fc;
  margin-top: 0.5rem;
  font-weight: 500;
}

/* ── Section card ── */
.ins-section {
  background: rgba(5, 20, 10, 0.96);
  border-radius: 8px;
  padding: 1.2rem 1.25rem 1.4rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.04), 0 10px 25px rgba(0,0,0,0.45);
}

.sec-eyebrow {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #7dd3fc;
  margin-bottom: 0.3rem;
}

.sec-heading {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
}

.sec-body {
  font-size: 0.82rem;
  opacity: 0.8;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.sec-body strong {
  color: #f9fafb;
  opacity: 1;
  font-weight: 600;
}

/* ── Climate comfort pills ── */
.climate-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.9rem;
}

.cm-pill {
  font-size: 0.7rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  letter-spacing: 0.01em;
}

.cm-comfort    { background: rgba(56,189,248,0.18); color: #7dd3fc; border: 1px solid rgba(56,189,248,0.3); }
.cm-discomfort { background: rgba(185,28,28,0.18);  color: #fca5a5; border: 1px solid rgba(185,28,28,0.35); }

/* ── Climate chart ── */
/* ── Sort buttons ── */
.col-sort-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.4;
  transition: opacity 0.15s, color 0.15s;
  white-space: nowrap;
}

.col-sort-btn:hover { opacity: 0.7; }

.col-sort-btn.col-active {
  opacity: 1;
  color: #7dd3fc;
}

.col-right { justify-self: end; }

.sort-icon { font-size: 0.9rem; letter-spacing: 0; line-height: 1; position: relative; top: 0.1em; }

.cc-colheads {
  display: grid;
  grid-template-columns: 160px 1fr 28px;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  padding: 0 0 0.2rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.climate-chart {
  position: relative;
}

.cc-row {
  display: grid;
  grid-template-columns: 160px 1fr 28px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.15rem 0;
}

.cc-name {
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.7;
}

.cc-qualified {
  opacity: 1;
  color: #86efac;
}

.cc-track {
  position: relative;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  height: 14px;
  overflow: hidden;
}

.cc-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--bw);
  border-radius: 2px;
}

.cc-delta {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  left: min(var(--bw), calc(100% - 40px));
  padding-left: 4px;
  font-size: 0.62rem;
  opacity: 0.85;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.6);
}

.cc-pts {
  font-size: 0.78rem;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Points badge colors */
.pts-9 { color: #4ade80; }
.pts-7 { color: #86efac; }
.pts-4 { color: #facc15; }
.pts-1 { color: #fb923c; }
.pts-0 { color: rgba(255,255,255,0.3); }

/* ── Elevation chart ── */
.elev-chart {
  margin-top: 0.5rem;
}

.elev-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  align-items: end;
}

.elev-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.elev-bar-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.elev-gpg {
  font-size: 1.3rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #f9fafb;
}

.elev-bar-track {
  width: 100%;
  height: 120px;
  background: rgba(255,255,255,0.06);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.elev-bar {
  width: 100%;
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
}

.elev-tier-name {
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
}

.elev-range {
  font-size: 0.68rem;
  opacity: 0.55;
  text-align: center;
}

.elev-games {
  font-size: 0.65rem;
  opacity: 0.4;
  text-align: center;
}

/* ── Timezone callouts ── */
.tz-callouts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.tz-call {
  border-radius: 6px;
  padding: 0.75rem 0.85rem;
  border: 1px solid transparent;
}

.tz-green { background: rgba(74,222,128,0.08);  border-color: rgba(74,222,128,0.2); }
.tz-gold  { background: rgba(250,204,21,0.08);  border-color: rgba(250,204,21,0.2); }
.tz-red   { background: rgba(239,68,68,0.08);   border-color: rgba(239,68,68,0.2); }

.tz-call-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 0.2rem;
}

.tz-call-team {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.tz-call-stat {
  font-size: 0.72rem;
  opacity: 0.7;
}

/* ── Timezone bar chart ── */
.tz-colheads {
  display: grid;
  grid-template-columns: 160px 1fr 36px 30px;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
  padding: 0 0 0.2rem;
  border-bottom: 1px solid rgba(255,255,255,0.07);
}

.tz-chart {
  border-top: none;
  padding-top: 0.75rem;
}

.tz-row {
  display: grid;
  grid-template-columns: 160px 1fr 36px 30px;
  gap: 0.5rem;
  align-items: center;
  padding: 0.12rem 0;
}

.tz-name {
  font-size: 0.78rem;
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tz-qualified { opacity: 1; color: #86efac; }

.tz-track {
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  height: 10px;
  overflow: hidden;
}

.tz-bar {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(to right, #818cf8, #6366f1);
}

.tz-h {
  font-size: 0.68rem;
  opacity: 0.55;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tz-pts {
  font-size: 0.78rem;
  font-weight: 700;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.tz-note {
  font-size: 0.65rem;
  opacity: 0.35;
  margin: 0.5rem 0 0;
}

/* ── Story cards ── */
.stories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem;
}

.story {
  border-radius: 6px;
  padding: 0.85rem 1rem;
  border: 1px solid transparent;
}

.story-pos  { background: rgba(74,222,128,0.06);  border-color: rgba(74,222,128,0.15); }
.story-neg  { background: rgba(239,68,68,0.06);   border-color: rgba(239,68,68,0.15); }
.story-core { background: rgba(125,211,252,0.05); border-color: rgba(125,211,252,0.12); }
.story-ai   { background: rgba(161,66,244,0.06);  border-color: rgba(161,66,244,0.18); }
.story-pinned { border-color: rgba(161,66,244,0.4); }

.story-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.story-tag {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.5;
}

.story-team {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.story-stat {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.65;
  margin-bottom: 0.4rem;
}

.story-body {
  font-size: 0.78rem;
  line-height: 1.55;
  opacity: 0.75;
  margin: 0;
}

/* ── AI section ── */
.ai-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.generate-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: rgba(161,66,244,0.15);
  border: 1px solid rgba(161,66,244,0.35);
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  /* Fixed width so "Generating…" and "Generate insights" render at the same
     size — otherwise the label swap resizes the button and reflows the heading. */
  min-width: 11rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #d8b4fe;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  box-sizing: border-box;
}

.generate-btn:hover:not(:disabled) { background: rgba(161,66,244,0.25); }
.generate-btn:disabled              { opacity: 0.45; cursor: not-allowed; }
.generate-btn.generating            { opacity: 0.7; }

.gemini-star {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.gemini-star-sm {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
}

.gemini-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  opacity: 0.45;
  margin-bottom: 1rem;
}

.generate-error {
  font-size: 0.78rem;
  color: #fca5a5;
  margin: 0 0 0.75rem;
}

.ai-group {
  margin-top: 0.75rem;
}

.ai-group + .ai-group {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.ai-group-label {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.35;
  margin-bottom: 0.4rem;
}

.pin-btn {
  all: unset;
  cursor: pointer;
  width: 18px;
  height: 18px;
  opacity: 0.25;
  transition: opacity 0.15s, color 0.15s;
  color: #d8b4fe;
  flex-shrink: 0;
}

.pin-btn svg { width: 100%; height: 100%; display: block; }
.pin-btn:hover:not(:disabled) { opacity: 0.7; }
.pin-btn-active               { opacity: 1 !important; }
.pin-btn:disabled             { cursor: default; }

.pin-limit-note {
  font-size: 0.68rem;
  opacity: 0.45;
  margin: 0.5rem 0 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .insights { padding: 0.75rem 1rem 2.5rem; }

  .hero-grid      { grid-template-columns: 1fr; }
  .hero-num       { font-size: 2.2rem; }
  .tz-callouts    { grid-template-columns: 1fr; }
  .stories-grid   { grid-template-columns: 1fr; }
  .elev-bars      { grid-template-columns: repeat(2, 1fr); }

  .cc-colheads,
  .cc-row         { grid-template-columns: 120px 1fr 24px; }
  /* header row must match the data rows so columns line up */
  .tz-colheads,
  .tz-row         { grid-template-columns: 120px 1fr 32px 26px; }
  .cc-name,
  .tz-name        { font-size: 0.72rem; }

  /* Stack the "Generate insights" button under the heading so the heading
     isn't squeezed into a narrow column beside it. */
  .ai-section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
  }
  .generate-btn { width: 100%; }

  /* Comfortable tap targets for the column-sort controls (matches the 44px
     minimum used elsewhere in the app). */
  .col-sort-btn { min-height: 44px; }
}
</style>
