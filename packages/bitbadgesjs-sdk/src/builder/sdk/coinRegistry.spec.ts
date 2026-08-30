/**
 * Tests for builder/sdk/coinRegistry.ts
 *
 * The registry maps known symbols (USDC/ATOM/OSMO) to IBC denoms +
 * pre-generated Smart Token backing addresses. The builder uses this
 * extensively when generating mint/backing approvals, so every lookup
 * permutation and denom resolution path must be covered.
 */

import { USDC_DENOM, USDC_NOBLE_DENOM, MAINNET_COINS_REGISTRY as SDK_COINS_REGISTRY } from '../../common/constants.js';
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

  // USDC moved from the Noble-direct IBC route to the Injective-canonicalized
  // one. Both denoms stay in the registry — the legacy route still backs live
  // collections — so the thing worth pinning is which one a bare "USDC" means,
  // and that the two never collapse into each other.
  describe('USDC routes', () => {
    it('registers both routes under distinct denoms', () => {
      expect(USDC_DENOM).not.toBe(USDC_NOBLE_DENOM);
      expect(MAINNET_COINS_REGISTRY).toHaveProperty(USDC_DENOM);
      expect(MAINNET_COINS_REGISTRY).toHaveProperty(USDC_NOBLE_DENOM);
    });

    // The migration contract is ADDITIVE, NEVER SUBSTITUTIVE: three earlier
    // passes each "helpfully" replaced the legacy denom instead of adding the
    // canonical one next to it. Enforce the rule mechanically instead of
    // remembering it. Deliberately literal strings, not the exported
    // constants — an edit to USDC_DENOM / USDC_NOBLE_DENOM themselves must
    // fail here too, in BOTH registries (builder and common/constants).
    it('never drops either USDC denom string from either registry (additive contract)', () => {
      const CANONICAL = 'ibc/E1116484B327AEE59CDC3DA73D319834781A13DB2A7DFC1F38A30CD45ABF58B8';
      const LEGACY = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
      for (const registry of [MAINNET_COINS_REGISTRY, SDK_COINS_REGISTRY]) {
        expect(Object.keys(registry)).toEqual(expect.arrayContaining([CANONICAL, LEGACY]));
        expect(registry[CANONICAL].baseDenom).toBe(CANONICAL);
        expect(registry[LEGACY].baseDenom).toBe(LEGACY);
      }
    });

    it('resolves the bare symbol "USDC" to the Injective route', () => {
      // This is the default every caller inherits — the frontend's pickers, the
      // indexer's origin-denom map, and the builder's approval generation all
      // bottom out here.
      expect(resolveIbcDenom('USDC')).toBe(USDC_DENOM);
      expect(lookupTokenInfo('USDC')!.ibcDenom).toBe(USDC_DENOM);
    });

    it('gives the legacy route its own symbol so it is never mistaken for USDC', () => {
      const legacy = lookupTokenInfo(USDC_NOBLE_DENOM);
      expect(legacy).not.toBeNull();
      // USDC.n is Skip Go's ecosystem-wide name for the Noble voucher,
      // including Skip's own bitbadges-1 registry entry.
      expect(legacy!.symbol).toBe('USDC.N'); // the map upper-cases symbols
      expect(legacy!.displayName).toBe('USDC.n'); // what a user actually sees
      expect(resolveIbcDenom('USDC.n')).toBe(USDC_NOBLE_DENOM);
    });

    it('keeps the pre-release "USDC.noble" spelling as an accepted input alias', () => {
      // Displayed/emitted everywhere as USDC.n; typed input stays forgiving.
      expect(resolveIbcDenom('USDC.noble')).toBe(USDC_NOBLE_DENOM);
      expect(lookupTokenInfo('USDC.noble')!.symbol).toBe('USDC.N');
    });

    // The deprecation copy is rendered verbatim to holders in the wallet UI,
    // and three codebases have to agree on it: this registry, the SDK's own
    // `common/constants` registry, and the frontend's pinned fallback copy
    // (`src/utils/coinRegistry.ts`, `PendingSdkDeprecationNotes`) which exists
    // until the frontend's `bitbadges` dependency carries the field. Byte
    // identity is the actual requirement, so pin the bytes.
    const DEPRECATION_NOTE =
      'Legacy Noble-routed USDC. Existing balances stay fully usable \u2014 use canonical USDC (via Injective) for everything new.';

    it('carries the holder-facing deprecation note on the legacy route only', () => {
      expect(MAINNET_COINS_REGISTRY[USDC_NOBLE_DENOM].deprecated).toBe(true);
      expect(MAINNET_COINS_REGISTRY[USDC_NOBLE_DENOM].deprecationNote).toBe(DEPRECATION_NOTE);
      expect(MAINNET_COINS_REGISTRY[USDC_DENOM].deprecated).toBeUndefined();
      expect(MAINNET_COINS_REGISTRY[USDC_DENOM].deprecationNote).toBeUndefined();
    });

    it('keeps the builder registry and the SDK registry note byte-identical', () => {
      expect(SDK_COINS_REGISTRY[USDC_NOBLE_DENOM].deprecationNote).toBe(DEPRECATION_NOTE);
      expect(SDK_COINS_REGISTRY[USDC_NOBLE_DENOM].deprecationNote).toBe(
        MAINNET_COINS_REGISTRY[USDC_NOBLE_DENOM].deprecationNote
      );
    });

    it('keeps the legacy route fully usable — same decimals, real registry entry', () => {
      // Balances in it must still price and format correctly; deprecation is a
      // routing decision, not a downgrade of the asset.
      expect(getDecimals(USDC_NOBLE_DENOM)).toBe(6);
      expect(getCoinDetails(USDC_NOBLE_DENOM)!.decimals).toBe('6');
      expect(getCoinDetails(USDC_NOBLE_DENOM)!.deprecated).toBe(true);
      expect(getCoinDetails(USDC_DENOM)!.deprecated).toBeUndefined();
    });
  });

  describe('buildSymbolToTokenInfoMap', () => {
    it('includes every coin in MAINNET_COINS_REGISTRY (native + chain-internal + IBC)', () => {
      const map = buildSymbolToTokenInfoMap();
      const symbols = Array.from(map.keys());
      for (const required of ['BADGE', 'CHAOS', 'USDC', 'ATOM', 'OSMO']) {
        expect(symbols).toContain(required);
      }
    });

    it('is cached — returns the same Map instance on repeated calls', () => {
      const a = buildSymbolToTokenInfoMap();
      const b = buildSymbolToTokenInfoMap();
      expect(a).toBe(b);
    });

    it('every IBC entry has a well-formed bb1 backing address; native + chain-internal entries omit it', () => {
      const map = buildSymbolToTokenInfoMap();
      for (const token of map.values()) {
        if (token.ibcDenom.startsWith('ibc/')) {
          expect(token.backingAddress).toMatch(/^bb1/);
          expect(token.backingAddress!.length).toBeGreaterThan(10);
        } else {
          // Native (BADGE @ ubadge) and chain-internal (CHAOS @
          // badges:49:chaosnet) denoms are queryable but can't have a
          // backing alias — the wrapper flow only applies to IBC sources.
          expect(token.backingAddress).toBeUndefined();
        }
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
      const denom = 'ibc/E1116484B327AEE59CDC3DA73D319834781A13DB2A7DFC1F38A30CD45ABF58B8';
      const result = lookupTokenInfo(denom);
      expect(result).not.toBeNull();
      expect(result!.symbol).toBe('USDC');
    });

    it('IBC-denom lookup is case-insensitive on the hex portion', () => {
      const lower = lookupTokenInfo('ibc/e1116484b327aee59cdc3da73d319834781a13db2a7dfc1f38a30cd45abf58b8');
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

    it('finds native BADGE (ubadge) and reports no backingAddress', () => {
      const badge = lookupTokenInfo('BADGE');
      expect(badge).not.toBeNull();
      expect(badge!.symbol).toBe('BADGE');
      expect(badge!.ibcDenom).toBe('ubadge');
      expect(badge!.decimals).toBe('9');
      expect(badge!.backingAddress).toBeUndefined();
    });

    it('finds chain-internal CHAOS (badges:49:chaosnet) and reports no backingAddress', () => {
      const chaos = lookupTokenInfo('CHAOS');
      expect(chaos).not.toBeNull();
      expect(chaos!.symbol).toBe('CHAOS');
      expect(chaos!.ibcDenom).toBe('badges:49:chaosnet');
      expect(chaos!.backingAddress).toBeUndefined();
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
      const d = getCoinDetails('ibc/E1116484B327AEE59CDC3DA73D319834781A13DB2A7DFC1F38A30CD45ABF58B8');
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
