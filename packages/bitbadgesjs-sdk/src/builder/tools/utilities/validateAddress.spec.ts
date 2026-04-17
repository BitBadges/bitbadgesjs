/**
 * Tests for `validate_address` builder tool.
 *
 * validateAddress is called by the LLM builder to confirm user-supplied addresses
 * before putting them into on-chain transactions. Misclassifying a valid address
 * or accepting an invalid one would cause downstream tx failures, so the
 * function must be airtight across every input shape we actually encounter:
 *
 *   - empty / whitespace strings
 *   - 0x prefix with invalid length / invalid hex
 *   - valid 20-byte ETH addresses (mixed case)
 *   - bb1 / cosmos1 bech32 addresses with valid + invalid checksums
 *   - generic bech32 addresses from other chains (osmo1, ibc channel ids, etc.)
 *   - strings that look like addresses but aren't
 *
 * Each branch in `handleValidateAddress` is exercised at least once.
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

    it('accepts a well-formed 0x address with mixed case and normalizes to lowercase', () => {
      const addr = '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01';
      const res = handleValidateAddress({ address: addr });
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe(addr.toLowerCase());
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
      expect(res.normalized).toBe(validBb1.toLowerCase());
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

  describe('Cosmos-prefixed (cosmos1) addresses', () => {
    // Valid cosmos1 encoding of 20 zero bytes
    const validCosmos1 = 'cosmos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnrql8a';

    it('accepts a valid cosmos1 address', () => {
      const res = handleValidateAddress({ address: validCosmos1 });
      expect(res.valid).toBe(true);
      expect(res.chain).toBe('cosmos');
      expect(res.details?.prefix).toBe('cosmos');
    });

    it('rejects a cosmos1 address with invalid checksum', () => {
      const broken = validCosmos1.slice(0, -1) + 'z';
      const res = handleValidateAddress({ address: broken });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('cosmos');
    });
  });

  describe('generic bech32 (other-chain prefixes)', () => {
    // osmo1 of 20 zero bytes
    const validOsmo = 'osmo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmcn030';

    it('accepts a valid osmo1 bech32 address via generic fallback', () => {
      const res = handleValidateAddress({ address: validOsmo });
      expect(res.valid).toBe(true);
      expect(res.chain).toBe('cosmos');
      expect(res.details?.prefix).toBe('osmo');
    });

    it('rejects an arbitrary non-bech32 string that has no 0x/bb1/cosmos1 prefix', () => {
      const res = handleValidateAddress({ address: 'foo1bar' });
      expect(res.valid).toBe(false);
      expect(res.chain).toBe('unknown');
    });
  });

  describe('output shape is consistent', () => {
    it('always returns success=true for non-throw paths (even when address is invalid)', () => {
      // This is important for MCP tool contracts — `success` means "the tool ran",
      // not "the address is valid". Downstream agents check `valid` separately.
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
