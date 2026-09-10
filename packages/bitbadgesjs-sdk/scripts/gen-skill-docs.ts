#!/usr/bin/env tsx
/**
 * Generate docs pages from builder skill instructions.
 *
 * Source of truth: src/builder/resources/skillInstructions.ts
 * Output: docs checkout's x-tokenization/examples/skills/ (or DOCS_OUTPUT_DIR).
 *
 * Ported from the old bitbadges-builder-mcp/scripts/gen-skill-docs.ts
 * when the MCP server was folded into the SDK. The only real change is
 * the import path — SKILL_INSTRUCTIONS now lives under the SDK's builder
 * subpath. Output shape + docs destination are unchanged so the existing
 * SUMMARY.md entries and any review diffs stay stable.
 *
 * Usage: bun scripts/gen-skill-docs.ts
 *        (optional) DOCS_OUTPUT_DIR=/path/to/override bun scripts/gen-skill-docs.ts
 */

import { SKILL_INSTRUCTIONS } from '../src/builder/resources/skillInstructions.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { resolveRelatedRepo } from './related-repo';

const DOCS_DIR =
  process.env.DOCS_OUTPUT_DIR ||
  join(resolveRelatedRepo('docs', process.env.DOCS_DIR), 'x-tokenization/examples/skills');

mkdirSync(DOCS_DIR, { recursive: true });

const categoryLabels: Record<string, string> = {
  'token-type': 'Token Types',
  standard: 'Standards',
  approval: 'Approval Patterns',
  feature: 'Features',
  advanced: 'Advanced',
};

// Group skills by category for the README
const byCategory = new Map<string, typeof SKILL_INSTRUCTIONS>();
for (const skill of SKILL_INSTRUCTIONS) {
  const list = byCategory.get(skill.category) || [];
  list.push(skill);
  byCategory.set(skill.category, list);
}

// Generate individual skill pages
for (const skill of SKILL_INSTRUCTIONS) {
  const filename = `${skill.id}.md`;
  const refs = skill.referenceCollectionIds?.length
    ? `\n\n## Reference Collections\n\n${skill.referenceCollectionIds
        .map((id) => `- [Collection ${id}](https://bitbadges.io/collections/${id})`)
        .join('\n')}`
    : '';

  const content = `# ${skill.name}

> ${skill.description}

**Category:** ${categoryLabels[skill.category] || skill.category}

## Summary

${skill.summary}

## Instructions

${skill.instructions}${refs}
`;

  writeFileSync(join(DOCS_DIR, filename), content);
}

// Generate README index
const categoryOrder = ['token-type', 'standard', 'approval', 'feature', 'advanced'];
let readme = `# 🤖 Builder Skills

These pages document every guided build skill available in the BitBadges Builder (shipped as part of [bitbadgesjs-sdk](https://github.com/BitBadges/bitbadgesjs)). Each skill provides step-by-step instructions for building a specific type of token or configuring a specific feature.

> **Tip:** If you're using the BitBadges builder in Claude, Cursor, or another AI tool via the MCP server (\`npx bitbadges bitbadges-builder\`) or the \`bitbadges-cli\` (\`build\`, \`tool\`, \`skills\`, …) command surface, these instructions are loaded automatically when you select a skill. These pages are provided as a human-readable reference.

`;

for (const cat of categoryOrder) {
  const skills = byCategory.get(cat);
  if (!skills?.length) continue;
  readme += `## ${categoryLabels[cat] || cat}\n\n`;
  for (const skill of skills) {
    readme += `- [${skill.name}](${skill.id}.md) — ${skill.description}\n`;
  }
  readme += '\n';
}

writeFileSync(join(DOCS_DIR, 'README.md'), readme);

// Print SUMMARY.md lines for easy copy-paste
console.log('\n=== Add these lines to SUMMARY.md as a top-level section ===\n');
console.log('## 🤖 Builder Skills\n');
console.log('* [Overview](x-tokenization/examples/skills/README.md)');
for (const skill of SKILL_INSTRUCTIONS) {
  console.log(`  * [${skill.name}](x-tokenization/examples/skills/${skill.id}.md)`);
}

console.log(`\n✅ Generated ${SKILL_INSTRUCTIONS.length} skill pages + README in ${DOCS_DIR}`);
