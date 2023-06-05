import {
  createMsgUpdateBytes as protoMsgUpdateBytes,
  createTransaction,
  NumberType,
  StringNumber,
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgUpdateBytes,
  MSG_UPDATE_BYTES_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MsgUpdateBytes<T extends NumberType> {
  creator: string
  collectionId: T
  bytes: string
}

export type b_MsgUpdateBytes = MsgUpdateBytes<bigint>
export type s_MsgUpdateBytes = MsgUpdateBytes<string>
export type n_MsgUpdateBytes = MsgUpdateBytes<number>
export type d_MsgUpdateBytes = MsgUpdateBytes<StringNumber>

export function convertMsgUpdateBytes<T extends NumberType, U extends NumberType>(
  msg: MsgUpdateBytes<T>,
  convertFunction: (item: T) => U
): MsgUpdateBytes<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
  }
}

export function convertFromProtoToMsgUpdateBytes(
  protoMsg: badges.bitbadges.bitbadgeschain.badges.MsgUpdateBytes,
): b_MsgUpdateBytes {
  return {
    creator: protoMsg.creator,
    collectionId: BigInt(protoMsg.collectionId),
    bytes: protoMsg.bytes,
  }
}

export function createTxMsgUpdateBytes<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateBytes<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_BYTES_TYPES)

  const msg = createMsgUpdateBytes(
    params.creator,
    params.collectionId,
    params.bytes,
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
  const msgCosmos = protoMsgUpdateBytes(
    params.creator,
    params.collectionId,
    params.bytes,
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
