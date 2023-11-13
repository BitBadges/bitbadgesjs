
import { createMsgExecuteContractCompat } from "../../../../";
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
  const msgCosmos = createMsgExecuteContractCompat(
    params.sender,
    params.contract,
    params.msg,
    params.funds,
  )
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
