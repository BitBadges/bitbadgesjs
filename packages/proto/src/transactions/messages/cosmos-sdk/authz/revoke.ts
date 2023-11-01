import {
  createTransaction,
  createMsgRevoke,
  RevokeMessages,
} from '../../../../'

import { Chain, Fee, Sender, SupportedChain } from '../../common'

/* eslint-disable camelcase */
export interface MsgStakeRevokeAuthorizationParams {
  bot_address: string
}

export function createTxMsgStakeRevokeAuthorization(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgStakeRevokeAuthorizationParams,
) {
  // EIP712
  // This is blocked until EvmosV7 is released with the eip712 any messages fixes!

  // Cosmos
  const msgCosmos = createMsgRevoke(
    sender.accountAddress,
    params.bot_address,
    RevokeMessages.REVOKE_MSG_DELEGATE,
  )
  const tx = createTransaction(
    msgCosmos,
    memo,
    fee.amount,
    fee.denom,
    parseInt(fee.gas, 10),
    chain.chain === SupportedChain.ETH ? 'ethsecp256' : 'secp256k1',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId,
  )

  return {
    signDirect: tx.signDirect,
    legacyAmino: tx.legacyAmino,
  }
}
