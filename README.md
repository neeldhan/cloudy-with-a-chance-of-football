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

On top of the climate angle, it's also a fully functional bracket predictor. You can fill in your knockout picks slot by slot, mark winners as you go, and watch live scores populate automatically as matches are played. Everything saves locally in your browser, so your predictions persist across sessions.

There's also an **Insights** tab that turns the raw results into analysis: it crunches every finished group stage match to measure whether climate familiarity, altitude, and timezone travel actually correlated with results — and can generate fresh written observations about the data on demand using an AI model.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Features

### Core

* **Interactive knockout bracket** covering all six rounds — Round of 32 through to the Final — with match numbers, dates, stadiums, and host city temperatures
* **Full group stage schedule** — all 72 matches across 12 groups (A–L), with past matches highlighted
* **Live scores** — finished and in-progress match scores fetched automatically from football-data.org every 60 seconds, with a pulsing LIVE badge during in-play matches
* **Auto winner highlighting** — once a match has an official score, the winning team is highlighted in gold automatically; manual toggling re-enabled for unplayed matches

### Climate Explorer

* **Training climate temperatures** displayed on every team as a colour-coded pill, using a blue → red gradient (cold → hot climate)
* **Host city average July temperatures** shown on every match card
* **Real-time match-day weather** — for matches played yesterday, today, or tomorrow, the actual forecast temperature for the host city is fetched live from Open-Meteo and displayed alongside the historical average

### Bracket Editing

* **Slot assignment** — right-click any bracket slot on desktop (or long-press on mobile) to assign a team to it, filling in your predictions before the official results are known
* **Manual winner toggle** — click or tap any team to highlight them as the winner of that match, for matches without an official API score
* **Persistent state** — all slot assignments and manual winner highlights are saved to `localStorage` and survive page refreshes and browser sessions

### Insights & Data Analysis

* **Computed headline stats** — the app tallies every finished group stage match to answer the questions the whole project is built around: what's the win rate for teams playing within 8°C of their home climate versus beyond it, how do goals-per-game change with venue altitude, and how much bigger is the average timezone gap for eliminated teams than for qualifiers
* **Climate comfort chart** — a sorted bar for every team showing the average temperature gap between their training base and the venues they played in, coloured blue (close to home) to red (far out of comfort), with qualified teams highlighted
* **"Core Findings" cards** — four always-visible findings (climate comfort, altitude, timezone fatigue, climate extremes) computed live from the same data — not AI-generated, and never stale; see [Computed Insights](#computed-insights-non-ai) for exactly how each one is derived
* **AI-generated insights** — a "Generate insights" button that sends the computed statistics to a large language model (Llama 3.3 via Groq, though the model isn't named in the UI) and gets back four short, specific written observations about patterns in the data, each tagged (Resilient, Cautionary, Outlier, Pattern, Record, Surprising). At least half of every batch is required to be a genuine cross-team pattern (a shared region, climate band, altitude, or timezone bucket), not a single team's story
* **Generate more, up to a limit** — each click appends 4 more insights rather than replacing what's there, for up to 3 rounds (12 total) per set of results. The button then disables with a note explaining why, until new match results make more rounds available
* **Pin the good ones** — any generated insight can be pinned to keep it around; pinning moves the card into "Pinned" (not a copy), and unpinning moves it back. Pins are saved to `localStorage`
* **Grounded, cached, and honest** — the model is told to only cite numbers that appear verbatim in the data and to never restate a fact already shown in the Core Findings cards. Each round is cached so repeat views are instant, and the UI carries a visible disclaimer: AI can make mistakes, correlation isn't causation, and it can be a little too eager connecting dots — give it a human read

### Mobile

* Full mobile responsiveness — the bracket scrolls horizontally with snap points, the group grid collapses to a single column, and tap targets meet minimum accessibility size guidelines
* Long-press (500ms) replaces right-click for the slot editor on touch devices
* iOS auto-zoom prevention on form inputs

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Getting Started

This app has two parts: the frontend (the website itself, built with Vue and hosted on GitHub Pages) and a small backend proxy (a Cloudflare Worker that handles the live scores API). The frontend is static and deploys automatically — the Worker needs to be set up once manually.

### Prerequisites

* [Node.js](https://nodejs.org/) v22 or higher
* npm (bundled with Node.js)
* A free [football-data.org](https://www.football-data.org/) API key
* A free [Groq](https://console.groq.com/keys) API key (for the AI insights feature)
* A free [Cloudflare](https://cloudflare.com/) account (for the Worker backend)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) — Cloudflare's command-line deployment tool (`npm install -g wrangler`)

### Step 1 — Clone and install

```bash
git clone https://github.com/neeldhan/cloudy-with-a-chance-of-football.git
cd cloudy-with-a-chance-of-football
npm install
```

### Step 2 — Deploy the Cloudflare Worker

The app uses a Cloudflare Worker as a secure middleman between the browser and two external APIs (football scores and the AI model). This keeps your API keys hidden from users — they live encrypted inside Cloudflare, never in any code file. Deploy it once and it runs indefinitely for free.

First, create the KV namespace that caches AI insights, and paste the printed `id` into the `[[kv_namespaces]]` block in `wrangler.toml`:

```bash
wrangler login
wrangler kv namespace create INSIGHTS
# copy the printed id into wrangler.toml under [[kv_namespaces]]
```

Then store the two API keys as encrypted secrets and deploy:

```bash
wrangler secret put FOOTBALL_DATA_API_KEY
# paste your football-data.org API key when prompted
wrangler secret put GROQ_API_KEY
# paste your Groq API key when prompted
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

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Architecture

The app is a fully static Vue 3 single-page application — there is no traditional server. All match data, team climate information, and bracket structure is bundled at build time from local data files. The only runtime network calls are to Open-Meteo (weather) and to the Cloudflare Worker (scores), both made directly from the browser.

The Cloudflare Worker is the one piece of server-side code in the project. It acts as a secure proxy for the two APIs that require authentication keys — football-data.org (scores) and Groq (AI insights) — neither of which can be safely called from browser-side JavaScript. The Worker holds both keys as encrypted secrets and forwards only the results to the browser. It also owns a small KV store used to cache generated insights (see [AI Insights Flow](#ai-insights-flow) below).

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend framework | Vue 3 (Options API) | Component-based UI |
| Build tool | Vite 5 | Dev server and production bundler |
| Styling | Global CSS (no scoped styles) | Shared classes across components |
| Backend proxy | Cloudflare Workers | Secure API key proxy with edge caching |
| Insights cache | Cloudflare Workers KV | Stores generated AI insights keyed by data hash |
| Live weather | Open-Meteo API | No-auth match-day temperature fetches |
| Live scores | football-data.org API v4 | Match results and live scores |
| AI insights | Llama 3.3 70B via [Groq](https://groq.com/) | Written analysis of the computed statistics |
| State persistence | `localStorage` | Slot assignments, winner states, pinned insights |
| Hosting | GitHub Pages | Static site hosting via GitHub Actions |

### Component Tree

```
App.vue                        – tab navigation, score polling (60s interval)
├── BracketView.vue            – slot assignment state, SlotEditor orchestration
│   ├── KnockoutMatch.vue      – score display, winner logic, long-press handler
│   └── SlotEditor.vue        – team assignment overlay with datalist autocomplete
├── ScheduleView.vue           – passes scores prop to groups
│   └── GroupSection.vue       – group title and team list
│       └── GroupMatch.vue     – score display, winner logic, live temp fetch
└── InsightsView.vue           – computed stats, climate chart, AI insights + pinning
```

The computed statistics that drive the Insights tab live in [`src/utils/insights.js`](src/utils/insights.js) (`computeInsights`), which builds group standings and per-team climate/timezone aggregates from the live scores.

### Data Files

```
src/data/
├── groups.js       – GROUP_TEAMS (A–L, 48 teams) and sorted TEAMS array
├── bracket.js      – 32 knockout matches with pre-computed isoDate and matchId
├── groupStage.js   – 72 group matches with pre-computed isoDate and matchId
└── climate.js      – TRAINING_CLIMATE (~50 teams), HOST_CITY_TEMPS_JULY, HOST_CITY_COORDS
```

### Live Scores Flow

```
Browser → Cloudflare Worker (wc26-scores.neel-dhanesha.workers.dev)
        → football-data.org API (secret key never leaves the Worker)
        → normalise team names
        → cache at edge for 60 seconds
        → return { "HomeTeam|AwayTeam": { home, away, status } }

App.vue polls Worker every 60s → passes scores prop down component tree
Each match card looks up its score by "home|away" key
```

The 60-second edge cache means football-data.org receives at most one request per minute regardless of how many visitors are on the site simultaneously.

### Computed Insights (Non-AI)

Everything on the Insights tab *except* the "Generate insights" button's output is plain JavaScript arithmetic over the live scores — no network call, no LLM, fully deterministic, and recomputed on every score refresh (every 60s, same cadence as live scores). This section documents exactly what's computed, since these numbers also form the "ground truth" the AI prompt is built from.

**`computeInsights(scores)`** in [`src/utils/insights.js`](src/utils/insights.js) is the single source of truth for the tab. It walks every *finished* group stage match once and returns:

| Field | What it is |
|---|---|
| `teamsByDelta` / `teamsByTz` | Every team with at least one finished match, each with `avgDelta` (mean absolute gap between training temperature and matchday venue temperature, °C) and `avgTzDiff` (mean absolute timezone gap, hours) — sorted for the climate and timezone charts respectively |
| `elevTiers` | Goals-per-game bucketed into four venue elevation bands (sea level / low / mid / high). Guadalajara (1,566m) falls in "mid"; Mexico City (2,240m, the highest World Cup venue ever hosted) falls in "high" |
| `headlines` | The hero-stat aggregates: climate comfort/discomfort win rate (a team counts as "comfortable" if its average gap is under `COMFORT_THRESHOLD`, currently 8°C), goals/game per elevation tier, and average timezone gap for qualified vs. eliminated teams |
| `tzSpotlight` | Three specific teams — `resilient`, `homeComfort`, `furthest` — picked from the per-team data (see below). Powers both the timezone hero card and the three callout cards, so they can never disagree with each other |
| `qualified` (per team) | Whichever two teams currently top their group by points → goal difference → goals-for, evaluated continuously as results come in — not gated on the group stage being complete |

**`tzSpotlight` selection logic:**
- `resilient` — the *qualified* team with the largest average timezone gap (travelled furthest and still advanced)
- `homeComfort` — the team with the *smallest* average timezone gap of anyone, ties broken by points (effectively "played at home")
- `furthest` — the largest average timezone gap among *eliminated* teams; falls back to the overall largest gap early in the tournament, before any team has actually been eliminated yet

**"Core Findings" cards** (`permanentInsights()` in `InsightsView.vue`) are four always-visible cards built directly from the fields above. They are recomputed on every render — nothing here is cached or stored:

1. **Climate Comfort** — `headlines.comfortWinPct` vs. `discomfortWinPct`, with their ratio (skipped if there's no discomfort-win data yet, to avoid a divide-by-zero).
2. **Altitude Suppresses Scoring** — `headlines.midAltGoals` (Guadalajara) vs. `seaLevelGoals`, mentioning `highAltGoals` (Mexico City) too.
3. **Timezone Fatigue** — `headlines.tzQualifiedAvg` vs. `tzEliminatedAvg`, and the gap between them.
4. **Climate Extremes** — deliberately *not* a fixed °C threshold. It takes the worst 25% of teams by climate gap (at least one team, so this card can never disappear even early in the tournament) and reports their point range. The closing sentence is adaptive: it says the pattern is "a striking tipping point" only if every team in that worst-quartile cohort scored ≤1 point, and otherwise honestly says results have been "more mixed than a clean tipping point would suggest." A fixed threshold risks going quiet (no team crosses it yet) or eventually asserting a clean pattern that stops being true — the floating cohort avoids both failure modes at the cost of a less catchy, non-fixed headline number.

Before your first "Generate insights" click, the "Current" section is a plain empty state ("No insights here yet — generate some above"), not placeholder content. An earlier version showed four computed-but-not-AI cards there by default; that was removed because they were visually indistinguishable from real AI output in a section literally labelled "AI Insights" — more confusing than a simple prompt to click the button.

### AI Insights Flow

When you click "Generate insights", the frontend computes the statistics locally (`computeInsights`) and POSTs them to the Worker's `/analysis` endpoint, along with a `round` number. The Worker then does the slow, key-sensitive work that can't happen in the browser:

```
Browser → POST /analysis  (computed stats: teams, elevation tiers, headlines, round)
        → Worker hashes the tournament data → KV cache key: promptVersion:hash:round
        → round > MAX_ROUNDS (3)?  reject with a round_limit error
        → cache HIT?  return the stored insights instantly (~0.1–0.5s)
        → cache MISS? DRAFT:    build a prompt → call the AI provider (currently
                                 Groq, Llama 3.3 70B) → parse 4 candidate insights
                     → CRITIQUE: build a second prompt (the draft insights +
                                 the full team data) → call the AI provider
                                 again → it fixes, replaces, or passes through
                                 each draft unchanged
                     → store the critiqued result in KV (1-day TTL)
                     → return the insights (~2–6s total for both calls)
```

Design choices worth calling out:

- **Every generation is draft-then-critique, not a single call.** A single generation pass reliably produces two failure modes: calling two teams with opposite outcomes a "Pattern" (two examples is a coincidence, not a trend), and framing a team succeeding *because of* a small, favourable climate/timezone gap as "surprising" or "despite" — technically well-formed JSON, but logically backwards. The critique pass re-reviews every draft insight against the *full* team list (not just the teams the draft happened to cite) before anything is cached or shown. Both prompts are built by `buildPrompt()`/`buildCritiquePrompt()` in `workers/scores.js`, sharing a `buildContext()` helper so the two never disagree about what data or already-shown facts the model has to work with. If the critique call itself fails, the Worker falls back to the uncritiqued draft rather than discarding a perfectly good generation over a hiccup in the second call.
- **Each click is a new "round", not a re-roll of the same cache slot.** The cache key includes an explicit round number (1, 2, 3, ...) that the frontend increments on every successful generation, so clicking "Generate" again returns a *different* batch instead of the same cached array forever — while still being an instant cache hit for every other visitor who reaches that same round for the same data. The frontend appends each round's 4 insights to what's already showing (up to `MAX_AI_ROUNDS = 3`, i.e. 12 total), then disables the button with an explanatory note. `MAX_ROUNDS` in the Worker and `MAX_AI_ROUNDS` in `InsightsView.vue` must be kept in sync manually — they're on opposite sides of a network boundary so can't share a constant.
- **A `PROMPT_VERSION` tag is folded into the cache key.** Without it, editing either prompt (wording, instructions, schema) would be silently masked by old cached insights until the underlying scores data happened to change — every visitor would keep getting the pre-edit output. Bump it whenever `buildPrompt()` or `buildCritiquePrompt()` changes meaningfully.
- **Both prompts explicitly rule out restating the Core Findings** — not just the three-way comparisons as a whole, but each individual figure within them, since a model will happily cite just one side of a comparison (e.g. the sea-level goals/game number alone) and not recognise it as the same already-shown fact.
- **At least 2 of the 4 insights per round must span multiple teams** — a shared region, climate band, altitude, or timezone bucket — with at most 1 single-team "spotlight" story, and any insight claiming a "Pattern" needs at least 3 *consistent* supporting teams, not 2 (two examples that disagree with each other is evidence against a pattern, not for one). This pushes the model toward the kind of cross-cutting pattern a person skimming a spreadsheet would likely miss, rather than four separate "here's one country's story" cards. The schema also explicitly forbids placeholder team labels like "None" or "Various" for these grouped insights, requiring a short descriptive label instead (e.g. "South American Teams").
- **Provider config is isolated to two constants** (`AI_API_URL`, `AI_MODEL` in `workers/scores.js`) and a provider-agnostic function name (`callAIForInsights`), so a future provider swap is a small, contained change rather than a search-and-replace across the file.
- **The model is asked for structured JSON** (`response_format: json_object`) so the four returned insights are reliably parseable.

The Worker caps each AI call with a timeout and returns a retryable error on failure; the frontend silently retries a couple of times before surfacing an error, so a cold generation almost always succeeds without the user noticing.

If the underlying tournament data actually changes (new match results, detected by comparing a snapshot of the stats against the last-seen one — not just any 60-second re-poll with identical content), the frontend clears `currentInsights` and resets the round counter to 0, since old AI insights may now cite stale numbers and a fresh round of generation becomes available.

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
| Korea Republic | South Korea |
| Congo DR / Democratic Republic of Congo | DR Congo |
| Cabo Verde | Cape Verde |
| Czech Republic | Czechia |
| Curaçao | Curacao |

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Usage

### Viewing the Group Stage Schedule

Switch to the **Group Stage Schedule** tab. All 72 matches are organised by group. Matches that have already been played have a green background. Completed matches show the final score automatically; matches currently in progress show a pulsing LIVE badge with the current score.

### Filling in the Knockout Bracket

Switch to the **Knockout Bracket** tab. Bracket slots show placeholder labels ("Winner of Group A", "Runner-up, Group B", etc.) until teams are assigned.

**To assign a team to a slot:**
- **Desktop:** Right-click the slot → type or select a team from the dropdown → Save
- **Mobile:** Long-press (hold for ~0.5 seconds) the slot → type or select a team → Save

Assignments are saved automatically to your browser's local storage, so they persist across page refreshes.

### Marking Match Winners

Click or tap any team name in either the bracket or the schedule to highlight them as the winner of that match. Click again to deselect. This is a manual prediction tool for matches that haven't been played yet — once an official score arrives from the API, it takes over automatically.

### Understanding the Temperature Colours

Each team's name appears in a colour-coded pill based on their training climate:

- **Blue pills** — cool climate (e.g. Scotland 17°C)
- **Orange/red pills** — hot climate (e.g. Qatar 38°C)

The match card also shows the host city's average July temperature, and for recent matches, the actual forecast temperature on match day fetched in real time.

### Exploring the Insights Tab

Switch to the **Insights** tab. At the top are headline figures computed from every finished group stage match — the climate-comfort win rate, goals-per-game by altitude, and the timezone-travel gap between qualifiers and eliminated teams — followed by a per-team climate comfort chart you can sort by team, temperature gap, or points.

Below that, press **Generate insights** to have an AI model read the computed statistics and write four short observations about patterns in the data — most of which should span multiple teams (a region, climate band, or timezone bucket) rather than narrate a single team's story. Each click gets a couple of seconds (cached and instant on repeat) and appends 4 more, up to 3 rounds (12 total) for the current results; after that the button explains it's out until new matches finish. Pin any insight you want to keep — pinning moves it into "Pinned" rather than copying it, and unpinning moves it back. As always with AI, treat the findings as a starting point: verify anything surprising against the numbers shown above.

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Deployment

The frontend deploys automatically — pushing to `main` is all that's needed. The Cloudflare Worker is deployed separately via Wrangler and only needs to be redeployed if `workers/scores.js` or `wrangler.toml` changes (`wrangler deploy`).

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

Both `FOOTBALL_DATA_API_KEY` and `GROQ_API_KEY` are stored as encrypted Cloudflare secrets and are never in any file or environment variable. To update either one, re-run the corresponding command and paste the new key:

```bash
wrangler secret put FOOTBALL_DATA_API_KEY
wrangler secret put GROQ_API_KEY
```

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Known Limitations

* **localStorage only** — slot assignments and winner states are stored in the visitor's own browser. They are not synced across devices or shared between users
* **Team name normalisation** — if a team name in the API response doesn't match any known variant in the Worker's normalisation map, its score won't appear on the app. These are easy to fix by adding entries to `NAME_MAP` in [`workers/scores.js`](workers/scores.js)
* **Knockout bracket is manual** — bracket slots must be filled in by hand once group stage results are known. There is no automatic propagation of group standings into the knockout draw
* **football-data.org free tier** — the free tier has rate limits. The 60-second edge cache in the Worker ensures these are not hit under normal traffic, but very high traffic spikes could theoretically exhaust the per-minute limit
* **No server-side rendering** — this is a fully client-side static app; initial page load fetches everything from flat data files and the Worker
* **AI insights can be wrong** — the generated observations come from a language model. It's instructed to cite only numbers present in the data and to favour cross-team patterns over single-team narration, but it can still misread a trend, overstate a correlation, or connect dots too eagerly — the UI carries a disclaimer to that effect. Treat the AI section as a starting point, not authority. Each round is also only as current as its cached result for that set of match data (cached for up to a day, or until the results actually change)
* **Groq free-tier limits** — the AI feature runs on Groq's free tier, which has per-minute rate limits. Each generation is two sequential calls (draft + critique — see [AI Insights Flow](#ai-insights-flow)), so it uses roughly double the tokens a single-pass design would. The KV cache means any given round (1, 2, or 3) for a given set of results is only ever generated once — subsequent requests for that same round are instant cache hits — so normal use stays well within limits, but generating several never-before-seen rounds back-to-back can hit the per-minute cap and return a retryable error

### Why Groq (and not OpenRouter or Gemini)?

The AI insights feature went through a few backends before landing on Groq, and the reasoning is worth recording:

* **OpenRouter's free tier doesn't work from Cloudflare Workers.** The exact same request completes in ~10 seconds from a normal machine but consistently fails to return within 30–55 seconds when made from the Worker. OpenRouter's free tier appears to throttle traffic from Cloudflare's shared egress IPs heavily enough that requests effectively never complete. Its random free-model router also sometimes selected the wrong kind of model entirely (e.g. a content-safety classifier) or a slow reasoning model. Groq, on separate infrastructure, returns in ~2–3 seconds from the same Worker.
* **Google Gemini was not actually the problem.** An earlier version of this feature targeted Gemini and hit a wall, but that turned out to be a red herring: the app was calling a *stale, dead Worker endpoint* the whole time (a leftover `VITE_SCORES_URL` in a local `.env.local` that overrode the real one), so nothing was reaching the intended backend regardless of provider. Gemini's `generateContent` API had in fact worked fine from the Worker. We note this only so the history is clear — no claim is made that Gemini is better or worse than the current setup.

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

* [football-data.org API v4 documentation](https://www.football-data.org/documentation/quickstart)
* [Open-Meteo API documentation](https://open-meteo.com/en/docs)
* [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
* [Cloudflare Workers KV documentation](https://developers.cloudflare.com/kv/)
* [Groq API documentation](https://console.groq.com/docs)
* [Vite environment variables](https://vitejs.dev/guide/env-and-mode)
* [Vue 3 Options API](https://vuejs.org/guide/introduction.html)
* [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

## Acknowledgements

* **football-data.org** for providing a free tier API with comprehensive World Cup data
* **Open-Meteo** for a genuinely free, no-auth-required weather API
* **Cloudflare** for making serverless edge computing accessible and free at this scale
* **Groq** for genuinely fast, free LLM inference that makes the AI insights feature feel instant

[<sub><sup>Back to top</sup></sub>](#world-cup-2026-heat-bracket)

---

**Last Updated: 7 July 2026**
