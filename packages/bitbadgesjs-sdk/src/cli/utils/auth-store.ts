/**
 * Storage for BitBadges CLI auth sessions, keyed by network +
 * address. Sister file to config.ts; lives at ~/.bitbadges/auth.json
 * with mode 0600 since it holds replayable session cookies.
 *
 * Multi-network: testnet/mainnet/local cookies are independent (same
 * address may exist on each as a separate session). Each network has
 * its own `active` pointer so subsequent `--with-session` flags know
 * which cookie to attach.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type Network = 'mainnet' | 'testnet' | 'local';

export interface AuthSession {
  /** Bech32 address (bb1... — canonical BitBadges address). */
  address: string;
  /** Native chain address (eth = 0x..., cosmos = bb1...). May equal `address`. */
  nativeAddress: string;
  /** SupportedChain enum value: 'Cosmos' | 'ETH'. */
  chain: 'Cosmos' | 'ETH';
  /** Session cookie name (varies by env: bitbadges / bitbadges-testnet / ...). */
  cookieName: string;
  /** Session cookie value (the part after `name=`, before `;`). */
  cookieValue: string;
  /** Scopes attached to the session. v1 always Full Access. */
  scopes: { scopeName: string }[];
  /** Unix ms timestamp at session mint. */
  createdAt: number;
  /** Unix ms timestamp at expiry (parsed from cookie Max-Age/Expires; falls back to +7d). */
  expiresAt: number;
  /** Unix ms timestamp of last successful `auth status` revalidation. */
  lastVerifiedAt?: number;
  /** Indexer base URL the cookie was issued against. */
  indexerUrl: string;
}

export interface PendingChallenge {
  /** The Blockin challenge message the user must sign. */
  message: string;
  /**
   * All cookies set by /auth/getChallenge — the session cookie carrying
   * the nonce + any LB sticky cookies. MUST be replayed verbatim on
   * /auth/verify or the indexer rejects with "No sign-in request found".
   */
  cookies: ParsedCookie[];
  /** Unix ms when this pending challenge expires (5 min TTL by default). */
  expiresAt: number;
  /** Indexer base URL the challenge was issued by. */
  indexerUrl: string;
}

interface NetworkStore {
  active?: string;
  sessions: Record<string, AuthSession>;
  /** Address → in-flight challenge waiting for an external signature. */
  pending?: Record<string, PendingChallenge>;
}

interface AuthFile {
  version: 1;
  networks: Partial<Record<Network, NetworkStore>>;
}

const AUTH_DIR = path.join(os.homedir(), '.bitbadges');
const AUTH_PATH = path.join(AUTH_DIR, 'auth.json');

export function getAuthPath(): string {
  return AUTH_PATH;
}

/**
 * Loads ~/.bitbadges/auth.json. Returns the empty shape if missing.
 * Throws on parse error so partial corruption never silently wipes
 * stored credentials. Auto-chmods to 0600 if found with looser perms.
 */
export function loadAuthStore(): AuthFile {
  if (!fs.existsSync(AUTH_PATH)) {
    return { version: 1, networks: {} };
  }
  enforceFileMode(AUTH_PATH);
  const raw = fs.readFileSync(AUTH_PATH, 'utf-8');
  const parsed = JSON.parse(raw) as AuthFile;
  if (parsed.version !== 1) {
    throw new Error(`Unsupported auth.json version ${parsed.version} at ${AUTH_PATH}`);
  }
  if (!parsed.networks) parsed.networks = {};
  return parsed;
}

export function saveAuthStore(store: AuthFile): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(AUTH_PATH, JSON.stringify(store, null, 2) + '\n', { encoding: 'utf-8', mode: 0o600 });
  enforceFileMode(AUTH_PATH);
}

function enforceFileMode(p: string): void {
  if (process.platform === 'win32') return;
  try {
    const stat = fs.statSync(p);
    const mode = stat.mode & 0o777;
    if (mode !== 0o600) {
      fs.chmodSync(p, 0o600);
    }
  } catch {
    /* best-effort */
  }
}

function ensureNetwork(store: AuthFile, network: Network): NetworkStore {
  let n = store.networks[network];
  if (!n) {
    n = { sessions: {} };
    store.networks[network] = n;
  }
  return n;
}

export function getSession(network: Network, address: string): AuthSession | undefined {
  const store = loadAuthStore();
  return store.networks[network]?.sessions[address];
}

export function getActiveSession(network: Network): AuthSession | undefined {
  const store = loadAuthStore();
  const n = store.networks[network];
  if (!n?.active) return undefined;
  return n.sessions[n.active];
}

export function setSession(network: Network, session: AuthSession): void {
  const store = loadAuthStore();
  const n = ensureNetwork(store, network);
  n.sessions[session.address] = session;
  if (!n.active) n.active = session.address;
  saveAuthStore(store);
}

export function removeSession(network: Network, address: string): void {
  const store = loadAuthStore();
  const n = store.networks[network];
  if (!n) return;
  delete n.sessions[address];
  if (n.active === address) n.active = undefined;
  saveAuthStore(store);
}

export function setActive(network: Network, address: string): void {
  const store = loadAuthStore();
  const n = ensureNetwork(store, network);
  if (!n.sessions[address]) {
    throw new Error(`No session stored for ${address} on ${network}; run \`bitbadges-cli auth login\` first.`);
  }
  n.active = address;
  saveAuthStore(store);
}

export function listSessions(network: Network): AuthSession[] {
  const store = loadAuthStore();
  return Object.values(store.networks[network]?.sessions ?? {});
}

export function listAllSessions(): { network: Network; session: AuthSession }[] {
  const store = loadAuthStore();
  const out: { network: Network; session: AuthSession }[] = [];
  (Object.keys(store.networks) as Network[]).forEach((network) => {
    const n = store.networks[network];
    if (!n) return;
    Object.values(n.sessions).forEach((session) => out.push({ network, session }));
  });
  return out;
}

/**
 * Format a stored session as a Cookie header value: `name=value`.
 * Express-session is happy without the surrounding attributes.
 */
export function formatCookieHeader(session: AuthSession): string {
  return `${session.cookieName}=${session.cookieValue}`;
}

const PENDING_TTL_MS = 5 * 60 * 1000;

export function setPendingChallenge(
  network: Network,
  address: string,
  message: string,
  cookies: ParsedCookie[],
  indexerUrl: string,
): PendingChallenge {
  const store = loadAuthStore();
  const n = ensureNetwork(store, network);
  if (!n.pending) n.pending = {};
  const pending: PendingChallenge = {
    message,
    cookies,
    expiresAt: Date.now() + PENDING_TTL_MS,
    indexerUrl,
  };
  n.pending[address] = pending;
  saveAuthStore(store);
  return pending;
}

export function getPendingChallenge(network: Network, address: string): PendingChallenge | undefined {
  const store = loadAuthStore();
  const p = store.networks[network]?.pending?.[address];
  if (!p) return undefined;
  if (Date.now() > p.expiresAt) {
    clearPendingChallenge(network, address);
    return undefined;
  }
  return p;
}

export function clearPendingChallenge(network: Network, address: string): void {
  const store = loadAuthStore();
  const n = store.networks[network];
  if (!n?.pending) return;
  delete n.pending[address];
  saveAuthStore(store);
}

export interface ParsedCookie {
  name: string;
  value: string;
  expiresAt: number;
}

/**
 * Parse a single Set-Cookie line into name/value/expiry. Returns null
 * if malformed.
 */
export function parseSetCookieLine(line: string): ParsedCookie | null {
  const [pair, ...attrs] = line.split(';').map((s) => s.trim());
  const eq = pair.indexOf('=');
  if (eq < 0) return null;
  const name = pair.slice(0, eq);
  const value = pair.slice(eq + 1);

  let expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  for (const attr of attrs) {
    const [k, v] = attr.split('=').map((s) => s.trim());
    const lower = k.toLowerCase();
    if (lower === 'max-age' && v) {
      const seconds = parseInt(v, 10);
      if (!Number.isNaN(seconds)) expiresAt = Date.now() + seconds * 1000;
    } else if (lower === 'expires' && v) {
      const ts = Date.parse(v);
      if (!Number.isNaN(ts)) expiresAt = ts;
    }
  }
  return { name, value, expiresAt };
}

/**
 * Pull ALL Set-Cookie values out of a fetch Response's headers.
 * Uses Headers.getSetCookie() (Node 19.7+) which preserves them as
 * separate entries; the older Headers.get('set-cookie') joins them
 * with `, ` and is lossy when cookie attributes contain commas (e.g.
 * Expires=Tue, 05-May-26 ...). Always prefer this helper.
 */
export function extractSetCookies(headers: Headers): ParsedCookie[] {
  const raw: string[] =
    typeof (headers as any).getSetCookie === 'function' ? (headers as any).getSetCookie() : [];
  if (!raw.length) {
    // Fallback: pre-19.7 Node. Best-effort split — may misparse cookies whose
    // Expires attribute contains a comma. Worth surfacing.
    const single = headers.get('set-cookie');
    if (!single) return [];
    return single
      .split(/,(?=\s*[A-Za-z0-9_\-]+=)/) // split on `,name=` boundaries only
      .map((s) => parseSetCookieLine(s.trim()))
      .filter((c): c is ParsedCookie => c !== null);
  }
  return raw.map(parseSetCookieLine).filter((c): c is ParsedCookie => c !== null);
}

/**
 * Pick the express-session cookie out of a Set-Cookie array. Indexer
 * uses `bitbadges`, `bitbadges-testnet`, `bitbadges-stagenet`, or
 * `bitbadges-dev` depending on env. Sibling cookies like
 * `BITBADGES_ROUTE` (load-balancer stickiness) are ignored here.
 */
export function pickSessionCookie(cookies: ParsedCookie[]): ParsedCookie | null {
  return cookies.find((c) => c.name.toLowerCase().startsWith('bitbadges') && c.name.toUpperCase() !== 'BITBADGES_ROUTE') ?? null;
}

/**
 * Render a Cookie header value from multiple parsed cookies, e.g.
 * `BITBADGES_ROUTE=...; bitbadges=s%3A...`. Order matters for some
 * load balancers — preserve input order.
 */
export function formatCookieHeaderFromMany(cookies: ParsedCookie[]): string {
  return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}
