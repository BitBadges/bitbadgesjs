/**
 * Tests for `validate_address` builder tool.
 *
 * validateAddress is a thin wrapper over the SDK's canonical address helpers
 * (`getChainForAddress`, `isAddressValid`, `convertToBitBadgesAddress`). The
 * MCP tool should return the same answer the rest of the SDK (and therefore
 * the indexer and chain) would return for the same address.
 *
 * Scope: only `0x` (ETH) and `bb`-prefixed (BitBadges bech32, including
 * `bbvaloper`) addresses count as "known". Other bech32 prefixes
 * (`cosmos1`, `osmo1`, `juno1`, etc.) are not BitBadges-supported chains and
 * report as `chain: 'unknown'`. This matches `getChainForAddress` and avoids
 * the prior footgun where `validate_address` would accept a foreign bech32
 * that subsequently broke any BitBadges tool downstream.
 */

import { handleValidateAddress } from './validateAddress.js';

describe('handleValidateAddress', () => {
  describe('empty + malformed input', () => {
    it('returns valid=false with explicit empty-address error for ""', () => {
      const res = handleValidateAddress({ address: '' });
      expect(res.success).toBe(true);
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('unknown');
      expect(res.error).toMatch(/empty/i);
    });

    it('returns valid=false for whitespace-only input', () => {
      const res = handleValidateAddress({ address: '   ' });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('unknown');
      expect(res.error).toMatch(/empty/i);
    });

    it('returns valid=false for a random unrelated string', () => {
      const res = handleValidateAddress({ address: 'definitely-not-an-address' });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('unknown');
      expect(res.details?.format).toBe('unknown');
      expect(res.error).toMatch(/not recognized/i);
    });
  });

  describe('ETH (0x) addresses', () => {
    it('accepts a well-formed 0x address (lowercase hex)', () => {
      const addr = '0x' + 'a'.repeat(40);
      const res = handleValidateAddress({ address: addr });
      expect(res.valid).toBe(true);
      expect(res.chain).toBe('eth');
      expect(res.normalized).toBe(addr.toLowerCase());
      expect(res.details?.format).toBe('ethereum');
      expect(res.details?.length).toBe(42);
    });

    it('rejects a mixed-case 0x address that fails the EIP-55 checksum', () => {
      // Mixed-case addresses must satisfy the EIP-55 checksum. This one does
      // not, so the canonical SDK helper rejects it — a correctness tighten
      // over the old hand-rolled `/^[0-9a-fA-F]+$/` check that accepted it.
      const addr = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01';
      const res = handleValidateAddress({ address: addr });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('eth');
    });

    it('accepts a valid EIP-55 checksummed 0x address', () => {
      // Derived by round-tripping an all-lowercase form through the SDK's
      // checksum encoder.
      const addr = '0x742d35cC6634c0532925A3b844bc9E7595F0beB1';
      const res = handleValidateAddress({ address: addr });
      expect(res.valid).toBe(true);
      expect(res.chain).toBe('eth');
    });

    it('rejects a 0x address that is too short (41 chars)', () => {
      const addr = '0x' + 'a'.repeat(39);
      const res = handleValidateAddress({ address: addr });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('eth');
      expect(res.normalized).toBeUndefined();
    });

    it('rejects a 0x address that is too long (43 chars)', () => {
      const addr = '0x' + 'a'.repeat(41);
      const res = handleValidateAddress({ address: addr });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('eth');
    });

    it('rejects a 0x address that contains non-hex characters', () => {
      const addr = '0x' + 'z'.repeat(40);
      const res = handleValidateAddress({ address: addr });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('eth');
    });

    it('rejects bare "0x" (prefix only)', () => {
      const res = handleValidateAddress({ address: '0x' });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('eth');
    });
  });

  describe('BitBadges (bb1) addresses', () => {
    // Real-ish bech32 address generated from 20 zero bytes with bb prefix:
    //   bech32.encode('bb', bech32.toWords(Buffer.alloc(20, 0)))
    const validBb1 = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

    it('accepts a valid bb1 address and reports the correct prefix', () => {
      const res = handleValidateAddress({ address: validBb1 });
      expect(res.valid).toBe(true);
      expect(res.chain).toBe('cosmos');
      expect(res.details?.prefix).toBe('bb');
      expect(res.details?.format).toBe('bech32');
    });

    it('rejects a bb1 address with a corrupted checksum', () => {
      // Flip the last character — breaks the bech32 checksum
      const broken = validBb1.slice(0, -1) + 'x';
      const res = handleValidateAddress({ address: broken });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('cosmos');
      expect(res.normalized).toBeUndefined();
    });
  });

  describe('non-BitBadges bech32 prefixes are not recognized', () => {
    // Valid cosmos1 encoding of 20 zero bytes — still not a BitBadges chain.
    const validCosmos1 = 'cosmos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnrql8a';
    // osmo1 of 20 zero bytes — same deal.
    const validOsmo = 'osmo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmcn030';

    it('reports cosmos1 addresses as chain=unknown (not a BitBadges-supported chain)', () => {
      const res = handleValidateAddress({ address: validCosmos1 });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('unknown');
    });

    it('reports osmo1 addresses as chain=unknown (not a BitBadges-supported chain)', () => {
      const res = handleValidateAddress({ address: validOsmo });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('unknown');
    });

    it('rejects an arbitrary non-bech32 string with no supported prefix', () => {
      const res = handleValidateAddress({ address: 'foo1bar' });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('unknown');
    });
  });

  describe('output shape is consistent', () => {
    it('always returns success=true for non-throw paths (even when address is invalid)', () => {
      // `success` means "the tool ran", not "the address is valid". Downstream
      // agents check `valid` separately.
      const cases = ['', '0x', '0xdead', 'bb1broken', 'random', '   '];
      for (const addr of cases) {
        const res = handleValidateAddress({ address: addr });
        expect(res.success).toBe(true);
      }
    });

    it('returns details.length matching the input length for malformed inputs', () => {
      const res = handleValidateAddress({ address: '0xdeadbeef' });
      expect(res.details?.length).toBe(10);
    });
  });
});
