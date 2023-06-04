import {
  BadgeUriWithType,
  NumberType,
  convertBadgeUri,
  createTransaction,
  createMsgUpdateUris as protoMsgUpdateUris
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  MSG_UPDATE_URIS_TYPES,
  createEIP712,
  createMsgUpdateUris,
  generateFee,
  generateMessage,
  generateTypes,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgUpdateUris {
  creator: string
  collectionId: NumberType
  collectionUri: string
  badgeUris: BadgeUriWithType<NumberType>[]
  balancesUri: string
}

export function convertFromProtoToMsgUpdateUris(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgUpdateUris,
): MessageMsgUpdateUris {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    collectionUri: msg.collectionUri,
    badgeUris: msg.badgeUris.map((x) => convertBadgeUri(x, BigInt)),
    balancesUri: msg.balancesUri,
  }
}

export function createTxMsgUpdateUris(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgUpdateUris,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_URIS_TYPES)

  const msg = createMsgUpdateUris(
    params.creator,
    params.collectionId,
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
  const msgCosmos = protoMsgUpdateUris(
    params.creator,
    params.collectionId,
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
