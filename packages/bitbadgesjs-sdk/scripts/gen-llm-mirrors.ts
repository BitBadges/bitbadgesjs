#!/usr/bin/env tsx
/**
 * Generate plugin SKILL.md routing wrappers for the BitBadges Claude Code
 * plugin from SKILL_INSTRUCTIONS (single source of truth).
 *
 * Each generated SKILL.md is a thin wrapper: frontmatter `description` so
 * Claude's matcher can route to it, plus a short routing body that points
 * at `bitbadges-cli sdk skills <id>` and the `get_skill_instructions` MCP
 * tool for the canonical instructions. The substance never lives here.
 *
 * Earlier revisions of this script also emitted Cursor `.mdc` rules and
 * a concatenated `for-llms-skills.md`. Both duplicated the existing
 * Gitbook pages at `x-tokenization/examples/skills/<id>.md` (emitted by
 * the sibling `gen-skill-docs.ts`), so they were dropped. Cursor / generic
 * LLM users get parity by setting up the bitbadges-builder MCP server and
 * letting the LLM call `get_skill_instructions` on demand — same path
 * the plugin uses.
 *
 * Usage: bun run gen-llm-mirrors
 *        (or with override) PLUGIN_SKILLS_DIR=/path bun run gen-llm-mirrors
 */

import { SKILL_INSTRUCTIONS, SkillInstruction } from '../src/builder/resources/skillInstructions.js';
import { writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here =
  typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

// Plugin skills are organized into two top-level groups: build/ for the
// 22 generated SKILL.md files (one per SKILL_INSTRUCTIONS id) and
// operations/ for the 7 hand-written runtime skills (review, simulate,
// query, address, claim, broadcast, explain). The generator only emits
// into build/.
const PLUGIN_SKILLS_DIR =
  process.env.PLUGIN_SKILLS_DIR ||
  join(here, '../../../../bitbadges-plugin/skills/build');

const HEADER_NOTE =
  '<!-- GENERATED FILE — do not edit by hand. Source: bitbadgesjs-sdk/src/builder/resources/skillInstructions.ts. Regenerate with `bun run gen-llm-mirrors`. -->';

mkdirSync(PLUGIN_SKILLS_DIR, { recursive: true });

// Wipe stale generated files in PLUGIN_SKILLS_DIR. We only delete dirs that
// have a SKILL.md marked GENERATED — hand-written operational skills
// (review, simulate, query, etc.) live next to these and must be preserved.
for (const entry of existsSync(PLUGIN_SKILLS_DIR) ? readdirSync(PLUGIN_SKILLS_DIR) : []) {
  const skillFile = join(PLUGIN_SKILLS_DIR, entry, 'SKILL.md');
  if (existsSync(skillFile)) {
    const content = require('fs').readFileSync(skillFile, 'utf-8');
    if (content.includes('GENERATED FILE')) {
      rmSync(join(PLUGIN_SKILLS_DIR, entry), { recursive: true, force: true });
    }
  }
}

const oneLine = (s: string) =>
  s.replace(/\s+/g, ' ').replace(/"/g, "'").trim();

const truncate = (s: string, max: number) =>
  s.length > max ? s.slice(0, max - 1) + '…' : s;

const skillRoutingBody = (s: SkillInstruction) => `${HEADER_NOTE}

# ${s.name}

${s.description}

## When to use this skill

${s.summary.split('\n').slice(0, 8).join('\n').trim()}

## Get the full instructions

The canonical instructions for this skill live in the BitBadges SDK and are loaded on demand. Use one of these to fetch them:

- **MCP tool (preferred in Claude Code)**: call \`get_skill_instructions\` with \`id: "${s.id}"\`.
- **CLI**: \`bitbadges-cli sdk skills ${s.id}\`
- **Web docs**: https://docs.bitbadges.io/x-tokenization/examples/skills/${s.id}

## Category

\`${s.category}\`

${
  s.referenceCollectionIds?.length
    ? `## Reference collections\n\n${s.referenceCollectionIds
        .map((id) => `- [Collection ${id}](https://bitbadges.io/collections/${id})`)
        .join('\n')}\n`
    : ''
}`;

let plugin = 0;

for (const skill of SKILL_INSTRUCTIONS) {
  const skillDir = join(PLUGIN_SKILLS_DIR, skill.id);
  mkdirSync(skillDir, { recursive: true });
  const fm = `---
description: ${oneLine(truncate(skill.description, 240))}
---

`;
  writeFileSync(join(skillDir, 'SKILL.md'), fm + skillRoutingBody(skill));
  plugin++;
}

console.log(`Generated ${plugin} plugin SKILL.md files in ${PLUGIN_SKILLS_DIR}`);
