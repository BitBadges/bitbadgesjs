/**
 * Tests for `convert_address` builder tool.
 *
 * convertAddress is a thin wrapper over the SDK's canonical address helpers
 * in `src/address-converter/converter.ts` (`convertToBitBadgesAddress`,
 * `convertToEthAddress`, `getChainForAddress`). The MCP tool should agree
 * with the rest of the SDK on format detection, bech32 decoding, and
 * EIP-55 checksum rules.
 *
 * The round-trip property is critical — eth → bb1 → eth must give back the
 * same address (in the SDK's canonical ETH form, i.e. EIP-55 checksummed),
 * and bb1 → eth → bb1 must give back the same lowercased bech32 form.
 *
 * Every code path in `handleConvertAddress` is exercised:
 *   - source detection via `getChainForAddress` (eth / cosmos / unknown)
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

  // A non-zero fixture to make sure we're not just passing `00...00` through.
  // All-lowercase hex bypasses EIP-55 checksum enforcement; the SDK's
  // `convertToEthAddress` returns the EIP-55 checksummed form, so the
  // round-trip lands on the mixed-case canonical string below.
  const ETH_NONZERO_LOWER = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';
  const ETH_NONZERO_CHECKSUM = '0x742d35cC6634c0532925A3b844bc9E7595F0beB1';

  describe('auto-detected target format', () => {
    it('converts 0x → bb1 when target is omitted', () => {
      const res = handleConvertAddress({ address: ETH_ZERO });
      expect(res.success).toBe(true);
      expect(res.originalFormat).toBe('eth');
      expect(res.targetFormat).toBe('bitbadges');
      expect(res.convertedAddress).toBe(BB1_ZERO);
      expect(res.originalAddress).toBe(ETH_ZERO);
    });

    it('converts bb1 → 0x when target is omitted (returns EIP-55 checksummed form)', () => {
      const res = handleConvertAddress({ address: BB1_ZERO });
      expect(res.success).toBe(true);
      expect(res.originalFormat).toBe('bitbadges');
      expect(res.targetFormat).toBe('eth');
      // Zero bytes have no case to check, so the checksummed form equals lowercase.
      expect(res.convertedAddress).toBe(ETH_ZERO);
    });

    it('round-trips a non-zero ETH address: 0x → bb1 → 0x (landing on the checksummed form)', () => {
      const toBb1 = handleConvertAddress({ address: ETH_NONZERO_LOWER });
      expect(toBb1.success).toBe(true);
      expect(toBb1.convertedAddress).toMatch(/^bb1/);

      const backToEth = handleConvertAddress({ address: toBb1.convertedAddress! });
      expect(backToEth.success).toBe(true);
      // SDK canonical form is EIP-55 checksummed, not lowercase.
      expect(backToEth.convertedAddress).toBe(ETH_NONZERO_CHECKSUM);
    });

    it('accepts already-checksummed ETH input and normalizes it through the conversion', () => {
      const res = handleConvertAddress({ address: ETH_NONZERO_CHECKSUM });
      expect(res.success).toBe(true);
      expect(res.convertedAddress).toMatch(/^bb1/);
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
      const auto = handleConvertAddress({ address: ETH_NONZERO_LOWER });
      const explicit = handleConvertAddress({ address: ETH_NONZERO_LOWER, targetFormat: 'bitbadges' });
      expect(explicit.convertedAddress).toBe(auto.convertedAddress);
    });

    it('explicit bb1 → eth produces the same result as auto-detect (checksummed)', () => {
      const toBb1 = handleConvertAddress({ address: ETH_NONZERO_LOWER });
      const explicit = handleConvertAddress({ address: toBb1.convertedAddress!, targetFormat: 'eth' });
      expect(explicit.success).toBe(true);
      expect(explicit.convertedAddress).toBe(ETH_NONZERO_CHECKSUM);
    });
  });

  describe('rejects unknown / invalid formats', () => {
    it('returns success=false for an empty string', () => {
      const res = handleConvertAddress({ address: '' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unknown/i);
    });

    it('returns success=false for a bare "0x" (fails conversion — no hex body)', () => {
      // getChainForAddress('0x') still reports ETH (prefix-based), so we fall
      // through to the converter which fails and returns the "Failed to convert"
      // path rather than the upstream "unknown format" path.
      const res = handleConvertAddress({ address: '0x' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/failed to convert|check format/i);
    });

    it('returns success=false for a 41-char 0x string (invalid length / checksum)', () => {
      const res = handleConvertAddress({ address: '0x' + '0'.repeat(39) });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/failed to convert|check format/i);
    });

    it('returns success=false for a non-prefixed random string', () => {
      const res = handleConvertAddress({ address: 'not-an-address' });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/unknown/i);
    });

    it('surfaces bech32 decode failure as a conversion error when bb1 checksum is corrupt', () => {
      const broken = BB1_ZERO.slice(0, -1) + 'x';
      const res = handleConvertAddress({ address: broken });
      expect(res.success).toBe(false);
      // A corrupted bb1 is detected as COSMOS by prefix, then fails in the converter.
      expect(res.error).toMatch(/failed to convert|check format/i);
    });
  });
});
