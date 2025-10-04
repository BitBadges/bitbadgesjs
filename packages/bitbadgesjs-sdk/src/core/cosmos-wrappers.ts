import {
  iApprovalAmounts,
  iApprovalCriteria,
  iIncomingApprovalCriteria,
  iMaxNumTransfers,
  iOutgoingApprovalCriteria,
  iPredeterminedBalances,
  iResetTimeIntervals
} from '@/interfaces/types/approvals.js';
import { CollectionApprovalWithDetails } from './approvals.js';
import { CosmosCoinWrapperPath } from './misc.js';
import { iUintRange } from '@/interfaces/index.js';

function validateBadgeIds(badgeIds: iUintRange<bigint>[], approvalTokenIds: iUintRange<bigint>[]) {
  if (badgeIds.length !== approvalTokenIds.length) {
    return false;
  }

  for (let i = 0; i < badgeIds.length; i++) {
    if (badgeIds[i].start !== approvalTokenIds[i].start || badgeIds[i].end !== approvalTokenIds[i].end) {
      return false;
    }
  }

  return true;
}

export const isWrapperApproval = (
  approval: CollectionApprovalWithDetails<bigint>,
  pathObj: CosmosCoinWrapperPath<bigint>,
  options?: { skipPathValidation?: boolean; validBadgeIds?: iUintRange<bigint>[] }
) => {
  if (!pathObj.allowCosmosWrapping) {
    return false;
  }

  const { address, balances } = pathObj;

  if (balances.length !== 1) {
    return false;
  }

  const { badgeIds, ownershipTimes } = balances[0];

  if (!options?.skipPathValidation) {
    if (!approval.toList.checkAddress(address)) {
      return false;
    }

    const allowOverrideWithAnyValidToken = pathObj.allowOverrideWithAnyValidToken;

    if (allowOverrideWithAnyValidToken) {
      if (options?.validBadgeIds) {
        if (!validateBadgeIds(options?.validBadgeIds ?? [], approval.badgeIds)) {
          return false;
        }
      }
    } else {
      if (!validateBadgeIds(badgeIds, approval.badgeIds)) {
        return false;
      }
    }

    if (ownershipTimes.length !== approval.ownershipTimes.length) {
      return false;
    }

    for (let i = 0; i < ownershipTimes.length; i++) {
      if (ownershipTimes[i].start !== approval.ownershipTimes[i].start || ownershipTimes[i].end !== approval.ownershipTimes[i].end) {
        return false;
      }
    }
  }

  if (!approval.approvalCriteria?.overridesToIncomingApprovals) {
    return false;
  }

  const approvalCriteriaWithoutOverrides = {
    ...approval.approvalCriteria,
    overridesToIncomingApprovals: undefined
  };

  if (!approvalCriteriaHasNoAdditionalRestrictions(approvalCriteriaWithoutOverrides)) {
    return false;
  }

  return true;
};

export const isUnwrapperApproval = (
  approval: CollectionApprovalWithDetails<bigint>,
  pathObj: CosmosCoinWrapperPath<bigint>,
  options?: { skipPathValidation?: boolean; validBadgeIds?: iUintRange<bigint>[] }
) => {
  const { address, balances } = pathObj;

  if (!pathObj.allowCosmosWrapping) {
    return false;
  }

  if (balances.length !== 1) {
    return false;
  }

  const { badgeIds, ownershipTimes } = balances[0];

  if (!options?.skipPathValidation) {
    if (!approval.fromList.checkAddress(address)) {
      return false;
    }

    const allowOverrideWithAnyValidToken = pathObj.allowOverrideWithAnyValidToken;

    if (allowOverrideWithAnyValidToken) {
      if (options?.validBadgeIds) {
        if (!validateBadgeIds(options?.validBadgeIds ?? [], approval.badgeIds)) {
          return false;
        }
      }
    } else {
      if (!validateBadgeIds(badgeIds, approval.badgeIds)) {
        return false;
      }
    }

    if (ownershipTimes.length !== approval.ownershipTimes.length) {
      return false;
    }

    for (let i = 0; i < ownershipTimes.length; i++) {
      if (ownershipTimes[i].start !== approval.ownershipTimes[i].start || ownershipTimes[i].end !== approval.ownershipTimes[i].end) {
        return false;
      }
    }
  }

  if (!approval.approvalCriteria?.overridesFromOutgoingApprovals) {
    return false;
  }

  const approvalCriteriaWithoutOverrides = {
    ...approval.approvalCriteria,
    overridesFromOutgoingApprovals: undefined
  };

  if (!approvalCriteriaHasNoAdditionalRestrictions(approvalCriteriaWithoutOverrides)) {
    return false;
  }

  return true;
};

export function approvalCriteriaHasNoAdditionalRestrictions(
  approvalCriteria?: iApprovalCriteria<bigint>,
  allowMintOverrides?: boolean,
  allowToOverrides?: boolean
) {
  return (
    !approvalCriteria ||
    (!approvalCriteria.requireFromEqualsInitiatedBy &&
      !approvalCriteria.requireFromDoesNotEqualInitiatedBy &&
      !approvalCriteria.requireToEqualsInitiatedBy &&
      !approvalCriteria.requireToDoesNotEqualInitiatedBy &&
      (allowMintOverrides || !approvalCriteria.overridesFromOutgoingApprovals) &&
      (allowToOverrides || !approvalCriteria.overridesToIncomingApprovals) &&
      (approvalCriteria.merkleChallenges ?? []).length === 0 &&
      (approvalCriteria.coinTransfers ?? []).length === 0 &&
      (approvalCriteria.userRoyalties?.percentage ?? 0n) === 0n &&
      (approvalCriteria.userRoyalties?.payoutAddress ?? '') === '' &&
      (approvalCriteria.mustOwnBadges ?? []).length === 0 &&
      (approvalCriteria.dynamicStoreChallenges ?? []).length === 0 &&
      (approvalCriteria.ethSignatureChallenges ?? []).length === 0)
  );
}

export function approvalCriteriaUsesPredeterminedBalances(approvalCriteria?: iApprovalCriteria<bigint>) {
  if (!approvalCriteria?.predeterminedBalances) {
    return false;
  }

  return (
    approvalCriteria.predeterminedBalances.incrementedBalances.startBalances.length > 0 ||
    approvalCriteria.predeterminedBalances.manualBalances.length > 0
  );
}

export function approvalCriteriaHasNoAmountRestrictions(approvalCriteria?: iApprovalCriteria<bigint>) {
  if (!approvalCriteria) return true;

  return (
    !approvalHasApprovalAmounts(approvalCriteria.approvalAmounts) &&
    !approvalHasMaxNumTransfers(approvalCriteria.maxNumTransfers) &&
    !approvalCriteriaUsesPredeterminedBalances(approvalCriteria)
  );
}

export const approvalHasApprovalAmounts = (approvalAmounts?: iApprovalAmounts<bigint>) => {
  if (!approvalAmounts) return false;

  return (
    approvalAmounts?.overallApprovalAmount > 0n ||
    approvalAmounts?.perFromAddressApprovalAmount > 0n ||
    approvalAmounts?.perToAddressApprovalAmount > 0n ||
    approvalAmounts?.perInitiatedByAddressApprovalAmount > 0n
  );
};

export const approvalHasMaxNumTransfers = (maxNumTransfers?: iMaxNumTransfers<bigint>) => {
  if (!maxNumTransfers) return false;

  return (
    maxNumTransfers?.overallMaxNumTransfers > 0n ||
    maxNumTransfers?.perFromAddressMaxNumTransfers > 0n ||
    maxNumTransfers?.perToAddressMaxNumTransfers > 0n ||
    maxNumTransfers?.perInitiatedByAddressMaxNumTransfers > 0n
  );
};

/**
 * Checks if reset time intervals are basically nil (empty or zero values)
 */
function isResetTimeIntervalBasicallyNil(resetTimeInterval?: iResetTimeIntervals<bigint>): boolean {
  return !resetTimeInterval || (resetTimeInterval.startTime === 0n && resetTimeInterval.intervalLength === 0n);
}

/**
 * Checks if max num transfers is basically nil (empty or zero values)
 */
function maxNumTransfersIsBasicallyNil(maxNumTransfers?: iMaxNumTransfers<bigint>): boolean {
  return (
    !maxNumTransfers ||
    (maxNumTransfers.overallMaxNumTransfers === 0n &&
      maxNumTransfers.perToAddressMaxNumTransfers === 0n &&
      maxNumTransfers.perFromAddressMaxNumTransfers === 0n &&
      maxNumTransfers.perInitiatedByAddressMaxNumTransfers === 0n &&
      isResetTimeIntervalBasicallyNil(maxNumTransfers.resetTimeIntervals))
  );
}

/**
 * Checks if approval amounts is basically nil (empty or zero values)
 */
function approvalAmountsIsBasicallyNil(approvalAmounts?: iApprovalAmounts<bigint>): boolean {
  return (
    !approvalAmounts ||
    (approvalAmounts.overallApprovalAmount === 0n &&
      approvalAmounts.perToAddressApprovalAmount === 0n &&
      approvalAmounts.perFromAddressApprovalAmount === 0n &&
      approvalAmounts.perInitiatedByAddressApprovalAmount === 0n &&
      isResetTimeIntervalBasicallyNil(approvalAmounts.resetTimeIntervals))
  );
}

/**
 * Checks if predetermined balances is basically nil (empty or zero values)
 */
function predeterminedBalancesIsBasicallyNil(predeterminedBalances?: iPredeterminedBalances<bigint>): boolean {
  if (!predeterminedBalances) return true;

  // Check if order calculation method is basically nil
  const orderCalculationMethodIsBasicallyNil =
    !predeterminedBalances.orderCalculationMethod ||
    (!predeterminedBalances.orderCalculationMethod.useMerkleChallengeLeafIndex &&
      !predeterminedBalances.orderCalculationMethod.useOverallNumTransfers &&
      !predeterminedBalances.orderCalculationMethod.usePerToAddressNumTransfers &&
      !predeterminedBalances.orderCalculationMethod.usePerFromAddressNumTransfers &&
      !predeterminedBalances.orderCalculationMethod.usePerInitiatedByAddressNumTransfers);

  // Check if sequential transfer (incremented balances) is basically nil
  const sequentialTransferIsBasicallyNil =
    !predeterminedBalances.incrementedBalances ||
    (predeterminedBalances.incrementedBalances.startBalances.length === 0 &&
      !predeterminedBalances.incrementedBalances.allowOverrideWithAnyValidBadge &&
      !predeterminedBalances.incrementedBalances.allowOverrideTimestamp &&
      predeterminedBalances.incrementedBalances.incrementBadgeIdsBy === 0n &&
      predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy === 0n &&
      predeterminedBalances.incrementedBalances.durationFromTimestamp === 0n &&
      (!predeterminedBalances.incrementedBalances.recurringOwnershipTimes ||
        (predeterminedBalances.incrementedBalances.recurringOwnershipTimes.startTime === 0n &&
          predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength === 0n)));

  // Check if manual balances is basically nil
  const manualBalancesIsBasicallyNil = !predeterminedBalances.manualBalances || predeterminedBalances.manualBalances.length === 0;

  return orderCalculationMethodIsBasicallyNil && sequentialTransferIsBasicallyNil && manualBalancesIsBasicallyNil;
}

/**
 * Checks if a collection approval has no side effects.
 *
 * An approval has no side effects if:
 * - It has no coin transfers
 * - It has no predetermined balances (or they are basically nil)
 * - It has no merkle challenges
 * - It has no max num transfers (or they are basically nil)
 * - It has no approval amounts (or they are basically nil)
 *
 * @param approvalCriteria - The approval criteria to check
 * @returns true if the approval has no side effects, false otherwise
 */
export function collectionApprovalHasNoSideEffects(approvalCriteria?: iApprovalCriteria<bigint>): boolean {
  if (!approvalCriteria) {
    return true;
  }

  // Check for coin transfers
  if (approvalCriteria.coinTransfers && approvalCriteria.coinTransfers.length > 0) {
    return false;
  }

  // Check for predetermined balances
  if (approvalCriteria.predeterminedBalances && !predeterminedBalancesIsBasicallyNil(approvalCriteria.predeterminedBalances)) {
    return false;
  }

  // Check for merkle challenges
  // Theoretically, we might be able to remove this but two things:
  // 1. It could potentially change which IDs are received (but that only makes sense if predetermined balances is true)
  // 2. We need to pass stuff to MsgTransferBadges so this doesn't really make sense for auto-scanning
  if (approvalCriteria.merkleChallenges && approvalCriteria.merkleChallenges.length > 0) {
    return false;
  }

  // Check for max num transfers
  if (approvalCriteria.maxNumTransfers && !maxNumTransfersIsBasicallyNil(approvalCriteria.maxNumTransfers)) {
    return false;
  }

  // Check for approval amounts
  if (approvalCriteria.approvalAmounts && !approvalAmountsIsBasicallyNil(approvalCriteria.approvalAmounts)) {
    return false;
  }

  return true;
}

export function isAutoScannable(
  approvalCriteria?: iApprovalCriteria<bigint> | iOutgoingApprovalCriteria<bigint> | iIncomingApprovalCriteria<bigint>
): boolean {
  return collectionApprovalHasNoSideEffects(approvalCriteria);
}
