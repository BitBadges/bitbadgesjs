import {
  buildSubscriptionV2RenewalApproval,
  inspectSubscriptionV2RenewalApproval,
  buildSubscriptionV2RenewalChange
} from './subscriptionUpgradeRenewal.js';
import type { SubscriptionUpgradeNativeProfile } from './subscriptionUpgradeNative.js';
import { UserIncomingApproval } from './approvals.js';

const profile: SubscriptionUpgradeNativeProfile = {
  version: 2,
  operator: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm',
  escrowStoreId: 1n,
  denom: 'uusdc',
  duration: 2_592_000_000n,
  tiers: [{ tokenId: 1n, price: 9_007_199_254_740_993n }],
  payouts: [{ recipient: 'bb1xvenxvenxvenxvenxvenxvenxvenxvenlrd2nm', weightBps: 10_000n }]
};
const args = {
  profile,
  tokenId: 1n,
  firstIntervalStartTime: 10_000_000_000n,
  approvalId: 'subscription-v2-renewal-test',
  transferTimes: [{ start: 1n, end: 18446744073709551615n }]
};

it('binds the operator, full tier price and one fixed period without floating point conversion', () => {
  const approval = buildSubscriptionV2RenewalApproval(args);
  expect(approval.fromListId).toBe(profile.operator);
  expect(approval.initiatedByListId).toBe(profile.operator);
  expect(approval.approvalCriteria!.coinTransfers![0].coins[0].amount).toBe(profile.tiers[0].price);
  expect(approval.approvalCriteria!.coinTransfers![0].overrideFromWithApproverAddress).toBe(true);
  expect(approval.approvalCriteria!.coinTransfers![0].overrideToWithInitiator).toBe(true);
  expect(approval.approvalCriteria!.predeterminedBalances!.incrementedBalances.allowAmountScaling).toBe(false);
  expect(approval.approvalCriteria!.maxNumTransfers!.overallMaxNumTransfers).toBe(1n);
  expect(inspectSubscriptionV2RenewalApproval(approval, profile)).toEqual({
    tokenId: 1n,
    price: profile.tiers[0].price,
    duration: profile.duration,
    denom: profile.denom,
    firstIntervalStartTime: args.firstIntervalStartTime
  });
});

it('accepts hydrated chain approvals with versions while rejecting modified payment and timing authority', () => {
  const approval = new UserIncomingApproval(buildSubscriptionV2RenewalApproval(args));
  approval.version = 7n;
  expect(inspectSubscriptionV2RenewalApproval(approval, profile)).not.toBeNull();
  const altered = approval.clone();
  altered.approvalCriteria!.coinTransfers![0].coins[0].amount++;
  expect(inspectSubscriptionV2RenewalApproval(altered, profile)).toBeNull();
  const shorter = approval.clone();
  shorter.approvalCriteria!.predeterminedBalances!.incrementedBalances.recurringOwnershipTimes.intervalLength = 1000n;
  expect(inspectSubscriptionV2RenewalApproval(shorter, profile)).toBeNull();
  const arbitraryWorker = approval.clone();
  arbitraryWorker.initiatedByListId = 'All';
  expect(inspectSubscriptionV2RenewalApproval(arbitraryWorker, profile)).toBeNull();
});

it('rejects invalid tiers, reused generic identifiers and overflowing periods', () => {
  expect(() => buildSubscriptionV2RenewalApproval({ ...args, tokenId: 2n })).toThrow();
  expect(() => buildSubscriptionV2RenewalApproval({ ...args, approvalId: 'generic' })).toThrow();
  expect(() => buildSubscriptionV2RenewalApproval({ ...args, firstIntervalStartTime: 18446744073709551615n })).toThrow();
});

it('recognizes the canonical default objects populated by the native chain', () => {
  const approval = buildSubscriptionV2RenewalApproval(args);
  approval.approvalCriteria = {
    ...approval.approvalCriteria,
    mustPrioritize: true,
    approvalAmounts: {
      overallApprovalAmount: 0n,
      perToAddressApprovalAmount: 0n,
      perFromAddressApprovalAmount: 0n,
      perInitiatedByAddressApprovalAmount: 0n,
      amountTrackerId: '',
      resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
    },
    autoDeletionOptions: { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false }
  };
  expect(inspectSubscriptionV2RenewalApproval(approval, profile)).not.toBeNull();
});

it('uses individual deletes before new consent without rewriting unrelated approvals', () => {
  const old = buildSubscriptionV2RenewalApproval(args);
  const unrelated = { ...old, approvalId: 'unrelated' };
  const messages = buildSubscriptionV2RenewalChange({
    creator: profile.operator,
    collectionId: '1',
    profile,
    incomingApprovals: [old, unrelated],
    target: { ...args, approvalId: 'subscription-v2-renewal-new' }
  });
  expect(messages.map((m) => m.toProto().getType().typeName)).toEqual([
    'tokenization.MsgDeleteIncomingApproval',
    'tokenization.MsgSetIncomingApproval'
  ]);
  expect(messages[0]).toMatchObject({ approvalId: old.approvalId });
  expect(messages[1]).toMatchObject({ approval: { approvalId: 'subscription-v2-renewal-new' } });
  expect(buildSubscriptionV2RenewalChange({ creator: profile.operator, collectionId: '1', profile, incomingApprovals: [old] })).toHaveLength(1);
});

it('refuses reused consent identity and unrecognized reserved approvals', () => {
  const old = buildSubscriptionV2RenewalApproval(args);
  const base = { creator: profile.operator, collectionId: '1', profile, incomingApprovals: [old] };
  expect(() => buildSubscriptionV2RenewalChange({ ...base, target: args })).toThrow();
  expect(() => buildSubscriptionV2RenewalChange({ ...base, incomingApprovals: [{ ...old, fromListId: 'All' }] })).toThrow();
});
