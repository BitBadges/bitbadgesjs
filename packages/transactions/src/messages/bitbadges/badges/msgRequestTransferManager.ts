import {
  NumberType,
  createTransaction,
  createMsgRequestTransferManager as protoMsgRequestTransferManager
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  MSG_REQUEST_TRANSFER_MANAGER_TYPES,
  createEIP712,
  createMsgRequestTransferManager,
  generateFee,
  generateMessage,
  generateTypes,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MsgRequestTransferManager<T extends NumberType> {
  creator: string
  collectionId: T
  addRequest: boolean
}

export function convertMsgRequestTransferManager<T extends NumberType, U extends NumberType>(
  msg: MsgRequestTransferManager<T>,
  convertFunction: (item: T) => U
): MsgRequestTransferManager<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
  }
}


export function convertFromProtoToMsgRequestTransferManager(
  proto: badges.bitbadges.bitbadgeschain.badges.MsgRequestTransferManager,
): MsgRequestTransferManager<bigint> {
  return {
    creator: proto.creator,
    collectionId: BigInt(proto.collectionId),
    addRequest: proto.addRequest,
  }
}

export function createTxMsgRequestTransferManager<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgRequestTransferManager<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_REQUEST_TRANSFER_MANAGER_TYPES)

  const msg = createMsgRequestTransferManager(
    params.creator,
    params.collectionId,
    params.addRequest,
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
  const msgCosmos = protoMsgRequestTransferManager(
    params.creator,
    params.collectionId,
    params.addRequest,
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
