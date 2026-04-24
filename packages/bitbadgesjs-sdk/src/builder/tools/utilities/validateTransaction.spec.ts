/**
 * Tests for `validate_transaction`.
 *
 * Thin wrapper around core/validate.ts — its job is to:
 *   1. Accept either a JSON string, a pre-parsed object (via `transaction`),
 *      OR auto-fill from the current session state when neither is given
 *   2. Normalize to an object, type-check, and pass to the full SDK validator
 *   3. Wrap parse/type errors in the standard issues[] format
 *
 * Tests below hit every branch in the normalization layer. Business-logic
 * coverage lives in `src/core/validate.spec.ts` (separate suite).
 */

import { handleValidateTransaction } from './validateTransaction.js';
import { resetAllSessions, setStandards, addApproval } from '../../session/sessionState.js';

describe('handleValidateTransaction — input normalization', () => {
  const validTx = {
    '@type': '/badges.MsgUniversalUpdateCollection',
    creator: 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv',
    collectionId: '0'
    // Other fields may produce validator warnings, but the wrapper itself
    // doesn't care — it just needs to reach the inner `validateTransaction`.
  };

  // Keep session state clean between tests — the wrapper falls back to
  // session state now (#0326), so stale state from one test can leak into
  // the next.
  beforeEach(() => {
    resetAllSessions();
  });

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

    it('treats an empty-string transactionJson as "no input" and auto-fills from session (NOT "Unexpected EOF")', () => {
      // Previously this returned "Invalid JSON: Unexpected EOF" — an
      // unrecoverable error that agents loop on. Post-#0326, an empty
      // string is treated like "no input provided" — the wrapper
      // auto-fills from session state and returns the real validation
      // issues (e.g. "missing creator") from the SDK validator, which
      // the agent CAN act on.
      const res = handleValidateTransaction({ transactionJson: '' });
      expect(res.valid).toBe(false);
      expect(res.issues.length).toBeGreaterThan(0);
      for (const issue of res.issues) {
        expect(issue.message).not.toMatch(/Unexpected EOF/);
        expect(issue.message).not.toMatch(/Invalid JSON/);
      }
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

  describe('session-state auto-fill (#0326)', () => {
    it('without transaction or transactionJson, auto-fills from session state', () => {
      // Populate session state via the same per-field setters the MCP
      // agent uses.
      const sessionId = 'test-session-validate-autofill';
      const creator = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
      setStandards(sessionId, ['BitBadges']);
      addApproval(sessionId, {
        fromListId: 'Mint',
        toListId: 'All',
        initiatedByListId: 'All',
        transferTimes: [{ start: '1', end: '18446744073709551615' }],
        tokenIds: [{ start: '1', end: '1' }],
        ownershipTimes: [{ start: '1', end: '18446744073709551615' }],
        approvalId: 'test-approval',
        approvalCriteria: {}
      });

      // Agent-style call with no tx args — must NOT return "Invalid JSON:
      // Unexpected EOF" (the bug #0326 fixed). Should either validate the
      // session tx or return validation issues from the SDK validator.
      const res = handleValidateTransaction({ sessionId, creatorAddress: creator } as any);
      expect(res).toHaveProperty('valid');
      expect(Array.isArray(res.issues)).toBe(true);
      for (const issue of res.issues) {
        expect(issue.message).not.toMatch(/Unexpected EOF/);
        expect(issue.message).not.toMatch(/No transaction to validate/);
      }
    });

    it('without any input and a fresh (auto-created) session, returns real validator issues — NOT "Unexpected EOF"', () => {
      // No args at all. getOrCreateSession returns a template tx with
      // all 11 canX permission arrays defaulted to []; validator runs
      // against that template and surfaces real issues (e.g. missing
      // creator) the agent can fix. Critically, this path must NOT
      // surface "Invalid JSON: Unexpected EOF" — the bug pattern that
      // caused #0326.
      const res = handleValidateTransaction({} as any);
      expect(res.valid).toBe(false);
      expect(res.issues.length).toBeGreaterThan(0);
      for (const issue of res.issues) {
        expect(issue.severity).toBeDefined();
        expect(issue.message).not.toMatch(/Unexpected EOF/);
        expect(issue.message).not.toMatch(/Invalid JSON/);
      }
    });
  });
});
