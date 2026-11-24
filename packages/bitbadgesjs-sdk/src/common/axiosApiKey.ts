import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/** Placeholder written over API key header values on axios errors. */
export const REDACTED_API_KEY = '[REDACTED]';

const API_KEY_HEADER = 'x-api-key';
const SENSITIVE_HEADERS = [API_KEY_HEADER, 'authorization', 'cookie', 'set-cookie', 'proxy-authorization'];
const NESTED_HEADER_GROUPS = ['common', 'get', 'post', 'put', 'patch', 'delete', 'head', 'options'];
const RAW_HEADER_LINE = /^(x-api-key|authorization|cookie|set-cookie|proxy-authorization)\s*:\s*\S[^\n]*/gim;
const ABSOLUTE_URL = /^([a-z][a-z\d+\-.]*:)?\/\//i;
const TO_JSON_MARK = Symbol('bbRedactedToJSON');

export interface ScopedApiKeyOptions {
  /** Configured BitBadges API key. Omitted when the caller has none. */
  apiKey?: string;
  /** API base URL whose host is allowed to receive `apiKey`. */
  apiBaseUrl: string;
}

/**
 * Combine a request URL with baseURL the same way axios does: absolute URLs
 * (including protocol-relative URLs) win, otherwise the base is joined.
 */
export function resolveRequestUrl(url: unknown, baseURL?: unknown): URL | undefined {
  const requestUrl = typeof url === 'string' ? url : '';
  const base = typeof baseURL === 'string' ? baseURL : undefined;
  let full = requestUrl;

  if (!requestUrl) {
    full = base ?? '';
  } else if (ABSOLUTE_URL.test(requestUrl)) {
    if (requestUrl.startsWith('//')) {
      const protocol = base?.match(/^[a-z][a-z\d+\-.]*:/i)?.[0] ?? 'https:';
      full = protocol + requestUrl;
    }
  } else if (base) {
    const trimmedBase = base.replace(/\/+$/, '');
    const relative = requestUrl.replace(/^\/+/, '');
    full = relative ? `${trimmedBase}/${relative}` : trimmedBase;
  }

  if (!full) return undefined;
  try {
    return new URL(full);
  } catch {
    return undefined;
  }
}

/** Origin key with default ports folded in, so `:443` matches an omitted HTTPS port. */
function originKey(url: URL): string {
  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const port = url.port || (url.protocol === 'https:' ? '443' : url.protocol === 'http:' ? '80' : '');
  return `${url.protocol}//${hostname}:${port}`;
}

export function requestTargetsApiHost(config: { url?: unknown; baseURL?: unknown }, apiBaseUrl: string): boolean {
  let api: URL;
  try {
    api = new URL(apiBaseUrl);
  } catch {
    return false;
  }
  const target = resolveRequestUrl(config.url, config.baseURL);
  if (!target) return false;
  return originKey(api) === originKey(target);
}

function usableSecrets(secrets: readonly string[] | undefined): string[] {
  // Header names are always cleared. Substring replacement is only safe for
  // real key material; a very short value would be rewritten inside unrelated text.
  return (secrets ?? []).filter((secret) => typeof secret === 'string' && secret.length >= 8);
}

function scrubText(value: string, secrets: readonly string[]): string {
  let out = value.replace(RAW_HEADER_LINE, (line) => {
    const separator = line.indexOf(':');
    const name = separator === -1 ? line : line.slice(0, separator);
    return `${name}: ${REDACTED_API_KEY}`;
  });
  for (const secret of secrets) {
    if (out.includes(secret)) out = out.split(secret).join(REDACTED_API_KEY);
  }
  return out;
}

function redactHeaderBag(headers: any, secrets: readonly string[], seen: WeakSet<object>): void {
  if (!headers || typeof headers !== 'object') return;
  if (seen.has(headers)) return;
  seen.add(headers);

  if (typeof headers.set === 'function' && typeof headers.has === 'function') {
    for (const name of SENSITIVE_HEADERS) {
      try {
        if (headers.has(name)) headers.set(name, REDACTED_API_KEY, true);
      } catch {
        // Fall through to the property walk for plain objects and locked bags.
      }
    }
  }

  for (const key of Object.keys(headers)) {
    let value: any;
    try {
      value = headers[key];
    } catch {
      continue;
    }
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      try {
        headers[key] = Array.isArray(value) ? value.map(() => REDACTED_API_KEY) : REDACTED_API_KEY;
      } catch {
        // ignore non-writable header slots
      }
      continue;
    }
    if (typeof value === 'string') {
      const next = scrubText(value, secrets);
      if (next !== value) {
        try {
          headers[key] = next;
        } catch {
          // ignore non-writable header slots
        }
      }
      continue;
    }
    if (value && typeof value === 'object' && (NESTED_HEADER_GROUPS.includes(key) || Array.isArray(value))) {
      redactHeaderBag(value, secrets, seen);
    }
  }
}

function shallowStringScrub(node: any, secrets: readonly string[]): void {
  for (const key of Object.getOwnPropertyNames(node)) {
    if (key === 'constructor') continue;
    let value: any;
    try {
      value = node[key];
    } catch {
      continue;
    }
    if (typeof value !== 'string') continue;
    const next = scrubText(value, secrets);
    if (next === value) continue;
    try {
      node[key] = next;
    } catch {
      // ignore non-writable fields such as a sealed request socket
    }
  }
}

const SHALLOW_TYPES = new Set(['ClientRequest', 'IncomingMessage', 'Socket', 'TLSSocket', 'Agent', 'Request', 'Response']);

function redactNode(node: any, secrets: readonly string[], seen: WeakSet<object>, depth: number): void {
  if (!node || typeof node !== 'object' || depth > 8) return;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(node)) return;
  if (node instanceof ArrayBuffer) return;
  if (seen.has(node)) return;
  seen.add(node);

  const typeName = node.constructor?.name;
  if (typeName && SHALLOW_TYPES.has(typeName)) {
    shallowStringScrub(node, secrets);
    return;
  }

  redactHeaderBag(node.headers, secrets, seen);

  const names = Object.getOwnPropertyNames(node);
  for (const key of names) {
    if (key === 'constructor' || key === 'headers') continue;
    let value: any;
    try {
      value = node[key];
    } catch {
      continue;
    }
    if (typeof value === 'string') {
      const next = scrubText(value, secrets);
      if (next !== value) {
        try {
          node[key] = next;
        } catch {
          // ignore non-writable fields
        }
      }
      continue;
    }
    if (value && typeof value === 'object') redactNode(value, secrets, seen, depth + 1);
  }
}

function wrapToJSON(error: any, secrets: readonly string[]): void {
  const current = error.toJSON;
  if (typeof current !== 'function' || (current as any)[TO_JSON_MARK]) return;
  const wrapped = function redactedToJSON(this: any) {
    redactErrorHeaders(this, secrets);
    const snapshot = current.call(this);
    if (snapshot && typeof snapshot === 'object') {
      const seen = new WeakSet<object>();
      redactNode(snapshot, secrets, seen, 0);
    }
    return snapshot;
  };
  (wrapped as any)[TO_JSON_MARK] = true;
  try {
    error.toJSON = wrapped;
  } catch {
    // ignore non-writable toJSON
  }
}

/**
 * Redacts API key and other credential headers on an axios-style error in place,
 * including config headers, request header text, response config, and `toJSON`.
 */
export function redactErrorHeaders(error: any, secrets?: readonly string[]): void {
  if (!error || typeof error !== 'object') return;
  try {
    const secretList = usableSecrets(secrets);
    const seen = new WeakSet<object>();
    redactNode(error, secretList, seen, 0);
    wrapToJSON(error, secretList);
  } catch {
    // Redaction must not replace the original failure.
  }
}

function removeApiKeyHeader(headers: any): void {
  if (!headers || typeof headers !== 'object') return;
  if (typeof headers.delete === 'function') {
    try {
      headers.delete(API_KEY_HEADER);
    } catch {
      // continue with property deletion
    }
  }
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === API_KEY_HEADER) {
      try {
        delete headers[key];
      } catch {
        // ignore non-configurable slots
      }
      continue;
    }
    const value = headers[key];
    if (value && typeof value === 'object' && NESTED_HEADER_GROUPS.includes(key)) {
      removeApiKeyHeader(value);
    }
  }
}

function ensureApiKeyHeader(headers: any, apiKey: string): void {
  if (!headers) return;
  if (typeof headers.set === 'function') {
    const current = typeof headers.get === 'function' ? headers.get(API_KEY_HEADER) : headers[API_KEY_HEADER];
    if (current == null || current === '' || current === false) {
      headers.set(API_KEY_HEADER, apiKey, true);
    }
    return;
  }
  if (headers[API_KEY_HEADER] == null || headers[API_KEY_HEADER] === '') {
    headers[API_KEY_HEADER] = apiKey;
  }
}

/**
 * Sends `x-api-key` only when the resolved request host matches `apiBaseUrl`.
 * Other hosts (LCD, RPC, custom nodes) have the header removed. Errors from
 * this instance are redacted before they propagate.
 */
export function attachScopedApiKey(instance: AxiosInstance, options: ScopedApiKeyOptions): void {
  const apiKey = options.apiKey;
  const secrets = apiKey ? [apiKey] : [];

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const headers = config.headers;
    if (requestTargetsApiHost(config, options.apiBaseUrl)) {
      if (apiKey) ensureApiKeyHeader(headers, apiKey);
    } else {
      removeApiKeyHeader(headers);
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: any) => {
      redactErrorHeaders(error, secrets);
      return Promise.reject(error);
    }
  );
}
