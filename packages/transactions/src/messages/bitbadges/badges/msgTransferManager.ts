import {
  createMsgTransferManager as protoMsgTransferManager,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgTransferManager,
  MSG_TRANSFER_MANAGER_TYPES,
} from 'bitbadgesjs-eip712'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgTransferManager {
  creator: string
  badgeId: number
  address: number
}

export function createTxMsgTransferManager(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgTransferManager,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_TRANSFER_MANAGER_TYPES)

  const msg = createMsgTransferManager(
    params.creator,
    params.badgeId,
    params.address,
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
  const msgCosmos = protoMsgTransferManager(
    params.creator,
    params.badgeId,
    params.address,
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
