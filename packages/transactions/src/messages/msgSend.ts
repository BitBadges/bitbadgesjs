import {
  createMsgSend as protoMsgSend,
  createTransaction,
  NumberType,
  StringNumber,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgSend,
  MSG_SEND_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from './domain'

import { Chain, Fee, Sender } from './common'

export interface MsgSend<T extends NumberType> {
  destinationAddress: string
  amount: T
  denom: string
}

export type b_MsgSend = MsgSend<bigint>
export type s_MsgSend = MsgSend<string>
export type n_MsgSend = MsgSend<number>
export type d_MsgSend = MsgSend<StringNumber>

export function createTxMsgSend<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgSend<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_SEND_TYPES)
  const msg = createMsgSend(
    params.amount,
    params.denom,
    sender.accountAddress,
    params.destinationAddress,
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
  const msgSend = protoMsgSend(
    sender.accountAddress,
    params.destinationAddress,
    params.amount,
    params.denom,
  )

  const tx = createTransaction(
    msgSend,
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
