import { buildSubscriptionV2RenewalApproval, inspectSubscriptionV2RenewalApproval } from './subscriptionUpgradeRenewal.js';
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
