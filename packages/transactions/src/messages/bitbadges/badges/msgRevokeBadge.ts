import {
  createMsgRevokeBadge as protoMsgRevokeBadge,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgRevokeBadge,
  MSG_REVOKE_BADGE_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'
import { IdRange } from './typeUtils'

export interface MessageMsgRevokeBadge {
  creator: string
  addresses: number[]
  amounts: number[]
  badgeId: number
  subbadgeRanges: IdRange[]
}

export function createTxMsgRevokeBadge(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgRevokeBadge,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_REVOKE_BADGE_TYPES)

  const msg = createMsgRevokeBadge(
    params.creator,
    params.addresses,
    params.amounts,
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
  const msgCosmos = protoMsgRevokeBadge(
    params.creator,
    params.addresses,
    params.amounts,
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
