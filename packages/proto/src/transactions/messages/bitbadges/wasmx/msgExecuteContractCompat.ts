
import { createProtoMsg } from "../../../../proto-types/base";
import * as wasmx from "../../../../proto/wasmx/tx_pb";
import { createTransactionPayload } from "../../base";
import { Chain, Fee, Sender } from "../../common";

/**
 * MsgExecuteContractCompat defines a ExecuteContractCompat message.
 *
 * @typedef {Object} MsgExecuteContractCompat
 * @property {string} sender - The sender of the transaction.
 * @property {string} contract - The contract address to execute.
 * @property {string} msg - The message to pass to the contract. Must be a valid JSON string.
 * @property {string} funds - The funds to send to the contract. Must be a valid JSON string.
 */
export interface MsgExecuteContractCompat {
  sender: string
  contract: string
  msg: string
  funds: string
}

/**
 * Creates a new transaction with the MsgExecuteContractCompat message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgExecuteContractCompat} params - The parameters of the ExecuteContractCompat message.
 */
export function createTxMsgExecuteContractCompat(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgExecuteContractCompat
) {
  const msgCosmos = createProtoMsg(new wasmx.MsgExecuteContractCompat(params))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
