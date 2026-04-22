/**
 * Tests for `set_valid_token_ids` builder tool.
 *
 * handleSetValidTokenIds validates a list of token-id ranges (uint64 strings)
 * and writes them into the in-memory session. The file previously had zero
 * tests even though the validation logic is the last line of defense before a
 * malformed tokenIds array reaches the chain — negative values, reversed
 * ranges, or out-of-uint64 bounds would all abort the transaction at tx-check
 * time. Every branch in the validator (negative start/end, >MAX_UINT64
 * start/end, start>end, non-numeric) is exercised below.
 *
 * On success we also verify the session state is mutated the way downstream
 * per-field tools assume: `validTokenIds` set to the provided array and
 * `updateValidTokenIds` flagged true.
 */
import { handleSetValidTokenIds } from './setValidTokenIds.js';
import { getOrCreateSession, resetAllSessions } from '../../session/sessionState.js';

const MAX_UINT64 = '18446744073709551615';

describe('handleSetValidTokenIds', () => {
  beforeEach(() => resetAllSessions());

  describe('happy path', () => {
    it('accepts a single 1..1 range (fungible token / subscription)', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '1', end: '1' }] });
      expect(res.success).toBe(true);
      expect(res.tokenIds).toEqual([{ start: '1', end: '1' }]);
    });

    it('accepts a large NFT range 1..100', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '1', end: '100' }] });
      expect(res.success).toBe(true);
      expect(res.tokenIds).toEqual([{ start: '1', end: '100' }]);
    });

    it('accepts multiple ranges', () => {
      const res = handleSetValidTokenIds({
        tokenIds: [
          { start: '1', end: '10' },
          { start: '100', end: '200' }
        ]
      });
      expect(res.success).toBe(true);
      expect(res.tokenIds).toHaveLength(2);
    });

    it('accepts a range at exactly MAX_UINT64 on both sides', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: MAX_UINT64, end: MAX_UINT64 }] });
      expect(res.success).toBe(true);
    });

    it('accepts start === end === "0" (zero is a valid uint64)', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '0', end: '0' }] });
      expect(res.success).toBe(true);
    });

    it('accepts an empty tokenIds array without complaining (edge case — no iteration)', () => {
      const res = handleSetValidTokenIds({ tokenIds: [] });
      expect(res.success).toBe(true);
      expect(res.tokenIds).toEqual([]);
    });
  });

  describe('validation errors', () => {
    it('rejects a negative start', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '-1', end: '5' }] });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/start.*negative/i);
    });

    it('rejects a negative end', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '1', end: '-5' }] });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/end.*negative/i);
    });

    it('rejects a start > MAX_UINT64', () => {
      const overflow = (BigInt(MAX_UINT64) + 1n).toString();
      const res = handleSetValidTokenIds({ tokenIds: [{ start: overflow, end: overflow }] });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/start.*max uint64/i);
    });

    it('rejects an end > MAX_UINT64', () => {
      const overflow = (BigInt(MAX_UINT64) + 1n).toString();
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '1', end: overflow }] });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/end.*max uint64/i);
    });

    it('rejects reversed range (start > end)', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '10', end: '5' }] });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/start.*> end/i);
    });

    it('rejects non-numeric strings', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: 'abc', end: '5' }] });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/numeric/i);
    });

    it('rejects decimals (BigInt parser throws on "1.5")', () => {
      const res = handleSetValidTokenIds({ tokenIds: [{ start: '1.5', end: '5' }] });
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/numeric/i);
    });

    it('fails on the first bad range and does not mutate the session', () => {
      const res = handleSetValidTokenIds({
        tokenIds: [
          { start: '1', end: '10' }, // valid
          { start: '5', end: '1' }   // invalid — triggers bail
        ]
      });
      expect(res.success).toBe(false);
      // Validation aborted before any session was written to. Calling
      // getOrCreateSession() here creates a fresh blank session whose
      // validTokenIds default is [].
      const session = getOrCreateSession();
      expect(session.messages[0].value.validTokenIds).toEqual([]);
    });
  });

  describe('session mutation', () => {
    it('writes tokenIds into the session and flips updateValidTokenIds', () => {
      const session = getOrCreateSession();
      // updateValidTokenIds defaults to true, so the assertion below would be
      // vacuous without first resetting to false.
      session.messages[0].value.updateValidTokenIds = false;
      handleSetValidTokenIds({ tokenIds: [{ start: '1', end: '5' }] });
      expect(session.messages[0].value.validTokenIds).toEqual([{ start: '1', end: '5' }]);
      expect(session.messages[0].value.updateValidTokenIds).toBe(true);
    });

    it('replaces prior ranges on a second call (set semantics, not append)', () => {
      handleSetValidTokenIds({ tokenIds: [{ start: '1', end: '5' }] });
      handleSetValidTokenIds({ tokenIds: [{ start: '10', end: '20' }] });
      const session = getOrCreateSession();
      expect(session.messages[0].value.validTokenIds).toEqual([{ start: '10', end: '20' }]);
    });

    it('isolates sessions by sessionId', () => {
      handleSetValidTokenIds({ sessionId: 'alpha', tokenIds: [{ start: '1', end: '5' }] });
      handleSetValidTokenIds({ sessionId: 'bravo', tokenIds: [{ start: '100', end: '200' }] });
      expect(getOrCreateSession('alpha').messages[0].value.validTokenIds).toEqual([{ start: '1', end: '5' }]);
      expect(getOrCreateSession('bravo').messages[0].value.validTokenIds).toEqual([{ start: '100', end: '200' }]);
    });
  });
});
