/**
 * Tests for auth-store.ts — cookie parsing, session disk-store, pending
 * challenge expiry.
 *
 * Covers:
 *   - parseSetCookieLine / extractSetCookies / pickSessionCookie / formatCookieHeader[FromMany]
 *   - loadAuthStore / saveAuthStore round-trip
 *   - getSession / getActiveSession / setSession / removeSession
 *   - setActive
 *   - refreshSessionExpiry (never shortens)
 *   - setPendingChallenge / getPendingChallenge / clearPendingChallenge
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import {
  parseSetCookieLine,
  pickSessionCookie,
  formatCookieHeader,
  formatCookieHeaderFromMany,
  loadAuthStore,
  saveAuthStore,
  getSession,
  getActiveSession,
  setSession,
  removeSession,
  setActive,
  refreshSessionExpiry,
  setPendingChallenge,
  getPendingChallenge,
  clearPendingChallenge,
  listSessions,
  listAllSessions,
  type AuthSession,
  type ParsedCookie
} from './auth-store.js';

const ORIG_CFG_DIR = process.env.BITBADGES_CONFIG_DIR;

beforeEach(() => {
  const tmp = path.join(os.tmpdir(), `bb-authtest-${crypto.randomBytes(4).toString('hex')}`);
  fs.mkdirSync(tmp, { recursive: true });
  process.env.BITBADGES_CONFIG_DIR = tmp;
});

afterAll(() => {
  if (ORIG_CFG_DIR === undefined) delete process.env.BITBADGES_CONFIG_DIR;
  else process.env.BITBADGES_CONFIG_DIR = ORIG_CFG_DIR;
});

function makeSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    address: 'bb1one',
    nativeAddress: 'bb1one',
    chain: 'Cosmos',
    cookieName: 'bitbadges',
    cookieValue: 'sid-value',
    scopes: [{ scopeName: 'Full Access' }],
    createdAt: Date.now(),
    expiresAt: Date.now() + 60_000,
    indexerUrl: 'http://localhost:3001/api/v0',
    ...overrides
  };
}

// ── Cookie parsing ─────────────────────────────────────────────────────────

describe('parseSetCookieLine', () => {
  it('parses name=value with no attributes', () => {
    const c = parseSetCookieLine('bitbadges=abc')!;
    expect(c.name).toBe('bitbadges');
    expect(c.value).toBe('abc');
    expect(c.expiresAt).toBeGreaterThan(Date.now());
  });

  it('honors Max-Age', () => {
    const before = Date.now();
    const c = parseSetCookieLine('bitbadges=abc; Max-Age=120; HttpOnly')!;
    expect(c.expiresAt).toBeGreaterThanOrEqual(before + 119_000);
    expect(c.expiresAt).toBeLessThanOrEqual(Date.now() + 121_000);
  });

  it('honors Expires when Max-Age is absent', () => {
    const c = parseSetCookieLine('bitbadges=abc; Expires=Tue, 01 Jan 2030 00:00:00 GMT')!;
    expect(c.expiresAt).toBe(Date.parse('Tue, 01 Jan 2030 00:00:00 GMT'));
  });

  it('returns null on malformed input', () => {
    expect(parseSetCookieLine('no-equals-here')).toBeNull();
  });
});

describe('pickSessionCookie', () => {
  it('picks the bitbadges* cookie, ignoring sibling cookies', () => {
    const cookies: ParsedCookie[] = [
      { name: 'BITBADGES_ROUTE', value: 'lb1', expiresAt: 0 },
      { name: 'bitbadges-testnet', value: 'sid', expiresAt: 0 }
    ];
    expect(pickSessionCookie(cookies)?.name).toBe('bitbadges-testnet');
  });

  it('returns null when no bitbadges* cookie is present', () => {
    expect(pickSessionCookie([{ name: 'OTHER', value: 'x', expiresAt: 0 }])).toBeNull();
  });
});

describe('formatCookieHeader[FromMany]', () => {
  it('renders a single session as name=value', () => {
    expect(formatCookieHeader(makeSession({ cookieName: 'bitbadges', cookieValue: 'v' }))).toBe('bitbadges=v');
  });

  it('joins many cookies with "; "', () => {
    const cookies: ParsedCookie[] = [
      { name: 'a', value: '1', expiresAt: 0 },
      { name: 'b', value: '2', expiresAt: 0 }
    ];
    expect(formatCookieHeaderFromMany(cookies)).toBe('a=1; b=2');
  });
});

// ── Session disk-store ─────────────────────────────────────────────────────

describe('loadAuthStore', () => {
  it('returns the empty shape when no file exists', () => {
    expect(loadAuthStore()).toEqual({ version: 1, networks: {} });
  });

  it('round-trips a saved store', () => {
    const s = makeSession();
    setSession('local', s);
    const reloaded = loadAuthStore();
    expect(reloaded.networks.local?.sessions[s.address]).toEqual(s);
  });

  it('throws on unsupported version', () => {
    saveAuthStore({ version: 2 as any, networks: {} });
    expect(() => loadAuthStore()).toThrow(/Unsupported auth.json version/);
  });
});

describe('setSession / getSession / removeSession', () => {
  it('stores + retrieves by address', () => {
    const s = makeSession({ address: 'bb1x' });
    setSession('local', s);
    expect(getSession('local', 'bb1x')).toEqual(s);
  });

  it('first stored session auto-becomes active', () => {
    setSession('local', makeSession({ address: 'bb1a' }));
    expect(getActiveSession('local')?.address).toBe('bb1a');
  });

  it('second stored session does NOT silently steal active', () => {
    setSession('local', makeSession({ address: 'bb1a' }));
    setSession('local', makeSession({ address: 'bb1b' }));
    expect(getActiveSession('local')?.address).toBe('bb1a');
  });

  it('removeSession clears the active pointer if it was active', () => {
    setSession('local', makeSession({ address: 'bb1a' }));
    removeSession('local', 'bb1a');
    expect(getActiveSession('local')).toBeUndefined();
  });
});

describe('setActive', () => {
  it('switches the active address', () => {
    setSession('local', makeSession({ address: 'bb1a' }));
    setSession('local', makeSession({ address: 'bb1b' }));
    setActive('local', 'bb1b');
    expect(getActiveSession('local')?.address).toBe('bb1b');
  });
});

describe('refreshSessionExpiry', () => {
  it('extends the expiry forward', () => {
    const initial = Date.now() + 60_000;
    setSession('local', makeSession({ address: 'bb1a', expiresAt: initial }));
    refreshSessionExpiry('local', 'bb1a', initial + 120_000);
    expect(getSession('local', 'bb1a')?.expiresAt).toBe(initial + 120_000);
  });

  it('NEVER shortens (out-of-order rolls drop)', () => {
    const initial = Date.now() + 120_000;
    setSession('local', makeSession({ address: 'bb1a', expiresAt: initial }));
    refreshSessionExpiry('local', 'bb1a', initial - 60_000);
    expect(getSession('local', 'bb1a')?.expiresAt).toBe(initial);
  });

  it('no-ops when the session is gone', () => {
    expect(() => refreshSessionExpiry('local', 'bb1missing', Date.now())).not.toThrow();
  });
});

describe('listSessions / listAllSessions', () => {
  it('listSessions returns only the requested network', () => {
    setSession('local', makeSession({ address: 'bb1a' }));
    setSession('local', makeSession({ address: 'bb1b' }));
    setSession('mainnet', makeSession({ address: 'bb1m' }));
    expect(listSessions('local').map((s) => s.address).sort()).toEqual(['bb1a', 'bb1b']);
  });

  it('listAllSessions returns every {network, session} pair', () => {
    setSession('local', makeSession({ address: 'bb1a' }));
    setSession('mainnet', makeSession({ address: 'bb1m' }));
    const all = listAllSessions();
    expect(all.map((p) => p.network).sort()).toEqual(['local', 'mainnet']);
  });
});

// ── Pending challenge ──────────────────────────────────────────────────────

describe('setPendingChallenge / getPendingChallenge / clearPendingChallenge', () => {
  it('round-trips a challenge', () => {
    setPendingChallenge('local', 'bb1a', 'msg', [], 'http://localhost');
    const p = getPendingChallenge('local', 'bb1a');
    expect(p?.message).toBe('msg');
    expect(p?.indexerUrl).toBe('http://localhost');
  });

  it('returns undefined for expired challenges (and clears them)', () => {
    setPendingChallenge('local', 'bb1a', 'msg', [], 'http://localhost');
    // Hand-edit the persisted expiry to the past.
    const store = loadAuthStore();
    store.networks.local!.pending!['bb1a'].expiresAt = Date.now() - 1;
    saveAuthStore(store);
    expect(getPendingChallenge('local', 'bb1a')).toBeUndefined();
    // Subsequent fetch: still gone (cleared on read).
    expect(getPendingChallenge('local', 'bb1a')).toBeUndefined();
  });

  it('clearPendingChallenge removes the entry', () => {
    setPendingChallenge('local', 'bb1a', 'msg', [], 'http://localhost');
    clearPendingChallenge('local', 'bb1a');
    expect(getPendingChallenge('local', 'bb1a')).toBeUndefined();
  });
});
