#!/usr/bin/env node
/**
 * bundle-docs.ts
 *
 * Reads for-llms.txt and SUMMARY.md from the bitbadges-docs repo,
 * parses them into structured data, and writes a TypeScript module
 * to src/cli/data/docs-bundle.ts that the CLI can import at runtime.
 *
 * Usage:  npx ts-node scripts/bundle-docs.ts
 *    or:  bun scripts/bundle-docs.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ── Paths ──────────────────────────────────────────────────────────────────────

const __filename_ = fileURLToPath(import.meta.url);
const __dirname_ = path.dirname(__filename_);

const DOCS_REPO = path.resolve(__dirname_, '../../../../bitbadges-docs');
const FOR_LLMS_PATH = path.join(DOCS_REPO, 'for-llms.txt');
const SUMMARY_PATH = path.join(DOCS_REPO, 'SUMMARY.md');
const OUT_PATH = path.resolve(__dirname_, '../src/cli/data/docs-bundle.ts');

// ── Types ──────────────────────────────────────────────────────────────────────

interface DocSection {
  title: string;
  slug: string;
  path?: string;
  children?: DocSection[];
}

// ── Slug helper ────────────────────────────────────────────────────────────────

function toSlug(title: string): string {
  return title
    .replace(/[^\w\s-]/g, '') // strip emoji and special chars
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// ── Parse SUMMARY.md ───────────────────────────────────────────────────────────

function parseSummary(text: string): DocSection[] {
  const lines = text.split('\n');
  const root: DocSection[] = [];

  // Stack: each entry is { indent, section } where section.children is the
  // list we append siblings to.
  const stack: { indent: number; children: DocSection[] }[] = [{ indent: -1, children: root }];

  let currentGroup: DocSection | null = null;

  for (const line of lines) {
    // Top-level group heading: ## Overview, ## Token Standard, etc.
    const groupMatch = line.match(/^##\s+(.+)/);
    if (groupMatch) {
      const title = groupMatch[1].replace(/[^\w\s-/()&]/g, '').trim();
      currentGroup = { title, slug: toSlug(title), children: [] };
      root.push(currentGroup);
      // Reset stack to this group's children
      while (stack.length > 1) stack.pop();
      stack.push({ indent: -1, children: currentGroup.children! });
      continue;
    }

    // List item: "  * [Title](path.md)" or "  * [Title](url)"
    const itemMatch = line.match(/^(\s*)\*\s+\[([^\]]+)\]\(([^)]+)\)/);
    if (!itemMatch) continue;

    const rawIndent = itemMatch[1].length;
    const title = itemMatch[2].replace(/[^\w\s\-/()&:.,+$#@=!'"]/g, '').trim();
    const linkPath = itemMatch[3];

    // Skip external links
    const isExternal = linkPath.startsWith('http://') || linkPath.startsWith('https://');

    const section: DocSection = {
      title,
      slug: toSlug(title),
      ...(isExternal ? {} : { path: linkPath.startsWith('./') ? linkPath.slice(2) : linkPath }),
    };

    // Find correct parent based on indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= rawIndent) {
      stack.pop();
    }

    // Append to current parent's children
    stack[stack.length - 1].children.push(section);

    // Push this section as a potential parent
    if (!section.children) section.children = [];
    stack.push({ indent: rawIndent, children: section.children! });
  }

  // Clean up empty children arrays
  function cleanEmpty(sections: DocSection[]) {
    for (const s of sections) {
      if (s.children && s.children.length === 0) {
        delete s.children;
      } else if (s.children) {
        cleanEmpty(s.children);
      }
    }
  }
  cleanEmpty(root);

  return root;
}

// ── Parse for-llms.txt into path→content map ──────────────────────────────────

function parseForLlms(text: string): Record<string, string> {
  const map: Record<string, string> = {};
  const sections = text.split(/^## File: /m);

  for (const section of sections) {
    if (!section.trim()) continue;
    const newlineIdx = section.indexOf('\n');
    if (newlineIdx === -1) continue;

    let filePath = section.slice(0, newlineIdx).trim();
    const content = section.slice(newlineIdx + 1);

    // Normalise: strip leading ./
    if (filePath.startsWith('./')) filePath = filePath.slice(2);

    map[filePath] = content;
  }

  return map;
}

// ── Main ───────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(FOR_LLMS_PATH)) {
    console.error(`ERROR: ${FOR_LLMS_PATH} not found. Is bitbadges-docs cloned alongside bitbadgesjs?`);
    process.exit(1);
  }
  if (!fs.existsSync(SUMMARY_PATH)) {
    console.error(`ERROR: ${SUMMARY_PATH} not found.`);
    process.exit(1);
  }

  const forLlmsRaw = fs.readFileSync(FOR_LLMS_PATH, 'utf-8');
  const summaryRaw = fs.readFileSync(SUMMARY_PATH, 'utf-8');

  const docsTree = parseSummary(summaryRaw);
  const docsByPath = parseForLlms(forLlmsRaw);

  // Build output TypeScript file
  const output = `// AUTO-GENERATED by scripts/bundle-docs.ts — do not edit manually
// Last generated: ${new Date().toISOString()}

export const DOCS_FULL_TEXT = ${JSON.stringify(forLlmsRaw)};

export interface DocSection {
  title: string;
  slug: string;
  path?: string;
  children?: DocSection[];
}

export const DOCS_TREE: DocSection[] = ${JSON.stringify(docsTree, null, 2)};

export const DOCS_BY_PATH: Record<string, string> = ${JSON.stringify(docsByPath)};
`;

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, output, 'utf-8');

  const sizeKB = (Buffer.byteLength(output, 'utf-8') / 1024).toFixed(0);
  const pathCount = Object.keys(docsByPath).length;
  const sectionCount = countSections(docsTree);

  console.log(`docs-bundle.ts written (${sizeKB} KB, ${pathCount} doc pages, ${sectionCount} tree nodes)`);
}

function countSections(sections: DocSection[]): number {
  let count = 0;
  for (const s of sections) {
    count++;
    if (s.children) count += countSections(s.children);
  }
  return count;
}

main();
