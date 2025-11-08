import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import { UintRangeArray } from './uintRanges.js';

export const isScheduledPaymentApproval = (approval: iCollectionApproval<bigint>) => {
  const approvalCriteria = approval.approvalCriteria;
  if (!approvalCriteria) {
    return false;
  }

  if (approval.fromListId !== 'Mint') {
    return false;
  }

  if (approvalCriteria.merkleChallenges?.length) {
    if (approvalCriteria.merkleChallenges.length !== 1) {
      return false;
    }

    let merkleChallenge = approvalCriteria.merkleChallenges?.[0];
    if (merkleChallenge.maxUsesPerLeaf !== 1n) {
      return false;
    }

    if (merkleChallenge.useCreatorAddressAsLeaf) {
      return false;
    }
  }

  const maxNumTransfers = approvalCriteria.maxNumTransfers?.overallMaxNumTransfers;
  if (!maxNumTransfers) {
    return false;
  }

  // Scheduled payments are one-time use
  if (maxNumTransfers !== 1n) {
    return false;
  }

  // Can have 1 or 2 coin transfers (payment + optional tip)
  const coinTransfers = approvalCriteria.coinTransfers ?? [];
  if (coinTransfers.length === 0) {
    return false;
  }

  const incrementedBalances = approvalCriteria.predeterminedBalances?.incrementedBalances;
  if (!incrementedBalances) {
    return false;
  }

  if (incrementedBalances.startBalances.length !== 1) {
    return false;
  }

  const allBadgeIds = UintRangeArray.From(incrementedBalances.startBalances[0].badgeIds).sortAndMerge().convert(BigInt);
  if (allBadgeIds.length !== 1 || allBadgeIds.size() !== 1n) {
    return false;
  }

  if (allBadgeIds[0].start !== 1n || allBadgeIds[0].end !== 1n) {
    return false;
  }

  const amount = incrementedBalances.startBalances[0].amount;
  if (amount !== 1n) {
    return false;
  }

  if (incrementedBalances.incrementBadgeIdsBy !== 0n) {
    return false;
  }

  if (incrementedBalances.incrementOwnershipTimesBy !== 0n) {
    return false;
  }

  if (incrementedBalances.durationFromTimestamp !== 0n) {
    return false;
  }

  if (incrementedBalances.allowOverrideTimestamp) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.startTime !== 0n) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.intervalLength !== 0n) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.chargePeriodLength !== 0n) {
    return false;
  }

  // Scheduled payments should override from outgoing approvals
  if (!approvalCriteria.overridesFromOutgoingApprovals) {
    return false;
  }

  if (approvalCriteria.requireToEqualsInitiatedBy) {
    return false;
  }

  return true;
};
