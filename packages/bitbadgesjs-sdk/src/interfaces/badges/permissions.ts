import type { NumberType } from '@/common/string-numbers.js';
import type { iAddressList, iUintRange } from './core.js';

/**
 * @category Interfaces
 */
export interface iUserPermissions<T extends NumberType> {
  /** The list of permissions for updating approved outgoing transfers. */
  canUpdateOutgoingApprovals: iUserOutgoingApprovalPermission<T>[];
  /** The list of permissions for updating approved incoming transfers. */
  canUpdateIncomingApprovals: iUserIncomingApprovalPermission<T>[];
  /** The permissions for updating auto-approving self-initiated outgoing transfers. If auto-approve is enabled, then the user will be approved by default for all outgoing transfers that are self-initiated. */
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: iActionPermission<T>[];
  /** The permissions for updating auto-approving self-initiated incoming transfers. If auto-approve is enabled, then the user will be approved by default for all incoming transfers that are self-initiated. */
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: iActionPermission<T>[];
  /** The permissions for updating auto-approving all incoming transfers. If auto-approve is enabled, then the user will be approved by default for all incoming transfers. */
  canUpdateAutoApproveAllIncomingTransfers: iActionPermission<T>[];
}

/**
 * @category Interfaces
 *  @interface
 */
export type iUserOutgoingApprovalPermissionWithDetails<T extends NumberType> = Omit<iCollectionApprovalPermission<T>, 'fromListId'> & {
  toList: iAddressList;
  initiatedByList: iAddressList;
};

/**
 * @category Interfaces
 * @interface
 */
export type iUserIncomingApprovalPermissionWithDetails<T extends NumberType> = Omit<iCollectionApprovalPermission<T>, 'toListId'> & {
  fromList: iAddressList;
  initiatedByList: iAddressList;
};

/**
 * @category Interfaces
 */
export interface iUserOutgoingApprovalPermission<T extends NumberType> {
  /** The list ID of the to addresses of the approved outgoing transfers. */
  toListId: string;
  /** The list ID of the initiatedBy addresses of the approved outgoing transfers. */
  initiatedByListId: string;
  /** The transfer times of the approved outgoing transfers. */
  transferTimes: iUintRange<T>[];
  /** The badge IDs of the approved outgoing transfers. */
  badgeIds: iUintRange<T>[];
  /** The owned times of the approved outgoing transfers. */
  ownershipTimes: iUintRange<T>[];
  /** The approval ID of the approved outgoing transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of the approved outgoing transfers. */
  permanentlyPermittedTimes: iUintRange<T>[];
  /** The forbidden times of the approved outgoing transfers. */
  permanentlyForbiddenTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApprovalPermission<T extends NumberType> {
  /** The list ID of the from addresses of the approved incoming transfers. */
  fromListId: string;
  /** The list ID of the initiatedBy addresses of the approved incoming transfers. */
  initiatedByListId: string;
  /** The transfer times of the approved incoming transfers. */
  transferTimes: iUintRange<T>[];
  /** The badge IDs of the approved incoming transfers. */
  badgeIds: iUintRange<T>[];
  /** The owned times of the approved incoming transfers. */
  ownershipTimes: iUintRange<T>[];
  /** The approval ID of the approved incoming transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of the approved incoming transfers. */
  permanentlyPermittedTimes: iUintRange<T>[];
  /** The forbidden times of the approved incoming transfers. */
  permanentlyForbiddenTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iCollectionPermissions<T extends NumberType> {
  /** The permissions for deleting the collection. */
  canDeleteCollection: iActionPermission<T>[];
  /** The permissions for archiving the collection. */
  canArchiveCollection: iTimedUpdatePermission<T>[];
  /** The permissions for updating the off-chain balances metadata. */
  canUpdateOffChainBalancesMetadata: iTimedUpdatePermission<T>[];
  /** The permissions for updating the standards. */
  canUpdateStandards: iTimedUpdatePermission<T>[];
  /** The permissions for updating the custom data. */
  canUpdateCustomData: iTimedUpdatePermission<T>[];
  /** The permissions for updating the manager. */
  canUpdateManager: iTimedUpdatePermission<T>[];
  /** The permissions for updating the collection metadata. */
  canUpdateCollectionMetadata: iTimedUpdatePermission<T>[];
  /** The permissions for creating more badges. */
  canUpdateValidBadgeIds: iBadgeIdsActionPermission<T>[];
  /** The permissions for updating the badge metadata. */
  canUpdateBadgeMetadata: iTimedUpdateWithBadgeIdsPermission<T>[];
  /** The permissions for updating the collection approved transfers. */
  canUpdateCollectionApprovals: iCollectionApprovalPermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iActionPermission<T extends NumberType> {
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange<T>[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iTimedUpdatePermission<T extends NumberType> {
  /** The timeline times that the permission applies to. */
  timelineTimes: iUintRange<T>[];
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange<T>[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iBadgeIdsActionPermission<T extends NumberType> {
  /** The badge IDs that the permission applies to. */
  badgeIds: iUintRange<T>[];
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange<T>[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iTimedUpdateWithBadgeIdsPermission<T extends NumberType> {
  /** The timeline times that the permission applies to. */
  timelineTimes: iUintRange<T>[];
  /** The badge IDs that the permission applies to. */
  badgeIds: iUintRange<T>[];
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange<T>[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iCollectionApprovalPermission<T extends NumberType> {
  /** The list ID of the from addresses of the approved transfers. */
  fromListId: string;
  /** The list ID of the to addresses of the approved transfers. */
  toListId: string;
  /** The list ID of the initiatedBy addresses of the approved transfers. */
  initiatedByListId: string;
  /** The transfer times of the approved transfers. */
  transferTimes: iUintRange<T>[];
  /** The badge IDs of the approved transfers. */
  badgeIds: iUintRange<T>[];
  /** The owned times of the approved transfers. */
  ownershipTimes: iUintRange<T>[];
  /** The approval ID of the approved transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of this permission. */
  permanentlyPermittedTimes: iUintRange<T>[];
  /** The forbidden times of this permission. */
  permanentlyForbiddenTimes: iUintRange<T>[];
}

/**
 * @category Interfaces
 */
export interface iCollectionApprovalPermissionWithDetails<T extends NumberType> extends iCollectionApprovalPermission<T> {
  toList: iAddressList;
  fromList: iAddressList;
  initiatedByList: iAddressList;
}

/**
 * @category Interfaces
 */
export interface iCollectionPermissionsWithDetails<T extends NumberType> extends iCollectionPermissions<T> {
  canUpdateCollectionApprovals: iCollectionApprovalPermissionWithDetails<T>[];
}

/**
 * @category Interfaces
 */
export interface iUserPermissionsWithDetails<T extends NumberType> extends iUserPermissions<T> {
  canUpdateIncomingApprovals: iUserIncomingApprovalPermissionWithDetails<T>[];
  canUpdateOutgoingApprovals: iUserOutgoingApprovalPermissionWithDetails<T>[];
}
