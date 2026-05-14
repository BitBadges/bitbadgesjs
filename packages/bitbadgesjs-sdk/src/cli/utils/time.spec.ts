/**
 * Tests for the unified time-flag parser.
 */
import { parseTimeFlag } from './time.js';

describe('parseTimeFlag', () => {
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
  });

  it('accepts raw ms-since-epoch (13-digit)', () => {
    expect(parseTimeFlag('1748140800000', '--expiry')).toBe(1_748_140_800_000n);
  });

  it('accepts raw ms-since-epoch at the 10-digit boundary', () => {
    expect(parseTimeFlag('1700000000', '--expiry')).toBe(1_700_000_000n);
  });

  it('parses 24h duration as delta from now', () => {
    expect(parseTimeFlag('24h', '--expiry')).toBe(1_700_000_000_000n + 86_400_000n);
  });

  it('parses 7d duration', () => {
    expect(parseTimeFlag('7d', '--expiry')).toBe(1_700_000_000_000n + 7n * 86_400_000n);
  });

  it('parses 30d duration', () => {
    expect(parseTimeFlag('30d', '--expiry')).toBe(1_700_000_000_000n + 30n * 86_400_000n);
  });

  it('parses monthly keyword', () => {
    expect(parseTimeFlag('monthly', '--expiry')).toBe(1_700_000_000_000n + 30n * 86_400_000n);
  });

  it('parses annually keyword', () => {
    expect(parseTimeFlag('annually', '--expiry')).toBe(1_700_000_000_000n + 365n * 86_400_000n);
  });

  it('parses daily keyword', () => {
    expect(parseTimeFlag('daily', '--expiry')).toBe(1_700_000_000_000n + 86_400_000n);
  });

  it('rejects short numeric input that could be confused for a bare-ms duration', () => {
    // Pure 7 (< 10 digits) falls through to parseDuration which rejects
    // unitless input. The user almost certainly meant "7d" or a real
    // timestamp.
    expect(() => parseTimeFlag('7', '--expiry')).toThrow();
  });

  it('rejects empty input', () => {
    expect(() => parseTimeFlag('', '--expiry')).toThrow(/Missing time value/);
  });

  it('rejects garbage with a helpful hint', () => {
    expect(() => parseTimeFlag('next week', '--expiry')).toThrow(/Invalid time value.*duration shorthand/s);
  });

  it('includes the context label in error messages', () => {
    try {
      parseTimeFlag('next week', '--valid-until');
    } catch (e: any) {
      expect(e.message).toContain('--valid-until');
    }
  });
});
