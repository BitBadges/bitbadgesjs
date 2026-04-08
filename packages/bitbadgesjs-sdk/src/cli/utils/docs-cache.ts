import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DOCS_URL = 'https://raw.githubusercontent.com/BitBadges/bitbadges-docs/master/for-llms.txt';
const SUMMARY_URL = 'https://raw.githubusercontent.com/BitBadges/bitbadges-docs/master/SUMMARY.md';
const CACHE_DIR = path.join(os.homedir(), '.bitbadges');
const CACHE_FILE = path.join(CACHE_DIR, 'docs-cache.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface DocSection {
  title: string;
  slug: string;
  path?: string;
  children?: DocSection[];
}

interface DocsCache {
  fetchedAt: number;
  fullText: string;
  tree: DocSection[];
  byPath: Record<string, string>;
}

function readCache(): DocsCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache: DocsCache = JSON.parse(raw);
    if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

function writeCache(cache: DocsCache): void {
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache), 'utf-8');
  } catch {
    // Non-fatal — cache write failure is OK
  }
}

/** Parse SUMMARY.md into a tree of sections. */
function parseSummary(summary: string): DocSection[] {
  const lines = summary.split('\n');
  const root: DocSection[] = [];
  const stack: { indent: number; children: DocSection[] }[] = [{ indent: -1, children: root }];

  for (const line of lines) {
    // Match: * [Title](path.md) or ## Group Name
    const groupMatch = line.match(/^##\s+(.+)/);
    if (groupMatch) {
      const title = groupMatch[1].replace(/[🏗️⌨️📚🔨⚒️📨🔍💡🤖🔒⛓️❓🐙✉️🎨🪙🔗🤝🎓🔷💧🔦👥🎁✍️👋]/g, '').trim();
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const section: DocSection = { title, slug, children: [] };
      root.push(section);
      stack.length = 1;
      stack.push({ indent: 0, children: section.children! });
      continue;
    }

    const itemMatch = line.match(/^(\s*)\*\s+\[(.+?)\]\((.+?)\)/);
    if (itemMatch) {
      const indent = itemMatch[1].length;
      const title = itemMatch[2].replace(/[📚🎓📨🔍💡🤖🔒⛓️❓🐙✉️🎨🪙🔗🤝🔷💧🔦👥🎁✍️👋📖🔨⚒️]/g, '').trim();
      const filePath = itemMatch[3];
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Skip external links
      if (filePath.startsWith('http')) continue;

      const section: DocSection = { title, slug, path: filePath };

      // Find correct parent based on indent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      stack[stack.length - 1].children.push(section);
      section.children = [];
      stack.push({ indent, children: section.children });
    }
  }

  return root;
}

/** Parse for-llms.txt into a map of file path → content. */
function parseForLlms(text: string): Record<string, string> {
  const byPath: Record<string, string> = {};
  const sections = text.split(/^## File: \.\//m);

  for (const section of sections) {
    if (!section.trim()) continue;
    const newlineIdx = section.indexOf('\n');
    if (newlineIdx === -1) continue;
    const filePath = section.slice(0, newlineIdx).trim();
    const content = section.slice(newlineIdx + 1);
    if (filePath) byPath[filePath] = content;
  }

  return byPath;
}

/** Fetch docs from GitHub, parse, and cache. Returns cached version if available. */
export async function loadDocs(): Promise<DocsCache> {
  // Try cache first
  const cached = readCache();
  if (cached) return cached;

  // Fetch both files
  process.stderr.write('Fetching documentation from GitHub...\n');

  const [fullTextRes, summaryRes] = await Promise.all([
    fetch(DOCS_URL),
    fetch(SUMMARY_URL)
  ]);

  if (!fullTextRes.ok) throw new Error(`Failed to fetch docs: HTTP ${fullTextRes.status}`);
  if (!summaryRes.ok) throw new Error(`Failed to fetch SUMMARY.md: HTTP ${summaryRes.status}`);

  const fullText = await fullTextRes.text();
  const summary = await summaryRes.text();

  const tree = parseSummary(summary);
  const byPath = parseForLlms(fullText);

  const cache: DocsCache = {
    fetchedAt: Date.now(),
    fullText,
    tree,
    byPath
  };

  writeCache(cache);
  return cache;
}

/** Load from cache only (no network). Returns null if cache is empty or expired. */
export function loadDocsOffline(): DocsCache | null {
  return readCache();
}

/** Clear the docs cache. */
export function clearDocsCache(): void {
  try {
    if (fs.existsSync(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
  } catch {
    // ignore
  }
}
