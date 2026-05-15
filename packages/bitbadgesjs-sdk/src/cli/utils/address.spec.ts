/**
 * Tests for the CLI address-normalization helpers. The conversion itself
 * is exercised by `address-converter/converter.spec.ts` — these tests
 * focus on the CLI-side ergonomics (empty-string-on-failure, exit on
 * malformed input, stderr normalization notice gating).
 */

import { tryBb1Address, requireBb1Address, requireBb1AddressStrict, resolveRecipientList } from './address.js';

// Zero-address pair — deterministic and stable across SDK versions.
// 0x000...000 ↔ bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv.
const ZERO_ETH = '0x0000000000000000000000000000000000000000';
const ZERO_BB1 = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

describe('tryBb1Address', () => {
  it('returns input as-is when already bb1', () => {
    expect(tryBb1Address(ZERO_BB1)).toBe(ZERO_BB1);
  });

  it('returns empty string for nonsense input', () => {
    expect(tryBb1Address('not-an-address')).toBe('');
    expect(tryBb1Address('')).toBe('');
    expect(tryBb1Address('bb1invalid')).toBe('');
  });

  it('converts a valid 0x address to bb1', () => {
    // Pick a checksummed eth address; the converter validates checksum.
    expect(tryBb1Address(ZERO_ETH)).toBe(ZERO_BB1);
  });
});

describe('requireBb1Address', () => {
  let exitSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('process.exit');
    }) as never);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
    delete process.env.BB_QUIET;
  });

  it('returns bb1 for valid input', () => {
    expect(requireBb1Address(ZERO_BB1, '--mine')).toBe(ZERO_BB1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('exits with a clear error for invalid input, including the usage label', () => {
    expect(() => requireBb1Address('garbage', '--mine')).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    const stderrCall = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrCall).toContain('Error: invalid address "garbage" for --mine');
    expect(stderrCall).toContain('bb1... or 0x...');
  });

  it('emits a normalization notice when input differs from output', () => {
    requireBb1Address(ZERO_ETH, '<address>');
    const stderrCall = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrCall).toContain('Normalized');
    expect(stderrCall).toContain(ZERO_ETH);
    expect(stderrCall).toContain(ZERO_BB1);
  });

  it('suppresses the normalization notice when BB_QUIET is set', () => {
    process.env.BB_QUIET = '1';
    requireBb1Address(ZERO_ETH, '<address>');
    const stderrCall = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrCall).not.toContain('Normalized');
  });

  it('does NOT emit a normalization notice when input is already bb1', () => {
    requireBb1Address(ZERO_BB1, '<address>');
    const stderrCall = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrCall).not.toContain('Normalized');
  });
});

describe('requireBb1AddressStrict', () => {
  let exitSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('process.exit');
    }) as never);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
    delete process.env.BB_ADDRESS_AUTO_CONVERT;
  });

  it('returns bb1 for valid bb1 input', () => {
    expect(requireBb1AddressStrict(ZERO_BB1, '--creator')).toBe(ZERO_BB1);
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('REJECTS 0x input with a bb account convert hint', () => {
    expect(() => requireBb1AddressStrict(ZERO_ETH, '--creator')).toThrow('process.exit');
    const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrText).toContain('--creator');
    expect(stderrText).toContain('0x form');
    expect(stderrText).toContain('bb account convert');
    expect(stderrText).toContain('BB_ADDRESS_AUTO_CONVERT=1');
  });

  it('REJECTS empty input with a clear error', () => {
    expect(() => requireBb1AddressStrict('', '--creator')).toThrow('process.exit');
    const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrText).toContain('--creator requires a bb1... address');
  });

  it('rejects malformed bb1 input', () => {
    expect(() => requireBb1AddressStrict('bb1garbage', '--creator')).toThrow('process.exit');
    const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrText).toContain('invalid bb1 address');
  });

  it('honors BB_ADDRESS_AUTO_CONVERT=1 by delegating to requireBb1Address', () => {
    process.env.BB_ADDRESS_AUTO_CONVERT = '1';
    expect(requireBb1AddressStrict(ZERO_ETH, '--creator')).toBe(ZERO_BB1);
    expect(exitSpy).not.toHaveBeenCalled();
    const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join('');
    // The lenient path emits a "Normalized X → Y" notice (unless BB_QUIET).
    expect(stderrText).toContain('Normalized');
  });

  it('does NOT silently convert when env var is unset', () => {
    expect(() => requireBb1AddressStrict(ZERO_ETH, '--creator')).toThrow('process.exit');
  });
});

describe('resolveRecipientList', () => {
  let exitSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((_code?: number) => {
      throw new Error('process.exit');
    }) as never);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  it('splits a comma-joined string and strictly validates each element', () => {
    expect(resolveRecipientList(`${ZERO_BB1}, ${ZERO_BB1}`, '--to')).toEqual([ZERO_BB1, ZERO_BB1]);
  });

  it('accepts the repeatable-argument (string[]) form', () => {
    expect(resolveRecipientList([ZERO_BB1, `${ZERO_BB1},${ZERO_BB1}`], '--to')).toEqual([
      ZERO_BB1, ZERO_BB1, ZERO_BB1
    ]);
  });

  it('does not dedupe (downstream builders own that)', () => {
    expect(resolveRecipientList(`${ZERO_BB1},${ZERO_BB1}`, '--to')).toHaveLength(2);
  });

  it('rejects a malformed element via requireBb1AddressStrict', () => {
    expect(() => resolveRecipientList(`${ZERO_BB1},bb1garbage`, '--to')).toThrow('process.exit');
    const stderrText = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(stderrText).toContain('invalid bb1 address');
  });

  it('rejects a non-bb1 (0x) element', () => {
    expect(() => resolveRecipientList(ZERO_ETH, '--to')).toThrow('process.exit');
  });
});
