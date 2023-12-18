import * as badges from '../../../../proto/badges/tx_pb'

import { BadgeMetadataTimeline, Balance, CollectionApproval, CollectionMetadataTimeline, CollectionPermissions, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, NumberType, OffChainBalancesMetadataTimeline, StandardsTimeline, UserIncomingApproval, UserOutgoingApproval, UserPermissions, convertBadgeMetadataTimeline, convertBalance, convertCollectionApproval, convertCollectionMetadataTimeline, convertCollectionPermissions, convertCustomDataTimeline, convertIsArchivedTimeline, convertManagerTimeline, convertOffChainBalancesMetadataTimeline, convertStandardsTimeline, convertUserIncomingApproval, convertUserOutgoingApproval, convertUserPermissions } from '../../../..'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"
import { createProtoMsg } from '../../../../proto-types/base'

/**
 * MsgUniversalUpdateCollection is a universal transaction that can be used to create / update any collection. It is only executable by the manager.
 * MsgCreateCollection and MsgUpdateCollection are special cases of this message.
 *
 * Upon initial creation, you can set the default approved outgoing transfers, default approved incoming transfers, default user permissions, and balances type.
 * However, after that, they are final and ignored in subsequent MsgUniversalUpdateCollection calls.
 *
 * For a new collection, specify collectionId == "0".
 *
 * Note that you must have the necessary privileges to update specific fields. If you do not have the necessary privileges, it will throw an error.
 * We update any CollectionPermissions at the end, so the permissions checked for the current execution are the permissions BEFORE the update.
 * In the case of the first MsgUniversalUpdateCollection, the previous permissions are by default all permitted.
 *
 * To specify you would like to update a field, the corresponding update field must be set to true. If it is set to false, we ignore it.
 *
 * @typedef {Object} MsgUniversalUpdateCollection
 * @property {string} creator - The creator of the transaction.
 * @property {T} collectionId - The collection ID. If you are creating a new collection, set this to "0".
 * @property {string} balancesType - The balances type. Either "Standard", "Off-Chain - Indexed", "Off-Chain - Non-Indexed" or "Inherited". Only can be set on initial creation.
 * @property {UserOutgoingApproval[]} defaultOutgoingApprovals - The default approved outgoing transfers timeline for users who have not interacted with the collection yet. Only can be set on initial creation. Only used if collection has "Standard" balance type.
 * @property {UserIncomingApproval[]} defaultIncomingApprovals - The default approved incoming transfers timeline for users who have not interacted with the collection yet. Only can be set on initial creation. Only used if collection has "Standard" balance type.
 * @property {UserPermissions} defaultUserPermissions - The default user permissions for users who have not interacted with the collection yet. Only can be set on initial creation. Only used if collection has "Standard" balance type.
 * @property {Balance[]} badgesToCreate - The badges to create. Newly created badges will be sent to the "Mint" address. Must have necessary permissions. Only used if collection has "Standard" balance type.
 * @property {boolean} updateCollectionPermissions - Whether or not to update the collection permissions.
 * @property {CollectionPermissions} collectionPermissions - The new collection permissions. Must have the necessary permissions to update.
 * @property {boolean} updateManagerTimeline - Whether or not to update the manager timeline.
 * @property {ManagerTimeline[]} managerTimeline - The new manager timeline. Must have the necessary permissions to update.
 * @property {boolean} updateCollectionMetadataTimeline - Whether or not to update the collection metadata timeline.
 * @property {CollectionMetadataTimeline[]} collectionMetadataTimeline - The new collection metadata timeline. Must have the necessary permissions to update.
 * @property {boolean} updateBadgeMetadataTimeline - Whether or not to update the badge metadata timeline.
 * @property {BadgeMetadataTimeline[]} badgeMetadataTimeline - The new badge metadata timeline. Must have the necessary permissions to update. Note we take first-match only for badge IDs, so do not define duplicates.
 * @property {boolean} updateOffChainBalancesMetadataTimeline - Whether or not to update the off-chain balances metadata timeline.
 * @property {OffChainBalancesMetadataTimeline[]} offChainBalancesMetadataTimeline - The new off-chain balances metadata timeline. Must have the necessary permissions to update. Only used if "Off-Chain - Indexed" or "Off-Chain - Non-Indexed" balance type.
 * @property {boolean} updateCustomDataTimeline - Whether or not to update the custom data timeline.
 * @property {CustomDataTimeline[]} customDataTimeline - The new custom data timeline. Must have the necessary permissions to update.
 * @property {boolean} updateCollectionApprovals - Whether or not to update the collection approved transfers timeline.
 * @property {CollectionApproval[]} collectionApprovals - The new collection approved transfers timeline. Must have the necessary permissions to update.
 * @property {boolean} updateStandardsTimeline - Whether or not to update the standards timeline.
 * @property {StandardsTimeline[]} standardsTimeline - The new standards timeline. Must have the necessary permissions to update.
 * @property {boolean} updateIsArchivedTimeline - Whether or not to update the is archived timeline.
 * @property {IsArchivedTimeline[]} isArchivedTimeline - The new is archived timeline. Must have the necessary permissions to update.
 */
export interface MsgUniversalUpdateCollection<T extends NumberType> {
  creator: string
  collectionId: T
  balancesType?: string
  defaultOutgoingApprovals?: UserOutgoingApproval<T>[]
  defaultIncomingApprovals?: UserIncomingApproval<T>[]
  defaultAutoApproveSelfInitiatedOutgoingTransfers?: boolean
  defaultAutoApproveSelfInitiatedIncomingTransfers?: boolean
  defaultUserPermissions?: UserPermissions<T>
  badgesToCreate?: Balance<T>[]
  updateCollectionPermissions?: boolean
  collectionPermissions?: CollectionPermissions<T>
  updateManagerTimeline?: boolean
  managerTimeline?: ManagerTimeline<T>[]
  updateCollectionMetadataTimeline?: boolean
  collectionMetadataTimeline?: CollectionMetadataTimeline<T>[]
  updateBadgeMetadataTimeline?: boolean
  badgeMetadataTimeline?: BadgeMetadataTimeline<T>[]
  updateOffChainBalancesMetadataTimeline?: boolean
  offChainBalancesMetadataTimeline?: OffChainBalancesMetadataTimeline<T>[]
  updateCustomDataTimeline?: boolean
  customDataTimeline?: CustomDataTimeline<T>[]
  updateCollectionApprovals?: boolean
  collectionApprovals?: CollectionApproval<T>[]
  updateStandardsTimeline?: boolean
  standardsTimeline?: StandardsTimeline<T>[]
  updateIsArchivedTimeline?: boolean
  isArchivedTimeline?: IsArchivedTimeline<T>[]
}

export function convertMsgUniversalUpdateCollection<T extends NumberType, U extends NumberType>(
  msg: MsgUniversalUpdateCollection<T>,
  convertFunction: (item: T) => U
): MsgUniversalUpdateCollection<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    defaultOutgoingApprovals: msg.defaultOutgoingApprovals ? msg.defaultOutgoingApprovals.map(x => convertUserOutgoingApproval(x, convertFunction)) : undefined,
    defaultIncomingApprovals: msg.defaultIncomingApprovals ? msg.defaultIncomingApprovals.map(x => convertUserIncomingApproval(x, convertFunction)) : undefined,
    defaultUserPermissions: msg.defaultUserPermissions ? convertUserPermissions(msg.defaultUserPermissions, convertFunction) : undefined,

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


export function convertFromProtoToMsgUniversalUpdateCollection(
  protoMsg: badges.MsgUniversalUpdateCollection,
): MsgUniversalUpdateCollection<bigint> {
  const msg = (protoMsg.toJson({ emitDefaultValues: true }) as any) as MsgUniversalUpdateCollection<string>;

  return {
    ...msg,
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    balancesType: msg.balancesType,
    defaultOutgoingApprovals: msg.defaultOutgoingApprovals?.map(x => convertUserOutgoingApproval(x, BigInt)),
    defaultIncomingApprovals: msg.defaultIncomingApprovals?.map(x => convertUserIncomingApproval(x, BigInt)),
    defaultUserPermissions: msg.defaultUserPermissions ? convertUserPermissions(msg.defaultUserPermissions, BigInt) : undefined,

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

    updateCollectionPermissions: msg.updateCollectionPermissions,
    updateManagerTimeline: msg.updateManagerTimeline,
    updateCollectionMetadataTimeline: msg.updateCollectionMetadataTimeline,
    updateBadgeMetadataTimeline: msg.updateBadgeMetadataTimeline,
    updateOffChainBalancesMetadataTimeline: msg.updateOffChainBalancesMetadataTimeline,
    updateCustomDataTimeline: msg.updateCustomDataTimeline,
    updateCollectionApprovals: msg.updateCollectionApprovals,
    updateStandardsTimeline: msg.updateStandardsTimeline,
    updateIsArchivedTimeline: msg.updateIsArchivedTimeline,
  }
}

export function createTxMsgUniversalUpdateCollection<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUniversalUpdateCollection<T>,
) {
  const msgCosmos = createProtoMsg(new badges.MsgUniversalUpdateCollection(convertMsgUniversalUpdateCollection(params, String)))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
