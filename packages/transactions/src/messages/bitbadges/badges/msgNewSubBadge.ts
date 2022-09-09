import {
  createMsgNewSubBadge as protoMsgNewSubBadge,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgNewSubBadge,
  MSG_NEW_SUB_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgNewSubBadge {
  creator: string
  badgeId: number
  supplys: number[]
  amountsToCreate: number[]
}

export function createTxMsgNewSubBadge(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgNewSubBadge,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_NEW_SUB_BADGE_TYPES)

  const msg = createMsgNewSubBadge(
    params.creator,
    params.badgeId,
    params.supplys,
    params.amountsToCreate,
  )
  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  const eipToSign = createEIP712(types, chain.chainId, messages)

  // Cosmos
  const msgCosmos = protoMsgNewSubBadge(
    params.creator,
    params.badgeId,
    params.supplys,
    params.amountsToCreate,
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
