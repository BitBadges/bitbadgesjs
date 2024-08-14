import { CosmosAddress } from '@/api-indexer/docs/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iCollectionApproval, iUserIncomingApproval, iUserOutgoingApproval } from '../../../../interfaces/badges/approvals.js';
import type {
  iAddressList,
  iBadgeMetadataTimeline,
  iCollectionMetadataTimeline,
  iCustomDataTimeline,
  iIsArchivedTimeline,
  iManagerTimeline,
  iOffChainBalancesMetadataTimeline,
  iStandardsTimeline,
  iTransfer,
  iUintRange
} from '../../../../interfaces/badges/core.js';
import type { iCollectionPermissions, iUserPermissions } from '../../../../interfaces/badges/permissions.js';
import type { iUserBalanceStore } from '../../../../interfaces/badges/userBalances.js';

/**
 * @category Interfaces
 */
export interface iMsgCreateAddressLists {
  /** The creator of the transaction. */
  creator: CosmosAddress;
  /** The address lists to create. */
  addressLists: iAddressList[];
}

/**
 * @category Interfaces
 */
export interface iMsgCreateCollection<T extends NumberType> {
  /** The creator of the transaction. */
  creator: CosmosAddress;

  /** The balances type. Either "Standard", "Off-Chain - Indexed", "Off-Chain - Non-Indexed" or "Non-Public" */
  balancesType?: string;

  /** The default balances for users who have not interacted with the collection yet. Only can be set on initial creation. Only used if collection has "Standard" balance type. */
  defaultBalances?: iUserBalanceStore<T>;

  /** The badges to create. Newly created badges will be sent to the "Mint" address. Must have necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Only used if collection has "Standard" balance type. */
  badgeIdsToAdd?: iUintRange<T>[];

  /** The new collection permissions. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionPermissions?: iCollectionPermissions<T>;

  /** The new manager timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  managerTimeline?: iManagerTimeline<T>[];

  /** The new collection metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. */
  collectionMetadataTimeline?: iCollectionMetadataTimeline<T>[];

  /** The new badge metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Note we take first-match only for badge IDs, so do not define duplicates. */
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
}

/**
 * @category Interfaces
 */
export interface iMsgDeleteCollection<T extends NumberType> {
  /** The creator of the transaction. */
  creator: CosmosAddress;
  /** The ID of the collection to delete. */
  collectionId: T;
}

/**
 * @category Interfaces
 */
export interface iMsgTransferBadges<T extends NumberType> {
  /** The creator of the transaction. */
  creator: CosmosAddress;
  /** The ID of the collection to transfer badges from. */
  collectionId: T;
  /** The transfers to perform. */
  transfers: iTransfer<T>[];
}

/**
 * @category Interfaces
 */
export interface iMsgUniversalUpdateCollection<T extends NumberType> extends iMsgCreateCollection<T> {
  /** The ID of the collection to update. */
  collectionId: T;
  /** Whether or not to update the collection permissions. */
  updateCollectionPermissions?: boolean;
  /** Whether or not to update the manager timeline. */
  updateManagerTimeline?: boolean;
  /** Whether or not to update the collection metadata timeline. */
  updateCollectionMetadataTimeline?: boolean;
  /** Whether or not to update the badge metadata timeline. */
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
  creator: CosmosAddress;
  /** The ID of the collection to transfer badges from. */
  collectionId: T;
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
  /** Whether or not to update the user permissions. */
  updateUserPermissions?: boolean;
  /** The new user permissions. Must have the necessary permissions to update. */
  userPermissions?: iUserPermissions<T>;
}
