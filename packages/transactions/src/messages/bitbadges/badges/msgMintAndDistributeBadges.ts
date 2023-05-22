import {
  BadgeSupplyAndAmount, BadgeUri, Claim, Transfer,
  convertToBadgeSupplyAndAmount,
  convertToBadgeUri,
  convertToClaim,
  convertToTransfer,
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

export interface MessageMsgMintAndDistributeBadges {
  creator: string
  collectionId: bigint
  badgeSupplys: BadgeSupplyAndAmount[]
  transfers: Transfer[]
  claims: Claim[]
  collectionUri: string
  badgeUris: BadgeUri[]
  balancesUri: string
}

export function convertFromProtoToMsgMintAndDistributeBadges(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgMintAndDistributeBadges,
): MessageMsgMintAndDistributeBadges {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    badgeSupplys: msg.badgeSupplys.map(convertToBadgeSupplyAndAmount),
    transfers: msg.transfers.map(convertToTransfer),
    claims: msg.claims.map(convertToClaim),
    collectionUri: msg.collectionUri,
    badgeUris: msg.badgeUris.map(convertToBadgeUri),
    balancesUri: msg.balancesUri
  }
}

export function createTxMsgMintAndDistributeBadges(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgMintAndDistributeBadges,
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
