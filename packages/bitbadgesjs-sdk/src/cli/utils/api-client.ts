/**
 * HTTP client helper for BitBadges API requests.
 * Uses native fetch. Adds x-api-key header. Returns parsed JSON.
 */

import { assertNetworkAvailable } from '../../signing/types.js';
import {
  Network,
  extractSetCookies,
  pickSessionCookie,
  refreshSessionExpiry,
} from './auth-store.js';
import { getConfigApiKey, getConfigBaseUrl } from './config.js';

export interface ApiRequestOptions {
  method: string;
  path: string;
  body?: any;
  apiKey?: string;
  baseUrl?: string;
  /** Optional Cookie header value (e.g. "bitbadges=s%3A..."). Set via `auth login`. */
  cookie?: string;
  /**
   * Pointer back to the stored session so the rolled Set-Cookie expiry
   * (express-session is `rolling: true`) gets persisted to auth.json.
   * Leave undefined for non-session calls or one-shot cookie attaches.
   */
  cookieRef?: { network: Network; address: string };
}

/**
 * Resolves the base URL for the API from flags/env/config/defaults.
 *
 * Priority:
 *  1. Explicit --url flag
 *  2. --local flag
 *  3. --testnet flag
 *  4. BITBADGES_API_URL environment variable
 *  5. Config file (network / url)
 *  6. Default production URL
 */
export function resolveBaseUrl(options?: {
  testnet?: boolean;
  local?: boolean;
  baseUrl?: string;
}): string {
  if (options?.baseUrl) return options.baseUrl;
  if (options?.local) return 'http://localhost:3001/api/v0';
  if (options?.testnet) {
    // Fail fast if testnet is currently disabled. Override via env var.
    assertNetworkAvailable('testnet');
    return 'https://api.testnet.bitbadges.io/api/v0';
  }
  if (process.env.BITBADGES_API_URL) return process.env.BITBADGES_API_URL;
  const configUrl = getConfigBaseUrl();
  if (configUrl) return configUrl;
  return 'https://api.bitbadges.io/api/v0';
}

/**
 * Resolves the API key from flag, environment variable, or config file.
 *
 * Priority:
 *  1. Explicit --api-key flag
 *  2. Network-specific env var (BITBADGES_API_KEY_TESTNET / BITBADGES_API_KEY_LOCAL)
 *  3. Generic BITBADGES_API_KEY env var
 *  4. Network-specific config key (apiKeyTestnet / apiKeyLocal)
 *  5. Default config apiKey
 */
export function resolveApiKey(explicit?: string, network?: 'mainnet' | 'testnet' | 'local'): string {
  if (explicit) return explicit;

  // Network-specific env var
  if (network === 'testnet' && process.env.BITBADGES_API_KEY_TESTNET) {
    return process.env.BITBADGES_API_KEY_TESTNET;
  }
  if (network === 'local' && process.env.BITBADGES_API_KEY_LOCAL) {
    return process.env.BITBADGES_API_KEY_LOCAL;
  }

  // Generic env var
  if (process.env.BITBADGES_API_KEY) return process.env.BITBADGES_API_KEY;

  // Config file (network-aware)
  const configKey = getConfigApiKey(network);
  if (configKey) return configKey;

  throw new Error(
    'No API key. Pass --api-key, run `bb settings set apiKey <key>`, or see `bb settings --help` for env-var alternatives.'
  );
}

/**
 * Makes an HTTP request to the BitBadges API and returns parsed JSON.
 */
export async function apiRequest(options: ApiRequestOptions): Promise<any> {
  const { method, path, body, apiKey, baseUrl, cookie, cookieRef } = options;

  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'x-api-key': apiKey || '',
  };

  if (cookie) {
    headers['Cookie'] = cookie;
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: any) {
    // Network-level failures (DNS, connection refused, TLS) all surface as
    // a single `TypeError: fetch failed` via undici with no context. Re-throw
    // with the resolved URL embedded + a targeted hint so agents can tell
    // apart "wrong URL" / "indexer down" / "firewall" without re-reading the
    // source.
    const msg = err?.cause?.code
      ? `${err.message} (${err.cause.code})`
      : err?.message || String(err);
    const wrapped = new Error(`Network error reaching ${url}: ${msg}`);
    (wrapped as any).hint =
      'Could not reach the indexer. Check: (1) the URL is correct (--url / --local / --testnet), (2) the indexer is running, (3) network/firewall.';
    throw wrapped;
  }

  // Indexer runs express-session with rolling: true — every authenticated
  // response carries a fresh Set-Cookie that resets Max-Age to 7d. Capture
  // it back to auth.json so the local expiresAt tracks reality. The SID
  // itself is stable across rolls; only the expiry advances.
  if (cookieRef) {
    try {
      const rolled = pickSessionCookie(extractSetCookies(response.headers));
      if (rolled) refreshSessionExpiry(cookieRef.network, cookieRef.address, rolled.expiresAt);
    } catch {
      /* best-effort — never let a roll-write failure poison the response */
    }
  }

  const text = await response.text();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    // If the response is not JSON, wrap it
    parsed = { raw: text, status: response.status };
  }

  if (!response.ok) {
    const errorMessage =
      parsed?.errorMessage || parsed?.error || `HTTP ${response.status}`;
    const err = new Error(`API error: ${errorMessage}`);
    (err as any).status = response.status;
    (err as any).response = parsed;
    // Targeted hint:" — only on 401/403 (Full Access required) when the
    // caller didn't already attach a session cookie. Generic auth-failure
    // errors are 401/403 with no cookie attached → the agent skipped the
    // login step. Cookie attached but still 401 → session expired or
    // scoped wrong; re-login is the right next step either way.
    if (response.status === 401 || response.status === 403) {
      (err as any).hint = cookie
        ? 'Session may be expired or scoped wrong — run `bb auth login` again.'
        : 'This route requires user-scoped auth — run `bb auth login`, then retry with `--with-session`.';
    }
    if (response.status === 404 && /\/collection\//.test(path)) {
      // /collection/:id 404 is the most common indexer-lag symptom: a tx
      // committed on chain but the indexer hasn't surfaced the doc yet.
      // The catch-up window is usually <5s on local, <30s on mainnet/testnet.
      // (We don't know if the caller just deployed the collection vs.
      // looked up a never-existed ID, so we keep the hint conditional in
      // tone — "if you just deployed" rather than asserting lag.)
      (err as any).hint =
        'If this collection was just deployed, the indexer may not have caught up yet — retry in a few seconds. Otherwise the collection ID does not exist.';
    }
    throw err;
  }

  return parsed;
}
