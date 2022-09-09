import {
  createMsgUpdateFeeSplit as protoMsgUpdateFeeSplit,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgUpdateFeeSplit,
  MSG_UPDATE_FEE_SPLIT_TYPES,
} from 'bitbadgesjs-eip712'

import { Chain, Fee, Sender } from '../../common'

import { getDefaultDomainWithChainId } from '../../domain'

export interface MessageMsgUpdateFeeSplit {
  contractAddress: string
  deployerAddress: string
  withdrawerAddress: string
  nonces: number[]
}

export function createTxMsgUpdateFeeSplit(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgUpdateFeeSplit,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_FEE_SPLIT_TYPES)

  const msg = createMsgUpdateFeeSplit(
    params.contractAddress,
    params.deployerAddress,
    params.withdrawerAddress,
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
  const msgCosmos = protoMsgUpdateFeeSplit(
    params.contractAddress,
    params.deployerAddress,
    params.withdrawerAddress,
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
