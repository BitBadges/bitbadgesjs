import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import { UintRangeArray } from './uintRanges.js';
import { doesCollectionFollowProtocol } from './quests.js';

export const doesCollectionFollowInvoiceProtocol = (collection: Readonly<iCollectionDoc<bigint>>) => {
  if (!doesCollectionFollowProtocol(collection, 'Invoices')) {
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

export const isInvoiceApproval = (approval: iCollectionApproval<bigint>) => {
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

  if (maxNumTransfers <= 0n) {
    return false;
  }

  if ((approvalCriteria.coinTransfers ?? []).length > 1) {
    return false;
  }

  for (const coinTransfer of approvalCriteria.coinTransfers ?? []) {
    if (coinTransfer.coins.length !== 1) {
      return false;
    }

    // For invoices, payments are initiator -> address
    // So we should NOT override from with approver address (from = initiator)
    // And we should NOT override to with initiator (to = address)
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

  return true;
};
