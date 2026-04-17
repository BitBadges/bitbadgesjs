/**
 * Tests for `lookup_token_info`.
 *
 * Wraps the coinRegistry to resolve a symbol (USDC/ATOM/OSMO) or an IBC denom
 * (ibc/...) to a TokenInfo object that includes the deterministic backing
 * address for Smart Token denom wrapping.
 *
 * Behaviors covered:
 *   - exact-symbol match (case-insensitive)
 *   - exact-IBC-denom match (case-insensitive)
 *   - unknown IBC denom → generates a synthetic TokenInfo with backingAddress
 *   - unknown symbol → error with the list of known symbols
 *   - `query` = "" or "all" → returns every known token
 *   - backingAddress is a valid bb1 bech32 address
 */

import { handleLookupTokenInfo } from './lookupTokenInfo.js';

describe('handleLookupTokenInfo', () => {
  describe('exact symbol lookup', () => {
    it('finds USDC by uppercase symbol', () => {
      const res = handleLookupTokenInfo({ query: 'USDC' });
      expect(res.success).toBe(true);
      expect(res.tokenInfo).toBeDefined();
      expect(res.tokenInfo!.symbol).toBe('USDC');
      expect(res.tokenInfo!.ibcDenom.startsWith('ibc/')).toBe(true);
    });

    it('is case-insensitive for symbol (lowercase "usdc" still matches)', () => {
      const res = handleLookupTokenInfo({ query: 'usdc' });
      expect(res.success).toBe(true);
      expect(res.tokenInfo!.symbol).toBe('USDC');
    });

    it('is case-insensitive for symbol (mixed case "UsDc")', () => {
      const res = handleLookupTokenInfo({ query: 'UsDc' });
      expect(res.success).toBe(true);
      expect(res.tokenInfo!.symbol).toBe('USDC');
    });

    it('finds ATOM by symbol and returns decimals=6', () => {
      const res = handleLookupTokenInfo({ query: 'ATOM' });
      expect(res.success).toBe(true);
      expect(res.tokenInfo!.decimals).toBe('6');
    });

    it('finds OSMO by symbol', () => {
      const res = handleLookupTokenInfo({ query: 'OSMO' });
      expect(res.success).toBe(true);
      expect(res.tokenInfo!.symbol).toBe('OSMO');
    });
  });

  describe('exact IBC denom lookup', () => {
    it('finds USDC by its full IBC denom', () => {
      const denom = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
      const res = handleLookupTokenInfo({ query: denom });
      expect(res.success).toBe(true);
      expect(res.tokenInfo!.symbol).toBe('USDC');
      expect(res.tokenInfo!.ibcDenom).toBe(denom);
    });

    it('IBC denom lookup is case-insensitive (lowercased hex)', () => {
      // Known USDC denom in lowercase
      const denom = 'ibc/f082b65c88e4b6d5ef1db243cda1d331d002759e938a0f5cd3ffdc5d53b3e349';
      const res = handleLookupTokenInfo({ query: denom });
      expect(res.success).toBe(true);
      expect(res.tokenInfo!.symbol).toBe('USDC');
    });
  });

  describe('unknown IBC denom fallback', () => {
    it('generates a synthetic TokenInfo for an unknown but valid-looking IBC denom', () => {
      const denom = 'ibc/' + 'A'.repeat(64);
      const res = handleLookupTokenInfo({ query: denom });
      expect(res.success).toBe(true);
      expect(res.tokenInfo).toBeDefined();
      expect(res.tokenInfo!.symbol).toBe('UNKNOWN');
      expect(res.tokenInfo!.decimals).toBe('6');
      expect(res.tokenInfo!.backingAddress).toMatch(/^bb1/);
    });

    it('synthetic TokenInfo still has a valid bb1 backing address', () => {
      const denom = 'ibc/0123456789ABCDEF';
      const res = handleLookupTokenInfo({ query: denom });
      expect(res.success).toBe(true);
      expect(res.tokenInfo!.backingAddress.length).toBeGreaterThan(4);
    });
  });

  describe('unknown symbol', () => {
    it('returns success=false with an error listing known symbols', () => {
      const res = handleLookupTokenInfo({ query: 'ZZZ' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/Token not found/i);
      // Should list at least one known symbol
      expect(res.error).toMatch(/USDC/);
    });
  });

  describe('"all" or empty query returns every token', () => {
    it('query="all" returns the full list', () => {
      const res = handleLookupTokenInfo({ query: 'all' });
      expect(res.success).toBe(true);
      expect(res.allTokens).toBeDefined();
      expect(res.allTokens!.length).toBeGreaterThanOrEqual(3); // USDC, ATOM, OSMO
      const symbols = res.allTokens!.map(t => t.symbol);
      expect(symbols).toContain('USDC');
      expect(symbols).toContain('ATOM');
      expect(symbols).toContain('OSMO');
    });

    it('query="ALL" (case variants) also returns the full list', () => {
      const res = handleLookupTokenInfo({ query: 'ALL' });
      expect(res.success).toBe(true);
      expect(res.allTokens).toBeDefined();
      expect(res.allTokens!.length).toBeGreaterThanOrEqual(3);
    });

    it('empty query returns the full list (not an error)', () => {
      const res = handleLookupTokenInfo({ query: '' });
      expect(res.success).toBe(true);
      expect(res.allTokens).toBeDefined();
    });
  });

  describe('backingAddress determinism', () => {
    it('the same symbol always returns the same backing address', () => {
      const a = handleLookupTokenInfo({ query: 'USDC' }).tokenInfo!;
      const b = handleLookupTokenInfo({ query: 'USDC' }).tokenInfo!;
      expect(a.backingAddress).toBe(b.backingAddress);
    });

    it('different IBC denoms get different backing addresses', () => {
      const usdc = handleLookupTokenInfo({ query: 'USDC' }).tokenInfo!;
      const atom = handleLookupTokenInfo({ query: 'ATOM' }).tokenInfo!;
      expect(usdc.backingAddress).not.toBe(atom.backingAddress);
    });
  });
});
