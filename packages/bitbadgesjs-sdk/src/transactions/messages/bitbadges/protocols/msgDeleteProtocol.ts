import * as protocols from '../../../../proto/protocols/tx_pb'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

export interface MsgDeleteProtocol {
  creator: string,
  name: string,
}

export function createTxMsgDeleteProtocol(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: {
    name: string,
  }
) {
  const msgCosmos = new protocols.MsgDeleteProtocol(params)
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
