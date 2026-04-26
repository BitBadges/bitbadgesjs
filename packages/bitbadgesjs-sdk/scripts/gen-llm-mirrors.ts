#!/usr/bin/env tsx
/**
 * Generate LLM-context mirrors of every BitBadges builder skill.
 *
 * Source of truth: src/builder/resources/skillInstructions.ts
 *
 * Three outputs (override paths via env vars):
 *   1. Plugin SKILL.md files — thin routing wrappers for the Claude Code
 *      plugin. Body is short; substance lives in the SDK and is fetched
 *      at invoke time via `bitbadges-cli sdk skills <id>` or the
 *      `get_skill_instructions` MCP tool.
 *      (PLUGIN_SKILLS_DIR, default: ../../../../bitbadges-plugin/skills)
 *
 *   2. Cursor .mdc rules — full instructions, formatted for Cursor's
 *      project-level rules system. Users copy these into .cursor/rules/.
 *      (CURSOR_RULES_DIR, default: ../../../../bitbadges-docs/for-developers/ai-agents/cursor-rules)
 *
 *   3. for-llms-skills.md — single concatenated markdown that any
 *      generic LLM harness can be told to read. Sibling to gen-skill-docs's
 *      Gitbook output but with all skills inlined for one-shot loading.
 *      (FOR_LLMS_FILE, default: ../../../../bitbadges-docs/for-developers/ai-agents/for-llms-skills.md)
 *
 * Usage: bun tsx scripts/gen-llm-mirrors.ts
 */

import { SKILL_INSTRUCTIONS, SkillInstruction } from '../src/builder/resources/skillInstructions.js';
import { writeFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const here =
  typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));

const PLUGIN_SKILLS_DIR =
  process.env.PLUGIN_SKILLS_DIR ||
  join(here, '../../../../bitbadges-plugin/skills');

const CURSOR_RULES_DIR =
  process.env.CURSOR_RULES_DIR ||
  join(here, '../../../../bitbadges-docs/for-developers/ai-agents/cursor-rules');

const FOR_LLMS_FILE =
  process.env.FOR_LLMS_FILE ||
  join(here, '../../../../bitbadges-docs/for-developers/ai-agents/for-llms-skills.md');

const HEADER_NOTE =
  '<!-- GENERATED FILE — do not edit by hand. Source: bitbadgesjs-sdk/src/builder/resources/skillInstructions.ts. Regenerate with `bun run gen-llm-mirrors`. -->';

mkdirSync(PLUGIN_SKILLS_DIR, { recursive: true });
mkdirSync(CURSOR_RULES_DIR, { recursive: true });
mkdirSync(dirname(FOR_LLMS_FILE), { recursive: true });

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

// Same for cursor rules — wipe only the ones we own.
for (const entry of existsSync(CURSOR_RULES_DIR) ? readdirSync(CURSOR_RULES_DIR) : []) {
  if (entry.endsWith('.mdc')) {
    rmSync(join(CURSOR_RULES_DIR, entry));
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

const cursorRule = (s: SkillInstruction) => `${HEADER_NOTE}
---
description: ${oneLine(truncate(s.description, 240))}
globs:
alwaysApply: false
---

# ${s.name}

> ${s.description}

**Category:** \`${s.category}\`

## Summary

${s.summary}

## Instructions

${s.instructions}
${
  s.referenceCollectionIds?.length
    ? `\n## Reference Collections\n\n${s.referenceCollectionIds
        .map((id) => `- [Collection ${id}](https://bitbadges.io/collections/${id})`)
        .join('\n')}\n`
    : ''
}`;

let plugin = 0;
let cursor = 0;

for (const skill of SKILL_INSTRUCTIONS) {
  const skillDir = join(PLUGIN_SKILLS_DIR, skill.id);
  mkdirSync(skillDir, { recursive: true });
  const fm = `---
description: ${oneLine(truncate(skill.description, 240))}
---

`;
  writeFileSync(join(skillDir, 'SKILL.md'), fm + skillRoutingBody(skill));
  plugin++;

  writeFileSync(join(CURSOR_RULES_DIR, `${skill.id}.mdc`), cursorRule(skill));
  cursor++;
}

const categoryLabels: Record<string, string> = {
  'token-type': 'Token Types',
  standard: 'Standards',
  approval: 'Approval Patterns',
  feature: 'Features',
  advanced: 'Advanced',
};

const byCategory = new Map<string, SkillInstruction[]>();
for (const s of SKILL_INSTRUCTIONS) {
  const list = byCategory.get(s.category) || [];
  list.push(s);
  byCategory.set(s.category, list);
}

let forLlms = `${HEADER_NOTE}

# BitBadges Builder Skills (for LLMs)

This file is a single-shot context drop for any LLM that wants to know how to build BitBadges tokens. It contains the complete instructions for every builder skill, generated from the SDK.

If you are a Claude Code user, install the [BitBadges plugin](https://github.com/BitBadges/bitbadges-plugin) instead — these instructions are loaded on demand via the MCP server.

If you are a Cursor user, copy the [\`cursor-rules/*.mdc\`](./cursor-rules/) files into your project's \`.cursor/rules/\` directory.

For all other harnesses, point your LLM at this file.

## Skill index

`;

const order = ['token-type', 'standard', 'approval', 'feature', 'advanced'];
for (const cat of order) {
  const list = byCategory.get(cat);
  if (!list?.length) continue;
  forLlms += `\n### ${categoryLabels[cat] || cat}\n\n`;
  for (const s of list) {
    forLlms += `- **${s.name}** (\`${s.id}\`) — ${s.description}\n`;
  }
}

forLlms += `\n---\n\n`;

for (const cat of order) {
  const list = byCategory.get(cat);
  if (!list?.length) continue;
  forLlms += `\n# ${categoryLabels[cat] || cat}\n\n`;
  for (const s of list) {
    forLlms += `## ${s.name}\n\n`;
    forLlms += `**ID:** \`${s.id}\`\n\n`;
    forLlms += `> ${s.description}\n\n`;
    forLlms += `### Summary\n\n${s.summary}\n\n`;
    forLlms += `### Instructions\n\n${s.instructions}\n\n`;
    if (s.referenceCollectionIds?.length) {
      forLlms += `### Reference collections\n\n`;
      for (const id of s.referenceCollectionIds) {
        forLlms += `- [Collection ${id}](https://bitbadges.io/collections/${id})\n`;
      }
      forLlms += '\n';
    }
    forLlms += '---\n\n';
  }
}

writeFileSync(FOR_LLMS_FILE, forLlms);

console.log(`Generated:`);
console.log(`  ${plugin} plugin SKILL.md files in ${PLUGIN_SKILLS_DIR}`);
console.log(`  ${cursor} cursor .mdc rules in ${CURSOR_RULES_DIR}`);
console.log(`  1 for-llms-skills.md at ${FOR_LLMS_FILE}`);
