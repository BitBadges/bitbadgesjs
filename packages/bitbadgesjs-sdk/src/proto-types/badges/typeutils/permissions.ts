import { NumberType } from "../string-numbers";
import { UintRange, convertUintRange, deepCopy } from "./typeUtils";

/**
 * UserPermissions represents the permissions of a user and what they can update about their approvals.
 *
 * @typedef {Object} UserPermissions
 * @property {UserOutgoingApprovalPermission[]} canUpdateOutgoingApprovals - The list of permissions for updating approved outgoing transfers.
 * @property {UserIncomingApprovalPermission[]} canUpdateIncomingApprovals - The list of permissions for updating approved incoming transfers.
 * @property {ActionPermission[]} canUpdateAutoApproveSelfInitiatedOutgoingTransfers - The permissions for updating auto-approving self-initiated outgoing transfers. If auto-approve is enabled, then the user will be approved by default for all outgoing transfers that are self-initiated.
 * @property {ActionPermission[]} canUpdateAutoApproveSelfInitiatedIncomingTransfers - The permissions for updating auto-approving self-initiated incoming transfers. If auto-approve is enabled, then the user will be approved by default for all incoming transfers that are self-initiated.
 */
export interface UserPermissions<T extends NumberType> {
  canUpdateOutgoingApprovals: UserOutgoingApprovalPermission<T>[];
  canUpdateIncomingApprovals: UserIncomingApprovalPermission<T>[];
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: ActionPermission<T>[];
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: ActionPermission<T>[];
}

export function convertUserPermissions<T extends NumberType, U extends NumberType>(permissions: UserPermissions<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserPermissions<U> {
  return deepCopy({
    ...permissions,
    canUpdateOutgoingApprovals: permissions.canUpdateOutgoingApprovals.map((b) => convertUserOutgoingApprovalPermission(b, convertFunction, populateOptionalFields)),
    canUpdateIncomingApprovals: permissions.canUpdateIncomingApprovals.map((b) => convertUserIncomingApprovalPermission(b, convertFunction, populateOptionalFields)),
    canUpdateAutoApproveSelfInitiatedIncomingTransfers: permissions.canUpdateAutoApproveSelfInitiatedIncomingTransfers.map((b) => convertActionPermission(b, convertFunction, populateOptionalFields)),
    canUpdateAutoApproveSelfInitiatedOutgoingTransfers: permissions.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.map((b) => convertActionPermission(b, convertFunction, populateOptionalFields)),
  })
}

/**
 * UserOutgoingApprovalPermission represents the permissions of a user and whether they can update their approved outgoing transfers.
 *
 * @typedef {Object} UserOutgoingApprovalPermission
 *
 * @property {string} toListId - The list ID of the to addresses of the approved outgoing transfers.
 * @property {string} initiatedByListId - The list ID of the initiatedBy addresses of the approved outgoing transfers.
 * @property {UintRange[]} transferTimes - The transfer times of the approved outgoing transfers.
 * @property {UintRange[]} badgeIds - The badge IDs of the approved outgoing transfers.
 * @property {UintRange[]} ownershipTimes - The owned times of the approved outgoing transfers.
 * @property {string} approvalId - The approval ID of the approved outgoing transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId.
 * @property {string} amountTrackerId - The approval tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId.
 * @property {string} challengeTrackerId - The challenge tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId.
 * @property {UintRange[]} permanentlyPermittedTimes - The permitted times of the approved outgoing transfers.
 * @property {UintRange[]} permanentlyForbiddenTimes - The forbidden times of the approved outgoing transfers.
*/
export interface UserOutgoingApprovalPermission<T extends NumberType> {
  toListId: string;
  initiatedByListId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  approvalId: string
  amountTrackerId: string
  challengeTrackerId: string

  permanentlyPermittedTimes: UintRange<T>[];
  permanentlyForbiddenTimes: UintRange<T>[];
}

export function convertUserOutgoingApprovalPermission<T extends NumberType, U extends NumberType>(permission: UserOutgoingApprovalPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserOutgoingApprovalPermission<U> {
  const _permission = populateOptionalFields ? {
    ...permission,
    fromListOptions: undefined,
  } as Required<UserOutgoingApprovalPermission<T>> : permission

  return deepCopy({
    ..._permission,
    transferTimes: permission.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: permission.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: permission.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyPermittedTimes: permission.permanentlyPermittedTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * UserIncomingApprovalPermission represents the permissions of a user and whether they can update their approved incoming transfers.
 *
 * @typedef {Object} UserIncomingApprovalPermission
 *
 * @property {string} fromListId - The list ID of the from addresses of the approved incoming transfers.
 * @property {string} initiatedByListId - The list ID of the initiatedBy addresses of the approved incoming transfers.
 * @property {UintRange[]} transferTimes - The transfer times of the approved incoming transfers.
 * @property {UintRange[]} badgeIds - The badge IDs of the approved incoming transfers.
 * @property {UintRange[]} ownershipTimes - The owned times of the approved incoming transfers.
 * @property {string} approvalId - The approval ID of the approved incoming transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId.
 * @property {string} amountTrackerId - The approval tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId.
 * @property {string} challengeTrackerId - The challenge tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId.
 *
 * @property {UintRange[]} permanentlyPermittedTimes - The permitted times of the approved incoming transfers.
 * @property {UintRange[]} permanentlyForbiddenTimes - The forbidden times of the approved incoming transfers.
*/
export interface UserIncomingApprovalPermission<T extends NumberType> {
  fromListId: string;
  initiatedByListId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  approvalId: string
  amountTrackerId: string
  challengeTrackerId: string
  permanentlyPermittedTimes: UintRange<T>[];
  permanentlyForbiddenTimes: UintRange<T>[]

}

export function convertUserIncomingApprovalPermission<T extends NumberType, U extends NumberType>(permission: UserIncomingApprovalPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserIncomingApprovalPermission<U> {
  const _permission = populateOptionalFields ? {
    ...permission,
    toListOptions: undefined,
  } as Required<UserIncomingApprovalPermission<T>> : permission

  return deepCopy({
    ..._permission,
    transferTimes: permission.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: permission.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: permission.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyPermittedTimes: permission.permanentlyPermittedTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * CollectionPermissions represents the permissions of a collection.
 *
 * @typedef {Object} CollectionPermissions
 * @property {ActionPermission[]} canDeleteCollection - The permissions for deleting the collection.
 * @property {TimedUpdatePermission[]} canArchiveCollection - The permissions for archiving the collection.
 * @property {TimedUpdatePermission[]} canUpdateOffChainBalancesMetadata - The permissions for updating the off-chain balances metadata.
 * @property {TimedUpdatePermission[]} canUpdateStandards - The permissions for updating the standards.
 * @property {TimedUpdatePermission[]} canUpdateCustomData - The permissions for updating the custom data.
 * @property {TimedUpdatePermission[]} canUpdateManager - The permissions for updating the manager.
 * @property {TimedUpdatePermission[]} canUpdateCollectionMetadata - The permissions for updating the collection metadata.
 * @property {BalancesActionPermission[]} canCreateMoreBadges - The permissions for creating more badges.
 * @property {TimedUpdateWithBadgeIdsPermission[]} canUpdateBadgeMetadata - The permissions for updating the badge metadata.
 * @property {CollectionApprovalPermission[]} canUpdateCollectionApprovals - The permissions for updating the collection approved transfers.
 */
export interface CollectionPermissions<T extends NumberType> {
  canDeleteCollection: ActionPermission<T>[];
  canArchiveCollection: TimedUpdatePermission<T>[];
  canUpdateOffChainBalancesMetadata: TimedUpdatePermission<T>[];
  canUpdateStandards: TimedUpdatePermission<T>[];
  canUpdateCustomData: TimedUpdatePermission<T>[];
  canUpdateManager: TimedUpdatePermission<T>[];
  canUpdateCollectionMetadata: TimedUpdatePermission<T>[];
  canCreateMoreBadges: BalancesActionPermission<T>[];
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission<T>[];
  canUpdateCollectionApprovals: CollectionApprovalPermission<T>[];
}

export function convertCollectionPermissions<T extends NumberType, U extends NumberType>(permissions: CollectionPermissions<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): CollectionPermissions<U> {
  return deepCopy({
    ...permissions,
    canDeleteCollection: permissions.canDeleteCollection.map((b) => convertActionPermission(b, convertFunction, populateOptionalFields)),
    canArchiveCollection: permissions.canArchiveCollection.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateOffChainBalancesMetadata: permissions.canUpdateOffChainBalancesMetadata.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateStandards: permissions.canUpdateStandards.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateCustomData: permissions.canUpdateCustomData.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateManager: permissions.canUpdateManager.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateCollectionMetadata: permissions.canUpdateCollectionMetadata.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canCreateMoreBadges: permissions.canCreateMoreBadges.map((b) => convertBalancesActionPermission(b, convertFunction, populateOptionalFields)),
    canUpdateBadgeMetadata: permissions.canUpdateBadgeMetadata.map((b) => convertTimedUpdateWithBadgeIdsPermission(b, convertFunction, populateOptionalFields)),
    canUpdateCollectionApprovals: permissions.canUpdateCollectionApprovals.map((b) => convertCollectionApprovalPermission(b, convertFunction, populateOptionalFields))
  })
}

/**
 * ActionPermission represents a standard permission with no extra criteria.
 *
 *@typedef {Object} ActionPermission
 * @property {UintRange[]} permanentlyPermittedTimes - The permitted times of the permission.
 * @property {UintRange[]} permanentlyForbiddenTimes - The forbidden times of the permission.
 */
export interface ActionPermission<T extends NumberType> {
  permanentlyPermittedTimes: UintRange<T>[];
  permanentlyForbiddenTimes: UintRange<T>[];
}

export function convertActionPermission<T extends NumberType, U extends NumberType>(permission: ActionPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): ActionPermission<U> {
  const _permission = populateOptionalFields ? {
    ...permission,
  } as Required<ActionPermission<T>> : permission

  return deepCopy({
    ..._permission,
    permanentlyPermittedTimes: permission.permanentlyPermittedTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * TimedUpdatePermission represents a permission that allows updating a timeline-based value time. For example, updating the collection metadata.
 * This permission allows you to define when the value can be updated, and what times the value can be updated for.
 *
 * @typedef {Object} TimedUpdatePermission
 * @property {UintRange[]} timelineTimes - The timeline times that the permission applies to.
 *@property {UintRange[]} permanentlyPermittedTimes - The permitted times of the permission.
 * @property {UintRange[]} permanentlyForbiddenTimes - The forbidden times of the permission.
 */
export interface TimedUpdatePermission<T extends NumberType> {
  timelineTimes: UintRange<T>[];
  permanentlyPermittedTimes: UintRange<T>[];
  permanentlyForbiddenTimes: UintRange<T>[];
}

export function convertTimedUpdatePermission<T extends NumberType, U extends NumberType>(permission: TimedUpdatePermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): TimedUpdatePermission<U> {
  const _permission = populateOptionalFields ? {
    ...permission,
  } as Required<TimedUpdatePermission<T>> : permission

  return deepCopy({
    ..._permission,
    timelineTimes: permission.timelineTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyPermittedTimes: permission.permanentlyPermittedTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}


/**
 * TimedUpdateWithBadgeIdsPermission represents a permission that allows updating a timeline-based value time with bagde IDS. For example, updating the badge metadata.
 *
 * This permission allows you to define when the value can be updated, and what times the value can be updated for, and for what badges the value can be updated for. Or any combination of these.
 *
 * @typedef {Object} TimedUpdateWithBadgeIdsPermission
 *@property {UintRange[]} timelineTimes - The timeline times that the permission applies to.
 * @property {UintRange[]} badgeIds - The badge IDs that the permission applies to.
 * @property {UintRange[]} permanentlyPermittedTimes - The permitted times of the permission.
 * @property {UintRange[]} permanentlyForbiddenTimes - The forbidden times of the permission.
 */
export interface TimedUpdateWithBadgeIdsPermission<T extends NumberType> {
  timelineTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  permanentlyPermittedTimes: UintRange<T>[];
  permanentlyForbiddenTimes: UintRange<T>[];
}

export function convertTimedUpdateWithBadgeIdsPermission<T extends NumberType, U extends NumberType>(permission: TimedUpdateWithBadgeIdsPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): TimedUpdateWithBadgeIdsPermission<U> {
  const _permission = populateOptionalFields ? {
    ...permission,
  } as Required<TimedUpdateWithBadgeIdsPermission<T>> : permission

  return deepCopy({
    ..._permission,
    timelineTimes: permission.timelineTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: permission.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    permanentlyPermittedTimes: permission.permanentlyPermittedTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * BalancesActionPermission represents a permission that allows creating more badges.
 *
 * This permission allows you to define when the permission can be executed and for what badgeIds and ownershipTimes the permission can be executed for. Or any combination of these.
 *
 * @typedef {Object} BalancesActionPermission
 * @property {UintRange[]} badgeIds - The badge IDs that the permission applies to.
 * @property {UintRange[]} ownershipTimes - The owned times of the permission.
 * @property {UintRange[]} permanentlyPermittedTimes - The permitted times of the permission.
 * @property {UintRange[]} permanentlyForbiddenTimes - The forbidden times of the permission.
*/
export interface BalancesActionPermission<T extends NumberType> {
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  permanentlyPermittedTimes: UintRange<T>[];
  permanentlyForbiddenTimes: UintRange<T>[];
}

export function convertBalancesActionPermission<T extends NumberType, U extends NumberType>(permission: BalancesActionPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): BalancesActionPermission<U> {
  const _permission = populateOptionalFields ? {
    ...permission,
  } as Required<BalancesActionPermission<T>> : permission

  return deepCopy({
    ..._permission,
    badgeIds: permission.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: permission.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyPermittedTimes: permission.permanentlyPermittedTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes.map((b) => convertUintRange(b, convertFunction)),
  })
}

/**
 * CollectionApprovalPermission represents a permission that allows updating the collection approved transfers.
 *
 * This permission allows you to define when the approved transfers can be updated and which combinations of (from, to, initiatedBy, transferTimes, badgeIds, ownershipTimes, permanentlyPermittedTimes, permanentlyForbiddenTimes) can be updated.
 *
 * @typedef {Object} CollectionApprovalPermission
 * @property {string} fromListId - The list ID of the from addresses of the approved transfers.
 * @property {string} toListId - The list ID of the to addresses of the approved transfers.
 * @property {string} initiatedByListId - The list ID of the initiatedBy addresses of the approved transfers.
 * @property {UintRange[]} transferTimes - The transfer times of the approved transfers.
 * @property {UintRange[]} badgeIds - The badge IDs of the approved transfers.
 * @property {UintRange[]} ownershipTimes - The owned times of the approved transfers.
 * @property {string} approvalId - The approval ID of the approved transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId.
 * @property {string} amountTrackerId - The approval tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId.
 * @property {string} challengeTrackerId - The challenge tracker ID of the approved transfers. Can use "All" to represent all IDs, "!trackerId" to represent all IDs except trackerId, or "trackerId" to represent only trackerId.
 * @property {UintRange[]} permanentlyPermittedTimes - The permitted times of this permission.
 * @property {UintRange[]} permanentlyForbiddenTimes - The forbidden times of this permission.
 */
export interface CollectionApprovalPermission<T extends NumberType> {
  fromListId: string;
  toListId: string;
  initiatedByListId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  approvalId: string
  amountTrackerId: string
  challengeTrackerId: string
  permanentlyPermittedTimes: UintRange<T>[];
  permanentlyForbiddenTimes: UintRange<T>[];
}

export function convertCollectionApprovalPermission<T extends NumberType, U extends NumberType>(permission: CollectionApprovalPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): CollectionApprovalPermission<U> {
  const _permission = populateOptionalFields ? {
    ...permission,
  } as Required<CollectionApprovalPermission<T>> : permission

  return deepCopy({
    ..._permission,
    transferTimes: permission.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: permission.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: permission.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyPermittedTimes: permission.permanentlyPermittedTimes.map((b) => convertUintRange(b, convertFunction)),
    permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}
