import { CollectionApprovalWithDetails } from './approvals.js';
import { TokenMetadataTimeline, CollectionMetadataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadataTimeline } from './misc.js';
import type { UsedFlags } from './overlaps.js';
import {
  ActionPermissionUsedFlags,
  ApprovalPermissionUsedFlags,
  TokenIdsActionPermissionUsedFlags,
  TimedUpdatePermissionUsedFlags,
  TimedUpdateWithTokenIdsPermissionUsedFlags
} from './overlaps.js';
import {
  ActionPermission,
  TokenIdsActionPermission,
  CollectionApprovalPermission,
  TimedUpdatePermission,
  TimedUpdateWithTokenIdsPermission
} from './permissions.js';

/**
 * @category Permissions
 */
export type PermissionNameString =
  | 'canDeleteCollection'
  | 'canArchiveCollection'
  | 'canUpdateOffChainBalancesMetadata'
  | 'canUpdateTokenMetadata'
  | 'canUpdateCollectionMetadata'
  | 'canUpdateValidTokenIds'
  | 'canUpdateCollectionApprovals'
  | 'canUpdateAutoApproveSelfInitiatedIncomingTransfers'
  | 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers'
  | 'canUpdateAutoApproveAllIncomingTransfers'
  | 'canUpdateStandards'
  | 'canUpdateCustomData'
  | 'canUpdateManager';

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
      validateFunction = IsArchivedTimeline.validateUpdate;
      break;
    case 'canUpdateOffChainBalancesMetadata':
      validateFunction = OffChainBalancesMetadataTimeline.validateUpdate;
      break;
    // case 'canUpdateStandards':
    // case 'canUpdateCustomData':
    case 'canUpdateManager':
      validateFunction = ManagerTimeline.validateUpdate;
      break;
    case 'canUpdateCollectionMetadata':
      validateFunction = CollectionMetadataTimeline.validateUpdate;
      break;
    case 'canUpdateTokenMetadata':
      validateFunction = TokenMetadataTimeline.validateUpdate;
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
    case 'canUpdateOffChainBalancesMetadata':
    case 'canUpdateStandards':
    case 'canUpdateCustomData':
    case 'canUpdateManager':
    case 'canUpdateCollectionMetadata':
      validatePermissionUpdateFunction = TimedUpdatePermission.validateUpdate;
      break;
    case 'canUpdateValidTokenIds':
      validatePermissionUpdateFunction = TokenIdsActionPermission.validateUpdate;

      break;
    case 'canUpdateTokenMetadata':
      // case 'canUpdateInheritedBalances':
      validatePermissionUpdateFunction = TimedUpdateWithTokenIdsPermission.validateUpdate;

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
    case 'canUpdateOffChainBalancesMetadata':
      question = 'Can update the off-chain balances metadata?';
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
    case 'canUpdateOffChainBalancesMetadata':
    case 'canUpdateStandards':
    case 'canUpdateCustomData':
    case 'canUpdateManager':
    case 'canUpdateCollectionMetadata':
      flags = TimedUpdatePermissionUsedFlags;
      break;
    case 'canUpdateValidTokenIds':
      flags = TokenIdsActionPermissionUsedFlags;
      break;
    case 'canUpdateTokenMetadata':
      // case 'canUpdateInheritedBalances':
      flags = TimedUpdateWithTokenIdsPermissionUsedFlags;
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
