/**
 * Tests for `convert_address` builder tool.
 *
 * convertAddress wraps bech32 encoding/decoding to move between the two
 * canonical BitBadges address formats:
 *   - 0x... (Ethereum-style, 20-byte hex)
 *   - bb1... (Cosmos bech32 with "bb" prefix)
 *
 * This is called by the LLM builder both for user convenience (paste either
 * format) and to normalize addresses before stuffing them into txs. The
 * round-trip property is critical — eth → bb1 → eth must give back the same
 * lowercased address, and bb1 → eth → bb1 must give back the same lowercased
 * bech32 form.
 *
 * Every code path in `handleConvertAddress` is exercised:
 *   - source detection (eth / cosmos / unknown)
 *   - auto-target selection when `targetFormat` is omitted
 *   - identity short-circuit (eth→eth, bb1→bb1)
 *   - actual conversion (both directions)
 *   - error handling for bad inputs
 */

import { handleConvertAddress } from './convertAddress.js';

describe('handleConvertAddress', () => {
  // Canonical fixture pair: the 20 zero bytes in both formats.
  const ETH_ZERO = '0x' + '0'.repeat(40);
  const BB1_ZERO = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

  // A non-zero fixture to make sure we're not just passing `00...00` through
  const ETH_NONZERO = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';

  describe('auto-detected target format', () => {
    it('converts 0x → bb1 when target is omitted', () => {
      const res = handleConvertAddress({ address: ETH_ZERO });
      expect(res.success).toBe(true);
      expect(res.originalFormat).toBe('eth');
      expect(res.targetFormat).toBe('bitbadges');
      expect(res.convertedAddress).toBe(BB1_ZERO);
      expect(res.originalAddress).toBe(ETH_ZERO);
    });

    it('converts bb1 → 0x when target is omitted', () => {
      const res = handleConvertAddress({ address: BB1_ZERO });
      expect(res.success).toBe(true);
      expect(res.originalFormat).toBe('bitbadges');
      expect(res.targetFormat).toBe('eth');
      expect(res.convertedAddress).toBe(ETH_ZERO);
    });

    it('round-trips a non-zero ETH address: 0x → bb1 → 0x', () => {
      const toBb1 = handleConvertAddress({ address: ETH_NONZERO });
      expect(toBb1.success).toBe(true);
      expect(toBb1.convertedAddress).toMatch(/^bb1/);

      const backToEth = handleConvertAddress({ address: toBb1.convertedAddress! });
      expect(backToEth.success).toBe(true);
      expect(backToEth.convertedAddress).toBe(ETH_NONZERO);
    });

    it('normalizes mixed-case ETH input to lowercase during conversion', () => {
      const mixed = '0x742D35CC6634C0532925A3B844BC9E7595F0BEB1';
      const res = handleConvertAddress({ address: mixed });
      expect(res.success).toBe(true);
      // The converted bb1 must be the same as the one derived from the
      // lowercased form — confirming eth→cosmos normalizes case.
      const expected = handleConvertAddress({ address: mixed.toLowerCase() });
      expect(res.convertedAddress).toBe(expected.convertedAddress);
    });
  });

  describe('explicit targetFormat', () => {
    it('identity: 0x → eth returns original unchanged', () => {
      const res = handleConvertAddress({ address: ETH_ZERO, targetFormat: 'eth' });
      expect(res.success).toBe(true);
      expect(res.originalAddress).toBe(ETH_ZERO);
      expect(res.convertedAddress).toBe(ETH_ZERO);
      expect(res.originalFormat).toBe('eth');
      expect(res.targetFormat).toBe('eth');
    });

    it('identity: bb1 → bitbadges returns original unchanged', () => {
      const res = handleConvertAddress({ address: BB1_ZERO, targetFormat: 'bitbadges' });
      expect(res.success).toBe(true);
      expect(res.convertedAddress).toBe(BB1_ZERO);
      expect(res.originalFormat).toBe('bitbadges');
      expect(res.targetFormat).toBe('bitbadges');
    });

    it('explicit 0x → bitbadges produces the same result as auto-detect', () => {
      const auto = handleConvertAddress({ address: ETH_NONZERO });
      const explicit = handleConvertAddress({ address: ETH_NONZERO, targetFormat: 'bitbadges' });
      expect(explicit.convertedAddress).toBe(auto.convertedAddress);
    });

    it('explicit bb1 → eth produces the same result as auto-detect', () => {
      const toBb1 = handleConvertAddress({ address: ETH_NONZERO });
      const explicit = handleConvertAddress({ address: toBb1.convertedAddress!, targetFormat: 'eth' });
      expect(explicit.success).toBe(true);
      expect(explicit.convertedAddress).toBe(ETH_NONZERO);
    });
  });

  describe('rejects unknown formats', () => {
    it('returns success=false for an empty string', () => {
      const res = handleConvertAddress({ address: '' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unknown/i);
    });

    it('returns success=false for a bare "0x"', () => {
      const res = handleConvertAddress({ address: '0x' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unknown/i);
    });

    it('returns success=false for a 41-char 0x string (wrong length)', () => {
      const res = handleConvertAddress({ address: '0x' + '0'.repeat(39) });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unknown/i);
    });

    it('returns success=false for a non-prefixed random string', () => {
      const res = handleConvertAddress({ address: 'not-an-address' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unknown/i);
    });

    it('surfaces bech32 decode failure as an error when bb1 checksum is corrupt', () => {
      const broken = BB1_ZERO.slice(0, -1) + 'x';
      const res = handleConvertAddress({ address: broken });
      // The detectFormat() function only checks the prefix, so this is
      // routed through cosmosToEth() and bech32.decode() throws.
      // handleConvertAddress wraps that in its catch block → success: false.
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/failed to convert/i);
    });
  });
});
