<template>
  <div class="about">
    <div class="ins-header">
      <p class="ins-eyebrow">FIFA World Cup 2026 Heat Bracket</p>
      <h2 class="ins-title">About This Project</h2>
    </div>

    <section class="ins-section shine">
      <h3 class="sec-heading">
        <svg class="sec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="16.5" x2="12" y2="16.51"/></svg>
        What is this?
      </h3>
      <ul class="about-bullets">
        <li>A World Cup 2026 bracket tracker built around one question: does heat, altitude, or jet lag affect who wins?</li>
        <li>Example: a team that trains at 38°C in Doha should hold up better in Houston's summer heat than a team that trains at 17°C in Edinburgh.</li>
        <li>This app tracks every match of the tournament live and checks whether that actually shows up in the results.</li>
      </ul>
    </section>

    <section class="ins-section shine">
      <h3 class="sec-heading">
        <svg class="sec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/></svg>
        How it works
      </h3>
      <ul class="about-bullets">
        <li>The Knockout Bracket and Group Stage Schedule tabs are the tournament itself, every match, updated automatically as real results come in.</li>
        <li>Each team's name appears inside a colour-coded pill running blue to red, based on the average temperature where they train.</li>
        <li>Host cities show their own average July temperature, plus the real forecast or live temperature once a match is close enough to kickoff.</li>
        <li>Three switches above the bracket turn off elevation, timezone, and FIFA seeding info if you just want the scores. Your choices save to your own browser only.</li>
        <li>The Insights tab tests the argument: win rate by climate comfort, goals per game by altitude, the timezone gap between teams that advanced and teams that didn't, and whether the December 2025 seeding draw, or the current FIFA ranking, predicted anything.</li>
        <li>Every chart can be exported as an image, and the whole page can be exported as Capacities-ready notes.</li>
      </ul>
    </section>

    <section class="ins-section shine">
      <h3 class="sec-heading">
        <svg class="sec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Methodology
      </h3>
      <ul class="about-bullets">
        <li>Every number on the Insights tab comes from finished group stage matches only, recalculated fresh on every score update. Nothing is pre-baked from an earlier point in the tournament.</li>
        <li>"Climate comfort" means a team's average temperature gap between their training base and the venues they've played in is under 8°C; win rate for that group is compared against everyone outside it.</li>
        <li>Altitude is bucketed into four tiers by venue elevation, from sea level up to Mexico City's 2,240m, the highest World Cup venue in history.</li>
        <li>Timezone gap is the average absolute difference between a team's home timezone and the host city's, in hours, across every match they've played.</li>
        <li>The "Climate Extremes" finding is not built around a fixed temperature cutoff. It takes whichever quarter of the field currently has the largest average climate mismatch, so it stays populated instead of going quiet early on or locking in a headline number that stops being true.</li>
        <li>Sample size is small by the standards of, say, election polling: 48 teams, and a group stage that's still filling in as it's played. Read every percentage here as a description of this tournament so far, not a law of football.</li>
      </ul>
    </section>

    <section class="ins-section shine">
      <h3 class="sec-heading">
        <svg class="sec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        Data and sources
      </h3>
      <ul class="about-sources">
        <li><strong>Live scores:</strong> <a href="https://www.football-data.org/" target="_blank" rel="noopener">football-data.org</a>'s API, proxied through a Cloudflare Worker so the API key never reaches a browser.</li>
        <li><strong>Live and historical weather:</strong> <a href="https://open-meteo.com/" target="_blank" rel="noopener">Open-Meteo</a>, a free, no-authentication weather API.</li>
        <li><strong>Current FIFA World Ranking:</strong> transcribed directly from <a href="https://inside.fifa.com/fifa-world-ranking/men" target="_blank" rel="noopener">FIFA's own ranking page</a>, cross-checked against Wikipedia's <a href="https://en.wikipedia.org/wiki/FIFA_World_Rankings" target="_blank" rel="noopener">FIFA World Rankings</a> article.</li>
        <li><strong>FIFA draw pots and seeding:</strong> the actual 5 December 2025 World Cup draw, based on the FIFA ranking as of 19 November 2025.</li>
        <li><strong>Team training-base climate and elevation:</strong> compiled from Wikipedia infobox data for each team's announced training city, cross-checked against independent geographic lookups where a single figure was disputed (see Corrections and caveats below).</li>
        <li><strong>Flags:</strong> the <a href="https://github.com/lipis/flag-icons" target="_blank" rel="noopener">flag-icons</a> open source library, bundled directly rather than fetched live, so there's no rate limit or outage risk on match day.</li>
        <li><strong>Hosting:</strong> <a href="https://pages.github.com/" target="_blank" rel="noopener">GitHub Pages</a> for the site, <a href="https://developers.cloudflare.com/workers/" target="_blank" rel="noopener">Cloudflare Workers</a> for the one piece of backend code.</li>
        <li><strong>Chart export:</strong> <a href="https://html2canvas.hertzen.com/" target="_blank" rel="noopener">html2canvas</a>. Notes export formatted for <a href="https://capacities.io/" target="_blank" rel="noopener">Capacities</a>.</li>
      </ul>
    </section>

    <section class="ins-section shine">
      <h3 class="sec-heading">
        <svg class="sec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 21 20 3 20Z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.01"/></svg>
        Corrections and caveats
      </h3>
      <ul class="about-bullets">
        <li>Claude Code helped write the code and compile source data for this app, including the current FIFA ranking and each team's training-city elevation.</li>
        <li>That process included cross-checking multiple sources, but figures compiled this way, especially ones drawn from secondary sources rather than a single official database, can still contain errors.</li>
        <li>One example: six of the 48 teams' training-city elevations (Algiers, Praia, Prampram, Bingerville, Wellington, and Ypané) are best estimates rather than confirmed figures, since those towns don't have a single authoritative elevation on record, or the sources that do exist disagree with each other by a wide margin.</li>
        <li>Every figure on this site is drawn from third-party sources and provided for informational purposes. Verify any figure against its primary source before citing it in your own reporting.</li>
      </ul>
    </section>

    <section class="ins-section shine">
      <h3 class="sec-heading">
        <svg class="sec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z"/></svg>
        Acknowledgements
      </h3>
      <ul class="about-masthead">
        <li><span class="about-masthead-name">Neel Dhanesha</span><span class="about-masthead-role">Concept and development · <a href="https://neeldhanesha.com" target="_blank" rel="noopener">neeldhanesha.com</a></span></li>
        <li><span class="about-masthead-name">Vikas Bhatia</span><span class="about-masthead-role">Development · <a href="https://discord.com/users/161966887754792960" target="_blank" rel="noopener">Discord</a> · <a href="https://www.reddit.com/user/SidewinderN7" target="_blank" rel="noopener">Reddit</a></span></li>
      </ul>
    </section>

    <p class="about-sign-off">&minus;30&minus;</p>
  </div>
</template>

<script>
export default {}
</script>

<style scoped>
.about {
  padding: 2.6rem 1.5rem 3rem;
  max-width: 900px;
  margin: 0 auto;
}

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
  margin: 0;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}

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

.sec-heading {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  margin: 0 0 0.6rem;
}

.sec-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  color: #f4d35e;
  opacity: 0.9;
}

.sec-body {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.65;
  margin: 0 0 1rem;
}

.sec-body a {
  color: var(--text-primary);
  text-decoration: underline;
  text-decoration-color: rgba(244, 211, 94, 0.4);
  text-underline-offset: 2px;
}

.sec-body a:hover {
  text-decoration-color: rgba(244, 211, 94, 0.9);
}

/* Small gold dot markers instead of the browser default bullet, matching
   the app's own glass/gold aesthetic rather than a plain list style. */
.about-bullets {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.about-bullets li {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.55;
  padding-left: 1rem;
  position: relative;
}

.about-bullets li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(244, 211, 94, 0.7);
}

.about-sources {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.about-sources li {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.6;
}

.about-sources strong {
  color: var(--text-primary);
  font-weight: 700;
}

.about-sources a,
.about-masthead a {
  color: var(--text-primary);
  text-decoration: underline;
  text-decoration-color: rgba(244, 211, 94, 0.4);
  text-underline-offset: 2px;
}

.about-sources a:hover,
.about-masthead a:hover {
  text-decoration-color: rgba(244, 211, 94, 0.9);
}

.about-masthead {
  list-style: none;
  margin: 0.5rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.about-masthead li {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.about-masthead-name {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
}

.about-masthead-role {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.about-sign-off {
  text-align: center;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--text-tertiary);
  margin: 1.5rem 0 0;
}

@media (max-width: 768px) {
  .about { padding: 1.6rem 1rem 2.5rem; }
  .ins-title { font-size: 1.9rem; }
}
</style>
