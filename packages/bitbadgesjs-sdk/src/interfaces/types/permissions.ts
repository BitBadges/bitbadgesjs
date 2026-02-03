import type { NumberType } from '@/common/string-numbers.js';
import type { iAddressList, iUintRange } from './core.js';

/**
 * @category Interfaces
 */
export interface iUserPermissions {
  /** The list of permissions for updating approved outgoing transfers. */
  canUpdateOutgoingApprovals: iUserOutgoingApprovalPermission[];
  /** The list of permissions for updating approved incoming transfers. */
  canUpdateIncomingApprovals: iUserIncomingApprovalPermission[];
  /** The permissions for updating auto-approving self-initiated outgoing transfers. If auto-approve is enabled, then the user will be approved by default for all outgoing transfers that are self-initiated. */
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: iActionPermission[];
  /** The permissions for updating auto-approving self-initiated incoming transfers. If auto-approve is enabled, then the user will be approved by default for all incoming transfers that are self-initiated. */
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: iActionPermission[];
  /** The permissions for updating auto-approving all incoming transfers. If auto-approve is enabled, then the user will be approved by default for all incoming transfers. */
  canUpdateAutoApproveAllIncomingTransfers: iActionPermission[];
}

/**
 * @category Interfaces
 *  @interface
 */
export type iUserOutgoingApprovalPermissionWithDetails = Omit<iCollectionApprovalPermission, 'fromListId'> & {
  toList: iAddressList;
  initiatedByList: iAddressList;
};

/**
 * @category Interfaces
 * @interface
 */
export type iUserIncomingApprovalPermissionWithDetails = Omit<iCollectionApprovalPermission, 'toListId'> & {
  fromList: iAddressList;
  initiatedByList: iAddressList;
};

/**
 * @category Interfaces
 */
export interface iUserOutgoingApprovalPermission {
  /** The list ID of the to addresses of the approved outgoing transfers. */
  toListId: string;
  /** The list ID of the initiatedBy addresses of the approved outgoing transfers. */
  initiatedByListId: string;
  /** The transfer times of the approved outgoing transfers. */
  transferTimes: iUintRange[];
  /** The token IDs of the approved outgoing transfers. */
  tokenIds: iUintRange[];
  /** The owned times of the approved outgoing transfers. */
  ownershipTimes: iUintRange[];
  /** The approval ID of the approved outgoing transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of the approved outgoing transfers. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the approved outgoing transfers. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iUserIncomingApprovalPermission {
  /** The list ID of the from addresses of the approved incoming transfers. */
  fromListId: string;
  /** The list ID of the initiatedBy addresses of the approved incoming transfers. */
  initiatedByListId: string;
  /** The transfer times of the approved incoming transfers. */
  transferTimes: iUintRange[];
  /** The token IDs of the approved incoming transfers. */
  tokenIds: iUintRange[];
  /** The owned times of the approved incoming transfers. */
  ownershipTimes: iUintRange[];
  /** The approval ID of the approved incoming transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of the approved incoming transfers. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the approved incoming transfers. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iCollectionPermissions {
  /** The permissions for deleting the collection. */
  canDeleteCollection: iActionPermission[];
  /** The permissions for archiving the collection. */
  canArchiveCollection: iActionPermission[];
  /** The permissions for updating the standards. */
  canUpdateStandards: iActionPermission[];
  /** The permissions for updating the custom data. */
  canUpdateCustomData: iActionPermission[];
  /** The permissions for updating the manager. */
  canUpdateManager: iActionPermission[];
  /** The permissions for updating the collection metadata. */
  canUpdateCollectionMetadata: iActionPermission[];
  /** The permissions for creating more tokens. */
  canUpdateValidTokenIds: iTokenIdsActionPermission[];
  /** The permissions for updating the token metadata. */
  canUpdateTokenMetadata: iTokenIdsActionPermission[];
  /** The permissions for updating the collection approved transfers. */
  canUpdateCollectionApprovals: iCollectionApprovalPermission[];
  /** The permissions for adding more alias paths to the collection. */
  canAddMoreAliasPaths: iActionPermission[];
  /** The permissions for adding more cosmos coin wrapper paths to the collection. */
  canAddMoreCosmosCoinWrapperPaths: iActionPermission[];
}

/**
 * @category Interfaces
 */
export interface iActionPermission {
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iTokenIdsActionPermission {
  /** The token IDs that the permission applies to. */
  tokenIds: iUintRange[];
  /** The permitted times of the permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of the permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iCollectionApprovalPermission {
  /** The list ID of the from addresses of the approved transfers. */
  fromListId: string;
  /** The list ID of the to addresses of the approved transfers. */
  toListId: string;
  /** The list ID of the initiatedBy addresses of the approved transfers. */
  initiatedByListId: string;
  /** The transfer times of the approved transfers. */
  transferTimes: iUintRange[];
  /** The token IDs of the approved transfers. */
  tokenIds: iUintRange[];
  /** The owned times of the approved transfers. */
  ownershipTimes: iUintRange[];
  /** The approval ID of the approved transfers. Can use "All" to represent all IDs, "!approvalId" to represent all IDs except approvalId, or "approvalId" to represent only approvalId. */
  approvalId: string;
  /** The permitted times of this permission. */
  permanentlyPermittedTimes: iUintRange[];
  /** The forbidden times of this permission. */
  permanentlyForbiddenTimes: iUintRange[];
}

/**
 * @category Interfaces
 */
export interface iCollectionApprovalPermissionWithDetails extends iCollectionApprovalPermission {
  toList: iAddressList;
  fromList: iAddressList;
  initiatedByList: iAddressList;
}

/**
 * @category Interfaces
 */
export interface iCollectionPermissionsWithDetails extends iCollectionPermissions {
  canUpdateCollectionApprovals: iCollectionApprovalPermissionWithDetails[];
}

/**
 * @category Interfaces
 */
export interface iUserPermissionsWithDetails extends iUserPermissions {
  canUpdateIncomingApprovals: iUserIncomingApprovalPermissionWithDetails[];
  canUpdateOutgoingApprovals: iUserOutgoingApprovalPermissionWithDetails[];
}
