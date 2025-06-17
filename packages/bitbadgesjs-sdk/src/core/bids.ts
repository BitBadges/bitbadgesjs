import { iCollectionApproval } from '@/interfaces/badges/approvals.js';
import { UintRangeArray } from './uintRanges.js';

export const isOrderbookBidOrListingApproval = (approval: iCollectionApproval<bigint>, approvalLevel: 'incoming' | 'outgoing') => {
  return isBidOrListingApproval(approval, approvalLevel, { isFungibleCheck: true, fungibleOrNonFungibleAllowed: true });
};

export const isBidOrListingApproval = (
  approval: iCollectionApproval<bigint>,
  approvalLevel: 'incoming' | 'outgoing',
  options?: { isFungibleCheck?: boolean; fungibleOrNonFungibleAllowed?: boolean; isCollectionBid?: boolean }
) => {
  const approvalCriteria = approval.approvalCriteria;
  if (approvalCriteria?.coinTransfers?.length !== 1) {
    return false;
  }

  if (approval.transferTimes.length !== 1) {
    return false;
  }

  const coinTransfer = approvalCriteria.coinTransfers[0];
  if (coinTransfer.coins.length !== 1) {
    return false;
  }

  if (coinTransfer.coins[0].denom !== 'ubadge') {
    return false;
  }

  //Make sure the to / from is correct
  if (approvalLevel === 'incoming' && !coinTransfer.overrideFromWithApproverAddress) {
    return false;
  }

  if (approvalLevel === 'incoming' && !coinTransfer.overrideToWithInitiator) {
    return false;
  }

  if (approvalLevel === 'outgoing' && coinTransfer.overrideFromWithApproverAddress) {
    return false;
  }

  if (approvalLevel === 'outgoing' && coinTransfer.overrideToWithInitiator) {
    return false;
  }

  // Recipient must be the approving user
  const to = coinTransfer.to;
  if (approvalLevel === 'outgoing' && to !== approval.fromListId) {
    return false;
  }

  const incrementedBalances = approvalCriteria.predeterminedBalances?.incrementedBalances;
  if (!incrementedBalances) {
    return false;
  }

  if (incrementedBalances.startBalances.length !== 1) {
    return false;
  }

  if (options?.isCollectionBid) {
    if (!incrementedBalances.allowOverrideWithAnyValidBadge) {
      return false;
    }
  } else {
    const allBadgeIds = UintRangeArray.From(incrementedBalances.startBalances[0].badgeIds).sortAndMerge().convert(BigInt);
    if (allBadgeIds.length !== 1 || allBadgeIds.size() !== 1n) {
      return false;
    }

    if (incrementedBalances.allowOverrideWithAnyValidBadge) {
      return false;
    }
  }

  const amount = incrementedBalances.startBalances[0].amount;
  const toCheckAmountOne = !options || (!options.isFungibleCheck && !options.fungibleOrNonFungibleAllowed);
  if (toCheckAmountOne) {
    if (amount !== 1n) {
      return false;
    }
  }

  if (!UintRangeArray.From(incrementedBalances.startBalances[0].ownershipTimes).isFull()) {
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

  if (approvalCriteria.maxNumTransfers?.overallMaxNumTransfers !== 1n) {
    return false;
  }

  return true;
};

export const isCollectionBid = (approval: iCollectionApproval<bigint>) => {
  return isBidOrListingApproval(approval, 'incoming', { isCollectionBid: true });
};
