import {
  createMsgUpdatePermissions as protoMsgUpdatePermissions,
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
  createMsgUpdatePermissions,
  MSG_UPDATE_PERMISSIONS_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MsgUpdatePermissions<T extends NumberType> {
  creator: string
  collectionId: T
  permissions: T
}

export type b_MsgUpdatePermissions = MsgUpdatePermissions<bigint>
export type s_MsgUpdatePermissions = MsgUpdatePermissions<string>
export type n_MsgUpdatePermissions = MsgUpdatePermissions<number>
export type d_MsgUpdatePermissions = MsgUpdatePermissions<StringNumber>

export function convertMsgUpdatePermissions<T extends NumberType, U extends NumberType>(
  msg: MsgUpdatePermissions<T>,
  convertFunction: (item: T) => U
): MsgUpdatePermissions<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    permissions: convertFunction(msg.permissions),
  }
}

export function convertFromProtoToMsgUpdatePermissions(
  protoMsg: badges.bitbadges.bitbadgeschain.badges.MsgUpdatePermissions,
): b_MsgUpdatePermissions {
  return {
    creator: protoMsg.creator,
    collectionId: BigInt(protoMsg.collectionId),
    permissions: BigInt(protoMsg.permissions),
  }
}

export function createTxMsgUpdatePermissions<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdatePermissions<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_PERMISSIONS_TYPES)

  const msg = createMsgUpdatePermissions(
    params.creator,
    params.collectionId,
    params.permissions,
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
  const msgCosmos = protoMsgUpdatePermissions(
    params.creator,
    params.collectionId,
    params.permissions,
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
