/**
 * Prebuilt community-skills fetcher that hits the public BitBadges
 * /api/v0/builder/community-skills endpoint.
 *
 * Power-user path — consumers who know skill IDs (e.g. from a Discord
 * share, a URL, or an internal registry) can wire this in and get the
 * same community skill injection the hosted flow uses. No discovery
 * UI ships; users bring their own IDs.
 *
 * The endpoint is API-key gated (x-api-key header). If no key is
 * configured, the fetcher returns an empty array — the agent then
 * behaves identically to the no-community-skills path.
 */

import type { CommunitySkillsFetcher } from './types.js';

export interface BitBadgesCommunitySkillsFetcherOptions {
  /** BitBadges API key. Falls back to `BITBADGES_API_KEY` env. */
  apiKey?: string;
  /** BitBadges API base URL. Falls back to `BITBADGES_API_URL` env, then production. */
  apiUrl?: string;
  /** Override the underlying `fetch` (useful for testing, proxies, edge runtimes). */
  fetchFn?: typeof fetch;
  /** Request timeout in ms. Default: 5000. */
  timeoutMs?: number;
}

interface CommunitySkillsApiResponse {
  success?: boolean;
  skills?: Array<{ name?: string; promptText?: string }>;
  error?: string;
}

const DEFAULT_API_URL = 'https://api.bitbadges.io';
const DEFAULT_TIMEOUT_MS = 5000;

/** Is this URL pointing at a local dev server? Used to relax the
 *  API-key requirement when developers are iterating against a local
 *  indexer (no key required in dev — mirrors the auth-bypass the
 *  indexer already applies to its own routes). */
function isLocalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '0.0.0.0' || u.hostname.endsWith('.localhost');
  } catch {
    return false;
  }
}

/**
 * Construct a `CommunitySkillsFetcher` that resolves promptSkillIds
 * against the BitBadges API (public or localhost).
 */
export function createBitBadgesCommunitySkillsFetcher(
  options: BitBadgesCommunitySkillsFetcherOptions = {}
): CommunitySkillsFetcher {
  const resolvedApiKey =
    options.apiKey ?? (typeof process !== 'undefined' ? process.env.BITBADGES_API_KEY : undefined);
  const resolvedApiUrl =
    options.apiUrl ??
    (typeof process !== 'undefined' ? process.env.BITBADGES_API_URL : undefined) ??
    DEFAULT_API_URL;
  const fetchImpl = options.fetchFn ?? (typeof fetch !== 'undefined' ? fetch : undefined);
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const localMode = isLocalUrl(resolvedApiUrl);

  return async function fetchCommunitySkills(
    promptSkillIds: string[],
    _creatorAddress: string
  ): Promise<Array<{ name: string; promptText: string }>> {
    if (!promptSkillIds || promptSkillIds.length === 0) return [];
    if (!resolvedApiKey && !localMode) {
      // No key + production URL — silently return nothing. Agent still
      // runs; users just miss the community-skill injection. Local dev
      // mode skips the key requirement since local indexers don't gate
      // their own routes for developer convenience.
      return [];
    }
    if (!fetchImpl) {
      // Node < 18 without node-fetch polyfill. Don't crash; return empty.
      return [];
    }

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `${resolvedApiUrl.replace(/\/$/, '')}/api/v0/builder/community-skills?ids=${encodeURIComponent(promptSkillIds.join(','))}`;
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (resolvedApiKey) headers['x-api-key'] = resolvedApiKey;
      const response = await fetchImpl(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });
      if (!response.ok) return [];
      const body = (await response.json()) as CommunitySkillsApiResponse;
      if (!body?.skills) return [];
      return body.skills
        .filter((s): s is { name: string; promptText: string } => !!(s && s.name && s.promptText))
        .map((s) => ({ name: s.name, promptText: s.promptText }));
    } catch {
      // Network errors, timeouts, parse errors — all treated as
      // "community skills not available right now." The build proceeds
      // with only the built-in skill instructions.
      return [];
    } finally {
      clearTimeout(timeoutHandle);
    }
  };
}
