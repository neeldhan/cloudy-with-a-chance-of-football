<p align="center"><strong><a href="https://wc26.neeldhanesha.com/">▶&nbsp;&nbsp;Open the live app</a></strong></p>

<h1 align="center">World Cup 2026 Heat Bracket</h1>

<p align="center">
  An interactive FIFA World Cup 2026 bracket and climate explorer — track live scores, visualise training climate mismatches between teams, and fill in your knockout predictions round by round.
</p>

<p align="center">
  <a href="https://wc26.neeldhanesha.com/">
    <img src="https://img.shields.io/badge/Live%20Demo-Online-22c55e?style=for-the-badge" alt="Live Demo">
  </a>&nbsp;
  <img src="https://img.shields.io/badge/Vue-3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3">&nbsp;
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">&nbsp;
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Workers">
</p>

<p align="center">
  <img src="https://forthebadge.com/images/badges/built-with-love.svg" alt="Built with ♥">
</p>

<h4 align="center">
  <a href="#introduction">Introduction</a> •
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#usage">Usage</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#known-limitations">Known Limitations</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#authors">Authors</a> •
  <a href="#references">References</a> •
  <a href="#acknowledgements">Acknowledgements</a>
</h4>

---

## Introduction

Does climate give some football teams an unfair advantage?

The theory is simple: a team that trains in a hot country — say, Qatar at 38°C — should be more physically acclimatised to playing in summer heat than a team from Scotland at 17°C. The 2026 World Cup is hosted across the USA, Canada, and Mexico in June and July, with host cities ranging from the relatively cool Vancouver to the sweltering Miami and Houston. That's a wide spread, and it means some matches are going to pit teams with very different climate backgrounds against each other in very different conditions.

This app is a tool for exploring that theory. It shows the full tournament — every group stage match and every knockout round — with each team's training climate displayed as a colour-coded temperature pill, from blue (cool) to red (hot). Host city temperatures are shown on every match card, and for recent matches, real-time weather data is fetched so you can see what the actual conditions were on match day.

On top of the climate angle, it's also a fully functional bracket predictor. Slots fill in automatically as real results come in, and you can fill in your own predictions for anything not yet decided. Everything saves locally in your browser, so your predictions persist across sessions.

There's also an **Insights** tab that turns the raw results into analysis: it crunches every finished group stage match to measure whether climate familiarity, altitude, and timezone travel actually correlated with results, and lets you export any of it as an image or as Capacities-ready notes.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Features

### Core

* **Interactive knockout bracket** covering all six rounds — Round of 32 through to the Final — with match numbers, dates, stadiums, and host city temperatures
* **Full group stage schedule** — all 72 matches across 12 groups (A–L), with past matches highlighted
* **Live scores** — finished and in-progress match scores fetched automatically from football-data.org every 60 seconds, with a pulsing LIVE badge during in-play matches
* **Auto winner highlighting** — once a match has an official score, the winning team gets a gold outline and gold text, layered on top of (not replacing) their climate-colour pill, so the temperature info survives a result

### Climate Explorer

* **Training climate temperatures** displayed on every team as a colour-coded pill, using a blue → red gradient (cold → hot climate)
* **FIFA seeding pot** — every team's 2026 draw pot (1, strongest, through 4) shown as a small badge before their name; see [FIFA Seeding](#fifa-seeding) for the analysis this feeds
* **Host city average July temperatures** shown on every match card
* **Real-time match-day weather** — for any match on or before tomorrow (that includes every match already played, not just yesterday's), the actual forecast/historical temperature for the host city is fetched live from Open-Meteo and displayed alongside the historical average
* **Display toggles** — three switches (Elevation, Timezone, FIFA Seeding) let you turn off what you don't want cluttering the match cards; state persists to `localStorage`

### Bracket Editing

* **Fully auto-populated** — winners automatically advance into the next round's bracket slots as group and knockout matches are decided, including resolving the "best 3rd place" qualifier slots once the real Round of 32 match actually kicks off. There's no manual override anymore; an undecided slot just shows a placeholder label ("Winner of Group A", "Runner-up, Group B", etc.) until the real result comes in

### Insights & Data Analysis

* **Computed headline stats** — the app tallies every finished group stage match to answer the questions the whole project is built around: what's the win rate for teams playing within 8°C of their home climate versus beyond it, how do goals-per-game change with venue altitude, and how much bigger is the average timezone gap for eliminated teams than for qualifiers
* **Climate comfort chart** — a sorted bar for every team showing the average temperature gap between their training base and the venues they played in, coloured blue (close to home) to red (far out of comfort), with qualified teams highlighted
* **FIFA Seeding chart** — average group-stage points per draw pot, plus "biggest riser" and "biggest faller" spotlight teams, answering whether the December 2025 seeding actually predicted anything; see [FIFA Seeding](#fifa-seeding) for exactly how it's computed
* **"Core Findings" cards** — five always-visible findings (climate comfort, altitude, timezone fatigue, climate extremes, seeding) computed live from the same data; see [Computed Insights](#computed-insights) for exactly how each one is derived
* **High-res chart export** — every chart on the Insights tab (Climate Comfort, Altitude Factor, Timezone Fatigue, and both FIFA Seeding charts) can be exported as a standalone PNG (transparent background) or JPG image at 3x resolution, with an "As of [date]" stamp baked into the image
* **Capacities export** — every computed stat (Core Findings, elevation tiers, seeding pots, and each team's climate/timezone gap) can be copied or downloaded as Capacities-ready markdown, one YAML frontmatter block per item; see [Capacities Export](#capacities-export) for the exact shape

### Mobile

* Full mobile responsiveness — the bracket scrolls horizontally with snap points, the group grid collapses to a single column, and tap targets meet minimum accessibility size guidelines
* iOS auto-zoom prevention on form inputs

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Getting Started

This app has two parts: the frontend (the website itself, built with Vue and hosted on GitHub Pages) and a small backend proxy (a Cloudflare Worker that handles the live scores API). The frontend is static and deploys automatically — the Worker needs to be set up once manually.

<details>
<summary>Show setup steps</summary>

### Prerequisites

* [Node.js](https://nodejs.org/) v20 or higher (matches the version the GitHub Actions build uses)
* npm (bundled with Node.js)
* A free [football-data.org](https://www.football-data.org/) API key
* A free [Cloudflare](https://cloudflare.com/) account (for the Worker backend)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — Cloudflare's command-line deployment tool (`npm install -g wrangler`)

### Step 1 — Clone and install

```bash
git clone https://github.com/neeldhan/cloudy-with-a-chance-of-football.git
cd cloudy-with-a-chance-of-football
npm install
```

### Step 2 — Deploy the Cloudflare Worker

The app uses a Cloudflare Worker as a secure middleman between the browser and football-data.org. This keeps your API key hidden from users — it lives encrypted inside Cloudflare, never in any code file. Deploy it once and it runs indefinitely for free.

```bash
wrangler login
wrangler secret put FOOTBALL_DATA_API_KEY
# paste your football-data.org API key when prompted
wrangler deploy
```

Wrangler will print your Worker URL — something like `https://wc26-scores.YOUR-SUBDOMAIN.workers.dev`. Copy it.

### Step 3 — Configure environment

Create a `.env.local` file in the project root (this file is gitignored and never committed):

```
VITE_SCORES_URL=https://wc26-scores.YOUR-SUBDOMAIN.workers.dev
```

### Step 4 — Run locally

```bash
npm run dev
```

The app is now running at `http://localhost:5173`. Live scores will work immediately since the Worker is already deployed to Cloudflare.

</details>

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Architecture

The app is a fully static Vue 3 single-page application — there is no traditional server. All match data, team climate information, and bracket structure is bundled at build time from local data files. The only runtime network calls are to Open-Meteo (weather) and to the Cloudflare Worker (scores), both made directly from the browser.

The Cloudflare Worker is the one piece of server-side code in the project. It acts as a secure proxy for football-data.org, which requires an authentication key that can't be safely called from browser-side JavaScript. The Worker holds that key as an encrypted secret and forwards only the results to the browser.

<details>
<summary>Show technical details</summary>

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | Vue 3 (Options API) | Component-based UI |
| Build tool | Vite 5 | Dev server and production bundler |
| Styling | Global CSS (no scoped styles, except InsightsView.vue) | Shared classes across components |
| Chart image export | [html2canvas](https://html2canvas.hertzen.com/) | Rasterizes Insights charts to PNG/JPG |
| Backend proxy | Cloudflare Workers | Secure API key proxy with edge caching |
| Live weather | Open-Meteo API | No-auth match-day temperature fetches |
| Live scores | football-data.org API v4 | Match results and live scores |
| State persistence | `localStorage` | Slot assignments, winner states |
| Hosting | GitHub Pages | Static site hosting via GitHub Actions |

### Component Tree

```
App.vue                        – tab navigation, score polling (60s interval),
│                                 display-toggle state (elevation/timezone/pot)
├── DisplayToggles.vue         – renders the toggle switches themselves, stacked
│                                 under the nav tabs in the same toolbar card
├── BracketView.vue            – auto-population via bracketProgression.js
│   └── KnockoutMatch.vue      – score display, winner highlight, pot badge
├── ScheduleView.vue           – passes scores + display-toggle props to groups
│   └── GroupSection.vue       – group title and team list
│       └── GroupMatch.vue     – score display, winner highlight, pot badge
└── InsightsView.vue           – computed stats, climate/altitude/timezone/seeding
                                  charts, Core Findings, chart export, Capacities export
```

The display-toggle switches live in the same toolbar card as the tab nav (stacked below it with a divider) rather than beside it, deliberately: hiding them on the Insights tab only ever changes the card's height, never its width, so the tab buttons never shift position when you switch tabs.

The computed statistics that drive the Insights tab live in [`src/utils/insights.js`](src/utils/insights.js) (`computeInsights`), which builds group standings and per-team climate/timezone/seeding aggregates from the live scores. The knockout bracket's automatic winner/qualifier propagation lives in [`src/utils/bracketProgression.js`](src/utils/bracketProgression.js) (`deriveAssignments`) — see [Bracket Auto-Population](#bracket-auto-population) below.

### Data Files

```
src/data/
├── groups.js       – GROUP_TEAMS (A–L, 48 teams) and sorted TEAMS array
├── bracket.js      – 32 knockout matches with pre-computed isoDate and matchId
├── groupStage.js   – 72 group matches with pre-computed isoDate and matchId
├── climate.js      – TRAINING_CLIMATE (~50 teams), HOST_CITY_TEMPS_JULY, HOST_CITY_COORDS
└── seeding.js       – TEAM_POT (all 48 teams → their 2026 draw pot, 1-4)
```

### Live Scores Flow

```
Browser → Cloudflare Worker (wc26-scores.neel-dhanesha.workers.dev)
        → football-data.org API (secret key never leaves the Worker)
        → normalise team names
        → cache at edge for 60 seconds
        → return { "HomeTeam|AwayTeam": { home, away, status, stage } }

App.vue polls Worker every 60s → passes scores prop down component tree
Each match card looks up its score by "home|away" key
```

The 60-second edge cache means football-data.org receives at most one request per minute regardless of how many visitors are on the site simultaneously.

### Bracket Auto-Population

Once football-data.org shows a real match result, the bracket doesn't need a manual entry for what happens next. `deriveAssignments(scores)` in [`src/utils/bracketProgression.js`](src/utils/bracketProgression.js) computes each group's full standings, fills in the 1st/2nd-place qualifier slots, then chains winners and losers forward through every knockout round in order.

The one case this can't compute from group standings alone is the 8 "best 3rd place" Round of 32 slots (labelled like `3A/B/C/D/F`) — which specific 3rd-place team advances depends on FIFA's own cross-group tiebreak ranking (using data like fair play points that isn't available here). Rather than reimplementing that ranking, `resolveThirdPlaceSlot()` reads the answer off the real Round of 32 fixture directly: once a slot's opponent is known, it checks which of the candidate 3rd-place teams has a recorded match against them at the `LAST_32` stage specifically (not just any later meeting between the same two teams, which could be a rematch). That check can only succeed once the match actually appears in the scores map, though — `handleScores()` in [`workers/scores.js`](workers/scores.js) only includes matches that are currently live or already finished (see the `LIVE`/`DONE` status sets), so a fixture that's merely been scheduled with both teams assigned isn't enough; the slot stays unresolved until that specific match kicks off.

There's no manual override anymore (see [Bracket Editing](#bracket-editing) in Features) — `assignments` in [`BracketView.vue`](src/components/BracketView.vue) is just `deriveAssignments(scores)` directly. A slot with no derivable result yet simply shows its placeholder label until one exists.

### Computed Insights

Everything on the Insights tab is plain JavaScript arithmetic over the live scores — no network call, fully deterministic, and recomputed on every score refresh (every 60s, same cadence as live scores). This section documents exactly what's computed.

**`computeInsights(scores)`** in [`src/utils/insights.js`](src/utils/insights.js) is the single source of truth for the tab. It walks every *finished* group stage match once and returns:

| Field | What it is |
|---|---|
| `teamsByDelta` / `teamsByTz` | Every team with at least one finished match, each with `avgDelta` (mean absolute gap between training temperature and matchday venue temperature, °C) and `avgTzDiff` (mean absolute timezone gap, hours) — sorted for the climate and timezone charts respectively |
| `elevTiers` | Goals-per-game bucketed into four venue elevation bands (sea level / low / mid / high). Guadalajara (1,566m) falls in "mid"; Mexico City (2,240m, the highest World Cup venue ever hosted) falls in "high" |
| `headlines` | The hero-stat aggregates: climate comfort/discomfort win rate (a team counts as "comfortable" if its average gap is under `COMFORT_THRESHOLD`, currently 8°C), goals/game per elevation tier, and average timezone gap for qualified vs. eliminated teams |
| `tzSpotlight` | Three specific teams — `resilient`, `homeComfort`, `furthest` — picked from the per-team data (see below). Powers both the timezone hero card and the three callout cards, so they can never disagree with each other |
| `potTiers` | The 4 FIFA draw pots, each with `teamCount`, `avgPoints`, and `qualifiedCount` among teams with at least one finished match. Powers the FIFA Seeding chart — see [FIFA Seeding](#fifa-seeding) below |
| `seedingSpotlight` | Two teams — `biggestRiser`, `biggestFaller` — picked the same "let an extreme case tell the story" way as `tzSpotlight`, rather than an invented "expected points" model |
| `qualified` (per team) | Whichever two teams currently top their group by points → goal difference → goals-for, evaluated continuously as results come in — not gated on the group stage being complete |

**`tzSpotlight` selection logic:**
- `resilient` — the *qualified* team with the largest average timezone gap (travelled furthest and still advanced)
- `homeComfort` — the team with the *smallest* average timezone gap of anyone, ties broken by points (effectively "played at home")
- `furthest` — the largest average timezone gap among *eliminated* teams; falls back to the overall largest gap early in the tournament, before any team has actually been eliminated yet

**"Core Findings" cards** (`permanentInsights()` in `InsightsView.vue`) are five always-visible cards built directly from the fields above. They are recomputed on every render — nothing here is cached or stored:

1. **Climate Comfort** — `headlines.comfortWinPct` vs. `discomfortWinPct`, with their ratio (skipped if there's no discomfort-win data yet, to avoid a divide-by-zero).
2. **Altitude Suppresses Scoring** — `headlines.midAltGoals` (Guadalajara) vs. `seaLevelGoals`, mentioning `highAltGoals` (Mexico City) too.
3. **Timezone Fatigue** — `headlines.tzQualifiedAvg` vs. `tzEliminatedAvg`, and the gap between them.
4. **Climate Extremes** — deliberately *not* a fixed °C threshold. It takes the worst 25% of teams by climate gap (at least one team, so this card can never disappear even early in the tournament) and reports their point range. The closing sentence is adaptive: it says the pattern is "a striking tipping point" only if every team in that worst-quartile cohort scored ≤1 point, and otherwise honestly says results have been "more mixed than a clean tipping point would suggest." A fixed threshold risks going quiet (no team crosses it yet) or eventually asserting a clean pattern that stops being true — the floating cohort avoids both failure modes at the cost of a less catchy, non-fixed headline number.
5. **Seeding Holds Up** — `potTiers[0].avgPoints` (Pot 1) vs. `potTiers[3].avgPoints` (Pot 4), skipped until both pots have at least one finished match. Says whether the gap actually favours the stronger seeds, since it's entirely possible for Pot 4 to be ahead.

### FIFA Seeding

Every team's 2026 World Cup draw pot (1 = strongest seed, 4 = weakest) is hardcoded in [`src/data/seeding.js`](src/data/seeding.js) (`TEAM_POT`), since neither football-data.org nor any API this app already talks to exposes FIFA ranking or seeding data. The pots come from the actual December 5, 2025 draw, based on the FIFA Men's World Ranking of November 19, 2025; Pot 4 also includes six teams that were still playoff-pending at draw time (four UEFA play-off winners, two inter-confederation play-off winners) and were seeded as anonymous Pot 4 slots regardless of their eventual individual ranking. All 48 names were cross-checked against `groups.js` for an exact match.

The pot badge (`P1` through `P4`) shown before each team name on the Bracket and Schedule tabs, and the FIFA Seeding chart and Core Finding on the Insights tab, all read from this same file — there's no separate, finer-grained numeric ranking used anywhere, deliberately: FIFA's ranking does give a precise 1-48 number for 42 of the 48 teams, but the six playoff qualifiers never had an individual draw-seeding rank of their own, so a full 1-48 list would mean splicing in a different, later ranking snapshot for those six specifically. Pot number is the one figure that's actually complete and official for all 48 teams.

The FIFA Seeding section of the Insights tab has two charts: the 4-bar average-points-per-pot chart described above, and a second per-team table (sortable by Team, Points, or Pot) using the same layout as the Climate Comfort and Timezone Fatigue tables, just with the bar and the sort axis swapped — Points is the bar here, Pot is the thin sortable column, and the bar is coloured by pot rather than by the value it represents, so the seed tier stays visible no matter which column it's sorted by.

### Chart Image Export

Each of the five Insights charts (Climate Comfort, Altitude Factor, Timezone Fatigue, and both FIFA Seeding charts) can be exported as a standalone PNG or JPG via `exportChart()` in [`InsightsView.vue`](src/components/InsightsView.vue), which rasterizes the chart's actual DOM node with [html2canvas](https://html2canvas.hertzen.com/) rather than redrawing it from scratch onto a canvas — these charts are solid colours (plus one simple linear gradient on the timezone bars) with no shadows or filters, so a straight rasterize holds up fine without a second hand-maintained renderer per chart type.

Exports render at a fixed 3x scale regardless of the chart's on-screen pixel size, so they hold up outside a browser window (e.g. printed). PNG keeps a real transparent background; JPG gets an explicit opaque background matching the on-screen card colour, since JPEG can't represent transparency at all. Every export also carries a small "As of [date]" line baked into the image itself, so a saved chart still shows when its numbers were current.

### Capacities Export

The "Export to Capacities" button builds a single markdown document out of every computed stat on the Insights tab (the 5 Core Findings, the 4 elevation tiers, the 4 seeding pots, and every team's climate and timezone gap — around 110 items total) via `buildCapacitiesMarkdown()` in [`src/utils/capacitiesExport.js`](src/utils/capacitiesExport.js).

Each item comes out as its own YAML frontmatter block (`type` / `tag` / `team` / `stat` / `body` / `date`) with no free-text body underneath, matching how [Capacities'](https://capacities.io/) markdown importer maps named frontmatter properties directly onto a typed object's fields rather than dumping everything into one page. Available as a copy-to-clipboard or a downloaded `.md` file, both producing the same document.

### Match ID Scheme

- Group stage: `G-{group}-{matchIndex}` e.g. `G-A-1`
- Knockout: `K-{matchNumber}` e.g. `K-73`

These IDs are used as keys in `localStorage` for winner state persistence.

### Team Name Normalisation

football-data.org uses different name variants for some countries than this app does. The Worker applies a normalisation map on every response to keep them in sync:

| API name | App name |
|---|---|
| Côte d'Ivoire | Ivory Coast |
| Türkiye / Turkey | Turkiye |
| IR Iran | Iran |
| United States of America / USA | United States |
| Democratic Republic of Congo / Congo DR | DR Congo |
| Korea Republic / Republic of Korea | South Korea |
| Czech Republic | Czechia |
| Curaçao | Curacao |
| Cabo Verde / Cape Verde Islands | Cape Verde |
| Bosnia-Herzegovina | Bosnia and Herzegovina |

</details>

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Usage

### Viewing the Group Stage Schedule

Switch to the **Group Stage Schedule** tab. All 72 matches are organised by group. Matches that have already been played have a green background. Completed matches show the final score automatically; matches currently in progress show a pulsing LIVE badge with the current score.

### Filling in the Knockout Bracket

Switch to the **Knockout Bracket** tab. As group and knockout matches are decided, slots fill in automatically with the real results — including the "best 3rd place" qualifier slots, once the actual Round of 32 match kicks off. Anything not yet decided shows a placeholder label ("Winner of Group A", "Runner-up, Group B", etc.) until the real result comes in. Once a match has a result, the winning team gets a gold outline and gold text.

### Understanding the Temperature Colours

Each team's name appears in a colour-coded pill based on their training climate:

- **Blue pills** — cool climate (e.g. Scotland 17°C)
- **Orange/red pills** — hot climate (e.g. Qatar 38°C)

The match card also shows the host city's average July temperature, and for recent matches, the actual forecast temperature on match day fetched in real time. A small "P1" through "P4" badge before each team's name shows their FIFA draw pot, 1 being the strongest seed.

The **Elevation**, **Timezone**, and **FIFA Seeding** switches near the top of the page (Bracket and Schedule tabs only) let you turn off whichever of those you don't want cluttering the match cards; your choice is remembered on your next visit.

### Exploring the Insights Tab

Switch to the **Insights** tab. At the top are headline figures computed from every finished group stage match — the climate-comfort win rate, goals-per-game by altitude, and the timezone-travel gap between qualifiers and eliminated teams — followed by a per-team climate comfort chart you can sort by team, temperature gap, or points. Further down are the Altitude Factor, Timezone Fatigue, and FIFA Seeding charts, then the "Core Findings" cards, which surface the same headline patterns (including seeding) as short written summaries.

Each chart has an **Export** dropdown for a standalone PNG or JPG image of just that chart. The **Export to Capacities** button near the top of the tab (hover or focus the adjacent "What's this?" text for a quick explainer) bundles every computed stat on the page into Capacities-ready markdown, either copied to your clipboard or downloaded as a `.md` file.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Deployment

The frontend deploys automatically — pushing to `main` is all that's needed. The Cloudflare Worker is deployed separately via Wrangler and only needs to be redeployed if `workers/scores.js` or `wrangler.toml` changes (`wrangler deploy`).

<details>
<summary>Show deployment details</summary>

### GitHub Actions Workflow

Every push to `main` triggers an automatic build and deploy to GitHub Pages — no manual steps required:

```
push to main → checkout → npm ci → npm run build → deploy to GitHub Pages
```

See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for the full workflow configuration.

### Custom Domain

The site is served at **`wc26.neeldhanesha.com`**, a custom domain on GitHub Pages. Two things wire this up:

- **`public/CNAME`** contains `wc26.neeldhanesha.com` — GitHub Pages reads this to bind the domain
- **`base: '/'` in `vite.config.js`** — a custom domain serves the repo at the domain root (not in a `/cloudy-with-a-chance-of-football/` subdirectory), so assets are referenced from `/`

The DNS side is a single `CNAME` record at neeldhanesha.com's provider (Cloudflare): `wc26` → `neeldhan.github.io`, left **unproxied (DNS only / grey cloud)** so GitHub can issue and serve its HTTPS certificate. The old `neeldhan.github.io/cloudy-with-a-chance-of-football/` URL automatically redirects to the custom domain.

To revert to the plain GitHub Pages URL, delete `public/CNAME` and set `base` back to `'/cloudy-with-a-chance-of-football/'`.

### Rotating the API Keys

`FOOTBALL_DATA_API_KEY` is stored as an encrypted Cloudflare secret and is never in any file or environment variable. To update it, re-run the command and paste the new key:

```bash
wrangler secret put FOOTBALL_DATA_API_KEY
```

</details>

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Known Limitations

* **localStorage only** — the elevation/timezone/seeding display toggles are stored in the visitor's own browser. They are not synced across devices or shared between users
* **Team name normalisation** — if a team name in the API response doesn't match any known variant in the Worker's normalisation map, its score won't appear on the app. These are easy to fix by adding entries to `NAME_MAP` in [`workers/scores.js`](workers/scores.js)
* **"Best 3rd place" slots wait on kickoff, not just the fixture** — the 8 qualifying 3rd-place knockout slots can't be computed from group standings alone (FIFA's cross-group tiebreak needs data this app doesn't have), so those specific slots read the answer off the real Round of 32 match instead. The Worker's scores endpoint only ever returns matches that are live or finished, so a fixture that's merely been scheduled with both teams assigned isn't enough — the slot shows a placeholder until that match actually kicks off
* **football-data.org free tier** — the free tier has rate limits. The 60-second edge cache in the Worker ensures these are not hit under normal traffic, but very high traffic spikes could theoretically exhaust the per-minute limit
* **No server-side rendering** — this is a fully client-side static app; initial page load fetches everything from flat data files and the Worker

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

If you discover a team name mismatch (a match with a known score that isn't appearing in the app), the fix is a one-line addition to the `NAME_MAP` object in [`workers/scores.js`](workers/scores.js), followed by `wrangler deploy`.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Authors

* **Neel Dhanesha** – concept and development – [neeldhanesha.com](https://neeldhanesha.com)
* **Vikas Bhatia** – development

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## References

<details>
<summary>Show links</summary>

* [football-data.org API v4 documentation](https://www.football-data.org/documentation/quickstart)
* [Open-Meteo API documentation](https://open-meteo.com/en/docs)
* [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
* [Vite environment variables](https://vitejs.dev/guide/env-and-mode)
* [Vue 3 Options API](https://vuejs.org/guide/introduction.html)
* [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
* [html2canvas documentation](https://html2canvas.hertzen.com/documentation)
* [Capacities](https://capacities.io/)

</details>

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Acknowledgements

* **football-data.org** for providing a free tier API with comprehensive World Cup data
* **Open-Meteo** for a genuinely free, no-auth-required weather API
* **Cloudflare** for making serverless edge computing accessible and free at this scale

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

**Last Updated: 17 July 2026**
