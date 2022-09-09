import {
  createMsgUpdatePermissions as protoMsgUpdatePermissions,
  createTransaction,
} from 'bitbadgesjs-proto'

import {
  createEIP712,
  generateFee,
  generateMessage,
  generateTypes,
  createMsgUpdatePermissions,
  MSG_UPDATE_PERMISSIONS_TYPES,
} from 'bitbadgesjs-eip712'

import { Chain, Fee, Sender } from '../../common'

export interface MessageMsgUpdatePermissions {
  creator: string
  badgeId: number
  permissions: number
}

export function createTxMsgUpdatePermissions(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MessageMsgUpdatePermissions,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_PERMISSIONS_TYPES)

  const msg = createMsgUpdatePermissions(
    params.creator,
    params.badgeId,
    params.permissions,
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
  const msgCosmos = protoMsgUpdatePermissions(
    params.creator,
    params.badgeId,
    params.permissions,
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
