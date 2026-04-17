/**
 * Tests for `diagnose_error`.
 *
 * Scores each error pattern against the user-supplied error message + context,
 * returns the top match as `diagnosis` and the next ≤3 as `suggestions`.
 * Scoring rules:
 *   - +10 per trigger keyword present in (error + context)
 *   - +5 extra if the trigger is in the error itself (not just context)
 *   - +3 if the category name appears in (error + context)
 *
 * These tests exercise:
 *   - happy-path match for several distinct known categories
 *   - the trigger-in-error bonus (error > context)
 *   - the no-match path (suggestions empty, `tip` points to next steps)
 *   - case-insensitivity
 *   - multiple-pattern resolution (top pick is the highest score)
 */

import { handleDiagnoseError } from './diagnoseError.js';
import { ERROR_PATTERNS } from '../../resources/errorPatterns.js';

describe('handleDiagnoseError', () => {
  describe('matches known error categories', () => {
    it('diagnoses "cannot unmarshal number" → Numbers-not-strings pattern', () => {
      const res = handleDiagnoseError({ error: 'json: cannot unmarshal number into Go struct' });
      expect(res.success).toBe(true);
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.category).toBe('serialization');
      expect(res.diagnosis!.matchedPattern).toMatch(/Numbers not strings/i);
    });

    it('diagnoses "account sequence mismatch" → signing category', () => {
      const res = handleDiagnoseError({ error: 'account sequence mismatch, expected 5, got 4' });
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.category).toBe('signing');
      expect(res.diagnosis!.matchedPattern).toMatch(/sequence/i);
    });

    it('diagnoses "out of gas" → insufficient gas pattern', () => {
      const res = handleDiagnoseError({ error: 'out of gas in location' });
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.matchedPattern).toMatch(/gas/i);
    });

    it('diagnoses "insufficient funds" → signing category', () => {
      const res = handleDiagnoseError({ error: 'insufficient funds: need 100ubadge' });
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.category).toBe('signing');
    });

    it('diagnoses "decoding bech32" → invalid address format', () => {
      const res = handleDiagnoseError({ error: 'failed decoding bech32: checksum error' });
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.category).toBe('address');
    });

    it('diagnoses "auto-scan failed" → transfer category', () => {
      const res = handleDiagnoseError({ error: 'auto-scan failed — must explicitly prioritize approvals' });
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.category).toBe('transfer');
    });
  });

  describe('scoring edge cases', () => {
    it('returns success=false when no pattern matches', () => {
      const res = handleDiagnoseError({ error: 'xyzzy totally unrelated gibberish 12345' });
      expect(res.success).toBe(false);
      expect(res.diagnosis).toBeNull();
      expect(res.suggestions).toHaveLength(0);
      expect(res.tip).toMatch(/No matching error pattern/i);
      expect(res.tip).toMatch(/validate_transaction/);
    });

    it('match is case-insensitive (SHOUTING error message still matches)', () => {
      const res = handleDiagnoseError({ error: 'ACCOUNT SEQUENCE MISMATCH' });
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.category).toBe('signing');
    });

    it('context alone (not error) can match, though with a weaker score', () => {
      const res = handleDiagnoseError({ error: 'something went wrong', context: 'out of gas' });
      // The trigger is in context but not error → should still match
      expect(res.diagnosis).not.toBeNull();
      expect(res.diagnosis!.matchedPattern).toMatch(/gas/i);
    });

    it('prefers a pattern matched in the error over one matched only in the context', () => {
      // Two keywords, one in error (+15), one in context-only (+10)
      const res = handleDiagnoseError({
        error: 'account sequence mismatch',
        context: 'out of gas' // different pattern, context-only
      });
      expect(res.diagnosis).not.toBeNull();
      // The error-side keyword gets the +5 bonus, so it should win.
      expect(res.diagnosis!.matchedPattern).toMatch(/sequence/i);
    });

    it('returns up to 3 suggestions (after the top match) when multiple patterns score > 0', () => {
      // Craft a query that hits many patterns simultaneously
      const res = handleDiagnoseError({
        error: 'invalid address sequence gas unmarshal number insufficient funds auto-scan'
      });
      expect(res.diagnosis).not.toBeNull();
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions.length).toBeLessThanOrEqual(3);
    });

    it('suggestions are sorted by descending relevance', () => {
      const res = handleDiagnoseError({
        error: 'invalid address sequence gas unmarshal insufficient funds auto-scan'
      });
      for (let i = 0; i + 1 < res.suggestions.length; i++) {
        expect(res.suggestions[i].relevance).toBeGreaterThanOrEqual(res.suggestions[i + 1].relevance);
      }
    });
  });

  describe('output shape', () => {
    it('tip always references simulate_transaction as a next step when a diagnosis exists', () => {
      const res = handleDiagnoseError({ error: 'out of gas' });
      expect(res.tip).toMatch(/simulate_transaction/);
    });

    it('diagnosis object exposes explanation + fix, and optionally an example', () => {
      const res = handleDiagnoseError({ error: 'cannot unmarshal number' });
      expect(res.diagnosis).not.toBeNull();
      expect(typeof res.diagnosis!.explanation).toBe('string');
      expect(res.diagnosis!.explanation.length).toBeGreaterThan(10);
      expect(typeof res.diagnosis!.fix).toBe('string');
      expect(res.diagnosis!.fix.length).toBeGreaterThan(10);
      // "Numbers not strings" has an example
      expect(res.diagnosis!.example).toBeDefined();
    });

    it('suggestions include pattern, category, and relevance fields', () => {
      const res = handleDiagnoseError({
        error: 'invalid address sequence gas unmarshal insufficient funds auto-scan'
      });
      for (const s of res.suggestions) {
        expect(typeof s.pattern).toBe('string');
        expect(typeof s.category).toBe('string');
        expect(typeof s.relevance).toBe('number');
        expect(s.relevance).toBeGreaterThan(0);
      }
    });
  });

  describe('invariants across all ERROR_PATTERNS', () => {
    it('every pattern has at least one trigger that would match itself', () => {
      // Sanity check on the resource: if a pattern has no triggers, it can never match.
      for (const pattern of ERROR_PATTERNS) {
        expect(pattern.triggers.length).toBeGreaterThan(0);
      }
    });

    it('every pattern can be matched by feeding back its first trigger', () => {
      for (const pattern of ERROR_PATTERNS) {
        const res = handleDiagnoseError({ error: pattern.triggers[0] });
        expect(res.diagnosis).not.toBeNull();
        // The top match isn't guaranteed to be *this* pattern (overlap between
        // pattern triggers is possible), but SOMETHING must match.
      }
    });
  });
});
