/**
 * Tests for the errorPatterns registry and findMatchingErrorPatterns helper.
 *
 * Covers the two patterns added / updated in ticket #219 so the indexer
 * AI-builder fix-loop (which consumes this registry via the
 * `bitbadgesjs-sdk/builder/resources` export) can rely on them matching
 * the exact error strings coming out of `/api/v0/builder/ai-build`.
 */

import { ERROR_PATTERNS, findMatchingErrorPatterns } from './errorPatterns.js';

describe('errorPatterns', () => {
  describe('findMatchingErrorPatterns', () => {
    it('returns [] for empty/falsy input', () => {
      expect(findMatchingErrorPatterns('')).toEqual([]);
      expect(findMatchingErrorPatterns(undefined as unknown as string)).toEqual([]);
    });

    it('matches the fee-denom pattern for Session A\'s exact error string', () => {
      const err =
        '[simulation] jsonToTxBytes: fee.amount[0].denom is required. ' +
        'Pass the denom the caller intends to pay fees in (e.g. "ubadge").';
      const hits = findMatchingErrorPatterns(err);
      expect(hits.length).toBeGreaterThan(0);
      const byName = hits.find((p) => p.name === 'Missing fee denom on transaction');
      expect(byName).toBeDefined();
      expect(byName!.fix.toLowerCase()).toContain('ubadge');
      expect(byName!.explanation.toLowerCase()).toContain('fee');
    });

    it('matches the autoApproveAllIncomingTransfers pattern for Session B\'s error string', () => {
      const err =
        '[standards] Collections with token-creation (Mint) approvals MUST have ' +
        'defaultBalances.autoApproveAllIncomingTransfers: true.';
      const hits = findMatchingErrorPatterns(err);
      const byName = hits.find((p) => p.name === 'Missing autoApproveAllIncomingTransfers');
      expect(byName).toBeDefined();
      // UPDATE-flow guidance must be present — this is the #219 delta
      expect(byName!.fix).toMatch(/updateDefaultBalances/);
      expect(byName!.explanation).toMatch(/update/i);
    });

    it('is case-insensitive', () => {
      const err = 'FEE.AMOUNT[0].DENOM IS REQUIRED';
      const hits = findMatchingErrorPatterns(err);
      expect(hits.some((p) => p.name === 'Missing fee denom on transaction')).toBe(true);
    });

    it('returns multiple patterns if the error hits more than one trigger', () => {
      // Contains substrings that match multiple categories
      const err = 'insufficient funds and invalid address format';
      const hits = findMatchingErrorPatterns(err);
      expect(hits.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ERROR_PATTERNS registry shape (consumed by indexer buildFixPrompt)', () => {
    it('every entry has the stable shape { name, category, triggers, explanation, fix }', () => {
      for (const p of ERROR_PATTERNS) {
        expect(typeof p.name).toBe('string');
        expect(typeof p.category).toBe('string');
        expect(Array.isArray(p.triggers)).toBe(true);
        expect(p.triggers.length).toBeGreaterThan(0);
        expect(typeof p.explanation).toBe('string');
        expect(typeof p.fix).toBe('string');
      }
    });

    it('has the new fee-denom entry', () => {
      expect(ERROR_PATTERNS.some((p) => p.name === 'Missing fee denom on transaction')).toBe(true);
    });
  });
});
