/**
 * Tests for `add_transfer` builder tool.
 *
 * handleAddTransfer appends a MsgTransferTokens message after the
 * collection-create message, used for auto-mint flows. Key behaviors:
 *
 *   - Appends a new message at the end of session.messages.
 *   - typeUrl is '/tokenization.MsgTransferTokens'.
 *   - value.collectionId is auto-set to "0" (the just-created collection).
 *   - value.creator is pulled from messages[0].value.creator (even if
 *     that's empty — e.g. session was auto-created without creatorAddress).
 *   - `from: "Mint"` passes through unchanged; any other address is
 *     normalized to bb1 via ensureBb1.
 *   - Returns {success, messageIndex, note} with the index of the new msg.
 *   - Validation errors (zod parse failures) are caught and returned as
 *     {success: false, error}.
 */
import { handleAddTransfer } from './addTransfer.js';
import { getOrCreateSession, resetAllSessions } from '../../session/sessionState.js';

const MAX = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX }];

const BASE_TRANSFER = {
  from: 'Mint',
  toAddresses: ['bb1alice'],
  balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }],
  prioritizedApprovals: [{ approvalId: 'mint-approval', approverAddress: '' }],
  merkleProofs: [],
  memo: ''
};

describe('handleAddTransfer', () => {
  beforeEach(() => resetAllSessions());

  describe('happy path', () => {
    it('appends a MsgTransferTokens at index 1 (after the collection create)', () => {
      const res = handleAddTransfer({ transfers: [BASE_TRANSFER] });
      expect(res.success).toBe(true);
      expect(res.messageIndex).toBe(1);
      expect(res.note).toMatch(/messages\[1\]/);

      const s = getOrCreateSession();
      expect(s.messages).toHaveLength(2);
      expect(s.messages[1].typeUrl).toBe('/tokenization.MsgTransferTokens');
    });

    it('auto-sets collectionId="0" on the appended message', () => {
      handleAddTransfer({ transfers: [BASE_TRANSFER] });
      const s = getOrCreateSession();
      expect(s.messages[1].value.collectionId).toBe('0');
    });

    it('pulls creator from messages[0].value.creator', () => {
      handleAddTransfer({
        // Seed the session with a creator via creatorAddress-on-first-call
        // by pre-creating the session.
      });
      // Pre-seed via getOrCreateSession
      resetAllSessions();
      getOrCreateSession(undefined, 'bb1creator');
      handleAddTransfer({ transfers: [BASE_TRANSFER] });
      const s = getOrCreateSession();
      expect(s.messages[1].value.creator).toBe('bb1creator');
    });

    it('creator is empty string when session was auto-created without address', () => {
      handleAddTransfer({ transfers: [BASE_TRANSFER] });
      expect(getOrCreateSession().messages[1].value.creator).toBe('');
    });

    it('pass-through "Mint" as sender (does not attempt bb1 conversion)', () => {
      handleAddTransfer({ transfers: [BASE_TRANSFER] });
      const s = getOrCreateSession();
      expect(s.messages[1].value.transfers[0].from).toBe('Mint');
    });

    it('normalizes a bb1... sender (already bb1 — pass-through)', () => {
      handleAddTransfer({
        transfers: [{ ...BASE_TRANSFER, from: 'bb1someone' }]
      });
      const s = getOrCreateSession();
      expect(s.messages[1].value.transfers[0].from).toBe('bb1someone');
    });

    it('pass-through bb1... recipient unchanged', () => {
      handleAddTransfer({ transfers: [BASE_TRANSFER] });
      const s = getOrCreateSession();
      expect(s.messages[1].value.transfers[0].toAddresses).toEqual(['bb1alice']);
    });

    it('supports multiple recipients in one transfer', () => {
      handleAddTransfer({
        transfers: [{ ...BASE_TRANSFER, toAddresses: ['bb1alice', 'bb1bob', 'bb1carol'] }]
      });
      const s = getOrCreateSession();
      expect(s.messages[1].value.transfers[0].toAddresses).toEqual(['bb1alice', 'bb1bob', 'bb1carol']);
    });

    it('supports multiple transfers in one call', () => {
      const res = handleAddTransfer({
        transfers: [
          BASE_TRANSFER,
          { ...BASE_TRANSFER, toAddresses: ['bb1bob'] }
        ]
      });
      expect(res.success).toBe(true);
      const s = getOrCreateSession();
      expect(s.messages[1].value.transfers).toHaveLength(2);
      expect(s.messages[1].value.transfers[1].toAddresses).toEqual(['bb1bob']);
    });

    it('returned messageIndex increments on each call', () => {
      const a = handleAddTransfer({ transfers: [BASE_TRANSFER] });
      const b = handleAddTransfer({ transfers: [BASE_TRANSFER] });
      const c = handleAddTransfer({ transfers: [BASE_TRANSFER] });
      expect(a.messageIndex).toBe(1);
      expect(b.messageIndex).toBe(2);
      expect(c.messageIndex).toBe(3);
      expect(getOrCreateSession().messages).toHaveLength(4);
    });
  });

  describe('defaults and schema behavior', () => {
    it('defaults prioritizedApprovals to [] when omitted', () => {
      const res = handleAddTransfer({
        transfers: [{
          from: 'Mint',
          toAddresses: ['bb1alice'],
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }] }]
        }] as any
      });
      expect(res.success).toBe(true);
      expect(getOrCreateSession().messages[1].value.transfers[0].prioritizedApprovals).toEqual([]);
    });

    it('defaults memo to ""', () => {
      handleAddTransfer({
        transfers: [{
          from: 'Mint',
          toAddresses: ['bb1alice'],
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }] }]
        }] as any
      });
      expect(getOrCreateSession().messages[1].value.transfers[0].memo).toBe('');
    });

    it('defaults merkleProofs to []', () => {
      handleAddTransfer({
        transfers: [{
          from: 'Mint',
          toAddresses: ['bb1alice'],
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }] }]
        }] as any
      });
      expect(getOrCreateSession().messages[1].value.transfers[0].merkleProofs).toEqual([]);
    });

    it('defaults balance ownershipTimes to forever when omitted', () => {
      handleAddTransfer({
        transfers: [{
          from: 'Mint',
          toAddresses: ['bb1alice'],
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }] }]
        }] as any
      });
      const balances = getOrCreateSession().messages[1].value.transfers[0].balances;
      expect(balances[0].ownershipTimes).toEqual(FOREVER);
    });

    it('defaults prioritizedApprovals[].approverAddress to ""', () => {
      handleAddTransfer({
        transfers: [{
          ...BASE_TRANSFER,
          prioritizedApprovals: [{ approvalId: 'only-id' }]
        }] as any
      });
      const pa = getOrCreateSession().messages[1].value.transfers[0].prioritizedApprovals;
      expect(pa[0]).toEqual({ approvalId: 'only-id', approverAddress: '' });
    });
  });

  describe('validation errors', () => {
    it('rejects a call with zero transfers', () => {
      const res = handleAddTransfer({ transfers: [] });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('rejects a transfer missing from', () => {
      const res = handleAddTransfer({
        transfers: [{
          toAddresses: ['bb1alice'],
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }] }]
        }] as any
      });
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('rejects a transfer missing toAddresses', () => {
      const res = handleAddTransfer({
        transfers: [{
          from: 'Mint',
          balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }] }]
        }] as any
      });
      expect(res.success).toBe(false);
    });

    it('rejects a transfer missing balances', () => {
      const res = handleAddTransfer({
        transfers: [{
          from: 'Mint',
          toAddresses: ['bb1alice']
        }] as any
      });
      expect(res.success).toBe(false);
    });

    it('rejects a balance missing amount', () => {
      const res = handleAddTransfer({
        transfers: [{
          from: 'Mint',
          toAddresses: ['bb1alice'],
          balances: [{ tokenIds: [{ start: '1', end: '1' }] }]
        }] as any
      });
      expect(res.success).toBe(false);
    });

    it('rejects a tokenIds range missing end', () => {
      const res = handleAddTransfer({
        transfers: [{
          from: 'Mint',
          toAddresses: ['bb1alice'],
          balances: [{ amount: '1', tokenIds: [{ start: '1' }] }]
        }] as any
      });
      expect(res.success).toBe(false);
    });

    it('rejects a missing transfers array entirely', () => {
      const res = handleAddTransfer({});
      expect(res.success).toBe(false);
    });

    it('does not mutate the session on validation failure', () => {
      const lenBefore = getOrCreateSession().messages.length;
      const res = handleAddTransfer({ transfers: [] });
      expect(res.success).toBe(false);
      const lenAfter = getOrCreateSession().messages.length;
      expect(lenAfter).toBe(lenBefore);
    });
  });

  describe('session isolation', () => {
    it('isolates appended transfers per sessionId', () => {
      handleAddTransfer({ sessionId: 'a', transfers: [BASE_TRANSFER] });
      handleAddTransfer({ sessionId: 'a', transfers: [BASE_TRANSFER] });
      handleAddTransfer({ sessionId: 'b', transfers: [BASE_TRANSFER] });
      expect(getOrCreateSession('a').messages).toHaveLength(3); // 1 create + 2 transfer
      expect(getOrCreateSession('b').messages).toHaveLength(2); // 1 create + 1 transfer
    });

    it('messageIndex is per-session (not global)', () => {
      handleAddTransfer({ sessionId: 'a', transfers: [BASE_TRANSFER] });
      handleAddTransfer({ sessionId: 'a', transfers: [BASE_TRANSFER] });
      const resB = handleAddTransfer({ sessionId: 'b', transfers: [BASE_TRANSFER] });
      // Session b is fresh — transfer goes to index 1, not 3
      expect(resB.messageIndex).toBe(1);
    });
  });
});
