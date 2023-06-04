import {
  createMsgTransferManager as protoMsgTransferManager,
  createTransaction,
  NumberType,
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgTransferManager,
  MSG_TRANSFER_MANAGER_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgTransferManager {
  creator: string
  collectionId: NumberType
  address: string
}

export function convertFromProtoToMsgTransferManager(
  proto: badges.bitbadges.bitbadgeschain.badges.MsgTransferManager,
): MessageMsgTransferManager {
  return {
    creator: proto.creator,
    collectionId: BigInt(proto.collectionId),
    address: proto.address,
  }
}

export function createTxMsgTransferManager(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgTransferManager,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_TRANSFER_MANAGER_TYPES)

  const msg = createMsgTransferManager(
    params.creator,
    params.collectionId,
    params.address,
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
  const msgCosmos = protoMsgTransferManager(
    params.creator,
    params.collectionId,
    params.address,
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
