/**
 * Tests for the pure helpers in `walkthrough-transfer.ts`. The
 * interactive walkthrough itself is hard to unit test (readline
 * prompts + network) — these cover the parsing + summarization
 * logic the prompt loop depends on.
 */

import {
  parseTokenIdSpec,
  parseIndexList,
  toCandidate,
  summarize,
  isYes
} from './walkthrough-transfer.js';

describe('isYes', () => {
  it('accepts y/Y/yes/YES (any case, with whitespace)', () => {
    for (const v of ['y', 'Y', 'yes', 'YES', 'Yes', '  y  ', 'yEs']) {
      expect(isYes(v)).toBe(true);
    }
  });

  it('rejects everything else (default = no)', () => {
    for (const v of ['', 'n', 'no', 'maybe', 'sure', '1', 'true']) {
      expect(isYes(v)).toBe(false);
    }
  });
});

describe('parseTokenIdSpec', () => {
  it('returns the all-tokens range for blank/all', () => {
    expect(parseTokenIdSpec('')).toEqual([{ start: '1', end: '18446744073709551615' }]);
    expect(parseTokenIdSpec('all')).toEqual([{ start: '1', end: '18446744073709551615' }]);
    expect(parseTokenIdSpec('  ALL  ')).toEqual([{ start: '1', end: '18446744073709551615' }]);
  });

  it('parses a single id as a one-wide range', () => {
    expect(parseTokenIdSpec('5')).toEqual([{ start: '5', end: '5' }]);
  });

  it('parses a hyphen range', () => {
    expect(parseTokenIdSpec('1-10')).toEqual([{ start: '1', end: '10' }]);
  });

  it('parses comma-separated ranges + singletons', () => {
    expect(parseTokenIdSpec('1-5,7,9-11')).toEqual([
      { start: '1', end: '5' },
      { start: '7', end: '7' },
      { start: '9', end: '11' }
    ]);
  });
});

describe('parseIndexList', () => {
  it('1-indexes user input and clamps to range', () => {
    expect(parseIndexList('1,2,3', 5)).toEqual([0, 1, 2]);
  });

  it('drops non-numeric, out-of-range, and zero entries', () => {
    expect(parseIndexList('1, foo, 0, 99, 2', 3)).toEqual([0, 1]);
  });

  it('returns [] for blank input', () => {
    expect(parseIndexList('', 5)).toEqual([]);
  });
});

describe('toCandidate / summarize', () => {
  const baseRaw = {
    approvalId: 'transfer-all',
    version: '0',
    fromListId: 'All',
    toListId: 'All',
    initiatedByListId: 'All',
    approvalCriteria: {}
  };

  it('extracts the canonical fields from a raw collection approval', () => {
    const c = toCandidate('collection', '', baseRaw);
    expect(c.level).toBe('collection');
    expect(c.approvalId).toBe('transfer-all');
    expect(c.fromListId).toBe('All');
    expect(c.hasPredeterminedBalances).toBe(false);
  });

  it('flags predeterminedBalances when present', () => {
    const c = toCandidate('collection', '', {
      ...baseRaw,
      approvalCriteria: { predeterminedBalances: { manualBalances: [] } }
    });
    expect(c.hasPredeterminedBalances).toBe(true);
  });

  it('summary surfaces tags for predetermined / payment / must-own / backed', () => {
    const c = toCandidate('collection', '', {
      ...baseRaw,
      approvalCriteria: {
        predeterminedBalances: { manualBalances: [] },
        coinTransfers: [{ to: 'bb1xxx', coins: [{ amount: '1', denom: 'ubadge' }] }],
        mustOwnTokens: [{ collectionId: '1' }],
        allowBackedMinting: true
      }
    });
    const s = summarize(c);
    expect(s).toContain('predetermined');
    expect(s).toContain('payment');
    expect(s).toContain('must-own');
    expect(s).toContain('backed');
  });

  it('summary stays compact when no special tags apply', () => {
    const c = toCandidate('outgoing', 'bb1from', baseRaw);
    const s = summarize(c);
    expect(s).toContain('"transfer-all"');
    expect(s).toContain('from=All');
    expect(s).toContain('to=All');
    expect(s).not.toContain('[');
  });
});
