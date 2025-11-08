import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import type { iCollectionApproval, iUserOutgoingApproval } from '@/interfaces/types/approvals.js';
import { UintRangeArray } from './uintRanges.js';

export const doesCollectionFollowProductProtocol = (collection?: Readonly<iCollectionDoc<bigint>>) => {
  if (!collection) {
    return false;
  }

  let found = false;
  for (const standard of collection.standardsTimeline) {
    const isCurrentTime = UintRangeArray.From(standard.timelineTimes).searchIfExists(BigInt(Date.now()));
    if (!isCurrentTime) {
      continue;
    }

    if (!standard.standards.includes('Products')) {
      continue;
    }

    found = true;
  }

  if (!found) {
    return false;
  }

  // Assert valid token IDs are only 1n-1n
  const tokenIds = UintRangeArray.From(collection.validTokenIds).sortAndMerge().convert(BigInt);
  if (tokenIds.length !== 1 || tokenIds.size() !== 1n) {
    return false;
  }

  if (tokenIds[0].start !== 1n || tokenIds[0].end !== 1n) {
    return false;
  }

  return true;
};

export const isProductApproval = (approval: iCollectionApproval<bigint>) => {
  const approvalCriteria = approval.approvalCriteria;
  if (!approvalCriteria?.coinTransfers) {
    return false;
  }

  if (approval.fromListId !== 'Mint') {
    return false;
  }

  for (const challenge of approvalCriteria.merkleChallenges ?? []) {
    if (challenge.maxUsesPerLeaf !== 1n) {
      return false;
    }

    if (challenge.useCreatorAddressAsLeaf) {
      return false;
    }
  }

  if (approvalCriteria.coinTransfers.length !== 1) {
    return false;
  }

  for (const coinTransfer of approvalCriteria.coinTransfers) {
    if (coinTransfer.coins.length !== 1) {
      return false;
    }

    if (coinTransfer.coins[0].denom !== 'ubadge') {
      return false;
    }

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

  const allTokenIds = UintRangeArray.From(incrementedBalances.startBalances[0].tokenIds).sortAndMerge().convert(BigInt);
  if (allTokenIds.length !== 1 || allTokenIds.size() !== 1n) {
    return false;
  }

  if (allTokenIds[0].start !== 1n || allTokenIds[0].end !== 1n) {
    return false;
  }

  const amount = incrementedBalances.startBalances[0].amount;
  if (amount !== 1n) {
    return false;
  }

  if (incrementedBalances.incrementTokenIdsBy !== 0n) {
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

  if (approvalCriteria.mustOwnTokens?.length) {
    return false;
  }

  return true;
};
