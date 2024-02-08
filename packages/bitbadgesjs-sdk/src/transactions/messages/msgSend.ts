import {
  CosmosCoin,
  NumberType
} from '../..'
import { MsgSend as ProtoMsgSend } from '../../proto/cosmos/bank/v1beta1/tx_pb'
import { createTransactionPayload } from './base'
import { Chain, Fee, Sender } from './common'

/**
 * MsgSend represents a message to send coins from one account to another.
 *
 * @typedef {Object} MsgSend
 * @property {string} fromAddress - The sender of the transaction.
 * @property {string} toAddress - The recipient of the transaction.
 * @property {CosmosCoin[]} amount - The amount of coins to send.
 */
export interface MsgSend<T extends NumberType> {
  fromAddress: string
  toAddress: string
  amount: CosmosCoin<T>[]
}


/**
 *Creates a new transaction with the MsgSend message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgSend} params - The parameters of the Send message.
 */
export function createTxMsgSend<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgSend<T>,
) {
  // Cosmos
  const msgSend = new ProtoMsgSend({
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    amount: params.amount.map((item) => {
      return {
        amount: item.amount.toString(),
        denom: item.denom,
      }
    }),
  })
  return createTransactionPayload({ chain, sender, fee, memo, }, msgSend)
}
