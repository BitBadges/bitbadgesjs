/**
 * Tests for `get_current_timestamp`.
 *
 * Returns the current time in ms (as a string for BitBadges' string-encoded
 * numeric convention), plus a handful of pre-computed helper values the LLM
 * uses when setting up time-bounded approvals (claim windows, transfer
 * times, etc.). Uses `jest.useFakeTimers` to pin time and assert exact values.
 *
 * Each path and every helper field is checked at least once.
 */

import { handleGetCurrentTimestamp } from './getCurrentTimestamp.js';

const FIXED_MS = 1700000000000; // 2023-11-14T22:13:20.000Z

const FIVE_MIN = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;
const ONE_YEAR = 365 * ONE_DAY;

describe('handleGetCurrentTimestamp', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(FIXED_MS));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('no offsets', () => {
    it('returns current timestamp as both string and number', () => {
      const res = handleGetCurrentTimestamp({});
      expect(res.timestampMs).toBe(FIXED_MS);
      expect(res.timestamp).toBe(String(FIXED_MS));
    });

    it('returns isoDate matching the timestamp', () => {
      const res = handleGetCurrentTimestamp({});
      expect(res.isoDate).toBe(new Date(FIXED_MS).toISOString());
    });

    it('returns MAX_UINT64 as foreverEnd (for "never expires" semantics)', () => {
      const res = handleGetCurrentTimestamp({});
      expect(res.foreverEnd).toBe('18446744073709551615');
    });

    it('helpers are computed relative to now', () => {
      const res = handleGetCurrentTimestamp({});
      expect(res.helpers.fiveMinutesFromNow).toBe(String(FIXED_MS + FIVE_MIN));
      expect(res.helpers.oneHourFromNow).toBe(String(FIXED_MS + ONE_HOUR));
      expect(res.helpers.oneDayFromNow).toBe(String(FIXED_MS + ONE_DAY));
      expect(res.helpers.oneWeekFromNow).toBe(String(FIXED_MS + ONE_WEEK));
      expect(res.helpers.oneMonthFromNow).toBe(String(FIXED_MS + ONE_MONTH));
      expect(res.helpers.oneYearFromNow).toBe(String(FIXED_MS + ONE_YEAR));
    });

    it('durations are constant (not relative to now)', () => {
      const res = handleGetCurrentTimestamp({});
      expect(res.durations.fiveMinutes).toBe(String(FIVE_MIN));
      expect(res.durations.oneHour).toBe(String(ONE_HOUR));
      expect(res.durations.oneDay).toBe(String(ONE_DAY));
      expect(res.durations.oneWeek).toBe(String(ONE_WEEK));
      expect(res.durations.oneMonth).toBe(String(ONE_MONTH));
      expect(res.durations.oneYear).toBe(String(ONE_YEAR));
    });
  });

  describe('offsets', () => {
    it('offsetMs adds to now', () => {
      const res = handleGetCurrentTimestamp({ offsetMs: 12345 });
      expect(res.timestampMs).toBe(FIXED_MS + 12345);
    });

    it('offsetHours adds `hours * 3600_000` to now', () => {
      const res = handleGetCurrentTimestamp({ offsetHours: 3 });
      expect(res.timestampMs).toBe(FIXED_MS + 3 * ONE_HOUR);
    });

    it('offsetDays adds `days * 86_400_000` to now', () => {
      const res = handleGetCurrentTimestamp({ offsetDays: 7 });
      expect(res.timestampMs).toBe(FIXED_MS + 7 * ONE_DAY);
    });

    it('all offsets combine additively (ms + hours + days)', () => {
      const res = handleGetCurrentTimestamp({ offsetMs: 100, offsetHours: 2, offsetDays: 1 });
      expect(res.timestampMs).toBe(FIXED_MS + 100 + 2 * ONE_HOUR + ONE_DAY);
    });

    it('negative offsets move backward in time', () => {
      const res = handleGetCurrentTimestamp({ offsetHours: -1 });
      expect(res.timestampMs).toBe(FIXED_MS - ONE_HOUR);
    });

    it('helpers are computed relative to the offset-adjusted "now", not wall clock', () => {
      const res = handleGetCurrentTimestamp({ offsetDays: 30 });
      expect(res.helpers.oneDayFromNow).toBe(String(FIXED_MS + 30 * ONE_DAY + ONE_DAY));
    });

    it('offsetMs=0 and offsetHours=0 behave as if omitted (falsy, skipped by `if (input.x)`)', () => {
      const res = handleGetCurrentTimestamp({ offsetMs: 0, offsetHours: 0, offsetDays: 0 });
      expect(res.timestampMs).toBe(FIXED_MS);
    });
  });

  describe('output shape invariants', () => {
    it('timestamp is always the String() of timestampMs', () => {
      const res = handleGetCurrentTimestamp({ offsetDays: 5 });
      expect(res.timestamp).toBe(String(res.timestampMs));
    });

    it('every helper key exists and is a string', () => {
      const res = handleGetCurrentTimestamp({});
      const keys = ['fiveMinutesFromNow', 'oneHourFromNow', 'oneDayFromNow', 'oneWeekFromNow', 'oneMonthFromNow', 'oneYearFromNow'] as const;
      for (const k of keys) {
        expect(typeof res.helpers[k]).toBe('string');
      }
    });

    it('every duration key exists and is a string', () => {
      const res = handleGetCurrentTimestamp({});
      const keys = ['fiveMinutes', 'oneHour', 'oneDay', 'oneWeek', 'oneMonth', 'oneYear'] as const;
      for (const k of keys) {
        expect(typeof res.durations[k]).toBe('string');
      }
    });
  });
});
