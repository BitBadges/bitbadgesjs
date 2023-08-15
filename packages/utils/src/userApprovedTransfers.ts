import { AddressMapping } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { UserApprovedIncomingTransferWithDetails, UserApprovedOutgoingTransferWithDetails } from "./types/users";


/**
 * @category Approvals / Transferability
 */
export function appendDefaultForIncoming(currApprovedTransfers: UserApprovedIncomingTransferWithDetails<bigint>[], userAddress: string): UserApprovedIncomingTransferWithDetails<bigint>[] {
  if (userAddress === "Mint" || userAddress === "Total") {
    return currApprovedTransfers;
  }

  currApprovedTransfers = currApprovedTransfers.concat([{
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
    approvalDetails: [],
    allowedCombinations: [{
      isApproved: true,
      transferTimesOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      badgeIdsOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      ownershipTimesOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      fromMappingOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      initiatedByMappingOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
    }],
  }]);

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

  currApprovedTransfers = currApprovedTransfers.concat([{
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
    approvalDetails: [],
    allowedCombinations: [{
      isApproved: true,
      transferTimesOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      badgeIdsOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      ownershipTimesOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      toMappingOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
      initiatedByMappingOptions: {
        invertDefault: false,
        allValues: false,
        noValues: false,
      },
    }],
  }]);

  return currApprovedTransfers;
}
