/**
 * Tests for builder/sdk/addressGenerator.ts
 *
 * Generates deterministic module-derived bb1 addresses for Smart Token
 * backing scenarios. The hash derivation is:
 *
 *   addr = sha256( sha256("module") || moduleNameBytes || 0x00 || derivKey[0] )
 *   then iteratively:  addr = sha256( sha256(addrBytes) || derivKey[i] )
 *
 * For IBC-backed denoms, the derivation key is:
 *   [ 0x12, utf8(ibcDenom) ]
 *
 * For Cosmos-coin-wrapper denoms, the derivation key is:
 *   [ 0x0c, utf8(denom) ]
 *
 * The tests here focus on DETERMINISM and DISTINCTNESS (different inputs →
 * different outputs). We don't hardcode golden values because the on-chain
 * module would produce different hashes — but on this commit the outputs
 * must be reproducible within the JS side so that Smart Token callers get
 * consistent backing addresses between builder sessions.
 */

import {
  generateAlias,
  generateAliasAddressForIBCBackedDenom,
  generateAliasAddressForDenom,
  getAliasDerivationKeysForIBCBackedDenom,
  getAliasDerivationKeysForDenom
} from './addressGenerator.js';

describe('addressGenerator', () => {
  describe('generateAlias — core derivation', () => {
    it('throws when derivationKeys is empty', () => {
      expect(() => generateAlias('tokenization', [])).toThrow(/derivationKeys/);
    });

    it('produces a bb1-prefixed bech32 address', () => {
      const addr = generateAlias('tokenization', [Buffer.from([0x00, 0x01, 0x02])]);
      expect(addr).toMatch(/^bb1/);
    });

    it('is deterministic for the same module + keys', () => {
      const k = [Buffer.from('fixed-input', 'utf8')];
      const a = generateAlias('tokenization', k);
      const b = generateAlias('tokenization', k);
      expect(a).toBe(b);
    });

    it('different module names produce different addresses', () => {
      const k = [Buffer.from('same-input', 'utf8')];
      const a = generateAlias('tokenization', k);
      const b = generateAlias('other-module', k);
      expect(a).not.toBe(b);
    });

    it('different derivation keys produce different addresses', () => {
      const a = generateAlias('tokenization', [Buffer.from('a')]);
      const b = generateAlias('tokenization', [Buffer.from('b')]);
      expect(a).not.toBe(b);
    });

    it('adding a second derivation key changes the output (Derive is applied iteratively)', () => {
      const base = generateAlias('tokenization', [Buffer.from('x')]);
      const derived = generateAlias('tokenization', [Buffer.from('x'), Buffer.from('y')]);
      expect(base).not.toBe(derived);
    });
  });

  describe('getAliasDerivationKeysForIBCBackedDenom', () => {
    it('returns [0x12 prefix, utf8(denom)] as two Buffers', () => {
      const denom = 'ibc/ABC';
      const keys = getAliasDerivationKeysForIBCBackedDenom(denom);
      expect(keys).toHaveLength(2);
      expect(keys[0].length).toBe(1);
      expect(keys[0][0]).toBe(0x12);
      expect(keys[1].toString('utf8')).toBe(denom);
    });
  });

  describe('getAliasDerivationKeysForDenom', () => {
    it('returns [0x0c prefix, utf8(denom)] for cosmos coin wrappers', () => {
      const denom = 'uatom';
      const keys = getAliasDerivationKeysForDenom(denom);
      expect(keys).toHaveLength(2);
      expect(keys[0][0]).toBe(0x0c);
      expect(keys[1].toString('utf8')).toBe(denom);
    });

    it('uses a different prefix byte than the IBC variant (0x0c vs 0x12)', () => {
      const ibc = getAliasDerivationKeysForIBCBackedDenom('ibc/X');
      const coin = getAliasDerivationKeysForDenom('X');
      expect(ibc[0][0]).not.toBe(coin[0][0]);
    });
  });

  describe('generateAliasAddressForIBCBackedDenom', () => {
    it('is deterministic for the same IBC denom', () => {
      const denom = 'ibc/F082B65C88E4B6D5EF1DB243CDA1D331D002759E938A0F5CD3FFDC5D53B3E349';
      expect(generateAliasAddressForIBCBackedDenom(denom))
        .toBe(generateAliasAddressForIBCBackedDenom(denom));
    });

    it('different IBC denoms produce different backing addresses', () => {
      const a = generateAliasAddressForIBCBackedDenom('ibc/AAA');
      const b = generateAliasAddressForIBCBackedDenom('ibc/BBB');
      expect(a).not.toBe(b);
    });

    it('returns a bb1-prefixed bech32 address', () => {
      const addr = generateAliasAddressForIBCBackedDenom('ibc/TEST');
      expect(addr).toMatch(/^bb1/);
    });
  });

  describe('generateAliasAddressForDenom (Cosmos coin wrappers)', () => {
    it('is deterministic for the same coin denom', () => {
      expect(generateAliasAddressForDenom('uatom'))
        .toBe(generateAliasAddressForDenom('uatom'));
    });

    it('different coin denoms produce different backing addresses', () => {
      expect(generateAliasAddressForDenom('uatom'))
        .not.toBe(generateAliasAddressForDenom('uosmo'));
    });

    it('returns a bb1-prefixed bech32 address', () => {
      expect(generateAliasAddressForDenom('uatom')).toMatch(/^bb1/);
    });
  });

  describe('cross-variant distinctness', () => {
    it('IBC-backed alias for "ibc/foo" differs from coin-wrapper alias for "ibc/foo"', () => {
      // Even though the input string is identical, the derivation prefix byte
      // is different (0x12 vs 0x0c), so the addresses must not collide.
      const viaIbc = generateAliasAddressForIBCBackedDenom('ibc/foo');
      const viaCoin = generateAliasAddressForDenom('ibc/foo');
      expect(viaIbc).not.toBe(viaCoin);
    });
  });
});
