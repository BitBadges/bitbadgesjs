import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import type { iCollectionApproval } from '@/interfaces/badges/approvals.js';
import { UintRangeArray } from './uintRanges.js';

export const doesCollectionFollowQuestProtocol = (collection?: Readonly<iCollectionDoc<bigint>>) => {
  if (!collection) {
    return false;
  }

  let found = false;
  for (const standard of collection.standardsTimeline) {
    const isCurrentTime = UintRangeArray.From(standard.timelineTimes).searchIfExists(BigInt(Date.now()));
    if (!isCurrentTime) {
      continue;
    }

    if (!standard.standards.includes('Quests')) {
      continue;
    }

    found = true;
  }

  if (!found) {
    return false;
  }

  // Assert valid token IDs are only 1n-1n
  const badgeIds = UintRangeArray.From(collection.validBadgeIds).sortAndMerge().convert(BigInt);
  if (badgeIds.length !== 1 || badgeIds.size() !== 1n) {
    return false;
  }

  if (badgeIds[0].start !== 1n || badgeIds[0].end !== 1n) {
    return false;
  }

  return true;
};

export const isQuestApproval = (approval: iCollectionApproval<bigint>) => {
  const approvalCriteria = approval.approvalCriteria;
  if (!approvalCriteria?.coinTransfers) {
    return false;
  }

  if (approval.fromListId !== 'Mint') {
    return false;
  }

  if (!approvalCriteria.merkleChallenges || approvalCriteria.merkleChallenges.length !== 1) {
    return false;
  }

  let merkleChallenge = approvalCriteria.merkleChallenges?.[0];
  if (merkleChallenge.maxUsesPerLeaf !== 1n) {
    return false;
  }

  if (approvalCriteria.mustOwnBadges?.length) {
    return false;
  }

  if (merkleChallenge.useCreatorAddressAsLeaf) {
    return false;
  }

  const maxNumTransfers = approvalCriteria.maxNumTransfers?.overallMaxNumTransfers;
  if (!maxNumTransfers) {
    return false;
  }

  if (maxNumTransfers <= 0n) {
    return false;
  }

  if (approvalCriteria.coinTransfers.length !== 1) {
    return false;
  }

  for (const coinTransfer of approvalCriteria.coinTransfers) {
    if (coinTransfer.coins.length !== 1) {
      return false;
    }

    if (!coinTransfer.overrideFromWithApproverAddress || !coinTransfer.overrideToWithInitiator) {
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

  //Needs this to be true for the subscription faucet to work
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

  if (approvalCriteria.requireToEqualsInitiatedBy) {
    return false;
  }

  return true;
};
