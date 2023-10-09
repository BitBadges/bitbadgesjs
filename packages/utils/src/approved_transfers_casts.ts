import { AddressMapping, ApprovalCriteria, IncomingApprovalCriteria, OutgoingApprovalCriteria } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { CollectionApprovalWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";

/**
 * @category Approvals / Transferability
 */
export function castOutgoingTransfersToCollectionTransfers(
  transfers: UserOutgoingApprovalWithDetails<bigint>[],
  fromAddress: string
): CollectionApprovalWithDetails<bigint>[] {
  const collectionTransfers: CollectionApprovalWithDetails<bigint>[] = [];
  for (const transfer of transfers) {
    collectionTransfers.push(castOutgoingTransferToCollectionTransfer(transfer, fromAddress));
  }
  return collectionTransfers;
}
/**
 * @category Approvals / Transferability
 */
export function castIncomingTransfersToCollectionTransfers(
  transfers: UserIncomingApprovalWithDetails<bigint>[],
  toAddress: string
): CollectionApprovalWithDetails<bigint>[] {
  const collectionTransfers: CollectionApprovalWithDetails<bigint>[] = [];
  for (const transfer of transfers) {
    collectionTransfers.push(castIncomingTransferToCollectionTransfer(transfer, toAddress));
  }
  return collectionTransfers;
}
/**
 * @category Approvals / Transferability
 */
export function castOutgoingTransferToCollectionTransfer(
  transfer: UserOutgoingApprovalWithDetails<bigint>,
  fromAddress: string
): CollectionApprovalWithDetails<bigint> {
  // const allowedCombinations: IsCollectionTransferAllowed[] = transfer.allowedCombinations.map(CastOutgoingCombinationToCollectionCombination);
  const approvalCriteria = transfer.approvalCriteria ? CastOutgoingApprovalCriteriaToCollectionApprovalCriteria(transfer.approvalCriteria) : undefined;

  return {
    ...transfer,
    toMappingId: transfer.toMappingId,
    fromMappingId: fromAddress,
    fromMapping: getReservedAddressMapping(fromAddress) as AddressMapping,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    approvalCriteria: approvalCriteria,
  };
}
/**
 * @category Approvals / Transferability
 */
export function castFromCollectionTransferToOutgoingTransfer(
  transfer: CollectionApprovalWithDetails<bigint>
): UserOutgoingApprovalWithDetails<bigint> {
  const approvalCriteria = transfer.approvalCriteria ? CastFromCollectionApprovalCriteriaToOutgoingApprovalCriteria(transfer.approvalCriteria) : undefined;

  return {
    ...transfer,
    toMappingId: transfer.toMappingId,
    toMapping: transfer.toMapping,
    initiatedByMapping: transfer.initiatedByMapping,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    approvalCriteria: approvalCriteria,
  };
}
/**
 * @category Approvals / Transferability
 */
export function castIncomingTransferToCollectionTransfer(
  transfer: UserIncomingApprovalWithDetails<bigint>,
  toAddress: string
): CollectionApprovalWithDetails<bigint> {
  const approvalCriteria = transfer.approvalCriteria ? CastIncomingApprovalCriteriaToCollectionApprovalCriteria(transfer.approvalCriteria) : undefined;

  return {
    ...transfer,
    toMapping: getReservedAddressMapping(toAddress) as AddressMapping,
    toMappingId: toAddress,
    fromMappingId: transfer.fromMappingId,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    approvalCriteria: approvalCriteria,
  };
}
/**
 * @category Approvals / Transferability
 */
export function castFromCollectionTransferToIncomingTransfer(
  transfer: CollectionApprovalWithDetails<bigint>
): UserIncomingApprovalWithDetails<bigint> {
  const approvalCriteria = transfer.approvalCriteria ? CastFromCollectionApprovalCriteriaToIncomingApprovalCriteria(transfer.approvalCriteria) : undefined;

  return {
    ...transfer,
    fromMappingId: transfer.fromMappingId,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    approvalCriteria: approvalCriteria,
  };
}

function CastIncomingApprovalCriteriaToCollectionApprovalCriteria(
  approvalCriteria: IncomingApprovalCriteria<bigint>
): ApprovalCriteria<bigint> {
  return {
    approvalAmounts: approvalCriteria.approvalAmounts,
    maxNumTransfers: approvalCriteria.maxNumTransfers,
    requireFromEqualsInitiatedBy: approvalCriteria.requireFromEqualsInitiatedBy,
    requireFromDoesNotEqualInitiatedBy: approvalCriteria.requireFromDoesNotEqualInitiatedBy,
    predeterminedBalances: approvalCriteria.predeterminedBalances,
    mustOwnBadges: approvalCriteria.mustOwnBadges,
    merkleChallenge: approvalCriteria.merkleChallenge,

    requireToEqualsInitiatedBy: false,
    requireToDoesNotEqualInitiatedBy: false,
    overridesFromOutgoingApprovals: false,
    overridesToIncomingApprovals: false,
  };
}

function CastOutgoingApprovalCriteriaToCollectionApprovalCriteria(
  approvalCriteria: OutgoingApprovalCriteria<bigint>
): ApprovalCriteria<bigint> {
  return {
    approvalAmounts: approvalCriteria.approvalAmounts,
    maxNumTransfers: approvalCriteria.maxNumTransfers,
    requireToEqualsInitiatedBy: approvalCriteria.requireToEqualsInitiatedBy,
    requireToDoesNotEqualInitiatedBy: approvalCriteria.requireToDoesNotEqualInitiatedBy,
    predeterminedBalances: approvalCriteria.predeterminedBalances,
    mustOwnBadges: approvalCriteria.mustOwnBadges,
    merkleChallenge: approvalCriteria.merkleChallenge,

    requireFromEqualsInitiatedBy: false,
    requireFromDoesNotEqualInitiatedBy: false,
    overridesFromOutgoingApprovals: false,
    overridesToIncomingApprovals: false,

  };
}

function CastFromCollectionApprovalCriteriaToIncomingApprovalCriteria(
  approvalCriteria: ApprovalCriteria<bigint>
): IncomingApprovalCriteria<bigint> {
  return {
    approvalAmounts: approvalCriteria.approvalAmounts,
    maxNumTransfers: approvalCriteria.maxNumTransfers,
    requireFromEqualsInitiatedBy: approvalCriteria.requireFromEqualsInitiatedBy,
    requireFromDoesNotEqualInitiatedBy: approvalCriteria.requireFromDoesNotEqualInitiatedBy,
    predeterminedBalances: approvalCriteria.predeterminedBalances,
    mustOwnBadges: approvalCriteria.mustOwnBadges,
    merkleChallenge: approvalCriteria.merkleChallenge,
  };
}

function CastFromCollectionApprovalCriteriaToOutgoingApprovalCriteria(
  approvalCriteria: ApprovalCriteria<bigint>
): OutgoingApprovalCriteria<bigint> {
  return {
    approvalAmounts: approvalCriteria.approvalAmounts,
    maxNumTransfers: approvalCriteria.maxNumTransfers,
    requireToEqualsInitiatedBy: approvalCriteria.requireToEqualsInitiatedBy,
    requireToDoesNotEqualInitiatedBy: approvalCriteria.requireToDoesNotEqualInitiatedBy,
    predeterminedBalances: approvalCriteria.predeterminedBalances,
    mustOwnBadges: approvalCriteria.mustOwnBadges,
    merkleChallenge: approvalCriteria.merkleChallenge,
  };
}
