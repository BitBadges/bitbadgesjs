import {
  createMsgSetApproval as protoMsgSetApproval,
  createTransaction,
  Balance,
  convertToBalance
} from 'bitbadgesjs-proto'
import * as badges from 'bitbadgesjs-proto/dist/proto/badges/tx'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgSetApproval,
  MSG_SET_APPROVAL_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgSetApproval {
  creator: string
  collectionId: bigint
  address: string
  balances: Balance[]
}

export function convertFromProtoToMessageMsgSetApproval(
  msg: badges.bitbadges.bitbadgeschain.badges.MsgSetApproval,
): MessageMsgSetApproval {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    address: msg.address,
    balances: msg.balances.map(convertToBalance)
  }
}

export function createTxMsgSetApproval(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgSetApproval,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_SET_APPROVAL_TYPES)

  const msg = createMsgSetApproval(
    params.creator,
    params.address,
    params.collectionId,
    params.balances,
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
  const msgCosmos = protoMsgSetApproval(
    params.creator,
    params.collectionId,
    params.address,
    params.balances,
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
