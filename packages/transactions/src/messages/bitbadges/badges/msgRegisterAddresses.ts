import {
  createMsgRegisterAddresses as protoMsgRegisterAddresses,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgRegisterAddresses,
  MSG_REGISTER_ADDRESSES_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgRegisterAddresses {
  creator: string
  addressesToRegister: string[]
}

export function createTxMsgRegisterAddresses(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgRegisterAddresses,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_REGISTER_ADDRESSES_TYPES)

  console.log('PARAMS', params)
  const msg = createMsgRegisterAddresses(
    params.creator,
    params.addressesToRegister,
  )
  console.log('EIP712 MSG', msg)
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
  console.log('PARAMS', params)
  const msgCosmos = protoMsgRegisterAddresses(
    params.creator,
    params.addressesToRegister,
  )
  console.log('COSMOS MSG', msgCosmos)
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