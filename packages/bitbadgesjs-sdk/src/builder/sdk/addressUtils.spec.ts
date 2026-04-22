/**
 * Tests for builder/sdk/addressUtils.ts
 *
 * After #0280 this module is a thin adapter over the SDK's canonical
 * `@category Address Utils` exports. Behaviour checked here:
 *
 *   - `ethToCosmos` / `cosmosToEth` — bech32 round-trip invariants and
 *     EIP-55 checksum enforcement (stricter than the pre-adapter impl).
 *   - `validateAddress` — eth vs. cosmos vs. unknown classification,
 *     and 20-byte / 32-byte `isModuleDerived` split.
 *   - `toBitBadgesAddress` / `toEthAddress` — idempotent identity and
 *     cross-conversion, empty-string passthrough for 32-byte aliases
 *     via `toEthAddress` (now via canonical converter).
 *   - `ensureBb1` — special-value pass-through list, plus new cases
 *     for `bbvaloper...` and still-lax behaviour for malformed 0x
 *     input (callers depend on best-effort coercion, not validation).
 *   - `ensureBb1ListId` — compound list id handling.
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
// Valid EIP-55 checksum form for a random non-zero test address.
const ETH_NZ = '0x742d35cC6634c0532925A3b844bc9E7595F0beB1';

describe('addressUtils — ethToCosmos', () => {
  it('converts 20-byte hex to a bb1 bech32 string', () => {
    expect(ethToCosmos(ETH_ZERO)).toBe(BB1_ZERO);
  });

  it('round-trips with cosmosToEth for a checksummed fixture', () => {
    expect(cosmosToEth(ethToCosmos(ETH_NZ)).toLowerCase()).toBe(ETH_NZ.toLowerCase());
  });

  it('accepts all-lowercase hex (no checksum form)', () => {
    expect(ethToCosmos(ETH_NZ.toLowerCase())).toBe(ethToCosmos(ETH_NZ));
  });

  it('accepts all-uppercase hex (no checksum form)', () => {
    const upper = '0x' + ETH_NZ.slice(2).toUpperCase();
    expect(ethToCosmos(upper)).toBe(ethToCosmos(ETH_NZ));
  });

  it('rejects mixed-case hex with a wrong EIP-55 checksum', () => {
    // Flip a letter case on the valid checksum to break it.
    const bad = ETH_NZ.replace('C', 'c');
    expect(() => ethToCosmos(bad)).toThrow();
  });

  it('throws when input is not a valid address', () => {
    expect(() => ethToCosmos('garbage')).toThrow();
  });

  it('throws when hex length is wrong (too short)', () => {
    expect(() => ethToCosmos('0x' + '0'.repeat(39))).toThrow();
  });

  it('throws on non-hex characters', () => {
    expect(() => ethToCosmos('0x' + 'z'.repeat(40))).toThrow();
  });
});

describe('addressUtils — cosmosToEth', () => {
  it('converts a valid bb1 address to 0x', () => {
    expect(cosmosToEth(BB1_ZERO).toLowerCase()).toBe(ETH_ZERO);
  });

  it('throws when the address cannot be converted', () => {
    expect(() => cosmosToEth('not-a-real-address')).toThrow();
  });

  it('throws when bech32 decoding fails (corrupt checksum)', () => {
    const broken = BB1_ZERO.slice(0, -1) + 'x';
    expect(() => cosmosToEth(broken)).toThrow();
  });
});

describe('addressUtils — validateAddress', () => {
  it('recognizes a valid checksummed ETH address', () => {
    const r = validateAddress(ETH_NZ);
    expect(r.valid).toBe(true);
    expect(r.chain).toBe('eth');
    expect(r.isModuleDerived).toBe(false);
    expect(r.normalized).toBe(ETH_NZ.toLowerCase());
  });

  it('rejects a malformed ETH address and returns an explanatory error', () => {
    const r = validateAddress('0xZZZZ');
    expect(r.valid).toBe(false);
    expect(r.chain).toBe('eth'); // 0x prefix is detected
    expect(r.error).toMatch(/invalid eth/i);
  });

  it('rejects a mixed-case ETH address with an invalid EIP-55 checksum', () => {
    // #0280: tighten checksum enforcement across the builder.
    const bad = ETH_NZ.replace('C', 'c');
    const r = validateAddress(bad);
    expect(r.valid).toBe(false);
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
    expect(() => toBitBadgesAddress('garbage')).toThrow();
  });
});

describe('addressUtils — toEthAddress', () => {
  it('passes through a 0x address (round-trip normalizes to checksum form)', () => {
    // mustConvertToEthAddress normalizes the checksum; compare case-insensitively.
    expect(toEthAddress(ETH_ZERO).toLowerCase()).toBe(ETH_ZERO);
  });

  it('converts a bb1 address to 0x', () => {
    expect(toEthAddress(BB1_ZERO).toLowerCase()).toBe(ETH_ZERO);
  });

  it('throws on unknown format', () => {
    expect(() => toEthAddress('foo')).toThrow();
  });

  it('round-trips 32-byte module-derived addresses without throwing', () => {
    // Pre-adapter impl threw "not a standard 20-byte address"; canonical
    // converter instead returns the full hex payload (#0280). Consumers
    // that previously relied on the throw were papering over an empty
    // branch — they now get a usable hex string.
    const { bech32 } = require('bech32');
    const module32 = bech32.encode('bb', bech32.toWords(Buffer.alloc(32, 0)));
    expect(() => toEthAddress(module32)).not.toThrow();
    expect(toEthAddress(module32)).toMatch(/^0x/);
  });
});

describe('addressUtils — ensureBb1', () => {
  it('returns falsy input unchanged (empty string)', () => {
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

  it('passes through bbvaloper addresses unchanged', () => {
    // #0280: validator addresses must survive the builder boundary.
    const valoper = 'bbvaloper1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq000000';
    expect(ensureBb1(valoper)).toBe(valoper);
  });

  it('converts a 0x 42-char address to bb1', () => {
    expect(ensureBb1(ETH_ZERO)).toBe(BB1_ZERO);
  });

  it('returns malformed 0x addresses as-is (does NOT throw)', () => {
    // ensureBb1 is a best-effort coercer. Downstream validation catches
    // malformed input; we only fall back to the original when the
    // canonical converter returns empty.
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
