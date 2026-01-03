import { CollectionApprovalWithDetails } from './approvals.js';
import {
  validateIsArchivedUpdate,
  validateManagerUpdate,
  validateCollectionMetadataUpdate,
  validateTokenMetadataUpdate,
  validateCustomDataUpdate,
  validateStandardsUpdate
} from './misc.js';
import type { UsedFlags } from './overlaps.js';
import { ActionPermissionUsedFlags, ApprovalPermissionUsedFlags, TokenIdsActionPermissionUsedFlags } from './overlaps.js';
import { ActionPermission, CollectionApprovalPermission, TokenIdsActionPermission } from './permissions.js';

/**
 * @category Permissions
 */
export type PermissionNameString =
  | 'canDeleteCollection'
  | 'canArchiveCollection'
  | 'canUpdateTokenMetadata'
  | 'canUpdateCollectionMetadata'
  | 'canUpdateValidTokenIds'
  | 'canUpdateCollectionApprovals'
  | 'canUpdateAutoApproveSelfInitiatedIncomingTransfers'
  | 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers'
  | 'canUpdateAutoApproveAllIncomingTransfers'
  | 'canUpdateStandards'
  | 'canUpdateCustomData'
  | 'canUpdateManager'
  | 'canAddMoreAliasPaths'
  | 'canAddMoreCosmosCoinWrapperPaths';

/**
 * Gets the permission variables from a permission name. Variables include the flags, question, and validation function.
 * Cast functions are directly used on the object itself.
 *
 * @category Permissions
 */
export const getPermissionVariablesFromName = (permissionName: PermissionNameString) => {
  let flags: UsedFlags = ApprovalPermissionUsedFlags;

  let validateFunction: any = undefined;
  let validatePermissionUpdateFunction: any = undefined;
  switch (permissionName) {
    case 'canArchiveCollection':
      validateFunction = validateIsArchivedUpdate;
      break;
    case 'canUpdateStandards':
      validateFunction = validateStandardsUpdate;
      break;
    case 'canUpdateCustomData':
      validateFunction = validateCustomDataUpdate;
      break;
    case 'canUpdateManager':
      validateFunction = validateManagerUpdate;
      break;
    case 'canUpdateCollectionMetadata':
      validateFunction = validateCollectionMetadataUpdate;
      break;
    case 'canUpdateTokenMetadata':
      validateFunction = validateTokenMetadataUpdate;
      break;
    case 'canUpdateCollectionApprovals':
      validateFunction = CollectionApprovalWithDetails.validateUpdate;
      break;
  }
  switch (permissionName) {
    case 'canDeleteCollection':
    case 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers':
    case 'canUpdateAutoApproveSelfInitiatedIncomingTransfers':
    case 'canUpdateAutoApproveAllIncomingTransfers':
      validatePermissionUpdateFunction = ActionPermission.validateUpdate;
      break;
    case 'canArchiveCollection':
    case 'canUpdateStandards':
    case 'canUpdateCustomData':
    case 'canUpdateManager':
    case 'canUpdateCollectionMetadata':
    case 'canAddMoreAliasPaths':
    case 'canAddMoreCosmosCoinWrapperPaths':
      validatePermissionUpdateFunction = ActionPermission.validateUpdate;
      break;
    case 'canUpdateValidTokenIds':
      validatePermissionUpdateFunction = TokenIdsActionPermission.validateUpdate;

      break;
    case 'canUpdateTokenMetadata':
      // case 'canUpdateInheritedBalances':
      validatePermissionUpdateFunction = TokenIdsActionPermission.validateUpdate;

      break;
    case 'canUpdateCollectionApprovals':
      validatePermissionUpdateFunction = CollectionApprovalPermission.validateUpdate;
      break;
  }

  let question = '';
  switch (permissionName) {
    case 'canDeleteCollection':
      question = 'Can delete the collection?';
      break;
    case 'canArchiveCollection':
      question = 'Can archive the collection?';
      break;
    case 'canUpdateStandards':
      question = 'Can update the standards?';
      break;
    case 'canUpdateCustomData':
      question = 'Can update the custom data?';
      break;
    case 'canUpdateManager':
      question = 'Can update the manager?';
      break;
    case 'canUpdateCollectionMetadata':
      question = 'Can update the collection metadata?';
      break;
    case 'canUpdateValidTokenIds':
      question = 'Can create more tokens?';
      break;
    case 'canUpdateTokenMetadata':
      question = 'Can update the token metadata?';
      break;
    case 'canUpdateCollectionApprovals':
      question = 'Can update collection approvals?';
      break;
    case 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers':
      question = 'Can update auto approve self initiated outgoing transfers?';
      break;
    case 'canUpdateAutoApproveSelfInitiatedIncomingTransfers':
      question = 'Can update auto approve self initiated incoming transfers?';
      break;
    case 'canUpdateAutoApproveAllIncomingTransfers':
      question = 'Can update auto approve all incoming transfers?';
      break;
    case 'canAddMoreAliasPaths':
      question = 'Can add more alias paths?';
      break;
    case 'canAddMoreCosmosCoinWrapperPaths':
      question = 'Can add more cosmos coin wrapper paths?';
      break;
    // Add custom questions for other permissions as needed
  }

  switch (permissionName) {
    case 'canDeleteCollection':
    case 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers':
    case 'canUpdateAutoApproveSelfInitiatedIncomingTransfers':
    case 'canUpdateAutoApproveAllIncomingTransfers':
      flags = ActionPermissionUsedFlags;
      break;
    case 'canArchiveCollection':
    case 'canUpdateStandards':
    case 'canUpdateCustomData':
    case 'canUpdateManager':
    case 'canUpdateCollectionMetadata':
    case 'canAddMoreAliasPaths':
    case 'canAddMoreCosmosCoinWrapperPaths':
      flags = ActionPermissionUsedFlags;
      break;
    case 'canUpdateValidTokenIds':
      flags = TokenIdsActionPermissionUsedFlags;
      break;
    case 'canUpdateTokenMetadata':
      // case 'canUpdateInheritedBalances':
      flags = TokenIdsActionPermissionUsedFlags;
      break;
    case 'canUpdateCollectionApprovals':
      flags = ApprovalPermissionUsedFlags;
      break;
  }

  return {
    flags,
    question,
    validateFunction,
    validatePermissionUpdateFunction
  };
};
