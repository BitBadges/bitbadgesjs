/**
 * HTTP client helper for BitBadges API requests.
 * Uses native fetch. Adds x-api-key header. Returns parsed JSON.
 */

export interface ApiRequestOptions {
  method: string;
  path: string;
  body?: any;
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Resolves the base URL for the API from flags/env/defaults.
 *
 * Priority:
 *  1. Explicit baseUrl argument (from --testnet / --local flags)
 *  2. BITBADGES_API_URL environment variable
 *  3. Default production URL
 */
export function resolveBaseUrl(options?: {
  testnet?: boolean;
  local?: boolean;
  baseUrl?: string;
}): string {
  if (options?.baseUrl) return options.baseUrl;
  if (options?.local) return 'http://localhost:3001/api/v0';
  if (options?.testnet) return 'https://api.testnet.bitbadges.io/api/v0';
  if (process.env.BITBADGES_API_URL) return process.env.BITBADGES_API_URL;
  return 'https://api.bitbadges.io/api/v0';
}

/**
 * Resolves the API key from flag or environment variable.
 */
export function resolveApiKey(explicit?: string): string {
  const key = explicit || process.env.BITBADGES_API_KEY;
  if (!key) {
    throw new Error(
      'No API key provided. Set BITBADGES_API_KEY env var or pass --api-key <key>.'
    );
  }
  return key;
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
