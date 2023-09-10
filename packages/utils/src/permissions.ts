import { ActionPermission, AddressMapping, BadgeMetadata, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { UniversalCombination, UniversalPermission } from "./overlaps";
import { CollectionApprovedTransferPermissionWithDetails, CollectionApprovedTransferWithDetails } from "./types/collections";
import { UserApprovedIncomingTransferWithDetails, UserApprovedOutgoingTransferWithDetails } from "./types/users";
import { searchUintRangesForId } from "./uintRanges";


/**
 * Simply checks if Date.now() is in the forbiddenTimes provided. If this returns false, the permission is permitted. Else, it is explicitly forbidden.
 *
 * @param {UintRange<bigint>[]} forbiddenTimes - The forbidden times to check.
 *
 * @category Validate Permissions
 */
export function isCurrentTimeForbidden(forbiddenTimes: UintRange<bigint>[]) {
  const currentTime = BigInt(Date.now());

  const [_, found] = searchUintRangesForId(currentTime, forbiddenTimes);
  return found;
}


const AllDefaultValues = {
  permittedTimes: [],
  forbiddenTimes: [],
  badgeIds: [],
  timelineTimes: [],
  transferTimes: [],
  ownershipTimes: [],
  fromMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
  toMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
  initiatedByMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false, // Replace this with the actual usesTransferTimes property from actionPermission.defaultValues
  usesToMapping: false, // Replace this with the actual usesToMapping property from actionPermission.defaultValues
  usesFromMapping: false, // Replace this with the actual usesFromMapping property from actionPermission.defaultValues
  usesInitiatedByMapping: false, // Replace this with the actual usesInitiatedByMapping property from actionPermission.defaultValues
  usesOwnershipTimes: false, // Replace this with the actual usesOwnershipTimes property from actionPermission.defaultValues
  arbitraryValue: undefined, // Replace this with the actual arbitraryValue property from actionPermission.defaultValues
}

const AllDefaultOptions = {
  fromMappingOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  toMappingOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  initiatedByMappingOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  transferTimesOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  badgeIdsOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  ownershipTimesOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  permittedTimesOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  forbiddenTimesOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
  timelineTimesOptions: {
    invertDefault: false,
    allValues: true,
    noValues: false
  },
};

/**
 * Casts an ActionPermission to a UniversalPermission.
 *
 * @param {ActionPermission<bigint>[]} actionPermission - The ActionPermission to cast.
 * @returns {UniversalPermission[]} The casted UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castActionPermissionToUniversalPermission = (actionPermission: ActionPermission<bigint>[]) => {
  const castedPermissions: UniversalPermission[] = [];
  for (const permission of actionPermission) {
    const castedCombinations: UniversalCombination[] = [];
    for (const combination of permission.combinations) {
      castedCombinations.push({
        ...AllDefaultOptions,
        permittedTimesOptions: combination.permittedTimesOptions,
        forbiddenTimesOptions: combination.forbiddenTimesOptions,
      });
    }

    castedPermissions.push({
      defaultValues: {
        permittedTimes: permission.defaultValues.permittedTimes,
        forbiddenTimes: permission.defaultValues.forbiddenTimes,
        badgeIds: [],
        timelineTimes: [],
        transferTimes: [],
        ownershipTimes: [],
        fromMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        toMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        usesBadgeIds: false,
        usesTimelineTimes: false,
        usesTransferTimes: false, // Replace this with the actual usesTransferTimes property from actionPermission.defaultValues
        usesToMapping: false, // Replace this with the actual usesToMapping property from actionPermission.defaultValues
        usesFromMapping: false, // Replace this with the actual usesFromMapping property from actionPermission.defaultValues
        usesInitiatedByMapping: false, // Replace this with the actual usesInitiatedByMapping property from actionPermission.defaultValues
        usesOwnershipTimes: false, // Replace this with the actual usesOwnershipTimes property from actionPermission.defaultValues
        arbitraryValue: undefined, // Replace this with the actual arbitraryValue property from actionPermission.defaultValues
      },
      combinations: castedCombinations,
    });
  }
  return castedPermissions;
};

/**
 * Casts a CollectionApprovedTransferPermission to a UniversalPermission.
 *
 * @param {CollectionApprovedTransferPermission[]} collectionUpdatePermission - The CollectionApprovedTransferPermission to cast.
 * @returns {UniversalPermission[]} The casted UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castCollectionApprovedTransferPermissionToUniversalPermission = (
  collectionUpdatePermission: CollectionApprovedTransferPermissionWithDetails<bigint>[]
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];
  for (const collectionPermission of collectionUpdatePermission) {
    const castedCombinations: UniversalCombination[] = [];
    for (const collectionCombination of collectionPermission.combinations) {
      castedCombinations.push({
        permittedTimesOptions: collectionCombination.permittedTimesOptions,
        forbiddenTimesOptions: collectionCombination.forbiddenTimesOptions,
        timelineTimesOptions: collectionCombination.timelineTimesOptions,
        transferTimesOptions: collectionCombination.transferTimesOptions,
        ownershipTimesOptions: collectionCombination.ownershipTimesOptions,
        toMappingOptions: collectionCombination.toMappingOptions,
        fromMappingOptions: collectionCombination.fromMappingOptions,
        initiatedByMappingOptions: collectionCombination.initiatedByMappingOptions,
        badgeIdsOptions: collectionCombination.badgeIdsOptions,
      });
    }

    castedPermissions.push({
      defaultValues: {
        timelineTimes: collectionPermission.defaultValues.timelineTimes,
        transferTimes: collectionPermission.defaultValues.transferTimes,
        ownershipTimes: collectionPermission.defaultValues.ownershipTimes,
        fromMapping: collectionPermission.defaultValues.fromMapping,
        toMapping: collectionPermission.defaultValues.toMapping,
        initiatedByMapping: collectionPermission.defaultValues.initiatedByMapping,
        badgeIds: collectionPermission.defaultValues.badgeIds,
        usesBadgeIds: true,
        usesTimelineTimes: true,
        usesTransferTimes: true,
        usesOwnershipTimes: true,
        usesToMapping: true,
        usesFromMapping: true,
        usesInitiatedByMapping: true,
        permittedTimes: collectionPermission.defaultValues.permittedTimes,
        forbiddenTimes: collectionPermission.defaultValues.forbiddenTimes,
        arbitraryValue: undefined,
      },
      combinations: castedCombinations,
    });

  }
  return castedPermissions;
};

/**
 * Casts a TimedUpdateWithBadgeIdsPermission to a UniversalPermission.
 *
 * @param {TimedUpdateWithBadgeIdsPermission[]} timedUpdateWithBadgeIdsPermission - The TimedUpdateWithBadgeIdsPermission to cast.
 * @returns {UniversalPermission[]} The casted UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castTimedUpdateWithBadgeIdsPermissionToUniversalPermission = (
  timedUpdateWithBadgeIdsPermission: TimedUpdateWithBadgeIdsPermission<bigint>[]
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];
  for (const timedPermission of timedUpdateWithBadgeIdsPermission) {
    const castedCombinations: UniversalCombination[] = [];
    for (const timedCombination of timedPermission.combinations) {
      castedCombinations.push({
        ...AllDefaultOptions,
        badgeIdsOptions: timedCombination.badgeIdsOptions,
        permittedTimesOptions: timedCombination.permittedTimesOptions,
        forbiddenTimesOptions: timedCombination.forbiddenTimesOptions,
        timelineTimesOptions: timedCombination.timelineTimesOptions,
      });
    }

    castedPermissions.push({
      defaultValues: {
        ...AllDefaultValues,
        timelineTimes: timedPermission.defaultValues.timelineTimes,
        badgeIds: timedPermission.defaultValues.badgeIds,
        usesTimelineTimes: true,
        usesBadgeIds: true,
        permittedTimes: timedPermission.defaultValues.permittedTimes,
        forbiddenTimes: timedPermission.defaultValues.forbiddenTimes,
      },
      combinations: castedCombinations,
    });
  }
  return castedPermissions;
};


/**
 * Casts a TimedUpdatePermission to a UniversalPermission.
 *
 * @param {TimedUpdatePermission[]} timedUpdatePermission - The TimedUpdatePermission to cast.
 * @returns {UniversalPermission[]} The casted UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castTimedUpdatePermissionToUniversalPermission = (
  timedUpdatePermission: TimedUpdatePermission<bigint>[]
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];
  for (const timedPermission of timedUpdatePermission) {
    const castedCombinations: UniversalCombination[] = [];
    for (const timedCombination of timedPermission.combinations) {
      castedCombinations.push({
        ...AllDefaultOptions,
        permittedTimesOptions: timedCombination.permittedTimesOptions,
        forbiddenTimesOptions: timedCombination.forbiddenTimesOptions,
        timelineTimesOptions: timedCombination.timelineTimesOptions,
      });
    }

    castedPermissions.push({
      defaultValues: {
        ...AllDefaultValues,
        timelineTimes: timedPermission.defaultValues.timelineTimes,
        usesTimelineTimes: true,
        permittedTimes: timedPermission.defaultValues.permittedTimes,
        forbiddenTimes: timedPermission.defaultValues.forbiddenTimes,
      },
      combinations: castedCombinations,
    });
  }
  return castedPermissions;
};

/**
 * Casts a BalancesActionPermission to a UniversalPermission.
 *
 * @param {BalancesActionPermission[]} balancesActionPermission - The BalancesActionPermission to cast.
 * @returns {UniversalPermission[]} The casted UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castBalancesActionPermissionToUniversalPermission = (
  balancesActionPermission: BalancesActionPermission<bigint>[]
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];
  for (const permission of balancesActionPermission) {
    const castedCombinations: UniversalCombination[] = [];
    for (const combination of permission.combinations) {
      castedCombinations.push({
        ...AllDefaultOptions,
        badgeIdsOptions: combination.badgeIdsOptions,
        ownershipTimesOptions: combination.ownershipTimesOptions,
        permittedTimesOptions: combination.permittedTimesOptions,
        forbiddenTimesOptions: combination.forbiddenTimesOptions,
      });
    }

    castedPermissions.push({
      defaultValues: {
        ...AllDefaultValues,
        badgeIds: permission.defaultValues.badgeIds,
        ownershipTimes: permission.defaultValues.ownershipTimes,
        usesBadgeIds: true,
        usesOwnershipTimes: true,
        permittedTimes: permission.defaultValues.permittedTimes,
        forbiddenTimes: permission.defaultValues.forbiddenTimes,
      },
      combinations: castedCombinations,
    });
  }
  return castedPermissions;
};

/**
 * Casts a CollectionApprovedTransfer to a UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castCollectionApprovedTransferToUniversalPermission = (
  collectionApprovedTransfers: CollectionApprovedTransferWithDetails<bigint>[]
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];

  for (const approvedTransfer of collectionApprovedTransfers) {
    castedPermissions.push({
      defaultValues: {
        ...AllDefaultValues,
        badgeIds: approvedTransfer.badgeIds,
        transferTimes: approvedTransfer.transferTimes,
        ownershipTimes: approvedTransfer.ownershipTimes,
        fromMapping: approvedTransfer.fromMapping,
        toMapping: approvedTransfer.toMapping,
        initiatedByMapping: approvedTransfer.initiatedByMapping,
        usesBadgeIds: true,
        usesTransferTimes: true,
        usesToMapping: true,
        usesFromMapping: true,
        usesInitiatedByMapping: true,
        usesOwnershipTimes: true,
        arbitraryValue: {
          approvalDetails: approvedTransfer.approvalDetails,
          allowedCombinations: approvedTransfer.allowedCombinations,
        }
      },
      combinations: [{
      }],
    });
  }
  return castedPermissions;
};


/**
 * Casts a UserApprovedOutgoingTransfer to a UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castUserApprovedOutgoingTransfersToUniversalPermission = (
  userApprovedOutgoingTransfers: UserApprovedOutgoingTransferWithDetails<bigint>[],
  fromAddress: string
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];

  for (const approvedTransfer of userApprovedOutgoingTransfers) {
    castedPermissions.push({
      defaultValues: {
        ...AllDefaultValues,
        badgeIds: approvedTransfer.badgeIds,
        transferTimes: approvedTransfer.transferTimes,
        ownershipTimes: approvedTransfer.ownershipTimes,
        fromMapping: getReservedAddressMapping(fromAddress, "") as AddressMapping,
        toMapping: approvedTransfer.toMapping,
        initiatedByMapping: approvedTransfer.initiatedByMapping,
        usesBadgeIds: true,
        usesTransferTimes: true,
        usesToMapping: true,
        usesFromMapping: true,
        usesInitiatedByMapping: true,
        usesOwnershipTimes: true,
        arbitraryValue: {
          approvalDetails: approvedTransfer.approvalDetails,
          allowedCombinations: approvedTransfer.allowedCombinations,
        }
      },
      combinations: [{
      }],
    });
  }
  return castedPermissions;
};



/**
 * Casts a UserApprovedOutgoingTransfer to a UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castUserApprovedIncomingTransfersToUniversalPermission = (
  userApprovedIncomingTransfers: UserApprovedIncomingTransferWithDetails<bigint>[],
  toAddress: string
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];

  for (const approvedTransfer of userApprovedIncomingTransfers) {
    castedPermissions.push({
      defaultValues: {
        ...AllDefaultValues,
        badgeIds: approvedTransfer.badgeIds,
        transferTimes: approvedTransfer.transferTimes,
        ownershipTimes: approvedTransfer.ownershipTimes,
        fromMapping: approvedTransfer.fromMapping,
        toMapping: getReservedAddressMapping(toAddress, "") as AddressMapping,
        initiatedByMapping: approvedTransfer.initiatedByMapping,
        usesBadgeIds: true,
        usesTransferTimes: true,
        usesToMapping: true,
        usesFromMapping: true,
        usesInitiatedByMapping: true,
        usesOwnershipTimes: true,
        arbitraryValue: {
          approvalDetails: approvedTransfer.approvalDetails,
          allowedCombinations: approvedTransfer.allowedCombinations,
        }
      },
      combinations: [{

      }],
    });
  }
  return castedPermissions;
};

// export const castInheritedBalancesToUniversalPermission = (
//   inheritedBalances: InheritedBalance<bigint>[]
// ): UniversalPermission[] => {
//   let castedPermissions: UniversalPermission[] = [];
//   for (let inheritedBalance of inheritedBalances) {
//     castedPermissions.push({
//       defaultValues: {
//         ...AllDefaultValues,
//         badgeIds: inheritedBalance.badgeIds,
//         usesBadgeIds: true,
//         arbitraryValue: inheritedBalance,
//       },
//       combinations: [
//         {
//           ...AllDefaultOptions,
//         }
//       ],
//     });
//   }
//   return castedPermissions;
// }

export const castBadgeMetadataToUniversalPermission = (
  badgeMetadata: BadgeMetadata<bigint>[]
): UniversalPermission[] => {
  let castedPermissions: UniversalPermission[] = [];
  for (let metadata of badgeMetadata) {
    castedPermissions.push({
      defaultValues: {
        ...AllDefaultValues,
        badgeIds: metadata.badgeIds,
        usesBadgeIds: true,
        arbitraryValue: metadata.uri + "<><><>" + metadata.customData,
      },
      combinations: [
        {
          ...AllDefaultOptions,
        }
      ],
    });
  }
  return castedPermissions;
}
