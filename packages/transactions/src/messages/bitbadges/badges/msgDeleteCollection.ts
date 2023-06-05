import {
  NumberType,
  StringNumber,
  createTransaction,
  createMsgDeleteCollection as protoMsgDeleteCollection,
} from 'bitbadgesjs-proto'

import {
  MSG_DELETE_COLLECTION_TYPES,
  createEIP712,
  createMsgDeleteCollection,
  generateFee,
  generateMessage,
  generateTypes,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

export interface MsgDeleteCollection<T extends NumberType> {
  creator: string
  collectionId: T
}

export type b_MsgDeleteCollection = MsgDeleteCollection<bigint>
export type s_MsgDeleteCollection = MsgDeleteCollection<string>
export type n_MsgDeleteCollection = MsgDeleteCollection<number>
export type d_MsgDeleteCollection = MsgDeleteCollection<StringNumber>

export function convertMsgDeleteCollection<T extends NumberType, U extends NumberType>(
  msg: MsgDeleteCollection<T>,
  convertFunction: (item: T) => U
): MsgDeleteCollection<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
  }
}

export function convertFromProtoToMsgDeleteCollection(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgDeleteCollection,
): b_MsgDeleteCollection {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
  }
}

export function createTxMsgDeleteCollection<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgDeleteCollection<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_DELETE_COLLECTION_TYPES)

  const msg = createMsgDeleteCollection(
    params.creator,
    params.collectionId,
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
  const msgCosmos = protoMsgDeleteCollection(
    params.creator,
    params.collectionId,
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
