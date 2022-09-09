import {
  createMsgHandlePendingTransfer as protoMsgHandlePendingTransfer,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgHandlePendingTransfer,
  MSG_HANDLE_PENDING_TRANSFER_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import { IdRange } from './typeUtils'

export interface MessageMsgHandlePendingTransfer {
  creator: string
  accept: boolean
  badgeId: number
  nonceRanges: IdRange[]
  forcefulAccept: boolean
}

export function createTxMsgHandlePendingTransfer(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgHandlePendingTransfer,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_HANDLE_PENDING_TRANSFER_TYPES)

  const msg = createMsgHandlePendingTransfer(
    params.creator,
    params.accept,
    params.badgeId,
    params.nonceRanges,
    params.forcefulAccept,
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
  const msgCosmos = protoMsgHandlePendingTransfer(
    params.creator,
    params.accept,
    params.badgeId,
    params.nonceRanges,
    params.forcefulAccept,
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
