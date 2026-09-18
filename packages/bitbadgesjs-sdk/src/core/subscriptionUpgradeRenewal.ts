import { GO_MAX_UINT_64 } from '../common/math.js';
import type { iUserIncomingApproval } from '../interfaces/types/approvals.js';
import type { iUintRange } from '../interfaces/types/core.js';
import { UserIncomingApproval } from './approvals.js';
import { buildSubscriptionUpgradeCollection, type SubscriptionUpgradeNativeProfile } from './subscriptionUpgradeNative.js';

export const SUBSCRIPTION_V2_RENEWAL_PREFIX = 'subscription-v2-renewal-';

export function buildSubscriptionV2RenewalApproval({
  profile,
  tokenId,
  firstIntervalStartTime,
  approvalId,
  transferTimes
}: {
  profile: SubscriptionUpgradeNativeProfile;
  tokenId: bigint;
  firstIntervalStartTime: bigint;
  approvalId: string;
  transferTimes: iUintRange<bigint>[];
}): iUserIncomingApproval<bigint> {
  buildSubscriptionUpgradeCollection({ profile, uri: 'urn:subscription:terms-validation' });
  const tier = profile.tiers.find((item) => item.tokenId === tokenId);
  if (!tier || !approvalId.startsWith(SUBSCRIPTION_V2_RENEWAL_PREFIX) || approvalId.length <= SUBSCRIPTION_V2_RENEWAL_PREFIX.length) {
    throw new Error('Invalid subscription renewal tier or approval ID.');
  }
  if (firstIntervalStartTime < 1n || firstIntervalStartTime + profile.duration - 1n > GO_MAX_UINT_64) {
    throw new Error('Invalid subscription renewal start.');
  }
  if (!transferTimes.length || transferTimes.some((r) => r.start < 1n || r.end < r.start || r.end > GO_MAX_UINT_64)) {
    throw new Error('Invalid subscription renewal payment window.');
  }
  const full = [{ start: 1n, end: GO_MAX_UINT_64 }];
  const tokenIds = [{ start: tokenId, end: tokenId }];
  return {
    approvalId,
    version: 0n,
    fromListId: profile.operator,
    initiatedByListId: profile.operator,
    tokenIds,
    ownershipTimes: full,
    transferTimes,
    approvalCriteria: {
      coinTransfers: [
        {
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ amount: tier.price, denom: profile.denom }]
        }
      ],
      predeterminedBalances: {
        manualBalances: [],
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        },
        incrementedBalances: {
          startBalances: [{ amount: 1n, tokenIds, ownershipTimes: full }],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: {
            startTime: firstIntervalStartTime,
            intervalLength: profile.duration,
            chargePeriodLength: profile.duration < 604800000n ? profile.duration : 604800000n
          }
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 1n,
        perToAddressMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        amountTrackerId: approvalId,
        resetTimeIntervals: { startTime: firstIntervalStartTime, intervalLength: profile.duration }
      }
    }
  };
}

export function inspectSubscriptionV2RenewalApproval(approval: iUserIncomingApproval<bigint>, profile: SubscriptionUpgradeNativeProfile) {
  try {
    const tokenId = approval.tokenIds[0]?.start;
    const firstIntervalStartTime = approval.approvalCriteria?.predeterminedBalances?.incrementedBalances.recurringOwnershipTimes.startTime;
    if (tokenId === undefined || firstIntervalStartTime === undefined) return null;
    const expected = buildSubscriptionV2RenewalApproval({
      profile,
      tokenId,
      firstIntervalStartTime,
      approvalId: approval.approvalId,
      transferTimes: approval.transferTimes
    });
    const canonical = (item: iUserIncomingApproval<bigint>) =>
      new UserIncomingApproval({ ...item, version: 0n, uri: '', customData: '' }).toProto().toJsonString();
    if (canonical(approval) !== canonical(expected)) return null;
    return {
      tokenId,
      firstIntervalStartTime,
      price: profile.tiers.find((tier) => tier.tokenId === tokenId)!.price,
      duration: profile.duration,
      denom: profile.denom
    };
  } catch {
    return null;
  }
}
