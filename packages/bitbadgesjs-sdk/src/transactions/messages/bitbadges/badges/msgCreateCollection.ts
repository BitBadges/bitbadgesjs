import * as badges from '../../../../proto/badges/tx_pb'

import { BadgeMetadataTimeline, Balance, CollectionApproval, CollectionMetadataTimeline, CollectionPermissions, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, NumberType, OffChainBalancesMetadataTimeline, StandardsTimeline, UserBalanceStore, convertBadgeMetadataTimeline, convertBalance, convertCollectionApproval, convertCollectionMetadataTimeline, convertCollectionPermissions, convertCustomDataTimeline, convertIsArchivedTimeline, convertManagerTimeline, convertOffChainBalancesMetadataTimeline, convertStandardsTimeline, convertUserBalanceStore } from '../../../..'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

/**
 * MsgCreateCollection is a transaction that can be used to create a collection.
 *
 * Upon initial creation, you can set the default approved outgoing transfers, default approved incoming transfers, default user permissions, and balances type.
 * However, after that, they are final and ignored in subsequent MsgCreateCollection calls.

 *
 * @typedef {Object} MsgCreateCollection
 * @property {string} creator - The creator of the transaction.
 * @property {string} balancesType - The balances type. Either "Standard", "Off-Chain - Indexed", "Off-Chain - Non-Indexed", or "Inherited".
 * @property {UserBalanceStore} defaultBalances - The default balances for users who have not interacted with the collection yet. Only can be set on initial creation. Only used if collection has "Standard" balance type.
 * @property {Balance[]} badgesToCreate - The badges to create. Newly created badges will be sent to the "Mint" address. Must have necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Only used if collection has "Standard" balance type.
 * @property {CollectionPermissions} collectionPermissions - The new collection permissions. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg.
 * @property {ManagerTimeline[]} managerTimeline - The new manager timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg.
 * @property {CollectionMetadataTimeline[]} collectionMetadataTimeline - The new collection metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg.
 * @property {BadgeMetadataTimeline[]} badgeMetadataTimeline - The new badge metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Note we take first-match only for badge IDs, so do not define duplicates.
 * @property {OffChainBalancesMetadataTimeline[]} offChainBalancesMetadataTimeline - The new off-chain balances metadata timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg. Only used if "Off-Chain - Indexed" or "Off-Chain - Non-Indexed" balance type.
 * @property {CustomDataTimeline[]} customDataTimeline - The new custom data timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg.
 * @property {CollectionApproval[]} collectionApprovals - The new collection approved transfers timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg.
 * @property {StandardsTimeline[]} standardsTimeline - The new standards timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg.
 * @property {IsArchivedTimeline[]} isArchivedTimeline - The new is archived timeline. Must have the necessary permissions in future transactions to update. However, no restrictions in this genesis Msg.
 */
export interface MsgCreateCollection<T extends NumberType> {
  creator: string
  balancesType?: string
  defaultBalances?: UserBalanceStore<T>
  badgesToCreate?: Balance<T>[]
  collectionPermissions?: CollectionPermissions<T>
  managerTimeline?: ManagerTimeline<T>[]
  collectionMetadataTimeline?: CollectionMetadataTimeline<T>[]
  badgeMetadataTimeline?: BadgeMetadataTimeline<T>[]
  offChainBalancesMetadataTimeline?: OffChainBalancesMetadataTimeline<T>[]
  customDataTimeline?: CustomDataTimeline<T>[]
  collectionApprovals?: CollectionApproval<T>[]
  standardsTimeline?: StandardsTimeline<T>[]
  isArchivedTimeline?: IsArchivedTimeline<T>[]
}

export function convertMsgCreateCollection<T extends NumberType, U extends NumberType>(
  msg: MsgCreateCollection<T>,
  convertFunction: (item: T) => U
): MsgCreateCollection<U> {
  return {
    ...msg,
    defaultBalances: msg.defaultBalances ? convertUserBalanceStore(msg.defaultBalances, convertFunction) : undefined,

    badgesToCreate: msg.badgesToCreate ? msg.badgesToCreate.map(x => convertBalance(x, convertFunction)) : undefined,
    collectionPermissions: msg.collectionPermissions ? convertCollectionPermissions(msg.collectionPermissions, convertFunction) : undefined,
    managerTimeline: msg.managerTimeline ? msg.managerTimeline.map(x => convertManagerTimeline(x, convertFunction)) : undefined,
    collectionMetadataTimeline: msg.collectionMetadataTimeline ? msg.collectionMetadataTimeline.map(x => convertCollectionMetadataTimeline(x, convertFunction)) : undefined,
    badgeMetadataTimeline: msg.badgeMetadataTimeline ? msg.badgeMetadataTimeline.map(x => convertBadgeMetadataTimeline(x, convertFunction)) : undefined,
    offChainBalancesMetadataTimeline: msg.offChainBalancesMetadataTimeline ? msg.offChainBalancesMetadataTimeline.map(x => convertOffChainBalancesMetadataTimeline(x, convertFunction)) : undefined,
    customDataTimeline: msg.customDataTimeline ? msg.customDataTimeline.map(x => convertCustomDataTimeline(x, convertFunction)) : undefined,
    collectionApprovals: msg.collectionApprovals ? msg.collectionApprovals.map(x => convertCollectionApproval(x, convertFunction)) : undefined,
    standardsTimeline: msg.standardsTimeline ? msg.standardsTimeline.map(x => convertStandardsTimeline(x, convertFunction)) : undefined,
    isArchivedTimeline: msg.isArchivedTimeline ? msg.isArchivedTimeline.map(x => convertIsArchivedTimeline(x, convertFunction)) : undefined,
  };
}


export function convertFromProtoToMsgCreateCollection(
  protoMsg: badges.MsgCreateCollection,
): MsgCreateCollection<bigint> {
  const msg = (protoMsg.toJson({ emitDefaultValues: true }) as any) as MsgCreateCollection<string>;

  return {
    ...msg,
    creator: msg.creator,
    balancesType: msg.balancesType,
    defaultBalances: msg.defaultBalances ? convertUserBalanceStore(msg.defaultBalances, BigInt) : undefined,

    badgesToCreate: msg.badgesToCreate?.map(x => convertBalance(x, BigInt)),
    collectionPermissions: msg.collectionPermissions ? convertCollectionPermissions(msg.collectionPermissions, BigInt) : undefined,
    managerTimeline: msg.managerTimeline?.map(x => convertManagerTimeline(x, BigInt)),
    collectionMetadataTimeline: msg.collectionMetadataTimeline?.map(x => convertCollectionMetadataTimeline(x, BigInt)),
    badgeMetadataTimeline: msg.badgeMetadataTimeline?.map(x => convertBadgeMetadataTimeline(x, BigInt)),
    offChainBalancesMetadataTimeline: msg.offChainBalancesMetadataTimeline?.map(x => convertOffChainBalancesMetadataTimeline(x, BigInt)),
    customDataTimeline: msg.customDataTimeline?.map(x => convertCustomDataTimeline(x, BigInt)),
    // inheritedCollectionId: BigInt(msg.inheritedCollectionId),
    collectionApprovals: msg.collectionApprovals?.map(x => convertCollectionApproval(x, BigInt)),
    standardsTimeline: msg.standardsTimeline?.map(x => convertStandardsTimeline(x, BigInt)),
    isArchivedTimeline: msg.isArchivedTimeline?.map(x => convertIsArchivedTimeline(x, BigInt)),
  }
}

/**
 * Creates a new transaction with the MsgCreateCollection message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgCreateCollection} params - The parameters of the CreateCollection message.
 */
export function createTxMsgCreateCollection<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgCreateCollection<T>,
) {
  const msgCosmos = new badges.MsgCreateCollection(convertMsgCreateCollection(params, String))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
