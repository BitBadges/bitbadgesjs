/**
 * HTTP client helper for BitBadges API requests.
 * Uses native fetch. Adds x-api-key header. Returns parsed JSON.
 */

import { assertNetworkAvailable } from '../../signing/types.js';
import { getConfigApiKey, getConfigBaseUrl } from './config.js';

export interface ApiRequestOptions {
  method: string;
  path: string;
  body?: any;
  apiKey?: string;
  baseUrl?: string;
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
    'No API key provided. Set BITBADGES_API_KEY env var, pass --api-key <key>, or run `bitbadges-cli config set apiKey <key>`.'
  );
}

/**
 * Makes an HTTP request to the BitBadges API and returns parsed JSON.
 */
export async function apiRequest(options: ApiRequestOptions): Promise<any> {
  const { method, path, body, apiKey, baseUrl } = options;

  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'x-api-key': apiKey || '',
  };

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

  const response = await fetch(url, fetchOptions);

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
    throw err;
  }

  return parsed;
}
