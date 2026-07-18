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
        <div class="hero-card shine">
          <div class="hero-num">{{ insights.headlines.comfortWinPct.toFixed(0) }}&thinsp;<span class="hero-unit">%</span></div>
          <div class="hero-label">win rate within {{ insights.comfortThreshold }}°C of home conditions</div>
          <div class="hero-compare">vs. {{ insights.headlines.discomfortWinPct.toFixed(0) }}% beyond that gap</div>
        </div>
        <div class="hero-card shine">
          <div class="hero-num">{{ insights.headlines.midAltGoals.toFixed(1) }} <span class="hero-unit">gpg</span></div>
          <div class="hero-label">goals per game at Guadalajara (1,566m)</div>
          <div class="hero-compare">vs. {{ insights.headlines.seaLevelGoals.toFixed(1) }} at sea-level venues</div>
        </div>
        <div class="hero-card shine">
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
            Exports every computed stat on this tab (Core Findings, elevation tiers, seeding pots, and each team's climate and timezone gap) as Capacities-ready markdown. Each item comes out as its own YAML frontmatter block, matching how Capacities' importer maps named properties onto a typed object. Copy to clipboard or download as a .md file, then import it into Capacities. Re-export any time to pull in updated results.
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
      <section class="ins-section shine" :class="{ 'menu-open': openExportMenu === 'climateChart' }">
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
              <div class="cc-bar" :style="{ background: deltaGradient(team.avgDelta) }"></div>
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
      <section class="ins-section shine" :class="{ 'menu-open': openExportMenu === 'elevChart' }">
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
            <div v-for="(tier, i) in insights.elevTiers" :key="tier.label" class="elev-col">
              <div class="elev-bar-wrap">
                <div class="elev-gpg">{{ tier.goalsPerGame.toFixed(2) }} <span class="elev-gpg-unit">gpg</span></div>
                <div class="elev-bar-track">
                  <div
                    class="elev-bar"
                    :style="{ height: (tier.goalsPerGame / 4 * 100) + '%', background: potGradient(i + 1) }"
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
      <section class="ins-section shine" :class="{ 'menu-open': openExportMenu === 'tzChart' }">
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
            <div class="tz-track" :style="{ '--bw': Math.min(Math.max(team.avgTzDiff / 20 * 100, 2), 100) + '%' }">
              <div class="tz-bar" :style="{ background: tzGradient(team.avgTzDiff) }"></div>
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

      <!-- ── FIFA Seeding ────────────────────────── -->
      <section class="ins-section shine" :class="{ 'menu-open': openExportMenu === 'seedChart' || openExportMenu === 'seedTeamChart' }">
        <div class="sec-eyebrow">FIFA Seeding</div>
        <h3 class="sec-heading">Did the draw pots predict who'd do well?</h3>
        <p class="sec-body">
          Every team was placed into one of four seeding pots for the December 2025 draw, Pot 1 being the strongest.
          Each bar shows the average group-stage points picked up by teams in that pot so far.
        </p>

        <div class="seed-callouts">
          <div class="tz-call tz-green">
            <div class="tz-call-label">Biggest riser</div>
            <template v-if="insights.seedingSpotlight.biggestRiser">
              <div class="tz-call-team">{{ insights.seedingSpotlight.biggestRiser.name }}</div>
              <div class="tz-call-stat">Pot {{ insights.seedingSpotlight.biggestRiser.pot }} · {{ ptsLabel(insights.seedingSpotlight.biggestRiser.P) }} · Qualified</div>
            </template>
            <template v-else>
              <div class="tz-call-team">—</div>
              <div class="tz-call-stat">Not enough data yet</div>
            </template>
          </div>
          <div class="tz-call tz-red">
            <div class="tz-call-label">Biggest faller</div>
            <template v-if="insights.seedingSpotlight.biggestFaller">
              <div class="tz-call-team">{{ insights.seedingSpotlight.biggestFaller.name }}</div>
              <div class="tz-call-stat">Pot {{ insights.seedingSpotlight.biggestFaller.pot }} · {{ ptsLabel(insights.seedingSpotlight.biggestFaller.P) }} · Eliminated</div>
            </template>
            <template v-else>
              <div class="tz-call-team">—</div>
              <div class="tz-call-stat">Not enough data yet</div>
            </template>
          </div>
        </div>

        <div class="seed-chart" ref="seedChart">
          <p class="elev-chart-title">Average group-stage points by pot</p>
          <div class="elev-bars">
            <div v-for="tier in insights.potTiers" :key="tier.pot" class="elev-col">
              <div class="elev-bar-wrap">
                <div class="elev-gpg">{{ tier.avgPoints.toFixed(1) }} <span class="elev-gpg-unit">pts</span></div>
                <div class="elev-bar-track">
                  <div
                    class="elev-bar"
                    :style="{ height: (tier.avgPoints / 9 * 100) + '%', background: potGradient(tier.pot) }"
                  ></div>
                </div>
              </div>
              <div class="elev-tier-name">Pot {{ tier.pot }}</div>
              <div class="elev-games">{{ tier.teamCount }} team{{ tier.teamCount === 1 ? '' : 's' }}</div>
            </div>
          </div>
          <p class="chart-asof">As of {{ asOfDate }}.</p>
        </div>
        <div class="chart-export-row">
          <div class="export-menu">
            <button class="export-btn" :disabled="exportingChart === 'seedChart'" @click.stop="toggleExportMenu('seedChart')">Export <span class="export-caret">▾</span></button>
            <div v-if="openExportMenu === 'seedChart'" class="export-dropdown">
              <button class="export-option" @click="doExport('seedChart', 'wc26-fifa-seeding', 'png')">Export as PNG</button>
              <button class="export-option" @click="doExport('seedChart', 'wc26-fifa-seeding', 'jpeg')">Export as JPG</button>
            </div>
          </div>
        </div>

        <div class="climate-chart" ref="seedTeamChart">
          <p class="elev-chart-title">Every team, by points, pot and current FIFA rank</p>
          <div class="cc-colheads seed-colheads">
            <button class="col-sort-btn" :class="{ 'col-active': seedSort.key === 'name' }" @click="setSort(seedSort, 'name')">Team <span class="sort-icon">{{ sortIcon(seedSort, 'name') }}</span></button>
            <button class="col-sort-btn" :class="{ 'col-active': seedSort.key === 'P' }" @click="setSort(seedSort, 'P')">Points <span class="sort-icon">{{ sortIcon(seedSort, 'P') }}</span></button>
            <button class="col-sort-btn col-right" :class="{ 'col-active': seedSort.key === 'pot' }" @click="setSort(seedSort, 'pot')">Pot <span class="sort-icon">{{ sortIcon(seedSort, 'pot') }}</span></button>
            <button class="col-sort-btn col-right" :class="{ 'col-active': seedSort.key === 'rank' }" @click="setSort(seedSort, 'rank')">Rank <span class="sort-icon">{{ sortIcon(seedSort, 'rank') }}</span></button>
          </div>
          <div
            v-for="team in sortedSeed"
            :key="team.name"
            class="cc-row seed-row"
          >
            <div class="cc-name" :class="{ 'cc-qualified': team.qualified }">{{ team.name }}</div>
            <div class="cc-track" :style="{ '--bw': Math.min(Math.max(team.P / 9 * 100, 2), 100) + '%' }">
              <div class="cc-bar" :style="{ background: seedGradient(team.P) }"></div>
              <span class="cc-delta">{{ ptsLabel(team.P) }}</span>
            </div>
            <div class="cc-pts" :style="{ color: potColor(team.pot) }">{{ team.pot ?? '—' }}</div>
            <div class="cc-pts" :class="rankClass(team.rank)">{{ team.rank ? '#' + team.rank : '—' }}</div>
          </div>
          <p class="chart-asof">As of {{ asOfDate }}.</p>
        </div>
        <div class="chart-export-row">
          <div class="export-menu">
            <button class="export-btn" :disabled="exportingChart === 'seedTeamChart'" @click.stop="toggleExportMenu('seedTeamChart')">Export <span class="export-caret">▾</span></button>
            <div v-if="openExportMenu === 'seedTeamChart'" class="export-dropdown">
              <button class="export-option" @click="doExport('seedTeamChart', 'wc26-seeding-by-team', 'png')">Export as PNG</button>
              <button class="export-option" @click="doExport('seedTeamChart', 'wc26-seeding-by-team', 'jpeg')">Export as JPG</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ── Core Findings ──────────────────────── -->
      <section class="ins-section shine">
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
import { tempToColor, tempGradientStops } from '../utils/temperature.js'
import { buildCapacitiesMarkdown } from '../utils/capacitiesExport.js'
import CAPACITIES_ICON_SRC     from '../assets/capacities-icon-white.png'

// Opaque fallback for JPEG exports, which can't have a transparent
// background — matches the .ins-section card background (rgba(5,20,10,0.96))
// flattened to a solid color, so an exported JPEG looks like the on-screen
// card instead of picking an arbitrary unrelated color.
const EXPORT_JPEG_BG = '#05140a'

// Low value → blue, high value → purple, t in [0, 1] — same "gradient
// reflects magnitude" idea as heatStop() above, just a blue→purple family
// for the seeding/timezone bars instead of blue→gold→red. Purple and blue
// are close enough in hue that a plain RGB lerp doesn't desaturate in the
// middle the way blue→red does, so no midpoint anchor needed here.
function purpleBlueStop(t) {
  const clamped = Math.max(0, Math.min(1, t))
  const blue   = { r: 56,  g: 189, b: 248 } // bright sky-blue — matches potColor(1)
  const purple = { r: 139, g: 92,  b: 246 } // violet-500
  const r = Math.round(blue.r + (purple.r - blue.r) * clamped)
  const g = Math.round(blue.g + (purple.g - blue.g) * clamped)
  const b = Math.round(blue.b + (purple.b - blue.b) * clamped)
  return `rgb(${r},${g},${b})`
}

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
      // Which column + direction each sortable table is currently sorted
      // by, plus which of its own columns (if any) should default to
      // descending the first time it's selected — every other column
      // defaults to ascending. Read/written by applySort()/setSort() below.
      climateSort: { key: 'avgDelta',  asc: true, descKey: 'P' },
      tzSort:      { key: 'avgTzDiff', asc: true, descKey: 'P' },
      seedSort:    { key: 'pot',       asc: true, descKey: null },

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

    // Per-team seeding table rows. teamsByDelta is just as good a starting
    // array as teamsByTz here — applySort() re-sorts it regardless — so
    // there's no need for computeInsights() to hand back a third pre-sorted
    // copy of the same team list.
    sortedSeed() {
      if (!this.insights) return []
      return this.applySort(this.insights.teamsByDelta, this.seedSort)
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
    // default direction — state.descKey (if set) starts high-to-low,
    // everything else starts low-to-high.
    setSort(state, key) {
      if (state.key === key) {
        state.asc = !state.asc
      } else {
        state.key = key
        state.asc = key !== state.descKey
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

    // Maps a climate gap (°C) onto the shared temperature scale used for
    // the pills everywhere else in the app too — translates "gap size"
    // into a fake temperature (15°C = no gap, 40°C = 25°C+ gap).
    deltaColor(delta) {
      return tempToColor(15 + Math.min(delta, 25))
    },

    // A bar filled with deltaColor() alone reads as one flat swatch. A
    // naive two-point `linear-gradient(a, b)` fixes that but only samples
    // the start and end colours and lets the browser lerp straight
    // between them — for a big-gap bar that cuts blue straight to red
    // through a muddy purple, skipping the green/yellow the real scale
    // passes through. tempGradientStops() includes every anchor the range
    // crosses so the bar's sweep matches the scale exactly.
    deltaGradient(delta) {
      const endTemp = 15 + Math.min(delta, 25)
      return `linear-gradient(90deg, ${tempGradientStops(15, endTemp)})`
    },

    // Maps a pot number (1-4) onto a purple→blue gradient — pot 1 (the
    // strongest teams, and in practice the highest-points tier) is
    // purple, pot 4 (lowest points) is blue, matching the same "low
    // value = blue, high value = purple" convention purpleBlueStop()
    // uses. sqrt() on the raw 0-1 position biases it toward purple
    // sooner across the 4 pots — a plain linear ramp left blue reading
    // as the dominant colour for too much of the sequence before purple
    // properly took over. Also reused directly for the altitude chart's
    // 4 elevation-tier bars (tier index + 1 standing in for "pot"), so
    // both 4-block charts share the same colour language.
    potColor(pot) {
      const raw = (4 - pot) / 3
      const t = Math.sqrt(raw)
      const r = Math.round(56  + (168 - 56)  * t)
      const g = Math.round(189 + (85  - 189) * t)
      const b = Math.round(248 + (247 - 248) * t)
      return `rgb(${r},${g},${b})`
    },

    // Each of the 4 bars (pot tiers, or elevation tiers via i+1 above)
    // stays dominated by its own potColor() rather than sweeping across
    // its full height — a hint of pot+1's colour at the base (bottom,
    // since these bars grow upward) that eases into this tier's own
    // colour over the first ~60% of the bar. The scale runs purple (1) →
    // blue (4), so tier 4's colour (bluest) feeds into the base of tier
    // 3, tier 3's into tier 2, tier 2's into tier 1 — a continuous
    // handoff toward purple. Tier 4 has no tier above it, so it comes
    // out solid.
    potGradient(pot) {
      const hint = this.potColor(Math.min(pot + 1, 4))
      const main = this.potColor(pot)
      return `linear-gradient(0deg, ${hint} 0%, ${main} 60%, ${main} 100%)`
    },

    // Same "sweep from the low anchor to a magnitude-scaled colour" pattern
    // as deltaGradient() above, blue→purple family: a low-points bar stays
    // close to blue end-to-end, a high-points bar's right edge pushes
    // further into purple. Points cap at 9 (3 wins).
    seedGradient(points) {
      const t = Math.min(points / 9, 1)
      return `linear-gradient(90deg, ${purpleBlueStop(0)}, ${purpleBlueStop(t)})`
    },

    // Same idea for the timezone bars, scaled against the same 20h cap the
    // bar width itself already uses.
    tzGradient(avgTzDiff) {
      const t = Math.min(avgTzDiff / 20, 1)
      return `linear-gradient(90deg, ${purpleBlueStop(0)}, ${purpleBlueStop(t)})`
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

    // Same green-to-grey scale as ptsClass(), reused for the FIFA Seeding
    // table's Rank column — a low rank number is the "good" end here
    // (world #1 vs world #88), so the thresholds run in the opposite
    // direction from points. Bands are sized to the actual 48-team field
    // (ranks 1-88), not a even split of the 1-211 full FIFA table.
    rankClass(rank) {
      if (rank == null) return 'pts-0'
      if (rank <= 10) return 'pts-9'
      if (rank <= 25) return 'pts-7'
      if (rank <= 45) return 'pts-4'
      if (rank <= 65) return 'pts-1'
      return 'pts-0'
    },

    // "Core Findings" cards — always-visible curated analysis, now computed
    // from live headline stats instead of a fixed launch-day snapshot.
    permanentInsights() {
      if (!this.insights) return []
      const { headlines, comfortThreshold, teamsByDelta, potTiers } = this.insights

      const comfortRatio = headlines.discomfortWinPct > 0
        ? headlines.comfortWinPct / headlines.discomfortWinPct
        : null
      // Ratio can land on either side of 1 — the old copy always called it
      // an "advantage" regardless, which would have been backwards if the
      // comfortable cohort ever actually won less often.
      const comfortSuffix = comfortRatio == null
        ? ' across the 48-team field.'
        : comfortRatio >= 1
          ? ` — a ${comfortRatio.toFixed(2)}× advantage across the 48-team field.`
          : ` — a ${(1 / comfortRatio).toFixed(2)}× disadvantage across the 48-team field.`
      const climateComfort = {
        tag: 'Climate Finding',
        team: 'Climate Comfort Boosts Win Rate',
        stat: `${headlines.comfortWinPct.toFixed(0)}% vs. ${headlines.discomfortWinPct.toFixed(0)}% win rate`,
        body: `Teams playing within ${comfortThreshold}°C of their home training temperature have won ${headlines.comfortWinPct.toFixed(0)}% of individual match sides, versus ${headlines.discomfortWinPct.toFixed(0)}% for teams in more alien conditions`
          + comfortSuffix,
      }

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
      let climateExtremes = null
      if (cohort.length > 0) {
        const cohortFloor = cohort[cohort.length - 1].avgDelta
        const pts    = cohort.map(t => t.P)
        const maxPts = Math.max(...pts)
        const minPts = Math.min(...pts)
        const rangeLabel = minPts === maxPts ? this.ptsLabel(maxPts) : `${minPts}–${maxPts} points`
        climateExtremes = {
          tag: 'Climate Finding',
          team: maxPts <= 1 ? 'Climate Extremes Sink Group Stage Hopes' : "Climate Extremes Don't Guarantee Elimination",
          stat: `Worst ${cohort.length} gap${cohort.length === 1 ? '' : 's'} (≥${cohortFloor.toFixed(1)}°C): ${rangeLabel}`,
          body: `The ${cohort.length} team${cohort.length === 1 ? '' : 's'} with the largest average climate mismatch — ${cohortFloor.toFixed(1)}°C or more — ${cohort.length === 1 ? 'has' : 'have'} scored ${rangeLabel} across their group matches so far. `
            + (maxPts <= 1 ? 'A striking tipping point for climate adaptation.' : 'Results at the extreme end have been more mixed than a clean tipping point would suggest.'),
        }
      }

      // Guadalajara (1,566m) sits in the "mid" elevation tier, Mexico City
      // (2,240m) in "high" — see ELEV_TIERS in utils/insights.js.
      const altitude = {
        tag: 'Elevation Finding',
        team: 'Altitude Suppresses Scoring',
        stat: `${headlines.midAltGoals.toFixed(2)} gpg vs. ${headlines.seaLevelGoals.toFixed(2)} at sea level`,
        body: `Guadalajara (1,566m) has averaged ${headlines.midAltGoals.toFixed(2)} goals per game so far, versus ${headlines.seaLevelGoals.toFixed(2)} at sea-level venues. Mexico City, at 2,240m, is the highest World Cup venue in history — averaging ${headlines.highAltGoals.toFixed(2)} goals per game there.`,
      }

      const tzGap = Math.abs(headlines.tzQualifiedAvg - headlines.tzEliminatedAvg)
      const timezone = {
        tag: 'Timezone Finding',
        team: 'Timezone Fatigue Tracks With Elimination',
        stat: `Qualifiers avg ${headlines.tzQualifiedAvg.toFixed(1)}h · Eliminated avg ${headlines.tzEliminatedAvg.toFixed(1)}h`,
        body: `Teams that have advanced from the group stage have averaged ${headlines.tzQualifiedAvg.toFixed(1)}h of timezone adjustment per match, versus ${headlines.tzEliminatedAvg.toFixed(1)}h for eliminated sides — a ${tzGap.toFixed(1)}h gap between the two groups.`,
      }

      // Pot 1 (strongest seed) vs. Pot 4 (weakest) average points — the
      // headline number for whether the December 2025 draw actually
      // predicted anything. Skipped until both pots have at least one
      // finished match, same divide-by-zero guard as Climate Comfort above.
      const pot1 = potTiers[0], pot4 = potTiers[3]
      let seedingHoldsUp = null
      if (pot1.teamCount > 0 && pot4.teamCount > 0) {
        const seedGap = pot1.avgPoints - pot4.avgPoints
        seedingHoldsUp = {
          tag: 'Seeding Finding',
          team: 'Seeding Holds Up',
          stat: `Pot 1 avg ${pot1.avgPoints.toFixed(1)} pts vs. Pot 4 avg ${pot4.avgPoints.toFixed(1)} pts`,
          body: `Teams from Pot 1, the strongest seeds in December's draw, have averaged ${pot1.avgPoints.toFixed(1)} group-stage points so far, versus ${pot4.avgPoints.toFixed(1)} for Pot 4. `
            + (seedGap > 0
              ? `A ${seedGap.toFixed(1)}-point gap in the seeds' favour — the draw pots have been a reasonable predictor of who'd do well.`
              : `Pot 4 is actually ahead by ${Math.abs(seedGap).toFixed(1)} points, which is the opposite of what the seeding would suggest.`),
        }
      }

      // Current FIFA World Ranking (updated 11 June 2026, reflecting recent
      // form) split into the best- and worst-ranked quartiles of the
      // 48-team field, each averaged for group-stage points. This is the
      // live-signal counterpart to "Seeding Holds Up" above, which only
      // checks the frozen December 2025 draw pot — same question ("does
      // the pre-tournament signal predict results?"), asked of the number
      // that's kept updating through the tournament instead of the one
      // locked in at the draw.
      const rankedTeams = [...teamsByDelta].filter(t => t.rank != null).sort((a, b) => a.rank - b.rank)
      const rankQuartile = Math.max(1, Math.floor(rankedTeams.length / 4))
      const topRanked    = rankedTeams.slice(0, rankQuartile)
      const bottomRanked = rankedTeams.slice(-rankQuartile)
      let currentRanking = null
      if (topRanked.length > 0 && bottomRanked.length > 0) {
        const avgPts = arr => arr.reduce((sum, t) => sum + t.P, 0) / arr.length
        const topAvg = avgPts(topRanked)
        const bottomAvg = avgPts(bottomRanked)
        const rankGap = topAvg - bottomAvg
        currentRanking = {
          tag: 'Seeding Finding',
          team: 'Current Ranking Also Predicts Results',
          stat: `Top ${topRanked.length} ranked avg ${topAvg.toFixed(1)} pts vs. bottom ${bottomRanked.length} avg ${bottomAvg.toFixed(1)} pts`,
          body: `The ${topRanked.length} teams currently ranked highest in the FIFA World Ranking have averaged ${topAvg.toFixed(1)} group-stage points so far, versus ${bottomAvg.toFixed(1)} for the ${bottomRanked.length} lowest-ranked teams in the 48-team field. `
            + (rankGap > 0
              ? `A ${rankGap.toFixed(1)}-point gap in the higher-ranked teams' favour — form and world ranking have tracked results about as well as the draw pots did.`
              : `The lower-ranked group is actually ahead by ${Math.abs(rankGap).toFixed(1)} points, the opposite of what current form would suggest.`),
        }
      }

      // Grouped by category (Climate, Elevation, Timezone, Seeding) rather
      // than computation order, so the 2-column grid below reads as
      // same-topic pairs instead of a shuffled deck.
      return [climateComfort, climateExtremes, altitude, timezone, seedingHoldsUp, currentRanking]
        .filter(Boolean)
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
          // html2canvas can't rasterize `background-clip: text` gradient
          // text (it paints the full gradient block behind barely-visible
          // text instead of clipping to the glyphs) and doesn't reliably
          // respect low-alpha rgba backgrounds either — both fine on
          // screen, both wrong in the exported image. onclone runs on an
          // offscreen clone right before capture, so overriding these
          // here doesn't touch the live page at all.
          onclone: (clonedDoc) => {
            clonedDoc.querySelectorAll('.col-sort-btn.col-active').forEach(node => {
              node.style.background = 'none'
              node.style.webkitTextFillColor = '#f4d35e'
              node.style.color = '#f4d35e'
            })
            clonedDoc.querySelectorAll('.cc-track, .tz-track').forEach(node => {
              node.style.background = 'rgba(20, 18, 12, 0.7)'
            })
          },
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
/* Top padding matches .app-header's on the other two tabs — Insights no
   longer has that shared header above it (App.vue hides it for this
   tab), so this eyebrow is effectively its own page heading and needs
   the same breathing room under the nav. */
.insights {
  padding: 2.6rem 1.5rem 3rem;
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
  background: var(--gold-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0 0 0.3rem;
}

.ins-title {
  font-size: 2.4rem;
  font-weight: 800;
  margin: 0 0 0.3rem;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

.ins-sub {
  font-size: 0.86rem;
  color: var(--text-secondary);
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
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 1.2rem 1.2rem 1.1rem;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
}

.hero-num {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  background: var(--gold-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-unit {
  font-size: 1.6rem;
  font-weight: 600;
  opacity: 0.8;
}

.hero-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 0.4rem;
  line-height: 1.4;
  flex: 1;
}

.hero-compare {
  font-size: 0.7rem;
  color: var(--text-tertiary);
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
  background: rgba(10, 8, 14, 0.92);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  padding: 0.65rem 0.8rem;
  font-size: 0.7rem;
  line-height: 1.5;
  color: var(--text-secondary);
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
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  transition: background 0.15s, color 0.15s, opacity 0.15s, border-color 0.15s;
}

.export-btn:hover:not(:disabled) { background: var(--glass-bg-strong); color: var(--text-primary); border-color: rgba(244, 211, 94, 0.3); }
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
  background: rgba(10, 8, 14, 0.92);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
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
  color: var(--text-secondary);
}

.export-option:hover { background: var(--glass-bg-strong); color: var(--text-primary); }

/* ── Section card ── */
.ins-section {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-card);
  padding: 1.3rem 1.35rem 1.5rem;
  margin-bottom: 0.9rem;
  box-shadow: var(--shadow-card);
}

/* backdrop-filter makes .ins-section its own stacking context, so its
   .export-dropdown (however high its own z-index) can never paint above
   a *sibling* section's content — the sibling isn't inside that context
   at all. Bumping the open section itself above its siblings, only while
   its menu is open, is what actually lets the dropdown clear the card
   below it. */
.ins-section.menu-open {
  z-index: 30;
}

.sec-eyebrow {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--gold-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.3rem;
}

.sec-heading {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0 0 0.5rem;
}

.sec-body {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem;
}

.sec-body strong {
  color: var(--text-primary);
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
  background: var(--gold-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* background-clip: text only clips the background of the element it's
   set on — it doesn't carry down into a nested element's own text, even
   though -webkit-text-fill-color: transparent does inherit. Without its
   own background to clip against, the (inherited-transparent) icon span
   had nothing to fill it with and just vanished. Giving it the same
   gradient/clip directly is what actually makes it visible again. */
.col-sort-btn.col-active .sort-icon {
  /* ↑/↓ render noticeably larger than ↕ at the same font-size in most
     fonts — sized down here so the two states read as the same glyph
     weight rather than the active one looming over the idle one. */
  font-size: 0.72rem;
  top: 0;
  background: var(--gold-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.col-right { justify-self: end; }

/* ↕ sits in an align-items:center row with the label text, but its own
   glyph metrics leave visible empty space below it, which still reads
   as "too high" even though the box itself is centred — nudged down a
   touch to compensate. Bumped up in size too, since it needs to end up
   visually close to the (larger-looking) single-arrow active state. */
.sort-icon {
  font-size: 1.05rem;
  letter-spacing: 0;
  line-height: 1;
  position: relative;
  top: 0.07em;
}

.cc-colheads {
  display: grid;
  grid-template-columns: 160px 1fr 28px;
  gap: 0.85rem;
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
  gap: 0.85rem;
  align-items: center;
  padding: 0.15rem 0;
}

/* FIFA Seeding table only, adds a 4th Rank column onto the shared
   3-column .cc-colheads/.cc-row grid used by Climate Comfort — kept as a
   modifier rather than changing the shared rule so Climate Comfort's own
   3-column layout is untouched. */
.cc-colheads.seed-colheads,
.cc-row.seed-row {
  grid-template-columns: 160px 1fr 34px 44px;
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
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
}

.cc-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--bw);
  border-radius: 999px;
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
  color: var(--text-primary);
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

/* Reuses .tz-call/.tz-green/.tz-red/.tz-call-label/.tz-call-team/.tz-call-stat
   from the timezone callouts above — only the grid needs its own class
   since this row has 2 cards, not 3. */
.seed-callouts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;
  margin-bottom: 1rem;
}

/* Reuses .elev-bars/.elev-col/etc. from the altitude chart above — pot is
   a 4-bucket tier just like elevation, so the same layout applies as-is. */
.seed-chart {
  margin-top: 0.5rem;
}

/* Same treatment as .story — rounder than the original 6px to echo the
   parent .ins-section's corners instead of reading sharp/flat next to
   it. */
.tz-call {
  border-radius: 14px;
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
  background: var(--gold-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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

/* Same treatment as .cc-track/.cc-bar (position:relative + an absolutely
   positioned bar sized via --bw) rather than the plain-flow narrower
   version this used to be — the two charts read as different chart
   systems otherwise. */
.tz-track {
  position: relative;
  background: rgba(255,255,255,0.06);
  border-radius: 999px;
  height: 10px;
  overflow: hidden;
}

.tz-bar {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: var(--bw);
  border-radius: 999px;
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
  margin-top: 1.1rem;
}

/* Rounder than the original 6px — doesn't need to match the parent
   .ins-section's own 20px exactly since this card is much smaller, but
   6px read as sharp/flat next to it rather than a smaller version of
   the same shape language. */
.story {
  border-radius: 14px;
  padding: 0.85rem 1rem;
  border: 1px solid transparent;
}

.story-pos  { background: rgba(74,222,128,0.06);  border-color: rgba(74,222,128,0.15); }
.story-neg  { background: rgba(239,68,68,0.06);   border-color: rgba(239,68,68,0.15); }
.story-core { background: rgba(244,211,94,0.06);  border-color: rgba(244,211,94,0.18); }

.story-tag {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  background: var(--gold-grad);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.3rem;
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
  .seed-callouts  { grid-template-columns: 1fr; }
  .stories-grid   { grid-template-columns: 1fr; }
  .elev-bars      { grid-template-columns: repeat(2, 1fr); }

  .cc-colheads,
  .cc-row         { grid-template-columns: 120px 1fr 24px; }
  .cc-colheads.seed-colheads,
  .cc-row.seed-row { grid-template-columns: 120px 1fr 28px 38px; }
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
