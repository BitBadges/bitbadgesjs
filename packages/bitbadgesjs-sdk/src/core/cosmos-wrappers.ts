import { iApprovalCriteria } from '@/interfaces/types/approvals.js';
import { CollectionApprovalWithDetails } from './approvals.js';
import { CosmosCoinWrapperPath } from './misc.js';
import { iUintRange } from '@/interfaces/index.js';

function validateTokenIds(tokenIds: iUintRange<bigint>[], approvalTokenIds: iUintRange<bigint>[]) {
  if (tokenIds.length !== approvalTokenIds.length) {
    return false;
  }

  for (let i = 0; i < tokenIds.length; i++) {
    if (tokenIds[i].start !== approvalTokenIds[i].start || tokenIds[i].end !== approvalTokenIds[i].end) {
      return false;
    }
  }

  return true;
}

export const isWrapperApproval = (
  approval: CollectionApprovalWithDetails<bigint>,
  pathObj: CosmosCoinWrapperPath<bigint>,
  options?: { skipPathValidation?: boolean; validTokenIds?: iUintRange<bigint>[] }
) => {
  const { address, balances } = pathObj;

  if (balances.length !== 1) {
    return false;
  }

  const { tokenIds, ownershipTimes } = balances[0];

  if (!options?.skipPathValidation) {
    if (!approval.toList.checkAddress(address)) {
      return false;
    }

    const allowOverrideWithAnyValidToken = pathObj.allowOverrideWithAnyValidToken;

    if (allowOverrideWithAnyValidToken) {
      if (options?.validTokenIds) {
        if (!validateTokenIds(options?.validTokenIds ?? [], approval.tokenIds)) {
          return false;
        }
      }
    } else {
      if (!validateTokenIds(tokenIds, approval.tokenIds)) {
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
  options?: { skipPathValidation?: boolean; validTokenIds?: iUintRange<bigint>[] }
) => {
  const { address, balances } = pathObj;

  if (balances.length !== 1) {
    return false;
  }

  const { tokenIds, ownershipTimes } = balances[0];

  if (!options?.skipPathValidation) {
    if (!approval.fromList.checkAddress(address)) {
      return false;
    }

    const allowOverrideWithAnyValidToken = pathObj.allowOverrideWithAnyValidToken;

    if (allowOverrideWithAnyValidToken) {
      if (options?.validTokenIds) {
        if (!validateTokenIds(options?.validTokenIds ?? [], approval.tokenIds)) {
          return false;
        }
      }
    } else {
      if (!validateTokenIds(tokenIds, approval.tokenIds)) {
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

export function approvalCriteriaHasNoAdditionalRestrictions(approvalCriteria?: iApprovalCriteria<bigint>) {
  return (
    !approvalCriteria ||
    (!approvalCriteria.requireFromEqualsInitiatedBy &&
      !approvalCriteria.requireFromDoesNotEqualInitiatedBy &&
      !approvalCriteria.requireToEqualsInitiatedBy &&
      !approvalCriteria.requireToDoesNotEqualInitiatedBy &&
      !approvalCriteria.overridesFromOutgoingApprovals &&
      !approvalCriteria.overridesToIncomingApprovals &&
      (approvalCriteria.merkleChallenges ?? []).length === 0 &&
      (approvalCriteria.coinTransfers ?? []).length === 0 &&
      (approvalCriteria.userRoyalties?.percentage ?? 0n) === 0n &&
      (approvalCriteria.userRoyalties?.payoutAddress ?? '') === '' &&
      (approvalCriteria.mustOwnTokens ?? []).length === 0)
  );
}
