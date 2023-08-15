import { AddressMapping, ApprovalDetails, IncomingApprovalDetails, IsCollectionTransferAllowed, IsUserIncomingTransferAllowed, IsUserOutgoingTransferAllowed, OutgoingApprovalDetails } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { CollectionApprovedTransferWithDetails } from "./types/collections";
import { UserApprovedIncomingTransferWithDetails, UserApprovedOutgoingTransferWithDetails } from "./types/users";

/**
 * @category Approvals / Transferability
 */
export function castOutgoingTransfersToCollectionTransfers(
  transfers: UserApprovedOutgoingTransferWithDetails<bigint>[],
  fromAddress: string
): CollectionApprovedTransferWithDetails<bigint>[] {
  const collectionTransfers: CollectionApprovedTransferWithDetails<bigint>[] = [];
  for (const transfer of transfers) {
    collectionTransfers.push(castOutgoingTransferToCollectionTransfer(transfer, fromAddress));
  }
  return collectionTransfers;
}
/**
 * @category Approvals / Transferability
 */
export function castIncomingTransfersToCollectionTransfers(
  transfers: UserApprovedIncomingTransferWithDetails<bigint>[],
  toAddress: string
): CollectionApprovedTransferWithDetails<bigint>[] {
  const collectionTransfers: CollectionApprovedTransferWithDetails<bigint>[] = [];
  for (const transfer of transfers) {
    collectionTransfers.push(castIncomingTransferToCollectionTransfer(transfer, toAddress));
  }
  return collectionTransfers;
}
/**
 * @category Approvals / Transferability
 */
export function castOutgoingTransferToCollectionTransfer(
  transfer: UserApprovedOutgoingTransferWithDetails<bigint>,
  fromAddress: string
): CollectionApprovedTransferWithDetails<bigint> {
  const allowedCombinations: IsCollectionTransferAllowed[] = transfer.allowedCombinations.map(CastOutgoingCombinationToCollectionCombination);
  const approvalDetails: ApprovalDetails<bigint>[] = transfer.approvalDetails.map(CastOutgoingApprovalDetailsToCollectionApprovalDetails);

  return {
    ...transfer,
    toMappingId: transfer.toMappingId,
    fromMappingId: fromAddress,
    fromMapping: getReservedAddressMapping(fromAddress, "") as AddressMapping,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    allowedCombinations: allowedCombinations,
    approvalDetails: approvalDetails,
  };
}
/**
 * @category Approvals / Transferability
 */
export function castFromCollectionTransferToOutgoingTransfer(
  transfer: CollectionApprovedTransferWithDetails<bigint>
): UserApprovedOutgoingTransferWithDetails<bigint> {
  const allowedCombinations: IsUserOutgoingTransferAllowed[] = transfer.allowedCombinations.map(CastFromCollectionCombinationToOutgoingCombination);
  const approvalDetails: OutgoingApprovalDetails<bigint>[] = transfer.approvalDetails.map(CastFromCollectionApprovalDetailsToOutgoingApprovalDetails);

  return {
    toMappingId: transfer.toMappingId,
    toMapping: transfer.toMapping,
    initiatedByMapping: transfer.initiatedByMapping,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    allowedCombinations: allowedCombinations,
    approvalDetails: approvalDetails,
  };
}
/**
 * @category Approvals / Transferability
 */
export function castIncomingTransferToCollectionTransfer(
  transfer: UserApprovedIncomingTransferWithDetails<bigint>,
  toAddress: string
): CollectionApprovedTransferWithDetails<bigint> {
  const allowedCombinations: IsCollectionTransferAllowed[] = transfer.allowedCombinations.map(CastIncomingCombinationToCollectionCombination);
  const approvalDetails: ApprovalDetails<bigint>[] = transfer.approvalDetails.map(CastIncomingApprovalDetailsToCollectionApprovalDetails);

  return {
    ...transfer,
    toMapping: getReservedAddressMapping(toAddress, "") as AddressMapping,
    toMappingId: toAddress,
    fromMappingId: transfer.fromMappingId,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    allowedCombinations: allowedCombinations,
    approvalDetails: approvalDetails,
  };
}
/**
 * @category Approvals / Transferability
 */
export function castFromCollectionTransferToIncomingTransfer(
  transfer: CollectionApprovedTransferWithDetails<bigint>
): UserApprovedIncomingTransferWithDetails<bigint> {
  const allowedCombinations: IsUserIncomingTransferAllowed[] = transfer.allowedCombinations.map(CastFromCollectionCombinationToIncomingCombination);
  const approvalDetails: IncomingApprovalDetails<bigint>[] = transfer.approvalDetails.map(CastFromCollectionApprovalDetailsToIncomingApprovalDetails);

  return {
    ...transfer,
    fromMappingId: transfer.fromMappingId,
    initiatedByMappingId: transfer.initiatedByMappingId,
    transferTimes: transfer.transferTimes,
    badgeIds: transfer.badgeIds,
    ownershipTimes: transfer.ownershipTimes,
    allowedCombinations: allowedCombinations,
    approvalDetails: approvalDetails,
  };
}

function CastIncomingCombinationToCollectionCombination(
  combination: IsUserIncomingTransferAllowed
): IsCollectionTransferAllowed {
  return {
    isApproved: combination.isApproved,
    badgeIdsOptions: combination.badgeIdsOptions,
    transferTimesOptions: combination.transferTimesOptions,
    fromMappingOptions: combination.fromMappingOptions,
    initiatedByMappingOptions: combination.initiatedByMappingOptions,
    ownershipTimesOptions: combination.ownershipTimesOptions,

    toMappingOptions: {
      invertDefault: false,
      allValues: false,
      noValues: false,
    }
  };
}

function CastFromCollectionCombinationToIncomingCombination(
  combination: IsCollectionTransferAllowed
): IsUserIncomingTransferAllowed {
  return {
    isApproved: combination.isApproved,
    badgeIdsOptions: combination.badgeIdsOptions,
    transferTimesOptions: combination.transferTimesOptions,
    fromMappingOptions: combination.fromMappingOptions,
    initiatedByMappingOptions: combination.initiatedByMappingOptions,
    ownershipTimesOptions: combination.ownershipTimesOptions,
  };
}

function CastOutgoingCombinationToCollectionCombination(
  combination: IsUserOutgoingTransferAllowed
): IsCollectionTransferAllowed {
  return {
    isApproved: combination.isApproved,
    badgeIdsOptions: combination.badgeIdsOptions,
    transferTimesOptions: combination.transferTimesOptions,
    toMappingOptions: combination.toMappingOptions,
    initiatedByMappingOptions: combination.initiatedByMappingOptions,
    ownershipTimesOptions: combination.ownershipTimesOptions,

    fromMappingOptions: {
      invertDefault: false,
      allValues: false,
      noValues: false,
    }
  };
}

function CastFromCollectionCombinationToOutgoingCombination(
  combination: IsCollectionTransferAllowed
): IsUserOutgoingTransferAllowed {
  return {
    isApproved: combination.isApproved,
    badgeIdsOptions: combination.badgeIdsOptions,
    transferTimesOptions: combination.transferTimesOptions,
    toMappingOptions: combination.toMappingOptions,
    initiatedByMappingOptions: combination.initiatedByMappingOptions,
    ownershipTimesOptions: combination.ownershipTimesOptions,
  };
}

function CastIncomingApprovalDetailsToCollectionApprovalDetails(
  approvalDetails: IncomingApprovalDetails<bigint>
): ApprovalDetails<bigint> {
  return {
    approvalId: approvalDetails.approvalId,
    approvalAmounts: approvalDetails.approvalAmounts,
    maxNumTransfers: approvalDetails.maxNumTransfers,
    requireFromEqualsInitiatedBy: approvalDetails.requireFromEqualsInitiatedBy,
    requireFromDoesNotEqualInitiatedBy: approvalDetails.requireFromDoesNotEqualInitiatedBy,
    uri: approvalDetails.uri,
    customData: approvalDetails.customData,
    predeterminedBalances: approvalDetails.predeterminedBalances,
    mustOwnBadges: approvalDetails.mustOwnBadges,
    merkleChallenges: approvalDetails.merkleChallenges,

    requireToEqualsInitiatedBy: false,
    requireToDoesNotEqualInitiatedBy: false,
    overridesFromApprovedOutgoingTransfers: false,
    overridesToApprovedIncomingTransfers: false,
  };
}

function CastOutgoingApprovalDetailsToCollectionApprovalDetails(
  approvalDetails: OutgoingApprovalDetails<bigint>
): ApprovalDetails<bigint> {
  return {
    approvalId: approvalDetails.approvalId,
    approvalAmounts: approvalDetails.approvalAmounts,
    maxNumTransfers: approvalDetails.maxNumTransfers,
    requireToEqualsInitiatedBy: approvalDetails.requireToEqualsInitiatedBy,
    requireToDoesNotEqualInitiatedBy: approvalDetails.requireToDoesNotEqualInitiatedBy,
    uri: approvalDetails.uri,
    customData: approvalDetails.customData,
    predeterminedBalances: approvalDetails.predeterminedBalances,
    mustOwnBadges: approvalDetails.mustOwnBadges,
    merkleChallenges: approvalDetails.merkleChallenges,

    requireFromEqualsInitiatedBy: false,
    requireFromDoesNotEqualInitiatedBy: false,
    overridesFromApprovedOutgoingTransfers: false,
    overridesToApprovedIncomingTransfers: false,

  };
}

function CastFromCollectionApprovalDetailsToIncomingApprovalDetails(
  approvalDetails: ApprovalDetails<bigint>
): IncomingApprovalDetails<bigint> {
  return {
    approvalId: approvalDetails.approvalId,
    approvalAmounts: approvalDetails.approvalAmounts,
    maxNumTransfers: approvalDetails.maxNumTransfers,
    requireFromEqualsInitiatedBy: approvalDetails.requireFromEqualsInitiatedBy,
    requireFromDoesNotEqualInitiatedBy: approvalDetails.requireFromDoesNotEqualInitiatedBy,
    uri: approvalDetails.uri,
    customData: approvalDetails.customData,
    predeterminedBalances: approvalDetails.predeterminedBalances,
    mustOwnBadges: approvalDetails.mustOwnBadges,
    merkleChallenges: approvalDetails.merkleChallenges,
  };
}

function CastFromCollectionApprovalDetailsToOutgoingApprovalDetails(
  approvalDetails: ApprovalDetails<bigint>
): OutgoingApprovalDetails<bigint> {
  return {
    approvalId: approvalDetails.approvalId,
    approvalAmounts: approvalDetails.approvalAmounts,
    maxNumTransfers: approvalDetails.maxNumTransfers,
    requireToEqualsInitiatedBy: approvalDetails.requireToEqualsInitiatedBy,
    requireToDoesNotEqualInitiatedBy: approvalDetails.requireToDoesNotEqualInitiatedBy,
    uri: approvalDetails.uri,
    customData: approvalDetails.customData,
    predeterminedBalances: approvalDetails.predeterminedBalances,
    mustOwnBadges: approvalDetails.mustOwnBadges,
    merkleChallenges: approvalDetails.merkleChallenges,
  };
}
