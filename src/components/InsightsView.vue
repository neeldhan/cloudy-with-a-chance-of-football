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

      <!-- ── Capacities export ──────────────────── -->
      <div class="page-export-row">
        <div class="export-help">
          <span class="export-help-trigger" tabindex="0">What's this?</span>
          <div class="export-help-tooltip">
            Exports every computed stat on this tab (Core Findings, elevation tiers, and each team's climate and timezone gap) as Capacities-ready markdown. Each item comes out as its own YAML frontmatter block, matching how Capacities' importer maps named properties onto a typed object. Copy to clipboard or download as a .md file, then import it into Capacities. Re-export any time to pull in updated results.
          </div>
        </div>
        <div class="export-menu">
          <button class="export-btn" @click.stop="toggleExportMenu('capacities')"><img :src="capacitiesIcon" class="capacities-icon" alt="" /> {{ capacitiesCopied ? 'Copied!' : 'Export to Capacities' }} <span class="export-caret">▾</span></button>
          <div v-if="openExportMenu === 'capacities'" class="export-dropdown">
            <button class="export-option" @click="copyCapacitiesExport">Copy to clipboard</button>
            <button class="export-option" @click="downloadCapacitiesExport">Download .md file</button>
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

        <div class="climate-chart" ref="climateChart">
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
          <p class="chart-asof">As of {{ asOfDate }}.</p>
        </div>
        <div class="chart-export-row">
          <div class="export-menu">
            <button class="export-btn" :disabled="exportingChart === 'climateChart'" @click.stop="toggleExportMenu('climateChart')">Export <span class="export-caret">▾</span></button>
            <div v-if="openExportMenu === 'climateChart'" class="export-dropdown">
              <button class="export-option" @click="doExport('climateChart', 'wc26-climate-comfort', 'png')">Export as PNG</button>
              <button class="export-option" @click="doExport('climateChart', 'wc26-climate-comfort', 'jpeg')">Export as JPG</button>
            </div>
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

        <div class="elev-chart" ref="elevChart">
          <p class="elev-chart-title">Goals per game by elevation tier</p>
          <div class="elev-bars">
            <div v-for="tier in insights.elevTiers" :key="tier.label" class="elev-col">
              <div class="elev-bar-wrap">
                <div class="elev-gpg">{{ tier.goalsPerGame.toFixed(2) }} <span class="elev-gpg-unit">gpg</span></div>
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
          <p class="chart-asof">As of {{ asOfDate }}.</p>
        </div>
        <div class="chart-export-row">
          <div class="export-menu">
            <button class="export-btn" :disabled="exportingChart === 'elevChart'" @click.stop="toggleExportMenu('elevChart')">Export <span class="export-caret">▾</span></button>
            <div v-if="openExportMenu === 'elevChart'" class="export-dropdown">
              <button class="export-option" @click="doExport('elevChart', 'wc26-altitude-factor', 'png')">Export as PNG</button>
              <button class="export-option" @click="doExport('elevChart', 'wc26-altitude-factor', 'jpeg')">Export as JPG</button>
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

        <div class="tz-chart" ref="tzChart">
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
          <p class="chart-asof">As of {{ asOfDate }}.</p>
        </div>
        <div class="chart-export-row">
          <div class="export-menu">
            <button class="export-btn" :disabled="exportingChart === 'tzChart'" @click.stop="toggleExportMenu('tzChart')">Export <span class="export-caret">▾</span></button>
            <div v-if="openExportMenu === 'tzChart'" class="export-dropdown">
              <button class="export-option" @click="doExport('tzChart', 'wc26-timezone-fatigue', 'png')">Export as PNG</button>
              <button class="export-option" @click="doExport('tzChart', 'wc26-timezone-fatigue', 'jpeg')">Export as JPG</button>
            </div>
          </div>
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

    </template>
  </div>
</template>

<script>
import html2canvas             from 'html2canvas'
import { computeInsights }     from '../utils/insights.js'
import { tempToColor }         from '../utils/temperature.js'
import { buildCapacitiesMarkdown } from '../utils/capacitiesExport.js'
import CAPACITIES_ICON_SRC     from '../assets/capacities-icon-white.png'

// Opaque fallback for JPEG exports, which can't have a transparent
// background — matches the .ins-section card background (rgba(5,20,10,0.96))
// flattened to a solid color, so an exported JPEG looks like the on-screen
// card instead of picking an arbitrary unrelated color.
const EXPORT_JPEG_BG = '#05140a'

// Fixed multiplier applied on top of the chart's on-screen pixel size, so
// exports hold up outside a browser window (e.g. printed) instead of being
// capped at whatever resolution the chart happens to render at on the
// visitor's own device.
const EXPORT_SCALE = 3

// PERMANENT_INSIGHTS used to be hardcoded here. It's now computed live from
// `insights` — see the permanentInsights() method below — so its numbers
// track actual results instead of going stale as the tournament progresses.

export default {
  props: {
    // Live scores map from App.vue ({ "Home|Away": {...} }), passed straight
    // through to computeInsights() below — this component does no fetching
    // of its own.
    scores: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      // Which column + direction the climate/timezone tables are currently
      // sorted by. Read/written by applySort()/setSort() below.
      climateSort: { key: 'avgDelta', asc: true },
      tzSort:      { key: 'avgTzDiff', asc: true },

      // Ref name ('climateChart' | 'elevChart' | 'tzChart') of whichever
      // chart is mid-export, so that chart's export button disables itself
      // rather than letting a second click overlap the first.
      exportingChart: null,

      // Name of whichever export dropdown is currently open — one of
      // 'climateChart' | 'elevChart' | 'tzChart' | 'capacities', or null if
      // none are (only one open at a time). Closed by picking an option, or
      // by clicking anywhere outside it — see handleDocumentClick() below.
      openExportMenu: null,

      // Briefly true right after "Copy to clipboard" succeeds, so the
      // Capacities export button can flash "Copied!" instead of relying on
      // a separate toast/notification system this app doesn't have.
      capacitiesCopied: false,
    }
  },

  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
  },

  beforeUnmount() {
    document.removeEventListener('click', this.handleDocumentClick)
  },

  computed: {
    // Recomputed from scratch every time `scores` changes (i.e. every 60s
    // score poll from App.vue) — see computeInsights() in utils/insights.js
    // for what this actually contains. null until the first finished match.
    insights() {
      return computeInsights(this.scores)
    },

    // "As of" date baked into every exported chart image, so a chart that
    // gets shared or printed still says when the numbers were current —
    // unlike the on-screen version, an exported PNG/JPG has no way to show
    // that it's live/refreshing.
    asOfDate() {
      return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    },

    // Exposes the imported icon asset URL to the template — a plain
    // module-level import isn't reachable from Options API templates on its
    // own, only things returned from data/computed/methods are.
    capacitiesIcon() {
      return CAPACITIES_ICON_SRC
    },

    // Climate comfort table rows, re-sorted whenever the sort column/direction
    // (climateSort) or the underlying data changes.
    sortedClimate() {
      if (!this.insights) return []
      return this.applySort(this.insights.teamsByDelta, this.climateSort)
    },

    // Same idea for the timezone table.
    sortedTz() {
      if (!this.insights) return []
      return this.applySort(this.insights.teamsByTz, this.tzSort)
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

    // Clicking a column header that's already the active sort flips
    // direction; clicking a different column switches to it with a sensible
    // default direction (points high-to-low first, everything else
    // low-to-high first).
    setSort(state, key) {
      if (state.key === key) {
        state.asc = !state.asc
      } else {
        state.key = key
        state.asc = key !== 'P'  // points default descending; everything else ascending
      }
    },

    // Which little arrow glyph to show next to a sortable column header.
    sortIcon(state, key) {
      // ︎ = variation selector-15: forces the text glyph so iOS doesn't
      // render these arrows (esp. ↕) as full-colour emoji.
      if (state.key !== key) return '↕︎' // this column isn't the active sort
      return state.asc ? '↑︎' : '↓︎'
    },

    // "1 pt" vs "7 pts" — used anywhere a points total appears in prose
    // (tzSpotlight callouts, Core Findings) so the grammar is never wrong
    // for exactly 1 point.
    ptsLabel(p) {
      return `${p} ${p === 1 ? 'pt' : 'pts'}`
    },

    // Maps a climate gap (°C) onto the blue→red gradient used for the
    // climate comfort chart bars — small gap stays blue/cool, gap of 25°C+
    // saturates fully red. Delegates the actual colour math to the shared
    // tempToColor() helper (also used for the temperature pills elsewhere
    // in the app) by translating "gap size" into a fake "temperature".
    deltaColor(delta) {
      return tempToColor(15 + Math.min(delta, 25))
    },

    // Maps a venue's minimum elevation (m) onto a blue→pink gradient for the
    // altitude chart bars — sea level is blue, 2000m+ (Mexico City-ish) is
    // fully pink. A simple linear interpolation between two fixed RGB
    // triples, independent of deltaColor()/tempToColor() since this isn't a
    // temperature scale.
    elevColor(minElev) {
      const t = Math.min(minElev / 2000, 1)
      const r = Math.round(56  + (185 - 56)  * t)
      const g = Math.round(189 + (28  - 189) * t)
      const b = Math.round(248 + (28  - 248) * t)
      return `rgb(${r},${g},${b})`
    },

    // CSS class for a points total, used to colour-code the points column in
    // both the climate and timezone tables (green for a strong points haul,
    // fading to grey for none).
    ptsClass(p) {
      if (p >= 9) return 'pts-9'
      if (p >= 7) return 'pts-7'
      if (p >= 4) return 'pts-4'
      if (p >= 1) return 'pts-1'
      return 'pts-0'
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

    // Opens/closes a chart's "Export ▾" dropdown. Only one menu is ever open
    // at a time — opening a second closes whichever was already open.
    toggleExportMenu(refName) {
      this.openExportMenu = this.openExportMenu === refName ? null : refName
    },

    // Any click outside an open export dropdown closes it — the dropdown
    // itself lives inside .export-menu, so anything else is "outside".
    // Registered on `document` (see mounted()/beforeUnmount()) rather than
    // relying on blur, since blur fires before the option's own click
    // handler would get a chance to run.
    handleDocumentClick(e) {
      if (this.openExportMenu && !e.target.closest('.export-menu')) {
        this.openExportMenu = null
      }
    },

    // Closes the dropdown, then hands off to exportChart() — the small
    // wrapper the two "Export as PNG/JPG" menu options actually call.
    doExport(refName, filenameBase, format) {
      this.openExportMenu = null
      this.exportChart(refName, filenameBase, format)
    },

    // Rasterizes one chart (referenced by ref name, e.g. 'climateChart')
    // and downloads it as a standalone image file. Reached via the Export
    // dropdown under each of the three charts (Climate Comfort, Altitude
    // Factor, Timezone Fatigue) — the Core Findings cards and hero stats
    // are plain text/numbers and don't need this.
    async exportChart(refName, filenameBase, format) {
      const el = this.$refs[refName]
      if (!el || this.exportingChart) return

      this.exportingChart = refName
      try {
        const isJpeg = format === 'jpeg'
        const canvas = await html2canvas(el, {
          scale: EXPORT_SCALE,
          // PNG keeps real transparency (no background painted at all);
          // JPEG can't represent transparency, so it gets an explicit
          // opaque background matching the card behind it on-screen.
          backgroundColor: isJpeg ? EXPORT_JPEG_BG : null,
        })

        const mime = isJpeg ? 'image/jpeg' : 'image/png'
        const dataUrl = canvas.toDataURL(mime, isJpeg ? 0.95 : undefined)

        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `${filenameBase}.${isJpeg ? 'jpg' : 'png'}`
        link.click()
      } finally {
        this.exportingChart = null
      }
    },

    // Copies the full Capacities export (Core Findings + elevation tiers +
    // every team's climate/timezone rows, one YAML frontmatter block each —
    // see buildCapacitiesMarkdown()) to the clipboard as plain markdown.
    async copyCapacitiesExport() {
      this.openExportMenu = null
      const text = buildCapacitiesMarkdown(this.insights, this.permanentInsights())
      await navigator.clipboard.writeText(text)
      // Flash "Copied!" on the button in place of a toast notification,
      // since the app doesn't have one.
      this.capacitiesCopied = true
      setTimeout(() => { this.capacitiesCopied = false }, 1500)
    },

    // Same export, downloaded as a standalone .md file instead of copied.
    downloadCapacitiesExport() {
      this.openExportMenu = null
      const text = buildCapacitiesMarkdown(this.insights, this.permanentInsights())
      const blob = new Blob([text], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `wc26-capacities-export-${new Date().toISOString().slice(0, 10)}.md`
      link.click()
      URL.revokeObjectURL(url)
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

/* ── Chart image export ── */
.chart-asof {
  font-size: 0.65rem;
  opacity: 0.35;
  margin: 0.5rem 0 0;
}

.elev-chart-title {
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  opacity: 0.4;
  margin: 0 0 0.6rem;
}

.elev-gpg-unit {
  font-size: 0.62rem;
  font-weight: 500;
  opacity: 0.5;
}

.chart-export-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 1.1rem;
}

.page-export-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  margin: 0 0 0.75rem;
}

.export-help {
  position: relative;
  display: flex;
  align-items: center;
}

.export-help-trigger {
  font-size: 0.72rem;
  opacity: 0.45;
  cursor: help;
  text-decoration: underline dotted;
  text-underline-offset: 2px;
  transition: opacity 0.15s;
}

.export-help-trigger:hover,
.export-help-trigger:focus {
  opacity: 0.85;
  outline: none;
}

.export-help-tooltip {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-width: calc(100vw - 2rem);
  background: #0a1f12;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.45);
  padding: 0.65rem 0.8rem;
  font-size: 0.7rem;
  line-height: 1.5;
  color: rgba(255,255,255,0.75);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-4px);
  transition: opacity 0.15s, transform 0.15s, visibility 0.15s;
  z-index: 25;
  pointer-events: none;
}

.export-help-trigger:hover + .export-help-tooltip,
.export-help-trigger:focus + .export-help-tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.export-menu {
  position: relative;
}

.export-btn {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.6);
  transition: background 0.15s, color 0.15s, opacity 0.15s;
}

.export-btn:hover:not(:disabled) { background: rgba(255,255,255,0.12); color: #f9fafb; }
.export-btn:disabled              { opacity: 0.4; cursor: default; }

.export-caret { font-size: 0.6rem; opacity: 0.7; }

.capacities-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  opacity: 0.85;
}

.export-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 165px;
  background: #0a1f12;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.45);
  overflow: hidden;
  z-index: 20;
}

.export-option {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  cursor: pointer;
  padding: 0.6rem 0.85rem;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.75);
}

.export-option:hover { background: rgba(255,255,255,0.08); color: #f9fafb; }

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

  /* Comfortable tap targets for the column-sort controls (matches the 44px
     minimum used elsewhere in the app). */
  .col-sort-btn { min-height: 44px; }
}
</style>
