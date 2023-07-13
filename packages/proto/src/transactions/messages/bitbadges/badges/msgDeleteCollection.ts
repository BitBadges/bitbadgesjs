import * as badges from '../../../../proto/badges/tx'

import { NumberType, createMsgDeleteCollection as protoMsgDeleteCollection } from '../../../../'
import { MSG_DELETE_COLLECTION_TYPES, createEIP712, createEIP712MsgDeleteCollection, generateFee, generateMessage, generateTypes } from "../../../../eip712"
import { createTransaction } from "../../../transaction"
import { Chain, Fee, Sender } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"



export interface MsgDeleteCollection<T extends NumberType> {
  creator: string
  collectionId: T
}

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
): MsgDeleteCollection<bigint> {
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

  const msg = createEIP712MsgDeleteCollection(
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
