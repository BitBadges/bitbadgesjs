/**
 * Tests for the CLI address-normalization helpers. The conversion itself
 * is exercised by `address-converter/converter.spec.ts` — these tests
 * focus on the CLI-side ergonomics (empty-string-on-failure, exit on
 * malformed input, stderr normalization notice gating).
 */

import { tryBb1Address, requireBb1Address } from './address.js';

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
