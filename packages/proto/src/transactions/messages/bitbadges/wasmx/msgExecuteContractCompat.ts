
import { createProtoMsg } from "../../../../proto-types/base";
import * as wasmx from "../../../../proto/wasmx/tx_pb";
import { createTransactionPayload } from "../../base";
import { Chain, Fee, Sender } from "../../common";

export interface MsgExecuteContractCompat {
  sender: string
  contract: string
  msg: string
  funds: string
}

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
