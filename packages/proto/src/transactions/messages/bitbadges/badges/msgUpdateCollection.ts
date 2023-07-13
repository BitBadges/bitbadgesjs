import * as badges from '../../../../proto/badges/tx'

import { BadgeMetadataTimeline, Balance, CollectionApprovedTransferTimeline, CollectionMetadataTimeline, CollectionPermissions, ContractAddressTimeline, CustomDataTimeline, InheritedBalancesTimeline, IsArchivedTimeline, ManagerTimeline, NumberType, OffChainBalancesMetadataTimeline, StandardsTimeline, UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline, UserPermissions, convertBadgeMetadataTimeline, convertBalance, convertCollectionApprovedTransferTimeline, convertCollectionMetadataTimeline, convertCollectionPermissions, convertContractAddressTimeline, convertCustomDataTimeline, convertInheritedBalancesTimeline, convertIsArchivedTimeline, convertManagerTimeline, convertOffChainBalancesMetadataTimeline, convertStandardsTimeline, convertUserApprovedIncomingTransferTimeline, convertUserApprovedOutgoingTransferTimeline, convertUserPermissions, createMsgUpdateCollection as protoMsgUpdateCollection } from '../../../../'
import { MSG_UPDATE_COLLECTION_TYPES, createEIP712, createEIP712MsgUpdateCollection, generateFee, generateMessage, generateTypes } from "../../../../eip712"
import { createTransaction } from "../../../transaction"
import { Chain, Fee, Sender } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"


export interface MsgUpdateCollection<T extends NumberType> {
  creator: string
  collectionId: T
  balancesType: string
  defaultApprovedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline<T>[]
  defaultApprovedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline<T>[]
  defaultUserPermissions: UserPermissions<T>
  badgesToCreate: Balance<T>[]
  updateCollectionPermissions: boolean
  collectionPermissions: CollectionPermissions<T>
  updateManagerTimeline: boolean
  managerTimeline: ManagerTimeline<T>[]
  updateCollectionMetadataTimeline: boolean
  collectionMetadataTimeline: CollectionMetadataTimeline<T>[]
  updateBadgeMetadataTimeline: boolean
  badgeMetadataTimeline: BadgeMetadataTimeline<T>[]
  updateOffChainBalancesMetadataTimeline: boolean
  offChainBalancesMetadataTimeline: OffChainBalancesMetadataTimeline<T>[]
  updateCustomDataTimeline: boolean
  customDataTimeline: CustomDataTimeline<T>[]
  updateInheritedBalancesTimeline: boolean
  inheritedBalancesTimeline: InheritedBalancesTimeline<T>[]
  updateCollectionApprovedTransfersTimeline: boolean
  collectionApprovedTransfersTimeline: CollectionApprovedTransferTimeline<T>[]
  updateStandardsTimeline: boolean
  standardsTimeline: StandardsTimeline<T>[]
  updateContractAddressTimeline: boolean
  contractAddressTimeline: ContractAddressTimeline<T>[]
  updateIsArchivedTimeline: boolean
  isArchivedTimeline: IsArchivedTimeline<T>[]
}

export function convertMsgUpdateCollection<T extends NumberType, U extends NumberType>(
  msg: MsgUpdateCollection<T>,
  convertFunction: (item: T) => U
): MsgUpdateCollection<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    defaultApprovedOutgoingTransfersTimeline: msg.defaultApprovedOutgoingTransfersTimeline.map(x => convertUserApprovedOutgoingTransferTimeline(x, convertFunction)),
    defaultApprovedIncomingTransfersTimeline: msg.defaultApprovedIncomingTransfersTimeline.map(x => convertUserApprovedIncomingTransferTimeline(x, convertFunction)),
    defaultUserPermissions: convertUserPermissions(msg.defaultUserPermissions, convertFunction),

    badgesToCreate: msg.badgesToCreate.map(x => convertBalance(x, convertFunction)),
    collectionPermissions: convertCollectionPermissions(msg.collectionPermissions, convertFunction),
    managerTimeline: msg.managerTimeline.map(x => convertManagerTimeline(x, convertFunction)),
    collectionMetadataTimeline: msg.collectionMetadataTimeline.map(x => convertCollectionMetadataTimeline(x, convertFunction)),
    badgeMetadataTimeline: msg.badgeMetadataTimeline.map(x => convertBadgeMetadataTimeline(x, convertFunction)),
    offChainBalancesMetadataTimeline: msg.offChainBalancesMetadataTimeline.map(x => convertOffChainBalancesMetadataTimeline(x, convertFunction)),
    customDataTimeline: msg.customDataTimeline.map(x => convertCustomDataTimeline(x, convertFunction)),
    inheritedBalancesTimeline: msg.inheritedBalancesTimeline.map(x => convertInheritedBalancesTimeline(x, convertFunction)),
    collectionApprovedTransfersTimeline: msg.collectionApprovedTransfersTimeline.map(x => convertCollectionApprovedTransferTimeline(x, convertFunction)),
    standardsTimeline: msg.standardsTimeline.map(x => convertStandardsTimeline(x, convertFunction)),
    contractAddressTimeline: msg.contractAddressTimeline.map(x => convertContractAddressTimeline(x, convertFunction)),
    isArchivedTimeline: msg.isArchivedTimeline.map(x => convertIsArchivedTimeline(x, convertFunction)),
  }
}

export function convertFromProtoToMsgUpdateCollection(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgUpdateCollection,
): MsgUpdateCollection<bigint> {
  return {
    ...msg,
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    balancesType: msg.balancesType,
    defaultApprovedOutgoingTransfersTimeline: msg.defaultApprovedOutgoingTransfersTimeline.map(x => convertUserApprovedOutgoingTransferTimeline(x, BigInt)),
    defaultApprovedIncomingTransfersTimeline: msg.defaultApprovedIncomingTransfersTimeline.map(x => convertUserApprovedIncomingTransferTimeline(x, BigInt)),
    defaultUserPermissions: convertUserPermissions(msg.defaultUserPermissions, BigInt),

    badgesToCreate: msg.badgesToCreate.map(x => convertBalance(x, BigInt)),
    collectionPermissions: convertCollectionPermissions(msg.collectionPermissions, BigInt),
    managerTimeline: msg.managerTimeline.map(x => convertManagerTimeline(x, BigInt)),
    collectionMetadataTimeline: msg.collectionMetadataTimeline.map(x => convertCollectionMetadataTimeline(x, BigInt)),
    badgeMetadataTimeline: msg.badgeMetadataTimeline.map(x => convertBadgeMetadataTimeline(x, BigInt)),
    offChainBalancesMetadataTimeline: msg.offChainBalancesMetadataTimeline.map(x => convertOffChainBalancesMetadataTimeline(x, BigInt)),
    customDataTimeline: msg.customDataTimeline.map(x => convertCustomDataTimeline(x, BigInt)),
    inheritedBalancesTimeline: msg.inheritedBalancesTimeline.map(x => convertInheritedBalancesTimeline(x, BigInt)),
    collectionApprovedTransfersTimeline: msg.collectionApprovedTransfersTimeline.map(x => convertCollectionApprovedTransferTimeline(x, BigInt)),
    standardsTimeline: msg.standardsTimeline.map(x => convertStandardsTimeline(x, BigInt)),
    contractAddressTimeline: msg.contractAddressTimeline.map(x => convertContractAddressTimeline(x, BigInt)),
    isArchivedTimeline: msg.isArchivedTimeline.map(x => convertIsArchivedTimeline(x, BigInt)),

    updateCollectionPermissions: msg.updateCollectionPermissions,
    updateManagerTimeline: msg.updateManagerTimeline,
    updateCollectionMetadataTimeline: msg.updateCollectionMetadataTimeline,
    updateBadgeMetadataTimeline: msg.updateBadgeMetadataTimeline,
    updateOffChainBalancesMetadataTimeline: msg.updateOffChainBalancesMetadataTimeline,
    updateCustomDataTimeline: msg.updateCustomDataTimeline,
    updateInheritedBalancesTimeline: msg.updateInheritedBalancesTimeline,
    updateCollectionApprovedTransfersTimeline: msg.updateCollectionApprovedTransfersTimeline,
    updateStandardsTimeline: msg.updateStandardsTimeline,
    updateContractAddressTimeline: msg.updateContractAddressTimeline,
    updateIsArchivedTimeline: msg.updateIsArchivedTimeline,
  }
}

export function createTxMsgUpdateCollection<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateCollection<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_COLLECTION_TYPES)

  const msg = createEIP712MsgUpdateCollection(
    params.creator,
    params.collectionId,
    params.balancesType,
    params.defaultApprovedOutgoingTransfersTimeline,
    params.defaultApprovedIncomingTransfersTimeline,
    params.defaultUserPermissions,
    params.badgesToCreate,
    params.updateCollectionPermissions,
    params.collectionPermissions,
    params.updateManagerTimeline,
    params.managerTimeline,
    params.updateCollectionMetadataTimeline,
    params.collectionMetadataTimeline,
    params.updateBadgeMetadataTimeline,
    params.badgeMetadataTimeline,
    params.updateOffChainBalancesMetadataTimeline,
    params.offChainBalancesMetadataTimeline,
    params.updateCustomDataTimeline,
    params.customDataTimeline,
    params.updateInheritedBalancesTimeline,
    params.inheritedBalancesTimeline,
    params.updateCollectionApprovedTransfersTimeline,
    params.collectionApprovedTransfersTimeline,
    params.updateStandardsTimeline,
    params.standardsTimeline,
    params.updateContractAddressTimeline,
    params.contractAddressTimeline,
    params.updateIsArchivedTimeline,
    params.isArchivedTimeline,
  )
  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  let domainObj = domain
  if (!domain) {
    domainObj = getDefaultDomainWithChainId(chain.chainId)
  }
  const eipToSign = createEIP712(types, messages, domainObj)

  // Cosmos
  const msgCosmos = protoMsgUpdateCollection(
    params.creator,
    params.collectionId,
    params.balancesType,
    params.defaultApprovedOutgoingTransfersTimeline,
    params.defaultApprovedIncomingTransfersTimeline,
    params.defaultUserPermissions,
    params.badgesToCreate,
    params.updateCollectionPermissions,
    params.collectionPermissions,
    params.updateManagerTimeline,
    params.managerTimeline,
    params.updateCollectionMetadataTimeline,
    params.collectionMetadataTimeline,
    params.updateBadgeMetadataTimeline,
    params.badgeMetadataTimeline,
    params.updateOffChainBalancesMetadataTimeline,
    params.offChainBalancesMetadataTimeline,
    params.updateCustomDataTimeline,
    params.customDataTimeline,
    params.updateInheritedBalancesTimeline,
    params.inheritedBalancesTimeline,
    params.updateCollectionApprovedTransfersTimeline,
    params.collectionApprovedTransfersTimeline,
    params.updateStandardsTimeline,
    params.standardsTimeline,
    params.updateContractAddressTimeline,
    params.contractAddressTimeline,
    params.updateIsArchivedTimeline,
    params.isArchivedTimeline,
  )
  const tx = createTransaction(
    msgCosmos,
    memo,
    fee.amount,
    fee.denom,
    parseInt(fee.gas, 10),
    'ethsecp256',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId,
  )

  return {
    signDirect: tx.signDirect,
    legacyAmino: tx.legacyAmino,
    eipToSign,
  }
}
