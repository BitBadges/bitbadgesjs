import { iApprovalCriteria } from '@/interfaces/badges/approvals.js';
import { CollectionApprovalWithDetails } from './approvals.js';
import { CosmosCoinWrapperPath } from './misc.js';

export const isWrapperApproval = (
  approval: CollectionApprovalWithDetails<bigint>,
  pathObj: CosmosCoinWrapperPath<bigint>,
  options?: { skipPathValidation?: boolean }
) => {
  const { address, balances } = pathObj;

  if (balances.length !== 1) {
    return false;
  }

  const { badgeIds, ownershipTimes } = balances[0];

  if (!options?.skipPathValidation) {
    if (!approval.toList.checkAddress(address)) {
      return false;
    }

    if (badgeIds.length !== approval.badgeIds.length) {
      return false;
    }

    for (let i = 0; i < badgeIds.length; i++) {
      if (badgeIds[i].start !== approval.badgeIds[i].start || badgeIds[i].end !== approval.badgeIds[i].end) {
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
  options?: { skipPathValidation?: boolean }
) => {
  const { address, balances } = pathObj;

  if (balances.length !== 1) {
    return false;
  }

  const { badgeIds, ownershipTimes } = balances[0];

  if (!options?.skipPathValidation) {
    if (!approval.fromList.checkAddress(address)) {
      return false;
    }

    if (badgeIds.length !== approval.badgeIds.length) {
      return false;
    }

    if (badgeIds.length !== approval.badgeIds.length) {
      return false;
    }

    for (let i = 0; i < badgeIds.length; i++) {
      if (badgeIds[i].start !== approval.badgeIds[i].start || badgeIds[i].end !== approval.badgeIds[i].end) {
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
      (approvalCriteria.mustOwnBadges ?? []).length === 0)
  );
}
