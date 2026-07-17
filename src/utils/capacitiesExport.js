// Builds the full Capacities-importable markdown export for the Insights
// tab — every computed team row, elevation tier, and Core Finding as its
// own YAML frontmatter block. Capacities' markdown importer reads
// frontmatter and maps each named property onto an existing object type
// field-for-field, so no free-text body is needed below the fence — see
// GitHub issue #2 for the full spec this follows.

// "1 pt" vs "7 pts" — duplicated from ptsLabel() in InsightsView.vue rather
// than imported, since this file is meant to stay a plain, dependency-free
// data-to-markdown transform.
function ptsLabel(p) {
  return `${p} ${p === 1 ? 'pt' : 'pts'}`
}

// YAML double-quoted scalar: escapes backslashes and double quotes so any
// team/body text with a colon, quote, or leading special character still
// parses as a single string value instead of breaking the frontmatter block.
function yamlString(value) {
  return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"'
}

function toFrontmatterBlock({ tag, team, stat, body, date }) {
  return [
    '---',
    'type: "WC26 Insight"',
    `tag: ${yamlString(tag)}`,
    `team: ${yamlString(team)}`,
    `stat: ${yamlString(stat)}`,
    `body: ${yamlString(body)}`,
    `date: ${date}`,
    '---',
  ].join('\n')
}

// `findings` is the Core Findings array (from permanentInsights() in
// InsightsView.vue) — already shaped as {tag, team, stat, body}, passed in
// rather than recomputed here so there's a single source of truth for that
// copy. `insights` is the return value of computeInsights().
export function buildCapacitiesMarkdown(insights, findings) {
  const date = new Date().toISOString().slice(0, 10)
  const items = []

  for (const f of findings) {
    items.push({ ...f, date })
  }

  for (const tier of insights.elevTiers) {
    items.push({
      tag:  'Altitude',
      team: tier.label,
      stat: `${tier.goalsPerGame.toFixed(2)} gpg (${tier.range})`,
      body: `${tier.label} venues (${tier.range}) have averaged ${tier.goalsPerGame.toFixed(2)} goals per game across ${tier.games} match${tier.games === 1 ? '' : 'es'} so far.`,
      date,
    })
  }

  for (const tier of insights.potTiers) {
    items.push({
      tag:  'Seeding',
      team: `Pot ${tier.pot}`,
      stat: `${tier.avgPoints.toFixed(1)} avg pts (${tier.teamCount} teams)`,
      body: `The ${tier.teamCount} team${tier.teamCount === 1 ? '' : 's'} in Pot ${tier.pot} of the December 2025 FIFA draw ${tier.teamCount === 1 ? 'has' : 'have'} averaged ${tier.avgPoints.toFixed(1)} group-stage points so far, with ${tier.qualifiedCount} qualified.`,
      date,
    })
  }

  for (const team of insights.teamsByDelta) {
    items.push({
      tag:  'Climate',
      team: team.name,
      stat: `${team.avgDelta.toFixed(1)}°C avg gap`,
      body: `${team.name} has averaged a ${team.avgDelta.toFixed(1)}°C gap between their training temperature and matchday venue temperatures, with ${ptsLabel(team.P)} and ${team.qualified ? 'currently qualified' : 'currently eliminated'} from their group.`,
      date,
    })
  }

  for (const team of insights.teamsByTz) {
    items.push({
      tag:  'Timezone',
      team: team.name,
      stat: `${team.avgTzDiff.toFixed(1)}h avg gap`,
      body: `${team.name} has averaged a ${team.avgTzDiff.toFixed(1)}h timezone gap per match, with ${ptsLabel(team.P)} and ${team.qualified ? 'currently qualified' : 'currently eliminated'} from their group.`,
      date,
    })
  }

  return items.map(toFrontmatterBlock).join('\n\n')
}
