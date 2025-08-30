import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iCosmosCoin } from '@/core/coin.js';
import type { iCollectionApproval, iUserIncomingApproval, iUserOutgoingApproval } from '../../../../interfaces/types/approvals.js';
import type {
  iAddressList,
  iApprovalIdentifierDetails,
  iBadgeMetadataTimeline,
  iBalance,
  iCollectionInvariants,
  iCollectionMetadataTimeline,
  iCosmosCoinWrapperPathAddObject,
  iCustomDataTimeline,
  iIsArchivedTimeline,
  iManagerTimeline,
  iOffChainBalancesMetadataTimeline,
  iStandardsTimeline,
  iTransfer,
  iUintRange,
  CollectionId
} from '../../../../interfaces/types/core.js';
import type {
  iBadgeIdsActionPermission,
  iCollectionApprovalPermission,
  iCollectionPermissions,
  iTimedUpdatePermission,
  iTimedUpdateWithBadgeIdsPermission,
  iUserPermissions
} from '../../../../interfaces/types/permissions.js';
import type { iUserBalanceStore } from '../../../../interfaces/types/userBalances.js';

/**
 * @category Interfaces
 */
export interface iMsgCreateAddressLists {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The address lists to create. */
  addressLists: iAddressList[];
}

/**
 * @category Interfaces
 */
export interface iMsgCreateCollection<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;

  /** The balances type. Either "Standard", "Off-Chain - Indexed", "Off-Chain - Non-Indexed" or "Non-Public" */
  balancesType?: string;

  /** The default balances for users who have not interacted with the collection yet. Only can be set on initial creation. Only used if collection has "Standard" balance type. */
  defaultBalances?: iUserBalanceStore<T>;

  /** The tokens to create. Newly created tokens will be sent to the "Mint" address. Must have necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Only used if collection has "Standard" balance type. */
  validBadgeIds?: iUintRange<T>[];

  /** The new collection permissions. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionPermissions?: iCollectionPermissions<T>;

  /** The new manager timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  managerTimeline?: iManagerTimeline<T>[];

  /** The new collection metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionMetadataTimeline?: iCollectionMetadataTimeline<T>[];

  /** The new token metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Note we take first-match only for token IDs, so do not define duplicates. */
  badgeMetadataTimeline?: iBadgeMetadataTimeline<T>[];

  /** The new off-chain balances metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Only used if "Off-Chain - Indexed" or "Off-Chain - Non-Indexed" balance type. */
  offChainBalancesMetadataTimeline?: iOffChainBalancesMetadataTimeline<T>[];

  /** The new custom data timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  customDataTimeline?: iCustomDataTimeline<T>[];

  /** The new collection approved transfers timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionApprovals?: iCollectionApproval<T>[];

  /** The new standards timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  standardsTimeline?: iStandardsTimeline<T>[];

  /** The new is archived timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  isArchivedTimeline?: iIsArchivedTimeline<T>[];

  /** The coins to mint to the transfer address. Only used if collection has "Non-Public" balance type. */
  mintEscrowCoinsToTransfer?: iCosmosCoin<T>[];

  /** The IBC wrapper paths to add. */
  cosmosCoinWrapperPathsToAdd?: iCosmosCoinWrapperPathAddObject<T>[];

  /** Collection-level invariants that cannot be broken. These are set upon genesis and cannot be modified. */
  invariants?: iCollectionInvariants<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteCollection<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection to delete. */
  collectionId: CollectionId;
}

/**
 * @category Interfaces
 */
export interface iMsgTransferBadges<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection to transfer tokens from. */
  collectionId: CollectionId;
  /** The transfers to perform. */
  transfers: iTransfer<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgUniversalUpdateCollection<T extends NumberType> extends iMsgCreateCollection<T> {
  /** The ID of the collection to update. */
  collectionId: CollectionId;
  /** Whether or not to update the collection permissions. */
  updateCollectionPermissions?: boolean;
  /** Whether or not to update the manager timeline. */
  updateManagerTimeline?: boolean;
  /** Whether or not to update the collection metadata timeline. */
  updateCollectionMetadataTimeline?: boolean;
  /** Whether or not to update the token metadata timeline. */
  updateBadgeMetadataTimeline?: boolean;
  /** Whether or not to update the off-chain balances metadata timeline. */
  updateOffChainBalancesMetadataTimeline?: boolean;
  /** Whether or not to update the custom data timeline. */
  updateCustomDataTimeline?: boolean;
  /** Whether or not to update the collection approved transfers timeline. */
  updateCollectionApprovals?: boolean;
  /** Whether or not to update the standards timeline. */
  updateStandardsTimeline?: boolean;
  /** Whether or not to update the is archived timeline. */
  updateIsArchivedTimeline?: boolean;
  /** Whether or not to update the valid token IDs. */
  updateValidBadgeIds?: boolean;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateCollection<T extends NumberType> extends Omit<iMsgUniversalUpdateCollection<T>, 'defaultBalances' | 'balancesType'> {}

/**
 * @category Interfaces
 */
export interface iMsgUpdateUserApprovals<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection to transfer tokens from. */
  collectionId: CollectionId;
  /** Whether or not to update the outgoing approvals. */
  updateOutgoingApprovals?: boolean;
  /** The new outgoing approvals. Must have the necessary permissions to update.  */
  outgoingApprovals?: iUserOutgoingApproval<T>[];
  /** Whether or not to update the incoming approvals. */
  updateIncomingApprovals?: boolean;
  /** The new incoming approvals. Must have the necessary permissions to update. */
  incomingApprovals?: iUserIncomingApproval<T>[];
  /** Whether or not to update the auto approve self initiated outgoing transfers (i.e. from == the user and initiator == the user). */
  updateAutoApproveSelfInitiatedOutgoingTransfers?: boolean;
  /** The new auto approve self initiated outgoing transfers. Must have the necessary permissions to update. */
  autoApproveSelfInitiatedOutgoingTransfers?: boolean;
  /** Whether or not to update the auto approve self initiated incoming transfers (i.e. to == the user and initiator == the user). */
  updateAutoApproveSelfInitiatedIncomingTransfers?: boolean;
  /** The new auto approve self initiated incoming transfers. Must have the necessary permissions to update. */
  autoApproveSelfInitiatedIncomingTransfers?: boolean;
  /** Whether or not to update the auto approve all incoming transfers. */
  updateAutoApproveAllIncomingTransfers?: boolean;
  /** The new auto approve all incoming transfers. Must have the necessary permissions to update. */
  autoApproveAllIncomingTransfers?: boolean;
  /** Whether or not to update the user permissions. */
  updateUserPermissions?: boolean;
  /** The new user permissions. Must have the necessary permissions to update. */
  userPermissions?: iUserPermissions<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgCreateDynamicStore {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
}

/**
 * @category Interfaces
 */
export interface iMsgUpdateDynamicStore<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store to update. */
  storeId: T;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteDynamicStore<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store to delete. */
  storeId: T;
}

/**
 * @category Interfaces
 */
export interface iMsgSetDynamicStoreValue<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store. */
  storeId: T;
  /** The address for which to set the value. */
  address: BitBadgesAddress;
  /** The usage count to set (number of times this address can use the approval). */
  value: T;
}

/**
 * @category Interfaces
 */
export interface iMsgIncrementStoreValue<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store. */
  storeId: T;
  /** The address for which to increment the value. */
  address: BitBadgesAddress;
  /** The amount to increment by. */
  amount: T;
}

/**
 * @category Interfaces
 */
export interface iMsgDecrementStoreValue<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the dynamic store. */
  storeId: T;
  /** The address for which to decrement the value. */
  address: BitBadgesAddress;
  /** The amount to decrement by. */
  amount: T;
}

/**
 * @category Interfaces
 */
export interface iMsgSetIncomingApproval<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: CollectionId;
  /** The incoming approval to set. */
  approval: iUserIncomingApproval<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteIncomingApproval {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: CollectionId;
  /** The ID of the approval to delete. */
  approvalId: string;
}

/**
 * @category Interfaces
 */
export interface iMsgSetOutgoingApproval<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: CollectionId;
  /** The outgoing approval to set. */
  approval: iUserOutgoingApproval<T>;
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteOutgoingApproval {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: CollectionId;
  /** The ID of the approval to delete. */
  approvalId: string;
}

/**
 * @category Interfaces
 */
export interface iMsgPurgeApprovals<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: CollectionId;
  /** Whether to purge expired approvals (approvals with no future valid transfer times). */
  purgeExpired: boolean;
  /** Address of the user whose approvals to purge. If empty, defaults to creator. */
  approverAddress: BitBadgesAddress;
  /** Whether to purge counterparty approvals (approvals where the creator is the only initiator). */
  purgeCounterpartyApprovals: boolean;
  /** Specific approvals to purge. If empty, purges all applicable approvals based on other flags. */
  approvalsToPurge: iApprovalIdentifierDetails<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetValidBadgeIds<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New token IDs to add to this collection. */
  validBadgeIds: iUintRange<T>[];
  /** Permission to update valid token IDs. */
  canUpdateValidBadgeIds: iBadgeIdsActionPermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetManager<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New manager timeline to set. */
  managerTimeline: iManagerTimeline<T>[];
  /** Permission to update manager timeline. */
  canUpdateManager: iTimedUpdatePermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetCollectionMetadata<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New collection metadata timeline to set. */
  collectionMetadataTimeline: iCollectionMetadataTimeline<T>[];
  /** Permission to update collection metadata timeline. */
  canUpdateCollectionMetadata: iTimedUpdatePermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetBadgeMetadata<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New token metadata timeline to set. */
  badgeMetadataTimeline: iBadgeMetadataTimeline<T>[];
  /** Permission to update token metadata timeline. */
  canUpdateBadgeMetadata: iTimedUpdateWithBadgeIdsPermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetCustomData<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New custom data timeline to set. */
  customDataTimeline: iCustomDataTimeline<T>[];
  /** Permission to update custom data timeline. */
  canUpdateCustomData: iTimedUpdatePermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetStandards<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New standards timeline to set. */
  standardsTimeline: iStandardsTimeline<T>[];
  /** Permission to update standards timeline. */
  canUpdateStandards: iTimedUpdatePermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetCollectionApprovals<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New collection approvals to set. */
  collectionApprovals: iCollectionApproval<T>[];
  /** Permission to update collection approvals. */
  canUpdateCollectionApprovals: iCollectionApprovalPermission<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgSetIsArchived<T extends NumberType> {
  /** The creator of the transaction. */
  creator: BitBadgesAddress;
  /** The ID of the collection. */
  collectionId: T;
  /** New isArchived timeline to set. */
  isArchivedTimeline: iIsArchivedTimeline<T>[];
  /** Permission to archive collection. */
  canArchiveCollection: iTimedUpdatePermission<T>[];
}
