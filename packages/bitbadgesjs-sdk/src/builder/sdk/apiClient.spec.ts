/**
 * A local indexer serves every read/simulate route without an API key. Demanding
 * one anyway made local development impossible for both the CLI and the MCP
 * query tools, and the error text pointed at a local flag that did not help —
 * a loop an agent cannot break out of.
 */
import { getBalance, isLocalApiUrl, search } from './apiClient.js';

describe('isLocalApiUrl', () => {
  it('recognises the local indexer', () => {
    expect(isLocalApiUrl('http://localhost:3001')).toBe(true);
    expect(isLocalApiUrl('http://127.0.0.1:3001')).toBe(true);
    expect(isLocalApiUrl('http://[::1]:3001')).toBe(true);
    expect(isLocalApiUrl('http://localhost:3001/api/v0')).toBe(true);
  });

  it('does not treat hosted BitBadges as local', () => {
    expect(isLocalApiUrl('https://api.bitbadges.io')).toBe(false);
    expect(isLocalApiUrl('https://api.bitbadges.io/testnet')).toBe(false);
    expect(isLocalApiUrl(undefined)).toBe(false);
    expect(isLocalApiUrl('')).toBe(false);
  });

  it('is not fooled by a hostname that merely contains localhost', () => {
    expect(isLocalApiUrl('https://localhost.evil.com')).toBe(false);
    expect(isLocalApiUrl('https://notlocalhost:3001')).toBe(false);
  });
});

describe('search', () => {
  const originalFetch = global.fetch;
  let calls: Array<{ url: string; init: any }> = [];

  beforeEach(() => {
    calls = [];
    (global as any).fetch = jest.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({ collections: [] }),
        text: async () => ''
      };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('POSTs to /api/v0/search/:searchValue, the indexer route', async () => {
    const res = await search({ searchValue: 'BitBadges' }, { apiKey: 'test-key', apiUrl: 'https://api.bitbadges.io' });

    expect(res.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.bitbadges.io/api/v0/search/BitBadges');
    expect(calls[0].init.method).toBe('POST');
  });
});

describe('getBalance', () => {
  const originalFetch = global.fetch;
  let calls: Array<{ url: string; init: any }> = [];
  const doc = { balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [] }], collectionId: '1' };

  beforeEach(() => {
    calls = [];
    (global as any).fetch = jest.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      return { ok: true, status: 200, json: async () => doc, text: async () => JSON.stringify(doc) };
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('GETs /api/v0/collection/:id/balance/:address and wraps the doc as { balance }', async () => {
    const res = await getBalance('1', 'bb1abc', { apiKey: 'test-key', apiUrl: 'https://api.bitbadges.io' });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.bitbadges.io/api/v0/collection/1/balance/bb1abc');
    expect(calls[0].init.method).toBe('GET');
    expect(res.success).toBe(true);
    expect(res.data?.balance.balances[0].amount).toBe('1');
  });
});
