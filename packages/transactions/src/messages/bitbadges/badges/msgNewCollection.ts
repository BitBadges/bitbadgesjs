import {
  createMsgNewCollection as protoMsgNewCollection,
  createTransaction,
  BadgeSupplyAndAmount,
  BadgeUri,
  Claim,
  TransferMapping,
  Transfer,
  convertToBadgeSupplyAndAmount,
  convertToBadgeUri,
  convertToClaim,
  convertToTransfer,
  convertToTransferMapping,
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgNewCollection,
  MSG_NEW_COLLECTION_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgNewCollection {
  creator: string
  collectionUri: string
  badgeUris: BadgeUri[],
  balancesUri: string,
  permissions: bigint
  bytes: string
  allowedTransfers: TransferMapping[]
  managerApprovedTransfers: TransferMapping[]
  standard: bigint
  badgeSupplys: BadgeSupplyAndAmount[]
  transfers: Transfer[]
  claims: Claim[]
}

export function convertFromProtoToMsgNewCollection(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgNewCollection,
): MessageMsgNewCollection {
  return {
    creator: msg.creator,
    collectionUri: msg.collectionUri,
    badgeUris: msg.badgeUris.map(convertToBadgeUri),
    balancesUri: msg.balancesUri,
    permissions: BigInt(msg.permissions),
    bytes: msg.bytes,
    allowedTransfers: msg.allowedTransfers.map(convertToTransferMapping),
    managerApprovedTransfers: msg.managerApprovedTransfers.map(convertToTransferMapping),
    standard: BigInt(msg.standard),
    badgeSupplys: msg.badgeSupplys.map(convertToBadgeSupplyAndAmount),
    transfers: msg.transfers.map(convertToTransfer),
    claims: msg.claims.map(convertToClaim),
  }
}

export function createTxMsgNewCollection(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgNewCollection,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_NEW_COLLECTION_TYPES)

  const msg = createMsgNewCollection(
    params.creator,
    params.collectionUri,
    params.badgeUris,
    params.balancesUri,
    params.bytes,
    params.permissions,
    params.allowedTransfers,
    params.managerApprovedTransfers,
    params.standard,
    params.badgeSupplys,
    params.transfers,
    params.claims,
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
  const msgCosmos = protoMsgNewCollection(
    params.creator,
    params.collectionUri,
    params.badgeUris,
    params.bytes,
    params.balancesUri,
    params.permissions,
    params.allowedTransfers,
    params.managerApprovedTransfers,
    params.standard,

    params.badgeSupplys,
    params.transfers,
    params.claims,
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
