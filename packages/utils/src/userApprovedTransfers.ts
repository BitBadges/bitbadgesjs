import { UserApprovedIncomingTransfer, UserApprovedOutgoingTransfer } from "bitbadgesjs-proto";

// By default, we approve all transfers if to === initiatedBy
export function appendDefaultForIncoming(currApprovedTransfers: UserApprovedIncomingTransfer<bigint>[], userAddress: string): UserApprovedIncomingTransfer<bigint>[] {
  currApprovedTransfers = currApprovedTransfers.concat([{
    fromMappingId: "AllWithMint", //everyone
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

// By default, we approve all transfers if from === initiatedBy
export function appendDefaultForOutgoing(currApprovedTransfers: UserApprovedOutgoingTransfer<bigint>[], userAddress: string): UserApprovedOutgoingTransfer<bigint>[] {
  currApprovedTransfers = currApprovedTransfers.concat([{
    toMappingId: "AllWithMint", //everyone
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
