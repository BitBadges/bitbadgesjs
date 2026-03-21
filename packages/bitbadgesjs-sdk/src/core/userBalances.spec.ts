/**
 * Tests for userBalances.ts
 *
 * Covers: UserBalanceStore constructor, convert, toProto, fromProto, toBech32Addresses,
 * UserBalanceStoreWithDetails constructor, convert, clone
 */

import { UserBalanceStore, UserBalanceStoreWithDetails } from './userBalances.js';
import { BalanceArray } from './balances.js';
import { UserPermissions, UserPermissionsWithDetails } from './permissions.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import type { NumberType } from '../common/string-numbers.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

function makeUserBalanceStore(): UserBalanceStore<bigint> {
  return new UserBalanceStore({
    balances: BalanceArray.From([
      {
        amount: 10n,
        tokenIds: [{ start: 1n, end: 5n }],
        ownershipTimes: UintRangeArray.FullRanges()
      }
    ]),
    incomingApprovals: [],
    outgoingApprovals: [],
    userPermissions: new UserPermissions({
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      canUpdateIncomingApprovals: [],
      canUpdateOutgoingApprovals: [],
      canUpdateAutoApproveAllIncomingTransfers: []
    }),
    autoApproveSelfInitiatedOutgoingTransfers: true,
    autoApproveSelfInitiatedIncomingTransfers: false,
    autoApproveAllIncomingTransfers: false
  });
}

describe('UserBalanceStore', () => {
  describe('constructor', () => {
    it('should construct with valid data', () => {
      const store = makeUserBalanceStore();
      expect(store.balances.length).toBe(1);
      expect(store.balances[0].amount).toBe(10n);
      expect(store.autoApproveSelfInitiatedOutgoingTransfers).toBe(true);
      expect(store.autoApproveSelfInitiatedIncomingTransfers).toBe(false);
      expect(store.autoApproveAllIncomingTransfers).toBe(false);
    });

    it('should construct with empty arrays', () => {
      const store = new UserBalanceStore({
        balances: [],
        incomingApprovals: [],
        outgoingApprovals: [],
        userPermissions: new UserPermissions({
          canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
          canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          canUpdateIncomingApprovals: [],
          canUpdateOutgoingApprovals: [],
          canUpdateAutoApproveAllIncomingTransfers: []
        }),
        autoApproveSelfInitiatedOutgoingTransfers: false,
        autoApproveSelfInitiatedIncomingTransfers: false,
        autoApproveAllIncomingTransfers: false
      });
      expect(store.balances.length).toBe(0);
      expect(store.incomingApprovals.length).toBe(0);
      expect(store.outgoingApprovals.length).toBe(0);
    });
  });

  describe('convert', () => {
    it('should convert bigint to string number type', () => {
      const store = makeUserBalanceStore();
      const stringStore = store.convert(String);
      expect(typeof stringStore.balances[0].amount).toBe('string');
      expect(stringStore.balances[0].amount).toBe('10');
    });

    it('should convert bigint to number type', () => {
      const store = makeUserBalanceStore();
      const numStore = store.convert(Number);
      expect(typeof numStore.balances[0].amount).toBe('number');
      expect(numStore.balances[0].amount).toBe(10);
    });
  });

  describe('toProto / fromProto round-trip', () => {
    it('should survive proto round-trip', () => {
      const store = makeUserBalanceStore();
      const proto = store.toProto();
      const restored = UserBalanceStore.fromProto(proto, BigInt);

      expect(restored.balances.length).toBe(1);
      expect(restored.balances[0].amount).toBe(10n);
      expect(restored.autoApproveSelfInitiatedOutgoingTransfers).toBe(true);
      expect(restored.autoApproveSelfInitiatedIncomingTransfers).toBe(false);
      expect(restored.autoApproveAllIncomingTransfers).toBe(false);
    });

    it('should handle fromProto when userPermissions is undefined (creates defaults)', () => {
      const store = makeUserBalanceStore();
      const proto = store.toProto();
      // Simulate missing userPermissions on proto
      (proto as any).userPermissions = undefined;
      const restored = UserBalanceStore.fromProto(proto, BigInt);

      expect(restored.userPermissions).toBeDefined();
      expect(restored.userPermissions.canUpdateIncomingApprovals).toEqual([]);
      expect(restored.userPermissions.canUpdateOutgoingApprovals).toEqual([]);
    });
  });

  describe('toBech32Addresses', () => {
    it('should return a new UserBalanceStore (no-op for empty approvals)', () => {
      const store = makeUserBalanceStore();
      const bech32Store = store.toBech32Addresses('bb');
      expect(bech32Store).toBeInstanceOf(UserBalanceStore);
      expect(bech32Store.balances.length).toBe(store.balances.length);
      expect(bech32Store.autoApproveSelfInitiatedOutgoingTransfers).toBe(store.autoApproveSelfInitiatedOutgoingTransfers);
    });
  });
});

describe('UserBalanceStoreWithDetails', () => {
  describe('constructor', () => {
    it('should construct with valid data', () => {
      const store = new UserBalanceStoreWithDetails({
        balances: BalanceArray.From([
          { amount: 5n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: UintRangeArray.FullRanges() }
        ]),
        incomingApprovals: [],
        outgoingApprovals: [],
        userPermissions: new UserPermissionsWithDetails({
          canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
          canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          canUpdateIncomingApprovals: [],
          canUpdateOutgoingApprovals: [],
          canUpdateAutoApproveAllIncomingTransfers: []
        }),
        autoApproveSelfInitiatedOutgoingTransfers: false,
        autoApproveSelfInitiatedIncomingTransfers: true,
        autoApproveAllIncomingTransfers: false
      });
      expect(store.balances.length).toBe(1);
      expect(store.autoApproveSelfInitiatedIncomingTransfers).toBe(true);
    });
  });

  describe('convert', () => {
    it('should convert number types correctly', () => {
      const store = new UserBalanceStoreWithDetails({
        balances: BalanceArray.From([
          { amount: 5n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: UintRangeArray.FullRanges() }
        ]),
        incomingApprovals: [],
        outgoingApprovals: [],
        userPermissions: new UserPermissionsWithDetails({
          canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
          canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          canUpdateIncomingApprovals: [],
          canUpdateOutgoingApprovals: [],
          canUpdateAutoApproveAllIncomingTransfers: []
        }),
        autoApproveSelfInitiatedOutgoingTransfers: false,
        autoApproveSelfInitiatedIncomingTransfers: false,
        autoApproveAllIncomingTransfers: false
      });
      const result = store.convert(String);
      expect(result).toBeInstanceOf(UserBalanceStoreWithDetails);
      expect(result.balances[0].amount).toBe('5');
    });
  });

  describe('clone', () => {
    it('should return a deep copy', () => {
      const store = new UserBalanceStoreWithDetails({
        balances: BalanceArray.From([
          { amount: 5n, tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: UintRangeArray.FullRanges() }
        ]),
        incomingApprovals: [],
        outgoingApprovals: [],
        userPermissions: new UserPermissionsWithDetails({
          canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
          canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          canUpdateIncomingApprovals: [],
          canUpdateOutgoingApprovals: [],
          canUpdateAutoApproveAllIncomingTransfers: []
        }),
        autoApproveSelfInitiatedOutgoingTransfers: false,
        autoApproveSelfInitiatedIncomingTransfers: false,
        autoApproveAllIncomingTransfers: false
      });
      const cloned = store.clone();
      expect(cloned).toBeInstanceOf(UserBalanceStoreWithDetails);
      expect(cloned.balances[0].amount).toBe(5n);
      // Modify clone should not affect original
      cloned.autoApproveAllIncomingTransfers = true;
      expect(store.autoApproveAllIncomingTransfers).toBe(false);
    });
  });
});
