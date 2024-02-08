
import * as wasmx from "../../../../proto/wasmx/tx_pb";
import { createTransactionPayload } from "../../base";
import { Chain, Fee, Sender } from "../../common";

/**
 * MsgInstantiateContractCompat defines a ExecuteContractCompat message.
 *
 * @typedef {Object} MsgInstantiateContractCompat
 * @property {string} sender - The sender of the transaction.
 * @property {string} codeId - The code ID of the contract to instantiate.
 * @property {string} label - The human-readable label of the contract.
 * @property {string} funds - The amount of funds to send to the contract on instantiation.
 */
export interface MsgInstantiateContractCompat {
  sender: string
  codeId: string
  label: string
  funds: string
}

/**
 * Creates a new transaction with the MsgInstantiateContractCompat message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgInstantiateContractCompat} params - The parameters of the ExecuteContractCompat message.
 */
export function createTxMsgInstantiateContractCompat(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgInstantiateContractCompat
) {
  const msgCosmos = new wasmx.MsgInstantiateContractCompat({
    sender: params.sender,
    codeId: params.codeId,
    label: params.label,
    funds: params.funds,
  })
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
