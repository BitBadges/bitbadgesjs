import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DOCS_URL = 'https://docs.bitbadges.io/for-llms.txt';
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
  source: string;
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
    if (cache.source !== DOCS_URL || Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
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

/** Parse for-llms.txt into a map of file path → content. */
function parseForLlms(text: string): Record<string, string> {
  const byPath: Record<string, string> = {};
  const sections = text.split(/^## File: (?:\.\/)?/m).slice(1);

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

/** Fetch the public documentation corpus and cache it locally. */
export async function loadDocs(): Promise<DocsCache> {
  const cached = readCache();
  if (cached) return cached;

  process.stderr.write('Fetching documentation from docs.bitbadges.io...\n');
  const response = await fetch(DOCS_URL);
  if (!response.ok) throw new Error(`Failed to fetch docs: HTTP ${response.status}`);
  const fullText = await response.text();
  const byPath = parseForLlms(fullText);
  if (Object.keys(byPath).length === 0) throw new Error('No documentation pages found in the public corpus.');

  const tree: DocSection[] = [];
  for (const [filePath, content] of Object.entries(byPath)) {
    const parts = filePath.replace(/\.md$/, '').split('/');
    let nodes = tree;
    for (let index = 0; index < parts.length; index++) {
      const slug = parts[index].toLowerCase();
      let node = nodes.find((entry) => entry.slug === slug);
      if (!node) {
        node = { title: parts[index], slug, children: [] };
        nodes.push(node);
      }
      if (index === parts.length - 1) {
        node.path = filePath;
        node.title = content.match(/^#\s+(.+)$/m)?.[1] ?? parts[index];
      }
      nodes = node.children!;
    }
  }

  const cache: DocsCache = {
    source: DOCS_URL,
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
