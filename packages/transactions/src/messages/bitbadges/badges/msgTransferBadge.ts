// @ts-nocheck
/* eslint-disable */
import {
  createMsgTransferBadge as protoMsgTransferBadge,
  createTransaction,
  IdRange, Transfer, n_Transfer, s_Transfer,
  NumberType, Transfer,
  StringNumber
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgTransferBadge,
  MSG_TRANSFER_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MsgTransferBadge<T extends NumberType> {
  creator: string;
  from: string;
  collectionId: T;
  transfers: Transfer<T>[];
}

export type b_MsgTransferBadge = MsgTransferBadge<bigint>
export type s_MsgTransferBadge = MsgTransferBadge<string>
export type n_MsgTransferBadge = MsgTransferBadge<number>
export type d_MsgTransferBadge = MsgTransferBadge<StringNumber>

export function convertMsgTransferBadge<T extends NumberType, U extends NumberType>(
  msg: MsgTransferBadge<T>,
  convertFunction: (item: T) => U
): MsgTransferBadge<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    transfers: msg.transfers.map((x) => convertTransfer(x, convertFunction)),
  }
}


export function convertFromProtoToMsgTransferBadge(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgTransferBadge,
): b_MsgTransferBadge {
  return {
    creator: msg.creator,
    from: msg.from,
    collectionId: BigInt(msg.collectionId),
    transfers: msg.transfers.map((x) => convertTransfer(x, BigInt)),
  }
}

export function createTxMsgTransferBadge<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgTransferBadge<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_TRANSFER_BADGE_TYPES)

  const msg = createMsgTransferBadge(
    params.creator,
    params.from,
    params.collectionId,
    params.transfers,
  )
  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  let domainObj = domain;
  if (!domain) {
    domainObj = getDefaultDomainWithChainId(chain.chainId);
  }
  const eipToSign = createEIP712(types, messages, domainObj);

  // Cosmos
  const msgCosmos = protoMsgTransferBadge(
    params.creator,
    params.from,
    params.collectionId,
    params.transfers,
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
