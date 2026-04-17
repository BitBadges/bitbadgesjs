/**
 * Tests for builder/sdk/coinRegistry.ts
 *
 * The registry maps known symbols (USDC/ATOM/OSMO) to IBC denoms +
 * pre-generated Smart Token backing addresses. The builder uses this
 * extensively when generating mint/backing approvals, so every lookup
 * permutation and denom resolution path must be covered.
 */

import {
  MAINNET_COINS_REGISTRY,
  buildSymbolToTokenInfoMap,
  lookupTokenInfo,
  getAllTokens,
  getCoinDetails,
  resolveIbcDenom,
  getDecimals
} from './coinRegistry.js';

describe('coinRegistry', () => {
  describe('MAINNET_COINS_REGISTRY fixtures', () => {
    it('includes the core denoms we care about', () => {
      expect(MAINNET_COINS_REGISTRY).toHaveProperty('ubadge');
      // USDC, ATOM, OSMO keys are IBC denoms; check via symbol.
      const symbols = Object.values(MAINNET_COINS_REGISTRY).map(c => c.symbol);
      expect(symbols).toContain('USDC');
      expect(symbols).toContain('ATOM');
      expect(symbols).toContain('OSMO');
      expect(symbols).toContain('BADGE');
    });
  });

  describe('buildSymbolToTokenInfoMap', () => {
    it('only includes IBC-denom entries (not native ubadge/badges:*)', () => {
      const map = buildSymbolToTokenInfoMap();
      for (const token of map.values()) {
        expect(token.ibcDenom.startsWith('ibc/')).toBe(true);
      }
    });

    it('is cached — returns the same Map instance on repeated calls', () => {
      const a = buildSymbolToTokenInfoMap();
      const b = buildSymbolToTokenInfoMap();
      expect(a).toBe(b);
    });

    it('each entry has a well-formed bb1 backing address', () => {
      const map = buildSymbolToTokenInfoMap();
      for (const token of map.values()) {
        expect(token.backingAddress).toMatch(/^bb1/);
        expect(token.backingAddress.length).toBeGreaterThan(10);
      }
    });
  });

  describe('lookupTokenInfo', () => {
    it('finds a token by symbol (case-insensitive)', () => {
      const usdc = lookupTokenInfo('USDC');
      const usdcLower = lookupTokenInfo('usdc');
      expect(usdc).not.toBeNull();
      expect(usdcLower).not.toBeNull();
      expect(usdc!.backingAddress).toBe(usdcLower!.backingAddress);
    });

    it('finds a token by exact IBC denom', () => {
      const denom = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
      const result = lookupTokenInfo(denom);
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('USDC');
    });

    it('IBC-denom lookup is case-insensitive on the hex portion', () => {
      const lower = lookupTokenInfo('ibc/f082b65c88e4b6d5ef1db243cda1d331d002759e938a0f5cd3ffdc5d53b3e349');
      expect(lower).not.toBeNull();
      expect(lower!.symbol).toBe('USDC');
    });

    it('returns a synthetic TokenInfo for unknown IBC denoms (symbol=UNKNOWN)', () => {
      const result = lookupTokenInfo('ibc/NEWDENOM999999999999999999999999999999999');
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('UNKNOWN');
      expect(result!.decimals).toBe('6');
      expect(result!.backingAddress).toMatch(/^bb1/);
    });

    it('returns null for an unknown non-IBC symbol', () => {
      expect(lookupTokenInfo('DOES_NOT_EXIST')).toBeNull();
    });

    it('returns null for an empty query (no symbol, no ibc/ prefix)', () => {
      expect(lookupTokenInfo('')).toBeNull();
    });
  });

  describe('getAllTokens', () => {
    it('returns all IBC-backed tokens as an array', () => {
      const all = getAllTokens();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThanOrEqual(3);
    });

    it('every returned token has a unique symbol', () => {
      const all = getAllTokens();
      const symbols = all.map(t => t.symbol);
      expect(new Set(symbols).size).toBe(symbols.length);
    });
  });

  describe('getCoinDetails', () => {
    it('returns details for ubadge (native)', () => {
      const d = getCoinDetails('ubadge');
      expect(d).not.toBeNull();
      expect(d!.symbol).toBe('BADGE');
      expect(d!.decimals).toBe('9');
    });

    it('returns details for a known IBC denom', () => {
      const d = getCoinDetails('ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349');
      expect(d).not.toBeNull();
      expect(d!.symbol).toBe('USDC');
    });

    it('returns null for unknown denom', () => {
      expect(getCoinDetails('ibc/UNKNOWN_DENOM_XXX')).toBeNull();
    });
  });

  describe('resolveIbcDenom', () => {
    it('returns ibc/... input unchanged', () => {
      const denom = 'ibc/ANYDENOM';
      expect(resolveIbcDenom(denom)).toBe(denom);
    });

    it('resolves a known symbol to its IBC denom', () => {
      const resolved = resolveIbcDenom('USDC');
      expect(resolved).toMatch(/^ibc\//);
      const expected = lookupTokenInfo('USDC')!.ibcDenom;
      expect(resolved).toBe(expected);
    });

    it('returns null for unknown symbol', () => {
      expect(resolveIbcDenom('UNKNOWN_SYMBOL')).toBeNull();
    });
  });

  describe('getDecimals', () => {
    it('returns 9 for native ubadge (BADGE)', () => {
      expect(getDecimals('ubadge')).toBe(9);
    });

    it('returns 6 for known IBC denoms (USDC/ATOM/OSMO)', () => {
      const usdcDenom = lookupTokenInfo('USDC')!.ibcDenom;
      expect(getDecimals(usdcDenom)).toBe(6);
    });

    it('returns 6 as default for unknown IBC denoms', () => {
      expect(getDecimals('ibc/COMPLETELY_NEW_DENOM')).toBe(6);
    });

    it('returns 6 when looking up a known SYMBOL (symbol hits lookupTokenInfo path)', () => {
      // Note: getDecimals first tries the registry (which is keyed by base denom),
      // then falls back to lookupTokenInfo for symbols. USDC isn't in the
      // registry as a key but lookupTokenInfo finds it.
      expect(getDecimals('USDC')).toBe(6);
    });

    it('returns 9 as default for unknown non-IBC strings (native-token fallback)', () => {
      expect(getDecimals('totally-unknown')).toBe(9);
    });
  });
});
