import { Command } from 'commander';
import type { DocSection } from '../utils/docs-cache.js';

function findSection(tree: DocSection[], slugPath: string): DocSection | null {
  const parts = slugPath.toLowerCase().split('/');
  function searchExact(nodes: DocSection[], depth: number): DocSection | null {
    for (const node of nodes) {
      if (node.slug === parts[depth]) {
        if (depth === parts.length - 1) return node;
        if (node.children) {
          const deeper = searchExact(node.children, depth + 1);
          if (deeper) return deeper;
        }
      }
      if (node.children) {
        const found = searchExact(node.children, depth);
        if (found) return found;
      }
    }
    return null;
  }
  const exact = searchExact(tree, 0);
  if (exact) return exact;
  if (parts.length === 1) {
    const query = parts[0];
    function searchPartial(nodes: DocSection[]): DocSection | null {
      for (const node of nodes) {
        if (node.slug.includes(query) || query.includes(node.slug)) return node;
        if (node.children) {
          const found = searchPartial(node.children);
          if (found) return found;
        }
      }
      return null;
    }
    return searchPartial(tree);
  }
  return null;
}

function collectPaths(section: DocSection): string[] {
  const paths: string[] = [];
  if (section.path) paths.push(section.path);
  if (section.children) {
    for (const child of section.children) paths.push(...collectPaths(child));
  }
  return paths;
}

function printTree(sections: DocSection[], indent = 0, maxDepth = 4): string {
  const lines: string[] = [];
  for (const s of sections) {
    const prefix = '  '.repeat(indent);
    const hasChildren = s.children && s.children.length > 0;
    const marker = hasChildren ? '▸ ' : '  ';
    const pad = Math.max(2, 30 - indent * 2);
    lines.push(`${prefix}${marker}${s.slug.padEnd(pad)} ${s.title}`);
    if (hasChildren && indent < maxDepth) {
      lines.push(printTree(s.children!, indent + 1, maxDepth));
    }
  }
  return lines.join('\n');
}

export const docsCommand = new Command('docs')
  .description('Browse BitBadges documentation (fetched from GitHub, cached 24h).')
  .argument('[section]', 'Section slug (use slashes for nested), or "all" for the full dump')
  .option('--refresh', 'Force refresh the docs cache')
  .addHelpText('after', `
Usage:
  docs                              Show all sections as a navigable tree
  docs all                          Dump full for-llms.txt (entire documentation)
  docs <section>                    Show a top-level section and all its children
  docs <section>/<subsection>       Drill into a specific subsection
  docs <section>/<sub>/<sub>        Navigate as deep as needed with slashes
  docs --refresh                    Force refresh the cached docs

Section Navigation (use slugs from the tree view, separated by /):
  docs learn                        All learning material
  docs learn/approval-criteria      Just the approval criteria section
  docs learn/approval-criteria/merkle-challenges   A specific sub-topic
  docs messages                     All message type docs
  docs messages/msg-transfer-tokens A specific message
  docs examples                     Code examples and snippets
  docs builder-skills               All builder skills (same as "skills")
  docs builder-skills/smart-token   A specific skill

Partial matching: "docs approvals" finds the first section containing "approvals".

Docs are fetched from GitHub on first use and cached locally for 24 hours.
Cache: ~/.bitbadges/docs-cache.json | Refresh: docs --refresh`)
  .action(async (section: string | undefined, opts: { refresh?: boolean }) => {
    const { loadDocs, clearDocsCache } = await import('../utils/docs-cache.js');

    if (opts.refresh) {
      clearDocsCache();
      process.stderr.write('Cache cleared.\n');
    }

    const docs = await loadDocs();

    if (!section) {
      console.log('BitBadges Documentation\n');
      console.log(printTree(docs.tree));
      console.log('\nNavigate with slashes: docs learn/approval-criteria/merkle-challenges');
      console.log('Dump everything: docs all');
      console.log('Partial match: docs approvals (finds first match)');
      return;
    }

    if (section === 'all') {
      console.log(docs.fullText);
      return;
    }

    const found = findSection(docs.tree, section);
    if (!found) {
      console.error(`Section "${section}" not found. Run "docs" to see available sections.`);
      process.exit(1);
    }

    const paths = collectPaths(found);
    if (paths.length === 0) {
      console.log(`Section "${found.title}" has no content files.`);
      if (found.children) {
        console.log('\nSub-sections:');
        for (const child of found.children) console.log(`  ${child.slug}    ${child.title}`);
      }
      return;
    }

    let out = '';
    for (const p of paths) {
      const content = docs.byPath[p];
      if (content) out += `\n## ${p}\n${content}\n`;
    }
    console.log(out.trim() || `No content found for "${section}".`);
  });
