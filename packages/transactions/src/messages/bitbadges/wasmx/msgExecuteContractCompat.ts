import {
  createTransaction,
  createMsgExecuteContractCompat as protoMsgExecuteContractCompat,
} from 'bitbadgesjs-proto'

import {
  MSG_EXECUTE_CONTRACT_COMPAT_TYPES,
  createEIP712,
  createMsgExecuteContractCompat,
  generateFee,
  generateMessage,
  generateTypes,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgExecuteContractCompat {
  sender: string
  contract: string
  msg: string
  funds: string
}

export function createTxMsgExecuteContractCompat(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgExecuteContractCompat,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_EXECUTE_CONTRACT_COMPAT_TYPES)

  const msg = createMsgExecuteContractCompat(
    params.sender,
    params.contract,
    params.msg,
    params.funds,
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
  const msgCosmos = protoMsgExecuteContractCompat(
    params.sender,
    params.contract,
    params.msg,
    params.funds,
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
