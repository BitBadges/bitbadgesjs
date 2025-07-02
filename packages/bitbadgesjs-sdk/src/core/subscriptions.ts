import { iCollectionDoc } from '@/api-indexer/docs/interfaces.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';
import type { iCollectionApproval, iPredeterminedBalances, iResetTimeIntervals, iUserIncomingApproval } from '@/interfaces/badges/approvals.js';
import { UintRangeArray } from './uintRanges.js';

export const getCurrentInterval = (resetTimeIntervals: iResetTimeIntervals<bigint> | undefined) => {
  // If no resets, we just treat it as one big interval
  if (!resetTimeIntervals || resetTimeIntervals.startTime === 0n || resetTimeIntervals.intervalLength === 0n) {
    return { start: 1n, end: GO_MAX_UINT_64 };
  }

  const currTime = BigInt(Date.now());
  const startTime = resetTimeIntervals.startTime;
  const intervalLength = resetTimeIntervals.intervalLength;

  // Little hacky, but we treat anything before the start time as one interval
  // It then resets at the start time and recurs forever
  if (currTime < startTime) {
    return { start: 1n, end: startTime - 1n };
  }

  const currInterval = (currTime - startTime) / intervalLength;
  const currIntervalStart = startTime + currInterval * intervalLength;
  const currIntervalEnd = currIntervalStart + intervalLength;

  return {
    start: currIntervalStart,
    end: currIntervalEnd
  };
};

export const trackerNeedsReset = (resetTimeIntervals: iResetTimeIntervals<bigint>, lastUpdatedAt: bigint) => {
  const currentInterval = getCurrentInterval(resetTimeIntervals);
  return lastUpdatedAt < currentInterval.start;
};

export const getNextChargeTime = (predeterminedBalances: iPredeterminedBalances<bigint> | undefined) => {
  const currentInterval = getCurrentInterval({
    startTime: predeterminedBalances?.incrementedBalances.recurringOwnershipTimes.startTime ?? 0n,
    intervalLength: predeterminedBalances?.incrementedBalances.recurringOwnershipTimes.intervalLength ?? 0n
  });

  const nextInterval = {
    start: currentInterval.end + 1n,
    end: currentInterval.end + (predeterminedBalances?.incrementedBalances.recurringOwnershipTimes.intervalLength ?? 0n)
  };

  return nextInterval.start - (predeterminedBalances?.incrementedBalances.recurringOwnershipTimes.chargePeriodLength ?? 0n);
};

export const doesCollectionFollowSubscriptionProtocol = (collection?: Readonly<iCollectionDoc<bigint>>) => {
  if (!collection) {
    return false;
  }

  const subscriptionApprovals = collection.collectionApprovals.filter((approval) => isSubscriptionFaucetApproval(approval));
  if (subscriptionApprovals.length < 1) {
    return false;
  }

  let found = false;
  for (const standard of collection.standardsTimeline) {
    const isCurrentTime = UintRangeArray.From(standard.timelineTimes).searchIfExists(BigInt(Date.now()));
    if (!isCurrentTime) {
      continue;
    }

    if (!standard.standards.includes('Subscriptions')) {
      continue;
    }

    found = true;
  }

  if (!found) {
    return false;
  }

  // Assert valid badge IDs are only 1n-1n
  const allSubscriptionBadgeIds = [];
  for (const approval of subscriptionApprovals) {
    const badgeIds = UintRangeArray.From(approval.badgeIds).sortAndMerge().convert(BigInt);
    allSubscriptionBadgeIds.push(...badgeIds);
  }
  const allSubscriptionBadgeIdsSorted = UintRangeArray.From(allSubscriptionBadgeIds).sortAndMerge().convert(BigInt);

  if (allSubscriptionBadgeIdsSorted.length !== 1) {
    return false;
  }

  if (collection.validBadgeIds.length !== 1) {
    return false;
  }

  if (collection.validBadgeIds.length !== allSubscriptionBadgeIdsSorted.length) {
    return false;
  }

  for (let i = 0; i < collection.validBadgeIds.length; i++) {
    if (
      collection.validBadgeIds[i].start !== allSubscriptionBadgeIdsSorted[i].start ||
      collection.validBadgeIds[i].end !== allSubscriptionBadgeIdsSorted[i].end
    ) {
      return false;
    }
  }

  return true;
};

export const isSubscriptionFaucetApproval = (approval: iCollectionApproval<bigint>) => {
  if (approval.fromListId !== 'Mint') {
    return false;
  }

  const approvalCriteria = approval.approvalCriteria;
  if (!approvalCriteria?.coinTransfers) {
    return false;
  }

  if (approvalCriteria.coinTransfers.length < 1) {
    return false;
  }

  const allDenoms = approvalCriteria.coinTransfers.map((coinTransfer) => coinTransfer.coins.map((coin) => coin.denom)).flat();
  if (allDenoms.length > 1) {
    return false;
  }

  for (const coinTransfer of approvalCriteria.coinTransfers) {
    if (coinTransfer.overrideFromWithApproverAddress || coinTransfer.overrideToWithInitiator) {
      return false;
    }
  }

  const incrementedBalances = approvalCriteria.predeterminedBalances?.incrementedBalances;
  if (!incrementedBalances) {
    return false;
  }

  if (incrementedBalances.startBalances.length !== 1) {
    return false;
  }

  const approvalBadgeIds = approval.badgeIds;
  if (approvalBadgeIds.length !== 1 || UintRangeArray.From(approvalBadgeIds).sortAndMerge().convert(BigInt).size() !== 1n) {
    return false;
  }

  const allBadgeIds = UintRangeArray.From(incrementedBalances.startBalances[0].badgeIds).sortAndMerge().convert(BigInt);
  if (allBadgeIds.length !== 1 || allBadgeIds.size() !== 1n) {
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

  if (incrementedBalances.durationFromTimestamp === 0n) {
    return false;
  }

  //Needs this to be true for the subscription faucet to work
  if (!incrementedBalances.allowOverrideTimestamp) {
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

  if (approvalCriteria.requireFromEqualsInitiatedBy) {
    return false;
  }

  if (approvalCriteria.requireToEqualsInitiatedBy) {
    return false;
  }

  if (approvalCriteria.overridesToIncomingApprovals) {
    return false;
  }

  if (approvalCriteria.merkleChallenges?.length) {
    return false;
  }

  if (approvalCriteria.mustOwnBadges?.length) {
    return false;
  }

  return true;
};

export const isUserRecurringApproval = (approval: iUserIncomingApproval<bigint>, subscriptionApproval: iCollectionApproval<bigint>) => {
  if (approval.fromListId !== 'Mint') {
    return false;
  }

  const intervalLength = BigInt(subscriptionApproval.approvalCriteria?.predeterminedBalances?.incrementedBalances.durationFromTimestamp ?? 0);
  const chargePeriodLength = BigInt(Math.min(Number(intervalLength), 604800000));
  const subscriptionAmount = subscriptionApproval.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.amount ?? 0n;
  const approvalAmount = approval.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.amount ?? 0n;

  //Ensure badge IDs match
  const approvalBadgeIds = UintRangeArray.From(approval.badgeIds).sortAndMerge().convert(BigInt);
  const subscriptionBadgeIds = UintRangeArray.From(subscriptionApproval.badgeIds).sortAndMerge().convert(BigInt);

  if (approvalBadgeIds.length !== subscriptionBadgeIds.length) {
    return false;
  }

  for (let i = 0; i < approvalBadgeIds.length; i++) {
    if (approvalBadgeIds[i].start !== subscriptionBadgeIds[i].start || approvalBadgeIds[i].end !== subscriptionBadgeIds[i].end) {
      return false;
    }
  }

  if (approvalAmount < subscriptionAmount) {
    return false;
  }

  if (approval.badgeIds.length !== 1 || UintRangeArray.From(approval.badgeIds).sortAndMerge().convert(BigInt).size() !== 1n) {
    return false;
  }

  const approvalCriteria = approval.approvalCriteria;
  if (approvalCriteria?.coinTransfers?.length !== 1) {
    return false;
  }

  const coinTransfer = approvalCriteria.coinTransfers[0];
  if (coinTransfer.coins.length !== 1) {
    return false;
  }

  //ensure denom is correct
  if (coinTransfer.coins[0].denom !== subscriptionApproval.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom) {
    return false;
  }

  if (!coinTransfer.overrideFromWithApproverAddress || !coinTransfer.overrideToWithInitiator) {
    return false;
  }

  const incrementedBalances = approvalCriteria.predeterminedBalances?.incrementedBalances;
  if (!incrementedBalances) {
    return false;
  }

  if (incrementedBalances.startBalances.length !== 1) {
    return false;
  }

  if (incrementedBalances.startBalances[0].amount !== 1n) {
    return false;
  }

  if (
    incrementedBalances.startBalances[0].badgeIds.length !== 1 ||
    UintRangeArray.From(incrementedBalances.startBalances[0].badgeIds).sortAndMerge().convert(BigInt).size() !== 1n
  ) {
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

  // if (incrementedBalances.recurringOwnershipTimes.startTime !== currTime) {
  //   return false;
  // }

  if (incrementedBalances.recurringOwnershipTimes.intervalLength !== intervalLength) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.chargePeriodLength !== chargePeriodLength) {
    return false;
  }

  // Ensure max 1 transfer and reset time intervals are correct
  const maxNumTransfers = approvalCriteria.maxNumTransfers;
  if (maxNumTransfers?.overallMaxNumTransfers !== 1n) {
    return false;
  }

  // if (maxNumTransfers?.resetTimeIntervals.startTime !== 0n) {
  //   return false;
  // }

  if (maxNumTransfers?.resetTimeIntervals.intervalLength !== intervalLength) {
    return false;
  }

  if (approvalCriteria.requireFromEqualsInitiatedBy) {
    return false;
  }

  if (approvalCriteria.merkleChallenges?.length) {
    return false;
  }

  if (approvalCriteria.mustOwnBadges?.length) {
    return false;
  }

  return true;
};
