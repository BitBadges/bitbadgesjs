import {
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

export interface MessageMsgDeleteCollection {
  creator: string
  collectionId: bigint
}

export function convertFromProtoToMsgDeleteCollection(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgDeleteCollection,
): MessageMsgDeleteCollection {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
  }
}

export function createTxMsgDeleteCollection(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgDeleteCollection,
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
