// @ts-nocheck
/* eslint-disable */
import {
  createMsgTransferBadge as protoMsgTransferBadge,
  createTransaction,
  UintRange, Transfers, convertToTransfer
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

export interface MessageMsgTransferBadge {
  creator: string;
  from: string;
  collectionId: bigint;
  transfers: Transfers[];
}

export function convertFromProtoToMsgTransferBadge(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgTransferBadge,
): MessageMsgTransferBadge {
  return {
    creator: msg.creator,
    from: msg.from,
    collectionId: BigInt(msg.collectionId),
    transfers: msg.transfers.map(convertToTransfer),
  }
}

export function createTxMsgTransferBadge(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgTransferBadge,
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
