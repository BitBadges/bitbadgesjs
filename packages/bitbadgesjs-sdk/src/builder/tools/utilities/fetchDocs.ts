/**
 * Tool: fetch_docs
 *
 * Search the curated `llms-full.txt` export on docs.bitbadges.io.
 *
 * History: this tool previously carried an 85-entry hardcoded topic → URL map
 * plus an HTML-scraping pipeline (entity decoding, tag stripping, 10k-char
 * truncation), with `llms-full.txt` search as a fallback only. Per backlog
 * #0237 we deleted the map + HTML path and promoted `llms-full.txt` to the
 * single source. The rationale is simple: `llms-full.txt` is the docs site's
 * own LLM-optimized export, so (a) every new docs page is picked up
 * automatically the next time the cache expires, (b) there is no
 * HTML-structure coupling, and (c) the public schema and return shape are
 * unchanged.
 */
import { z } from 'zod';

export const fetchDocsSchema = z.object({
  topic: z
    .string()
    .describe('Keywords, concept, or question — e.g. "claims", "approvals", "how do I mint"')
});

export type FetchDocsInput = z.infer<typeof fetchDocsSchema>;

export interface FetchDocsResult {
  success: boolean;
  topic?: string;
  content?: string;
  url?: string;
  error?: string;
}

export const fetchDocsTool = {
  name: 'fetch_docs',
  description:
    'Search live BitBadges documentation by keyword. Ranks sections from the curated llms-full.txt export on docs.bitbadges.io and returns the top matches.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      topic: {
        type: 'string',
        description:
          'Keywords, concept, or question — e.g. "claims", "approvals", "how do I mint"'
      }
    },
    required: ['topic']
  }
};

const LLMS_FULL_URL = 'https://docs.bitbadges.io/llms-full.txt';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_SECTIONS = 3;
const MAX_SECTION_CHARS = 3000;

let cache: { text: string; fetchedAt: number } | null = null;

/** Fetch `llms-full.txt`, caching the body for CACHE_TTL_MS. Throws on HTTP failure. */
async function loadLlmsFull(): Promise<string> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.text;
  }
  const response = await fetch(LLMS_FULL_URL, {
    headers: { 'User-Agent': 'BitBadges-Builder/1.0' }
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const text = await response.text();
  cache = { text, fetchedAt: Date.now() };
  return text;
}

/**
 * Score a section against a set of search terms. Counts raw term occurrences
 * and awards a bonus when a term appears in the section's header (first
 * line). Tokens appear in both the numerator and the header bonus so a
 * multi-word query like "address list" ranks sections with both tokens
 * higher than those with only one.
 */
function scoreSection(section: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const lower = section.toLowerCase();
  let score = 0;
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matches = lower.match(new RegExp(escaped, 'g'));
    if (matches) score += matches.length;
  }
  const headerMatch = section.match(/^#{1,3}\s+(.+)/);
  if (headerMatch) {
    const header = headerMatch[1].toLowerCase();
    for (const term of terms) {
      if (header.includes(term)) score += 5;
    }
  }
  return score;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.substring(0, max) + '\n...[truncated]';
}

/** Test hook — drop the cached llms-full.txt body. Not part of the public MCP surface. */
export function __resetFetchDocsCache(): void {
  cache = null;
}

export async function handleFetchDocs(input: FetchDocsInput): Promise<FetchDocsResult> {
  const { topic } = input;
  try {
    const text = await loadLlmsFull();
    const sections = text.split(/(?=^#{1,3}\s)/m);
    const terms = topic
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const scored = sections
      .map((section) => ({ section, score: scoreSection(section, terms) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SECTIONS);

    if (scored.length === 0) {
      return {
        success: false,
        topic,
        error: `No docs sections matched "${topic}". Try broader keywords, or visit ${LLMS_FULL_URL} directly.`
      };
    }

    const header = `# Search results for "${topic}" from docs.bitbadges.io\n\n`;
    const body = scored
      .map((s) => truncate(s.section.trim(), MAX_SECTION_CHARS))
      .join('\n\n---\n\n');

    return {
      success: true,
      topic,
      content: header + body,
      url: LLMS_FULL_URL
    };
  } catch (error) {
    return {
      success: false,
      topic,
      error: `Failed to fetch docs: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
