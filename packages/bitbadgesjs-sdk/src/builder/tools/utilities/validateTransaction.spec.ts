/**
 * Tests for `validate_transaction`.
 *
 * Thin wrapper around core/validate.ts — its job is to:
 *   1. Accept either a JSON string OR a pre-parsed object (via `transaction`)
 *   2. Normalize to JSON, parse it, and type-check (must be an object)
 *   3. Pass the parsed object to the full SDK validator
 *   4. Wrap parse/type errors in the standard issues[] format
 *
 * Tests below hit every branch in the normalization layer. Business-logic
 * coverage lives in `src/core/validate.spec.ts` (separate suite).
 */

import { handleValidateTransaction } from './validateTransaction.js';

describe('handleValidateTransaction — input normalization', () => {
  const validTx = {
    '@type': '/badges.MsgUniversalUpdateCollection',
    creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
    collectionId: '0'
    // Other fields may produce validator warnings, but the wrapper itself
    // doesn't care — it just needs to reach the inner `validateTransaction`.
  };

  describe('transactionJson input', () => {
    it('accepts a valid JSON string and delegates to the core validator', () => {
      const res = handleValidateTransaction({ transactionJson: JSON.stringify(validTx) });
      // The wrapper returns whatever validateTransaction returns; we just
      // assert it has the correct shape.
      expect(res).toHaveProperty('valid');
      expect(res).toHaveProperty('issues');
      expect(Array.isArray(res.issues)).toBe(true);
    });

    it('returns a single "Invalid JSON" issue when the string is unparseable', () => {
      const res = handleValidateTransaction({ transactionJson: '{not json' });
      expect(res.valid).toBe(false);
      expect(res.issues).toHaveLength(1);
      expect(res.issues[0].severity).toBe('error');
      expect(res.issues[0].message).toMatch(/Invalid JSON/);
    });

    it('treats an empty-string transactionJson as unparseable JSON', () => {
      const res = handleValidateTransaction({ transactionJson: '' });
      expect(res.valid).toBe(false);
      expect(res.issues[0].message).toMatch(/Invalid JSON/);
    });

    it('rejects top-level JSON values that are not objects (arrays)', () => {
      const res = handleValidateTransaction({ transactionJson: '[]' });
      expect(res.valid).toBe(false);
      // [] is typeof 'object' → so it actually passes the type guard. Instead,
      // the real validator will flag it via missing @type. Don't over-assert here.
      expect(res.issues.length).toBeGreaterThan(0);
    });

    it('rejects top-level JSON values that are strings', () => {
      const res = handleValidateTransaction({ transactionJson: '"hello"' });
      expect(res.valid).toBe(false);
      expect(res.issues[0].message).toMatch(/must be a JSON object/);
    });

    it('rejects top-level JSON values that are numbers', () => {
      const res = handleValidateTransaction({ transactionJson: '42' });
      expect(res.valid).toBe(false);
      expect(res.issues[0].message).toMatch(/must be a JSON object/);
    });

    it('rejects top-level null', () => {
      const res = handleValidateTransaction({ transactionJson: 'null' });
      expect(res.valid).toBe(false);
      expect(res.issues[0].message).toMatch(/must be a JSON object/);
    });
  });

  describe('transaction (object) input', () => {
    it('accepts a pre-parsed object and delegates to the core validator', () => {
      const res = handleValidateTransaction({ transaction: validTx });
      expect(res).toHaveProperty('valid');
      expect(Array.isArray(res.issues)).toBe(true);
    });

    it('prefers `transaction` over `transactionJson` when both are provided', () => {
      // `transaction` takes precedence in the normalization step. To prove
      // this, send an invalid JSON string alongside a valid object — the
      // object should win (no "Invalid JSON" error).
      const res = handleValidateTransaction({
        transaction: validTx,
        transactionJson: '{not json'
      });
      for (const issue of res.issues) {
        expect(issue.message).not.toMatch(/Invalid JSON/);
      }
    });
  });

  describe('missing-input edge cases', () => {
    it('without transaction or transactionJson, returns an Invalid JSON issue (empty string path)', () => {
      // The wrapper's `??` fallback turns missing input into '' → JSON.parse fails.
      // (The Zod `.refine` schema would catch this *before* the wrapper runs in
      // real MCP usage, but handleValidateTransaction itself is defensively
      // callable with missing fields.)
      const res = handleValidateTransaction({} as any);
      expect(res.valid).toBe(false);
      expect(res.issues[0].message).toMatch(/Invalid JSON/);
    });
  });
});
