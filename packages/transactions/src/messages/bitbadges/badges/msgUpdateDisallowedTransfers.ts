import {
  createMsgUpdateDisallowedTransfers as protoMsgUpdateDisallowedTransfers,
  createTransaction,
  TransferMapping
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgUpdateDisallowedTransfers,
  MSG_UPDATE_DISALLOWED_TRANSFERS_TYPES,
} from 'bitbadgesjs-eip712'

import { getDefaultDomainWithChainId } from '../../domain'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgUpdateDisallowedTransfers {
  creator: string
  collectionId: number
  disallowedTransfers: TransferMapping[]
}

export function createTxMsgUpdateDisallowedTransfers(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgUpdateDisallowedTransfers,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_DISALLOWED_TRANSFERS_TYPES)

  const msg = createMsgUpdateDisallowedTransfers(
    params.creator,
    params.collectionId,
    params.disallowedTransfers,
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
  const msgCosmos = protoMsgUpdateDisallowedTransfers(
    params.creator,
    params.collectionId,
    params.disallowedTransfers,
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
