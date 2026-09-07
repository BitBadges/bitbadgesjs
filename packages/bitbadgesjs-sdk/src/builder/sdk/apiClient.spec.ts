/**
 * A local indexer serves every read/simulate route without an API key. Demanding
 * one anyway made local development impossible for both the CLI and the MCP
 * query tools, and the error text pointed at a local flag that did not help —
 * a loop an agent cannot break out of.
 */
import { isLocalApiUrl } from './apiClient.js';

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
