/**
 * Tests for builder/sdk/addressUtils.ts
 *
 * Lower-level (non-MCP-tool-wrapper) address conversion helpers used by
 * many builder tools. Each exported function is exercised against its
 * full branch coverage:
 *
 *   - isHex / ethToCosmos / cosmosToEth: hex and bech32 round-trip invariants
 *   - validateAddress: eth vs. cosmos vs. unknown classification, and the
 *     20-byte / 32-byte isModuleDerived split
 *   - toBitBadgesAddress / toEthAddress: idempotent identity + cross-conversion
 *   - ensureBb1: the long list of special-value pass-throughs
 *   - ensureBb1ListId: compound list id handling ("!Mint:0x...:bb1..." etc.)
 */

import {
  ethToCosmos,
  cosmosToEth,
  validateAddress,
  toBitBadgesAddress,
  toEthAddress,
  ensureBb1,
  ensureBb1ListId
} from './addressUtils.js';

const ETH_ZERO = '0x' + '0'.repeat(40);
const BB1_ZERO = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const ETH_NZ = '0x742d35cc6634c0532925a3b844bc9e7595f0beb1';

describe('addressUtils — ethToCosmos', () => {
  it('converts 20-byte hex to a bb1 bech32 string', () => {
    expect(ethToCosmos(ETH_ZERO)).toBe(BB1_ZERO);
  });

  it('round-trips with cosmosToEth for a non-zero fixture', () => {
    expect(cosmosToEth(ethToCosmos(ETH_NZ))).toBe(ETH_NZ);
  });

  it('normalizes mixed-case hex (toLowerCase) before encoding', () => {
    const upper = ETH_NZ.toUpperCase().replace('0X', '0x');
    expect(ethToCosmos(upper)).toBe(ethToCosmos(ETH_NZ));
  });

  it('throws when input does not start with 0x', () => {
    expect(() => ethToCosmos('742d35cc6634c0532925a3b844bc9e7595f0beb1')).toThrow(/must start with 0x/);
  });

  it('throws when hex length is wrong (too short)', () => {
    expect(() => ethToCosmos('0x' + '0'.repeat(39))).toThrow(/40 hex/);
  });

  it('throws when hex length is wrong (too long)', () => {
    expect(() => ethToCosmos('0x' + '0'.repeat(41))).toThrow(/40 hex/);
  });

  it('throws on non-hex characters even with correct length', () => {
    expect(() => ethToCosmos('0x' + 'z'.repeat(40))).toThrow(/40 hex/);
  });
});

describe('addressUtils — cosmosToEth', () => {
  it('converts a valid bb1 address to 0x', () => {
    expect(cosmosToEth(BB1_ZERO)).toBe(ETH_ZERO);
  });

  it('throws when the address does not start with bb1', () => {
    expect(() => cosmosToEth('cosmos1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqnrql8a'))
      .toThrow(/must start with bb1/);
  });

  it('throws when bech32 decoding fails (corrupt checksum)', () => {
    const broken = BB1_ZERO.slice(0, -1) + 'x';
    expect(() => cosmosToEth(broken)).toThrow();
  });

  it('throws when the decoded address is not 20 bytes (module-derived 32-byte)', () => {
    // A bb1 address encoding 32 zero bytes would be module-derived
    const { bech32 } = require('bech32');
    const module32 = bech32.encode('bb', bech32.toWords(Buffer.alloc(32, 0)));
    expect(() => cosmosToEth(module32)).toThrow(/module-derived/);
  });
});

describe('addressUtils — validateAddress', () => {
  it('recognizes a valid ETH address', () => {
    const r = validateAddress(ETH_NZ);
    expect(r.valid).toBe(true);
    expect(r.chain).toBe('eth');
    expect(r.isModuleDerived).toBe(false);
    expect(r.normalized).toBe(ETH_NZ.toLowerCase());
  });

  it('rejects a malformed ETH address and returns an explanatory error', () => {
    const r = validateAddress('0xZZZZ');
    expect(r.valid).toBe(false);
    expect(r.chain).toBe('unknown');
    expect(r.error).toMatch(/40 hex/);
  });

  it('recognizes a valid bb1 20-byte address and marks isModuleDerived=false', () => {
    const r = validateAddress(BB1_ZERO);
    expect(r.valid).toBe(true);
    expect(r.chain).toBe('cosmos');
    expect(r.isModuleDerived).toBe(false);
  });

  it('flags 32-byte bb1 addresses as isModuleDerived=true', () => {
    const { bech32 } = require('bech32');
    const module32 = bech32.encode('bb', bech32.toWords(Buffer.alloc(32, 0)));
    const r = validateAddress(module32);
    expect(r.valid).toBe(true);
    expect(r.isModuleDerived).toBe(true);
  });

  it('rejects a bb1 address with invalid checksum', () => {
    const broken = BB1_ZERO.slice(0, -1) + 'x';
    const r = validateAddress(broken);
    expect(r.valid).toBe(false);
    expect(r.chain).toBe('unknown');
    expect(r.error).toMatch(/decode bech32/i);
  });

  it('returns chain=unknown with helpful error for unrecognized input', () => {
    const r = validateAddress('cosmos1qqqqq');
    expect(r.valid).toBe(false);
    expect(r.chain).toBe('unknown');
  });
});

describe('addressUtils — toBitBadgesAddress', () => {
  it('passes through a bb1 address unchanged', () => {
    expect(toBitBadgesAddress(BB1_ZERO)).toBe(BB1_ZERO);
  });

  it('converts a 0x address to bb1', () => {
    expect(toBitBadgesAddress(ETH_ZERO)).toBe(BB1_ZERO);
  });

  it('throws on unknown format', () => {
    expect(() => toBitBadgesAddress('garbage')).toThrow(/Unknown/);
  });
});

describe('addressUtils — toEthAddress', () => {
  it('passes through a 0x address unchanged', () => {
    expect(toEthAddress(ETH_ZERO)).toBe(ETH_ZERO);
  });

  it('converts a bb1 address to 0x', () => {
    expect(toEthAddress(BB1_ZERO)).toBe(ETH_ZERO);
  });

  it('throws on unknown format', () => {
    expect(() => toEthAddress('foo')).toThrow(/Unknown/);
  });

  it('throws when bb1 address is module-derived (32-byte)', () => {
    const { bech32 } = require('bech32');
    const module32 = bech32.encode('bb', bech32.toWords(Buffer.alloc(32, 0)));
    expect(() => toEthAddress(module32)).toThrow(/module-derived/);
  });
});

describe('addressUtils — ensureBb1', () => {
  it('returns falsy input unchanged (empty string, undefined-ish)', () => {
    expect(ensureBb1('')).toBe('');
  });

  it('passes special reserved values through unchanged', () => {
    for (const special of ['Mint', 'All', 'None', 'Total', 'AllWithMint']) {
      expect(ensureBb1(special)).toBe(special);
    }
  });

  it('passes through negated list ids (starting with "!")', () => {
    expect(ensureBb1('!Mint')).toBe('!Mint');
    expect(ensureBb1('!SomeList')).toBe('!SomeList');
  });

  it('passes through AllWithout* variants', () => {
    expect(ensureBb1('AllWithoutMint')).toBe('AllWithoutMint');
    expect(ensureBb1('AllWithoutSomething')).toBe('AllWithoutSomething');
  });

  it('passes through values that already start with bb1', () => {
    expect(ensureBb1(BB1_ZERO)).toBe(BB1_ZERO);
  });

  it('converts a 0x 42-char address to bb1', () => {
    expect(ensureBb1(ETH_ZERO)).toBe(BB1_ZERO);
  });

  it('returns malformed 0x addresses as-is (does NOT throw)', () => {
    // Downstream validation is supposed to catch these — ensureBb1 is a
    // best-effort coercer, not a validator.
    expect(ensureBb1('0xshort')).toBe('0xshort');
  });

  it('returns arbitrary unknown strings as-is', () => {
    expect(ensureBb1('random-list-id')).toBe('random-list-id');
  });
});

describe('addressUtils — ensureBb1ListId', () => {
  it('returns empty input unchanged', () => {
    expect(ensureBb1ListId('')).toBe('');
  });

  it('converts a bare 0x address', () => {
    expect(ensureBb1ListId(ETH_ZERO)).toBe(BB1_ZERO);
  });

  it('preserves a bare bb1 address', () => {
    expect(ensureBb1ListId(BB1_ZERO)).toBe(BB1_ZERO);
  });

  it('handles the "!" negation prefix and still converts the inner address', () => {
    expect(ensureBb1ListId('!' + ETH_ZERO)).toBe('!' + BB1_ZERO);
  });

  it('handles parentheses', () => {
    expect(ensureBb1ListId('(' + ETH_ZERO + ')')).toBe('(' + BB1_ZERO + ')');
  });

  it('handles the combined "!(...)", converting addresses inside', () => {
    expect(ensureBb1ListId('!(' + ETH_ZERO + ')')).toBe('!(' + BB1_ZERO + ')');
  });

  it('converts each colon-separated part that looks like a 0x address', () => {
    const input = ETH_ZERO + ':' + ETH_NZ + ':' + BB1_ZERO;
    const expected = BB1_ZERO + ':' + ethToCosmos(ETH_NZ) + ':' + BB1_ZERO;
    expect(ensureBb1ListId(input)).toBe(expected);
  });

  it('preserves non-address parts verbatim in compound ids', () => {
    const input = 'Mint:' + ETH_ZERO + ':AllWithoutSomething';
    const expected = 'Mint:' + BB1_ZERO + ':AllWithoutSomething';
    expect(ensureBb1ListId(input)).toBe(expected);
  });

  it('handles complex "!(AllWithout:0x...:bb1...)" form', () => {
    const input = '!(AllWithout:' + ETH_ZERO + ':' + BB1_ZERO + ')';
    const expected = '!(AllWithout:' + BB1_ZERO + ':' + BB1_ZERO + ')';
    expect(ensureBb1ListId(input)).toBe(expected);
  });
});
