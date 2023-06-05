import {
  BadgeSupplyAndAmount,
  BadgeUri,
  Claim,
  NumberType,
  StringNumber,
  TransferMapping,
  Transfer,
  convertBadgeSupplyAndAmount,
  convertBadgeUri,
  convertClaim,
  convertTransfer,
  convertTransferMapping,
  createTransaction,
  createMsgNewCollection as protoMsgNewCollection
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  MSG_NEW_COLLECTION_TYPES,
  createEIP712,
  createMsgNewCollection,
  generateFee,
  generateMessage,
  generateTypes,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MsgNewCollection<T extends NumberType> {
  creator: string
  collectionUri: string
  badgeUris: BadgeUri<T>[]
  balancesUri: string,
  permissions: T
  bytes: string
  allowedTransfers: TransferMapping<T>[]
  managerApprovedTransfers: TransferMapping<T>[]
  standard: T
  badgeSupplys: BadgeSupplyAndAmount<T>[]
  transfers: Transfer<T>[]
  claims: Claim<T>[]
}

export type b_MsgNewCollection = MsgNewCollection<bigint>
export type s_MsgNewCollection = MsgNewCollection<string>
export type n_MsgNewCollection = MsgNewCollection<number>
export type d_MsgNewCollection = MsgNewCollection<StringNumber>

export function convertMsgNewCollection<T extends NumberType, U extends NumberType>(
  msg: MsgNewCollection<T>,
  convertFunction: (item: T) => U
): MsgNewCollection<U> {
  return {
    ...msg,
    collectionUri: msg.collectionUri,
    badgeUris: msg.badgeUris.map((x) => convertBadgeUri(x, convertFunction)),
    balancesUri: msg.balancesUri,
    permissions: convertFunction(msg.permissions),
    bytes: msg.bytes,
    allowedTransfers: msg.allowedTransfers.map((x) => convertTransferMapping(x, convertFunction)),
    managerApprovedTransfers: msg.managerApprovedTransfers.map((x) => convertTransferMapping(x, convertFunction)),
    standard: convertFunction(msg.standard),
    badgeSupplys: msg.badgeSupplys.map((x) => convertBadgeSupplyAndAmount(x, convertFunction)),
    transfers: msg.transfers.map((x) => convertTransfer(x, convertFunction)),
    claims: msg.claims.map((x) => convertClaim(x, convertFunction)),
  }
}

export function convertFromProtoToMsgNewCollection(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgNewCollection,
): b_MsgNewCollection {
  return {
    creator: msg.creator,
    collectionUri: msg.collectionUri,
    badgeUris: msg.badgeUris.map((x) => convertBadgeUri(x, BigInt)),
    balancesUri: msg.balancesUri,
    permissions: BigInt(msg.permissions),
    bytes: msg.bytes,
    allowedTransfers: msg.allowedTransfers.map(x => convertTransferMapping(x, BigInt)),
    managerApprovedTransfers: msg.managerApprovedTransfers.map(x => convertTransferMapping(x, BigInt)),
    standard: BigInt(msg.standard),
    badgeSupplys: msg.badgeSupplys.map(x => convertBadgeSupplyAndAmount(x, BigInt)),
    transfers: msg.transfers.map(x => convertTransfer(x, BigInt)),
    claims: msg.claims.map(x => convertClaim(x, BigInt))
  }
}

export function createTxMsgNewCollection<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgNewCollection<T>,
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
