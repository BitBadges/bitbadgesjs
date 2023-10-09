import { ActionPermission, AddressMapping, BadgeMetadata, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange } from "bitbadgesjs-proto";
import { getReservedAddressMapping } from "./addressMappings";
import { UniversalPermission } from "./overlaps";
import { CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";
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
  amountTrackerIdMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
  challengeTrackerIdMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
  usesAmountTrackerIdMapping: false,
  usesChallengeTrackerIdMapping: false,
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false, // Replace this with the actual usesTransferTimes property from actionPermission
  usesToMapping: false, // Replace this with the actual usesToMapping property from actionPermission
  usesFromMapping: false, // Replace this with the actual usesFromMapping property from actionPermission
  usesInitiatedByMapping: false, // Replace this with the actual usesInitiatedByMapping property from actionPermission
  usesOwnershipTimes: false, // Replace this with the actual usesOwnershipTimes property from actionPermission
  arbitraryValue: undefined, // Replace this with the actual arbitraryValue property from actionPermission
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

    castedPermissions.push({
      ...AllDefaultOptions,
      permittedTimesOptions: permission.permittedTimesOptions,
      forbiddenTimesOptions: permission.forbiddenTimesOptions,

      permittedTimes: permission.permittedTimes,
      forbiddenTimes: permission.forbiddenTimes,
      badgeIds: [],
      timelineTimes: [],
      transferTimes: [],
      ownershipTimes: [],
      fromMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      toMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      initiatedByMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      amountTrackerIdMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdMapping: { mappingId: 'All', addresses: ["Mint"], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      usesAmountTrackerIdMapping: false,
      usesChallengeTrackerIdMapping: false,
      usesBadgeIds: false,
      usesTimelineTimes: false,
      usesTransferTimes: false, // Replace this with the actual usesTransferTimes property from actionPermission
      usesToMapping: false, // Replace this with the actual usesToMapping property from actionPermission
      usesFromMapping: false, // Replace this with the actual usesFromMapping property from actionPermission
      usesInitiatedByMapping: false, // Replace this with the actual usesInitiatedByMapping property from actionPermission
      usesOwnershipTimes: false, // Replace this with the actual usesOwnershipTimes property from actionPermission
      arbitraryValue: undefined, // Replace this with the actual arbitraryValue property from actionPermission
    }
    )
  }
  return castedPermissions;
};

/**
 * Casts a CollectionApprovalPermission to a UniversalPermission.
 *
 * @param {CollectionApprovalPermission[]} collectionUpdatePermission - The CollectionApprovalPermission to cast.
 * @returns {UniversalPermission[]} The casted UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castCollectionApprovalPermissionToUniversalPermission = (
  collectionUpdatePermission: CollectionApprovalPermissionWithDetails<bigint>[]
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];
  for (const collectionPermission of collectionUpdatePermission) {

    let approvalTrackerMapping: AddressMapping | undefined = undefined;

    if (collectionPermission.amountTrackerId === "All") {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [collectionPermission.amountTrackerId],
        includeAddresses: true
      };
    }

    let challengeTrackerMapping: AddressMapping | undefined = undefined;
    if (collectionPermission.challengeTrackerId === "All") {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [collectionPermission.challengeTrackerId],
        includeAddresses: true
      };
    }


    castedPermissions.push({
      ...AllDefaultValues,
      transferTimes: collectionPermission.transferTimes,
      ownershipTimes: collectionPermission.ownershipTimes,
      fromMapping: collectionPermission.fromMapping,
      toMapping: collectionPermission.toMapping,
      initiatedByMapping: collectionPermission.initiatedByMapping,
      badgeIds: collectionPermission.badgeIds,
      amountTrackerIdMapping: approvalTrackerMapping,
      challengeTrackerIdMapping: challengeTrackerMapping,
      usesAmountTrackerIdMapping: true,
      usesChallengeTrackerIdMapping: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesOwnershipTimes: true,
      usesToMapping: true,
      usesFromMapping: true,
      usesInitiatedByMapping: true,
      permittedTimes: collectionPermission.permittedTimes,
      forbiddenTimes: collectionPermission.forbiddenTimes,
      arbitraryValue: undefined,

      permittedTimesOptions: collectionPermission.permittedTimesOptions,
      forbiddenTimesOptions: collectionPermission.forbiddenTimesOptions,
      transferTimesOptions: collectionPermission.transferTimesOptions,
      ownershipTimesOptions: collectionPermission.ownershipTimesOptions,
      toMappingOptions: collectionPermission.toMappingOptions,
      fromMappingOptions: collectionPermission.fromMappingOptions,
      initiatedByMappingOptions: collectionPermission.initiatedByMappingOptions,
      badgeIdsOptions: collectionPermission.badgeIdsOptions,
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

    castedPermissions.push({
      ...AllDefaultOptions,
      badgeIdsOptions: timedPermission.badgeIdsOptions,
      permittedTimesOptions: timedPermission.permittedTimesOptions,
      forbiddenTimesOptions: timedPermission.forbiddenTimesOptions,
      timelineTimesOptions: timedPermission.timelineTimesOptions,

      ...AllDefaultValues,
      timelineTimes: timedPermission.timelineTimes,
      badgeIds: timedPermission.badgeIds,
      usesTimelineTimes: true,
      usesBadgeIds: true,
      permittedTimes: timedPermission.permittedTimes,
      forbiddenTimes: timedPermission.forbiddenTimes,
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

    castedPermissions.push({
      ...AllDefaultOptions,
      permittedTimesOptions: timedPermission.permittedTimesOptions,
      forbiddenTimesOptions: timedPermission.forbiddenTimesOptions,
      timelineTimesOptions: timedPermission.timelineTimesOptions,

      ...AllDefaultValues,
      timelineTimes: timedPermission.timelineTimes,
      usesTimelineTimes: true,
      permittedTimes: timedPermission.permittedTimes,
      forbiddenTimes: timedPermission.forbiddenTimes,

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

    castedPermissions.push({
      ...AllDefaultOptions,
      badgeIdsOptions: permission.badgeIdsOptions,
      ownershipTimesOptions: permission.ownershipTimesOptions,
      permittedTimesOptions: permission.permittedTimesOptions,
      forbiddenTimesOptions: permission.forbiddenTimesOptions,
      ...AllDefaultValues,
      badgeIds: permission.badgeIds,
      ownershipTimes: permission.ownershipTimes,
      usesBadgeIds: true,
      usesOwnershipTimes: true,
      permittedTimes: permission.permittedTimes,
      forbiddenTimes: permission.forbiddenTimes,
    });
  }
  return castedPermissions;
};

/**
 * Casts a CollectionApproval to a UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castCollectionApprovalToUniversalPermission = (
  collectionApprovals: CollectionApprovalWithDetails<bigint>[]
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];

  for (const approval of collectionApprovals) {

    let approvalTrackerMapping: AddressMapping | undefined = undefined;

    if (approval.amountTrackerId === "All") {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [approval.amountTrackerId],
        includeAddresses: true
      };
    }

    let challengeTrackerMapping: AddressMapping | undefined = undefined;
    if (approval.challengeTrackerId === "All") {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [approval.challengeTrackerId],
        includeAddresses: true
      };
    }

    castedPermissions.push({
      ...AllDefaultValues,
      badgeIds: approval.badgeIds,
      transferTimes: approval.transferTimes,
      ownershipTimes: approval.ownershipTimes,
      fromMapping: approval.fromMapping,
      toMapping: approval.toMapping,
      initiatedByMapping: approval.initiatedByMapping,
      amountTrackerIdMapping: approvalTrackerMapping,
      challengeTrackerIdMapping: challengeTrackerMapping,
      usesAmountTrackerIdMapping: true,
      usesChallengeTrackerIdMapping: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesToMapping: true,
      usesFromMapping: true,
      usesInitiatedByMapping: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalId: approval.approvalId,
        amountTrackerId: approval.amountTrackerId,
        challengeTrackerId: approval.challengeTrackerId,
        approvalCriteria: approval.approvalCriteria,
        isApproved: approval.isApproved,
      }
    });
  }
  return castedPermissions;
};


/**
 * Casts a UserOutgoingApproval to a UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castUserOutgoingApprovalsToUniversalPermission = (
  userOutgoingApprovals: UserOutgoingApprovalWithDetails<bigint>[],
  fromAddress: string
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];

  for (const approval of userOutgoingApprovals) {
    let approvalTrackerMapping: AddressMapping | undefined = undefined;

    if (approval.amountTrackerId === "All") {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [approval.amountTrackerId],
        includeAddresses: true
      };
    }

    let challengeTrackerMapping: AddressMapping | undefined = undefined;
    if (approval.challengeTrackerId === "All") {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [approval.challengeTrackerId],
        includeAddresses: true
      };
    }

    castedPermissions.push({
      ...AllDefaultValues,
      badgeIds: approval.badgeIds,
      transferTimes: approval.transferTimes,
      ownershipTimes: approval.ownershipTimes,
      fromMapping: getReservedAddressMapping(fromAddress) as AddressMapping,
      toMapping: approval.toMapping,
      initiatedByMapping: approval.initiatedByMapping,
      amountTrackerIdMapping: approvalTrackerMapping,
      challengeTrackerIdMapping: challengeTrackerMapping,
      usesAmountTrackerIdMapping: true,
      usesChallengeTrackerIdMapping: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesToMapping: true,
      usesFromMapping: true,
      usesInitiatedByMapping: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalId: approval.approvalId,
        amountTrackerId: approval.amountTrackerId,
        challengeTrackerId: approval.challengeTrackerId,
        approvalCriteria: approval.approvalCriteria,
        isApproved: approval.isApproved,
      }
    });
  }
  return castedPermissions;
};



/**
 * Casts a UserOutgoingApproval to a UniversalPermission.
 *
 * @category Permissions Casts
 */
export const castUserIncomingApprovalsToUniversalPermission = (
  userIncomingApprovals: UserIncomingApprovalWithDetails<bigint>[],
  toAddress: string
): UniversalPermission[] => {
  const castedPermissions: UniversalPermission[] = [];

  for (const approval of userIncomingApprovals) {
    let approvalTrackerMapping: AddressMapping | undefined = undefined;

    if (approval.amountTrackerId === "All") {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      approvalTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [approval.amountTrackerId],
        includeAddresses: true
      };
    }

    let challengeTrackerMapping: AddressMapping | undefined = undefined;
    if (approval.challengeTrackerId === "All") {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [],
        includeAddresses: false
      };
    } else {
      challengeTrackerMapping = {
        uri: '',
        customData: '',
        mappingId: '',
        addresses: [approval.challengeTrackerId],
        includeAddresses: true
      };
    }

    castedPermissions.push({
      ...AllDefaultValues,
      badgeIds: approval.badgeIds,
      transferTimes: approval.transferTimes,
      ownershipTimes: approval.ownershipTimes,
      fromMapping: approval.fromMapping,
      toMapping: getReservedAddressMapping(toAddress) as AddressMapping,
      initiatedByMapping: approval.initiatedByMapping,
      amountTrackerIdMapping: approvalTrackerMapping,
      challengeTrackerIdMapping: challengeTrackerMapping,
      usesAmountTrackerIdMapping: true,
      usesChallengeTrackerIdMapping: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesToMapping: true,
      usesFromMapping: true,
      usesInitiatedByMapping: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalCriteria: approval.approvalCriteria,
        isApproved: approval.isApproved,
      }
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
      ...AllDefaultValues,
      badgeIds: metadata.badgeIds,
      usesBadgeIds: true,
      arbitraryValue: metadata.uri + "<><><>" + metadata.customData,

      ...AllDefaultOptions,
    });
  }
  return castedPermissions;
}
