
import * as wasmx from "../../../../proto/wasmx/tx_pb";
import { createTransactionPayload } from "../../base";
import { Chain, Fee, Sender } from "../../common";

/**
 * MsgStoreCodeCompat defines a ExecuteContractCompat message.
 *
 * @typedef {Object} MsgStoreCodeCompat
 * @property {string} sender - The sender of the transaction.
 * @property {string} hexWasmByteCode - The contract address to execute.
 */
export interface MsgStoreCodeCompat {
  sender: string
  hexWasmByteCode: string
}

/**
 * Creates a new transaction with the MsgStoreCodeCompat message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgStoreCodeCompat} params - The parameters of the ExecuteContractCompat message.
 */
export function createTxMsgStoreCodeCompat(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgStoreCodeCompat
) {
  const msgCosmos = new wasmx.MsgStoreCodeCompat({
    sender: params.sender,
    hexWasmByteCode: params.hexWasmByteCode,
  })
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
