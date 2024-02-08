import { ActionPermission, AddressList, BadgeMetadata, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange } from "bitbadgesjs-proto";
import { getReservedAddressList, getReservedTrackerList } from "./addressLists";
import { UniversalPermission } from "./overlaps";
import { CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails, UserIncomingApprovalPermissionWithDetails, UserOutgoingApprovalPermissionWithDetails } from "./types/collections";
import { UserIncomingApprovalWithDetails, UserOutgoingApprovalWithDetails } from "./types/users";
import { searchUintRangesForId } from "./uintRanges";


/**
 * Simply checks if Date.now() is in the permanentlyForbiddenTimes provided. If this returns false, the permission is permitted. Else, it is explicitly forbidden.
 *
 * @param {UintRange<bigint>[]} permanentlyForbiddenTimes - The forbidden times to check.
 *
 * @category Validate Permissions
 */
export function isCurrentTimeForbidden(permanentlyForbiddenTimes: UintRange<bigint>[]) {
  const currentTime = BigInt(Date.now());

  const [_, found] = searchUintRangesForId(currentTime, permanentlyForbiddenTimes);
  return found;
}


const AllDefaultValues = {
  permanentlyPermittedTimes: [],
  permanentlyForbiddenTimes: [],
  badgeIds: [],
  timelineTimes: [],
  transferTimes: [],
  ownershipTimes: [],
  fromList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
  toList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
  initiatedByList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
  approvalIdList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
  amountTrackerIdList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
  challengeTrackerIdList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false,
  usesApprovalIdList: false,
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false, // Replace this with the actual usesTransferTimes property from actionPermission
  usesToList: false, // Replace this with the actual usesToList property from actionPermission
  usesFromList: false, // Replace this with the actual usesFromList property from actionPermission
  usesInitiatedByList: false, // Replace this with the actual usesInitiatedByList property from actionPermission
  usesOwnershipTimes: false, // Replace this with the actual usesOwnershipTimes property from actionPermission
  arbitraryValue: undefined, // Replace this with the actual arbitraryValue property from actionPermission
}


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

      permanentlyPermittedTimes: permission.permanentlyPermittedTimes,
      permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes,
      badgeIds: [],
      timelineTimes: [],
      transferTimes: [],
      ownershipTimes: [],
      fromList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
      toList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
      initiatedByList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
      approvalIdList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
      amountTrackerIdList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdList: { listId: 'All', addresses: ["Mint"], whitelist: false, uri: "", customData: "", createdBy: "" },
      usesAmountTrackerIdList: false,
      usesChallengeTrackerIdList: false,
      usesApprovalIdList: false,

      usesBadgeIds: false,
      usesTimelineTimes: false,
      usesTransferTimes: false, // Replace this with the actual usesTransferTimes property from actionPermission
      usesToList: false, // Replace this with the actual usesToList property from actionPermission
      usesFromList: false, // Replace this with the actual usesFromList property from actionPermission
      usesInitiatedByList: false, // Replace this with the actual usesInitiatedByList property from actionPermission
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

    castedPermissions.push({
      ...AllDefaultValues,
      transferTimes: collectionPermission.transferTimes,
      ownershipTimes: collectionPermission.ownershipTimes,
      fromList: collectionPermission.fromList,
      toList: collectionPermission.toList,
      initiatedByList: collectionPermission.initiatedByList,
      badgeIds: collectionPermission.badgeIds,
      approvalIdList: getReservedTrackerList(collectionPermission.approvalId),
      amountTrackerIdList: getReservedTrackerList(collectionPermission.amountTrackerId),
      challengeTrackerIdList: getReservedTrackerList(collectionPermission.challengeTrackerId),
      usesAmountTrackerIdList: true,
      usesChallengeTrackerIdList: true,
      usesApprovalIdList: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesOwnershipTimes: true,
      usesToList: true,
      usesFromList: true,
      usesInitiatedByList: true,
      permanentlyPermittedTimes: collectionPermission.permanentlyPermittedTimes,
      permanentlyForbiddenTimes: collectionPermission.permanentlyForbiddenTimes,
      arbitraryValue: undefined,
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

      ...AllDefaultValues,
      timelineTimes: timedPermission.timelineTimes,
      badgeIds: timedPermission.badgeIds,
      usesTimelineTimes: true,
      usesBadgeIds: true,
      permanentlyPermittedTimes: timedPermission.permanentlyPermittedTimes,
      permanentlyForbiddenTimes: timedPermission.permanentlyForbiddenTimes,
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
      ...AllDefaultValues,
      timelineTimes: timedPermission.timelineTimes,
      usesTimelineTimes: true,
      permanentlyPermittedTimes: timedPermission.permanentlyPermittedTimes,
      permanentlyForbiddenTimes: timedPermission.permanentlyForbiddenTimes,

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
      ...AllDefaultValues,
      badgeIds: permission.badgeIds,
      ownershipTimes: permission.ownershipTimes,
      usesBadgeIds: true,
      usesOwnershipTimes: true,
      permanentlyPermittedTimes: permission.permanentlyPermittedTimes,
      permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes,
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
    castedPermissions.push({
      ...AllDefaultValues,
      badgeIds: approval.badgeIds,
      transferTimes: approval.transferTimes,
      ownershipTimes: approval.ownershipTimes,
      fromList: approval.fromList,
      toList: approval.toList,
      initiatedByList: approval.initiatedByList,
      approvalIdList: getReservedTrackerList(approval.approvalId),
      amountTrackerIdList: getReservedTrackerList(approval.amountTrackerId),
      challengeTrackerIdList: getReservedTrackerList(approval.challengeTrackerId),
      usesAmountTrackerIdList: true,
      usesChallengeTrackerIdList: true,
      usesApprovalIdList: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesToList: true,
      usesFromList: true,
      usesInitiatedByList: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalId: approval.approvalId,
        amountTrackerId: approval.amountTrackerId,
        challengeTrackerId: approval.challengeTrackerId,
        approvalCriteria: approval.approvalCriteria,

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
    castedPermissions.push({
      ...AllDefaultValues,
      badgeIds: approval.badgeIds,
      transferTimes: approval.transferTimes,
      ownershipTimes: approval.ownershipTimes,
      fromList: getReservedAddressList(fromAddress) as AddressList,
      toList: approval.toList,
      initiatedByList: approval.initiatedByList,
      approvalIdList: getReservedTrackerList(approval.approvalId),
      amountTrackerIdList: getReservedTrackerList(approval.amountTrackerId),
      challengeTrackerIdList: getReservedTrackerList(approval.challengeTrackerId),
      usesAmountTrackerIdList: true,
      usesChallengeTrackerIdList: true,
      usesApprovalIdList: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesToList: true,
      usesFromList: true,
      usesInitiatedByList: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalId: approval.approvalId,
        amountTrackerId: approval.amountTrackerId,
        challengeTrackerId: approval.challengeTrackerId,
        approvalCriteria: approval.approvalCriteria,

      }
    });
  }
  return castedPermissions;
};

/**
 * Casts a UserOutgoingApproval to a CollectionApprovalPermission.
 *
 * @category Permissions Casts
 */
export const castUserIncomingApprovalPermissionToCollectionApprovalPermission = (
  userIncomingApprovals: UserIncomingApprovalPermissionWithDetails<bigint>[],
  toAddress: string
): CollectionApprovalPermissionWithDetails<bigint>[] => {
  return userIncomingApprovals.map((approval) => {
    return {
      ...approval,
      toList: getReservedAddressList(toAddress) as AddressList,
      toListId: toAddress,
    }
  }
  );
}

/**
 * Casts a UserOutgoingApproval to a CollectionApprovalPermission.
 *
 * @category Permissions Casts
 */
export const castUserOutgoingApprovalPermissionToCollectionApprovalPermission = (
  userOutgoingApprovals: UserOutgoingApprovalPermissionWithDetails<bigint>[],
  fromAddress: string
): CollectionApprovalPermissionWithDetails<bigint>[] => {
  return userOutgoingApprovals.map((approval) => {
    return {
      ...approval,
      fromList: getReservedAddressList(fromAddress) as AddressList,
      fromListId: fromAddress,
    }
  }
  );
}


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
    castedPermissions.push({
      ...AllDefaultValues,
      badgeIds: approval.badgeIds,
      transferTimes: approval.transferTimes,
      ownershipTimes: approval.ownershipTimes,
      fromList: approval.fromList,
      toList: getReservedAddressList(toAddress) as AddressList,
      initiatedByList: approval.initiatedByList,
      approvalIdList: getReservedTrackerList(approval.approvalId),
      amountTrackerIdList: getReservedTrackerList(approval.amountTrackerId),
      challengeTrackerIdList: getReservedTrackerList(approval.challengeTrackerId),
      usesAmountTrackerIdList: true,
      usesChallengeTrackerIdList: true,
      usesApprovalIdList: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesToList: true,
      usesFromList: true,
      usesInitiatedByList: true,
      usesOwnershipTimes: true,
      arbitraryValue: {
        approvalCriteria: approval.approvalCriteria,

      }
    });
  }
  return castedPermissions;
};

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
    });
  }
  return castedPermissions;
}
