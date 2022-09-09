import {
  createMsgUpdateBytes as protoMsgUpdateBytes,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgUpdateBytes,
  MSG_UPDATE_BYTES_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgUpdateBytes {
  creator: string
  badgeId: number
  newBytes: Uint8Array
}

export function createTxMsgUpdateBytes(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgUpdateBytes,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_BYTES_TYPES)

  const msg = createMsgUpdateBytes(
    params.creator,
    params.badgeId,
    params.newBytes,
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
  const msgCosmos = protoMsgUpdateBytes(
    params.creator,
    params.badgeId,
    params.newBytes,
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
