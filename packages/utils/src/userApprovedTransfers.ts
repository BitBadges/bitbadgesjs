import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { GetMappingIdWithOptions, GetMappingWithOptions, GetUintRangesWithOptions } from "./overlaps";
import { CollectionApprovedTransferWithDetails } from "./types/collections";
import { UserApprovedIncomingTransferWithDetails, UserApprovedOutgoingTransferWithDetails } from "./types/users";


/**
 * @category Approvals / Transferability
 */
export function expandCollectionApprovedTransfers(approvedTransfers: CollectionApprovedTransferWithDetails<bigint>[]): CollectionApprovedTransferWithDetails<bigint>[] {
  const newCurrApprovedTransfers: CollectionApprovedTransferWithDetails<bigint>[] = [];
  for (const approvedTransfer of approvedTransfers) {
    for (const allowedCombination of approvedTransfer.allowedCombinations) {
      const badgeIds = GetUintRangesWithOptions(approvedTransfer.badgeIds, allowedCombination.badgeIdsOptions, true);
      const ownershipTimes = GetUintRangesWithOptions(approvedTransfer.ownershipTimes, allowedCombination.ownershipTimesOptions, true);
      const times = GetUintRangesWithOptions(approvedTransfer.transferTimes, allowedCombination.transferTimesOptions, true);
      const toMappingId = GetMappingIdWithOptions(approvedTransfer.toMappingId, allowedCombination.toMappingOptions, true);
      const fromMappingId = GetMappingIdWithOptions(approvedTransfer.fromMappingId, allowedCombination.fromMappingOptions, true);
      const initiatedByMappingId = GetMappingIdWithOptions(approvedTransfer.initiatedByMappingId, allowedCombination.initiatedByMappingOptions, true);

      const toMapping = GetMappingWithOptions(approvedTransfer.toMapping, allowedCombination.toMappingOptions, true);
      const fromMapping = GetMappingWithOptions(approvedTransfer.fromMapping, allowedCombination.fromMappingOptions, true);
      const initiatedByMapping = GetMappingWithOptions(approvedTransfer.initiatedByMapping, allowedCombination.initiatedByMappingOptions, true);

      newCurrApprovedTransfers.push({
        toMappingId: toMappingId,
        fromMappingId: fromMappingId,
        initiatedByMappingId: initiatedByMappingId,
        transferTimes: times,
        badgeIds: badgeIds,
        ownershipTimes: ownershipTimes,
        allowedCombinations: [{
          isApproved: allowedCombination.isApproved,
        }],
        toMapping: toMapping,
        fromMapping: fromMapping,
        initiatedByMapping: initiatedByMapping,
        approvalDetails: approvedTransfer.approvalDetails,
        approvalId: approvedTransfer.approvalId,
        approvalTrackerId: approvedTransfer.approvalTrackerId,
        challengeTrackerId: approvedTransfer.challengeTrackerId,
      });
    }
  }

  return newCurrApprovedTransfers;
}


/**
 * @category Approvals / Transferability
 */
export function appendDefaultForIncoming(currApprovedTransfers: UserApprovedIncomingTransferWithDetails<bigint>[], userAddress: string): UserApprovedIncomingTransferWithDetails<bigint>[] {
  if (userAddress === "Mint" || userAddress === "Total") {
    return currApprovedTransfers;
  }

  const defaultToAdd = {
    fromMappingId: "AllWithMint", //everyone
    fromMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
    initiatedByMapping: getReservedAddressMapping(userAddress, "") as AddressMapping,
    initiatedByMappingId: userAddress,
    transferTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    ownershipTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    badgeIds: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    approvalId: "default-incoming",
    approvalTrackerId: "",
    challengeTrackerId: "",
    allowedCombinations: [{
      isApproved: true,
    }],
  }

  //append to front
  currApprovedTransfers = [defaultToAdd].concat(currApprovedTransfers);

  return currApprovedTransfers;
}

/**
 * By default, we approve all transfers if from === initiatedBy
 *
 * @category Approvals / Transferability
 */
export function appendDefaultForOutgoing(currApprovedTransfers: UserApprovedOutgoingTransferWithDetails<bigint>[], userAddress: string): UserApprovedOutgoingTransferWithDetails<bigint>[] {
  if (userAddress === "Mint" || userAddress === "Total") {
    return currApprovedTransfers;
  }

  const defaultToAdd = {
    toMappingId: "AllWithMint", //everyone
    initiatedByMappingId: userAddress,
    toMapping: getReservedAddressMapping("AllWithMint", "") as AddressMapping,
    initiatedByMapping: getReservedAddressMapping(userAddress, "") as AddressMapping,
    transferTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    ownershipTimes: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    badgeIds: [{
      start: 1n,
      end: 18446744073709551615n,
    }],
    approvalId: "default-outgoing",
    approvalTrackerId: "",
    challengeTrackerId: "",
    allowedCombinations: [{
      isApproved: true,
    }],
  }

  //append to front
  currApprovedTransfers = [defaultToAdd].concat(currApprovedTransfers);


  return currApprovedTransfers;
}
