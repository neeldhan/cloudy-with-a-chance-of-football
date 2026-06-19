<h1 align="center">World Cup 2026 Heat Bracket</h1>

<p align="center">
  An interactive FIFA World Cup 2026 bracket and climate explorer — track live scores, visualise training climate mismatches between teams, and fill in your knockout predictions round by round.
</p>

<p align="center">
  <a href="https://vikasbhatia.github.io/cloudy-with-a-chance-of-football/">
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

## Features

### Core

* **Interactive knockout bracket** covering all six rounds — Round of 32 through to the Final — with match numbers, dates, stadiums, and host city temperatures
* **Full group stage schedule** — all 72 matches across 12 groups (A–L), with past matches highlighted
* **Live scores** — finished and in-progress match scores fetched automatically from football-data.org every 60 seconds, with a pulsing LIVE badge during in-play matches
* **Auto winner highlighting** — once a match has an official score, the winning team is highlighted in gold automatically; manual toggling is re-enabled for unplayed matches

### Climate Explorer

* **Training climate temperatures** displayed on every team as a colour-coded pill, using a blue → red gradient (cold → hot climate)
* **Host city average July temperatures** shown on every match card
* **Real-time match-day weather** — for matches played yesterday, today, or tomorrow, the actual forecast temperature for the host city is fetched live from Open-Meteo and displayed alongside the historical average

### Bracket Editing

* **Slot assignment** — right-click any bracket slot on desktop (or long-press on mobile) to assign a team to it, filling in your predictions before the official results are known
* **Manual winner toggle** — click or tap any team to highlight them as the winner of that match, for matches without an official API score
* **Persistent state** — all slot assignments and manual winner highlights are saved to `localStorage` and survive page refreshes and browser sessions

### Mobile

* Full mobile responsiveness — the bracket scrolls horizontally with snap points, the group grid collapses to a single column, and tap targets meet minimum accessibility size guidelines
* Long-press (500ms) replaces right-click for the slot editor on touch devices
* iOS auto-zoom prevention on form inputs

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) v22 or higher
* npm (bundled with Node.js)
* A free [football-data.org](https://www.football-data.org/) API key
* A free [Cloudflare](https://cloudflare.com/) account (for the Worker backend)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)

### Step 1 — Clone and install

```bash
git clone https://github.com/vikasbhatia/cloudy-with-a-chance-of-football.git
cd cloudy-with-a-chance-of-football
npm install
```

### Step 2 — Deploy the Cloudflare Worker

The app uses a Cloudflare Worker as a backend proxy to keep your football-data.org API key secure. Deploy it once and it runs indefinitely for free.

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

The app is now running at `http://localhost:5173`.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Architecture

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | Vue 3 (Options API) | Component-based UI |
| Build tool | Vite 5 | Dev server and production bundler |
| Styling | Global CSS (no scoped styles) | Shared classes across components |
| Backend proxy | Cloudflare Workers | Secure API key proxy with edge caching |
| Live weather | Open-Meteo API | No-auth match-day temperature fetches |
| Live scores | football-data.org API v4 | Match results and live scores |
| State persistence | `localStorage` | Slot assignments and winner states |
| Hosting | GitHub Pages | Static site hosting via GitHub Actions |

### Component Tree

```
App.vue                        — tab navigation, score polling (60s interval)
├── BracketView.vue            — slot assignment state, SlotEditor orchestration
│   ├── KnockoutMatch.vue      — score display, winner logic, long-press handler
│   └── SlotEditor.vue        — team assignment overlay with datalist autocomplete
└── ScheduleView.vue           — passes scores prop to groups
    └── GroupSection.vue       — group title and team list
        └── GroupMatch.vue     — score display, winner logic, live temp fetch
```

### Data Files

```
src/data/
├── groups.js       — GROUP_TEAMS (A–L, 48 teams) and sorted TEAMS array
├── bracket.js      — 32 knockout matches with pre-computed isoDate and matchId
├── groupStage.js   — 72 group matches with pre-computed isoDate and matchId
└── climate.js      — TRAINING_CLIMATE (~50 teams), HOST_CITY_TEMPS_JULY, HOST_CITY_COORDS
```

### Live Scores Flow

```
Browser → Cloudflare Worker (wc26-scores.vikasbhatia.workers.dev)
        → football-data.org API (secret key never leaves the Worker)
        → normalise team names
        → cache at edge for 60 seconds
        → return { "HomeTeam|AwayTeam": { home, away, status } }

App.vue polls Worker every 60s → passes scores prop down component tree
Each match card looks up its score by "home|away" key
```

The 60-second edge cache means football-data.org receives at most one request per minute regardless of how many visitors are on the site simultaneously.

### Match ID Scheme

- Group stage: `G-{group}-{matchIndex}` e.g. `G-A-1`
- Knockout: `K-{matchNumber}` e.g. `K-73`

These IDs are used as keys in `localStorage` for winner state persistence.

### Score Lookup Keys

Scores are keyed by `"HomeTeam|AwayTeam"` using normalised team names. The Worker applies a name normalisation map to reconcile football-data.org's naming conventions with the app's:

| API name | App name |
|---|---|
| Côte d'Ivoire | Ivory Coast |
| Türkiye / Turkey | Turkiye |
| IR Iran | Iran |
| Korea Republic | South Korea |
| Congo DR / Democratic Republic of Congo | DR Congo |
| Cabo Verde | Cape Verde |
| Czech Republic | Czechia |
| Curaçao | Curacao |

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Usage

### Viewing the Group Stage Schedule

Switch to the **Group Stage Schedule** tab. All 72 matches are shown organised by group. Matches that have already been played have a green background. Completed matches show the final score automatically; today's matches show a LIVE badge if in progress.

### Filling in the Knockout Bracket

Switch to the **Knockout Bracket** tab. Bracket slots show placeholder labels ("Winner of Group A", "Runner-up, Group B", etc.) until teams are assigned.

**To assign a team to a slot:**
- **Desktop:** Right-click the slot → type or select a team from the dropdown → Save
- **Mobile:** Long-press (hold for ~0.5 seconds) the slot → type or select a team → Save

Assignments are saved automatically to your browser's local storage.

### Marking Match Winners

Click or tap any team name in either the bracket or the schedule to highlight them as the winner of that match. Click again to deselect. This is a manual prediction tool for matches that haven't been played yet.

Once a match has an official score from the API, the winner is highlighted automatically and manual toggling is disabled for that match.

### Understanding the Temperature Colours

Each team's name appears in a colour-coded pill based on their training climate:

- **Blue pills** — cool climate (e.g. Scotland 17°C)
- **Orange/red pills** — hot climate (e.g. Qatar 38°C)

The match card also shows the host city's average July temperature, and (for recent matches) the actual forecast temperature on match day.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Deployment

The app is deployed to GitHub Pages via GitHub Actions. Every push to `main` triggers an automatic build and deploy — no manual steps required.

### GitHub Actions Workflow

```
push to main → checkout → npm ci → npm run build → deploy to GitHub Pages
```

See [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) for the full workflow configuration.

### Moving to a Custom Domain

The site is currently accessible at `vikasbhatia.github.io/cloudy-with-a-chance-of-football/` for testing. To move it to `bracket.neeldhanesha.com`:

1. Add a DNS CNAME record: `bracket` → `vikasbhatia.github.io`
2. Remove the `base` option from `vite.config.js` (currently set to the GitHub Pages subdirectory path)
3. Push to `main` — GitHub Actions handles the rest

The `public/CNAME` file already contains `bracket.neeldhanesha.com`.

### Cloudflare Worker

The Worker is deployed separately via Wrangler and is not part of the GitHub Actions pipeline. Re-deploy it manually if `workers/scores.js` changes:

```bash
wrangler deploy
```

The `FOOTBALL_DATA_API_KEY` secret is stored in Cloudflare and is never in any file or environment variable. To rotate the key:

```bash
wrangler secret put FOOTBALL_DATA_API_KEY
```

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Known Limitations

* **localStorage only** — slot assignments and winner states are stored in the visitor's own browser. They are not synced across devices or shared between users
* **Team name normalisation** — the Worker maps known football-data.org name variants to the app's names. If a team name in the API response doesn't match any known variant, its score won't appear. These mismatches are easy to fix by adding entries to the `NAME_MAP` in `workers/scores.js`
* **Knockout bracket is manual** — bracket slots must be filled in by hand once group stage results are known. There is no automatic propagation of group standings into the knockout draw
* **macOS 12 Cloudflare warning** — Wrangler emits a warning on macOS 12 (Monterey) or below since the Workers runtime is not officially supported on that OS. The Worker itself still deploys and runs correctly on Cloudflare's infrastructure regardless
* **football-data.org free tier** — the free tier has rate limits. The 60-second edge cache in the Worker ensures these are not hit under normal traffic, but very high traffic spikes could theoretically exhaust the per-minute limit
* **No server-side rendering** — this is a fully client-side static app; initial page load fetches everything from flat data files and the Worker

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

If you discover a team name mismatch (a match with a known score that isn't appearing), the fix is a one-line addition to the `NAME_MAP` object in [`workers/scores.js`](workers/scores.js) followed by `wrangler deploy`.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Authors

* **Neel Dhanesha** — concept, design direction, product vision — [neeldhanesha.com](https://neeldhanesha.com)
* **Vikas Bhatia** — development — [brandfortytwo.com](https://brandfortytwo.com)

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## References

* [football-data.org API v4 documentation](https://www.football-data.org/documentation/quickstart)
* [Open-Meteo API documentation](https://open-meteo.com/en/docs)
* [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
* [Vite environment variables](https://vitejs.dev/guide/env-and-mode)
* [Vue 3 Options API](https://vuejs.org/guide/introduction.html)
* [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Acknowledgements

* **football-data.org** for providing a free tier API with comprehensive World Cup data
* **Open-Meteo** for a genuinely free, no-auth-required weather API
* **Cloudflare** for making serverless edge computing accessible and free at this scale

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

**Last Updated: 19 June 2026**
