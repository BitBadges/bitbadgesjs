import {
  createMsgSetApproval as protoMsgSetApproval,
  createTransaction,
} from 'bitbadgesjs-proto'

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
import { IdRange } from './typeUtils'

export interface MessageMsgSetApproval {
  creator: string
  amount: number
  address: number
  badgeId: number
  subbadgeRanges: IdRange[]
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
    params.amount,
    params.address,
    params.badgeId,
    params.subbadgeRanges,
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
    params.amount,
    params.address,
    params.badgeId,
    params.subbadgeRanges,
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
