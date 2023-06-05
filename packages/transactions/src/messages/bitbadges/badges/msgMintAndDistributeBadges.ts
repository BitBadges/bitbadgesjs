import {
  BadgeSupplyAndAmount,
  BadgeUri,
  Claim, NumberType,
  StringNumber,
  Transfer,
  convertBadgeSupplyAndAmount,
  convertBadgeUri,
  convertClaim,
  convertTransfer,
  createTransaction,
  createMsgMintAndDistributeBadges as protoMsgMintAndDistributeBadges
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  MSG_MINT_BADGE_TYPES,
  createEIP712,
  createMsgMintAndDistributeBadges,
  generateFee,
  generateMessage,
  generateTypes,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MsgMintAndDistributeBadges<T extends NumberType> {
  creator: string
  collectionId: T
  badgeSupplys: BadgeSupplyAndAmount<T>[]
  transfers: Transfer<T>[]
  claims: Claim<T>[]
  collectionUri: string
  badgeUris: BadgeUri<T>[]
  balancesUri: string
}

export type b_MsgMintAndDistributeBadges = MsgMintAndDistributeBadges<bigint>
export type s_MsgMintAndDistributeBadges = MsgMintAndDistributeBadges<string>
export type n_MsgMintAndDistributeBadges = MsgMintAndDistributeBadges<number>
export type d_MsgMintAndDistributeBadges = MsgMintAndDistributeBadges<StringNumber>

export function convertMsgMintAndDistributeBadges<T extends NumberType, U extends NumberType>(
  msg: MsgMintAndDistributeBadges<T>,
  convertFunction: (item: T) => U
): MsgMintAndDistributeBadges<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    badgeSupplys: msg.badgeSupplys.map((x) => convertBadgeSupplyAndAmount(x, convertFunction)),
    transfers: msg.transfers.map((x) => convertTransfer(x, convertFunction)),
    claims: msg.claims.map((x) => convertClaim(x, convertFunction)),
    badgeUris: msg.badgeUris.map((x) => convertBadgeUri(x, convertFunction)),
  }
}

export function convertFromProtoToMsgMintAndDistributeBadges(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgMintAndDistributeBadges,
): b_MsgMintAndDistributeBadges {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    badgeSupplys: msg.badgeSupplys.map((x) => convertBadgeSupplyAndAmount(x, BigInt)),
    transfers: msg.transfers.map((x) => convertTransfer(x, BigInt)),
    claims: msg.claims.map((x) => convertClaim(x, BigInt)),
    collectionUri: msg.collectionUri,
    badgeUris: msg.badgeUris.map((x) => convertBadgeUri(x, BigInt)),
    balancesUri: msg.balancesUri
  }
}

export function createTxMsgMintAndDistributeBadges<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgMintAndDistributeBadges<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_MINT_BADGE_TYPES)

  const msg = createMsgMintAndDistributeBadges(
    params.creator,
    params.collectionId,
    params.badgeSupplys,
    params.transfers,
    params.claims,
    params.collectionUri,
    params.badgeUris,
    params.balancesUri,
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
  const msgCosmos = protoMsgMintAndDistributeBadges(
    params.creator,
    params.collectionId,
    params.badgeSupplys,
    params.transfers,
    params.claims,
    params.collectionUri,
    params.badgeUris,
    params.balancesUri,
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
