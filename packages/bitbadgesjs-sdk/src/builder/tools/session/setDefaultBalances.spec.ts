/**
 * Tests for `set_default_balances` builder tool.
 *
 * handleSetDefaultBalances forwards to sessionState.setDefaultBalances which:
 *   - Writes the supplied config onto messages[0].value.defaultBalances.
 *   - Auto-fills the 5 required userPermissions keys with [] (neutral)
 *     merged with whatever the caller supplied.
 *   - Flips updateDefaultBalances=true so the SDK emits the field.
 *
 * autoApproveAllIncomingTransfers is called out as the #1 deployment bug —
 * the handler itself doesn't enforce it (zod default is `true`), but we
 * lock in the invariant here so any future regression is caught.
 */
import { handleSetDefaultBalances, setDefaultBalancesSchema } from './setDefaultBalances.js';
import { getOrCreateSession, resetAllSessions } from '../../session/sessionState.js';

const REQUIRED_USER_PERM_KEYS = [
  'canUpdateOutgoingApprovals',
  'canUpdateIncomingApprovals',
  'canUpdateAutoApproveSelfInitiatedOutgoingTransfers',
  'canUpdateAutoApproveSelfInitiatedIncomingTransfers',
  'canUpdateAutoApproveAllIncomingTransfers'
];

const MINIMAL: any = {
  balances: [],
  outgoingApprovals: [],
  incomingApprovals: [],
  autoApproveAllIncomingTransfers: true,
  autoApproveSelfInitiatedOutgoingTransfers: true,
  autoApproveSelfInitiatedIncomingTransfers: true,
  userPermissions: {}
};

describe('handleSetDefaultBalances', () => {
  beforeEach(() => resetAllSessions());

  describe('happy path', () => {
    it('writes defaultBalances onto the collection message', () => {
      const res = handleSetDefaultBalances({ defaultBalances: { ...MINIMAL } });
      expect(res.success).toBe(true);

      const value = getOrCreateSession().messages[0].value;
      expect(value.defaultBalances.balances).toEqual([]);
      expect(value.defaultBalances.outgoingApprovals).toEqual([]);
      expect(value.defaultBalances.incomingApprovals).toEqual([]);
      expect(value.defaultBalances.autoApproveAllIncomingTransfers).toBe(true);
    });

    it('flips updateDefaultBalances=true', () => {
      handleSetDefaultBalances({ defaultBalances: { ...MINIMAL } });
      expect(getOrCreateSession().messages[0].value.updateDefaultBalances).toBe(true);
    });

    it('preserves all three auto-approve flags when false', () => {
      handleSetDefaultBalances({
        defaultBalances: {
          ...MINIMAL,
          autoApproveAllIncomingTransfers: false,
          autoApproveSelfInitiatedOutgoingTransfers: false,
          autoApproveSelfInitiatedIncomingTransfers: false
        }
      });
      const db = getOrCreateSession().messages[0].value.defaultBalances;
      expect(db.autoApproveAllIncomingTransfers).toBe(false);
      expect(db.autoApproveSelfInitiatedOutgoingTransfers).toBe(false);
      expect(db.autoApproveSelfInitiatedIncomingTransfers).toBe(false);
    });

    it('passes through a non-empty balances array', () => {
      handleSetDefaultBalances({
        defaultBalances: {
          ...MINIMAL,
          balances: [
            { amount: '1', tokenIds: [{ start: '1', end: '10' }] }
          ]
        } as any
      });
      const db = getOrCreateSession().messages[0].value.defaultBalances;
      expect(db.balances).toHaveLength(1);
      expect(db.balances[0].amount).toBe('1');
      expect(db.balances[0].tokenIds).toEqual([{ start: '1', end: '10' }]);
    });
  });

  describe('userPermissions auto-fill', () => {
    it('fills every required key with neutral [] when userPermissions is empty {}', () => {
      handleSetDefaultBalances({ defaultBalances: { ...MINIMAL, userPermissions: {} } as any });
      const db = getOrCreateSession().messages[0].value.defaultBalances;
      for (const key of REQUIRED_USER_PERM_KEYS) {
        expect(db.userPermissions[key]).toEqual([]);
      }
    });

    it('preserves caller-supplied userPermissions values', () => {
      const supplied = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [{ start: '1', end: '18446744073709551615' }] }];
      handleSetDefaultBalances({
        defaultBalances: {
          ...MINIMAL,
          userPermissions: { canUpdateOutgoingApprovals: supplied }
        } as any
      });
      const db = getOrCreateSession().messages[0].value.defaultBalances;
      expect(db.userPermissions.canUpdateOutgoingApprovals).toEqual(supplied);
      // Other keys still auto-filled
      expect(db.userPermissions.canUpdateIncomingApprovals).toEqual([]);
      expect(db.userPermissions.canUpdateAutoApproveAllIncomingTransfers).toEqual([]);
    });

    it('merges: caller key wins, missing keys filled', () => {
      const suppliedA = [{ a: 1 }];
      handleSetDefaultBalances({
        defaultBalances: {
          ...MINIMAL,
          userPermissions: {
            canUpdateAutoApproveAllIncomingTransfers: suppliedA
          }
        } as any
      });
      const db = getOrCreateSession().messages[0].value.defaultBalances;
      expect(db.userPermissions.canUpdateAutoApproveAllIncomingTransfers).toEqual(suppliedA);
      expect(db.userPermissions.canUpdateOutgoingApprovals).toEqual([]);
    });
  });

  describe('zod schema defaults', () => {
    it('defaults arrays to [] when omitted', () => {
      const parsed = setDefaultBalancesSchema.parse({ defaultBalances: {} });
      expect(parsed.defaultBalances.balances).toEqual([]);
      expect(parsed.defaultBalances.outgoingApprovals).toEqual([]);
      expect(parsed.defaultBalances.incomingApprovals).toEqual([]);
    });

    it('defaults all three auto-approve flags to true', () => {
      const parsed = setDefaultBalancesSchema.parse({ defaultBalances: {} });
      expect(parsed.defaultBalances.autoApproveAllIncomingTransfers).toBe(true);
      expect(parsed.defaultBalances.autoApproveSelfInitiatedOutgoingTransfers).toBe(true);
      expect(parsed.defaultBalances.autoApproveSelfInitiatedIncomingTransfers).toBe(true);
    });

    it('defaults userPermissions to {}', () => {
      const parsed = setDefaultBalancesSchema.parse({ defaultBalances: {} });
      expect(parsed.defaultBalances.userPermissions).toEqual({});
    });
  });

  describe('session state', () => {
    it('replaces defaultBalances on re-call', () => {
      handleSetDefaultBalances({ defaultBalances: { ...MINIMAL, autoApproveAllIncomingTransfers: true } as any });
      handleSetDefaultBalances({ defaultBalances: { ...MINIMAL, autoApproveAllIncomingTransfers: false } as any });
      expect(
        getOrCreateSession().messages[0].value.defaultBalances.autoApproveAllIncomingTransfers
      ).toBe(false);
    });

    it('isolates defaultBalances per sessionId', () => {
      handleSetDefaultBalances({
        sessionId: 'a',
        defaultBalances: { ...MINIMAL, autoApproveAllIncomingTransfers: true } as any
      });
      handleSetDefaultBalances({
        sessionId: 'b',
        defaultBalances: { ...MINIMAL, autoApproveAllIncomingTransfers: false } as any
      });
      expect(
        getOrCreateSession('a').messages[0].value.defaultBalances.autoApproveAllIncomingTransfers
      ).toBe(true);
      expect(
        getOrCreateSession('b').messages[0].value.defaultBalances.autoApproveAllIncomingTransfers
      ).toBe(false);
    });

    it('auto-creates session with creatorAddress when supplied', () => {
      handleSetDefaultBalances({
        sessionId: 'c',
        creatorAddress: 'bb1alice',
        defaultBalances: { ...MINIMAL } as any
      });
      expect(getOrCreateSession('c').messages[0].value.creator).toBe('bb1alice');
    });
  });
});
