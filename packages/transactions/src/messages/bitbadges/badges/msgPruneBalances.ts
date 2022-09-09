import {
  createMsgPruneBalances as protoMsgPruneBalances,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgPruneBalances,
  MSG_PRUNE_BALANCES_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgPruneBalances {
  creator: string
  badgeIds: number[]
  addresses: number[]
}

export function createTxMsgPruneBalances(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgPruneBalances,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_PRUNE_BALANCES_TYPES)

  console.log('PARAMS', params)
  const msg = createMsgPruneBalances(
    params.creator,
    params.badgeIds,
    params.addresses,
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
  const msgCosmos = protoMsgPruneBalances(
    params.creator,
    params.badgeIds,
    params.addresses,
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
