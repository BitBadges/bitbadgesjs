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

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import { SubassetSupplyAndAmount } from './typeUtils'

export interface MessageMsgNewSubBadge {
  creator: string
  badgeId: number
  subassetSupplysAndAmounts: SubassetSupplyAndAmount[]
}

export function createTxMsgNewSubBadge(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgNewSubBadge,
  domain?: object,
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
    params.subassetSupplysAndAmounts,
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
  const msgCosmos = protoMsgNewSubBadge(
    params.creator,
    params.badgeId,
    params.subassetSupplysAndAmounts,
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
