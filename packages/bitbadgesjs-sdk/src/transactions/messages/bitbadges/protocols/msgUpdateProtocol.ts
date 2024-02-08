import * as protocols from '../../../../proto/protocols/tx_pb'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

export interface MsgUpdateProtocol {
  creator: string,
  name: string,
  uri: string,
  customData: string,
  isFrozen: boolean,
}

export function createTxMsgUpdateProtocol(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateProtocol,
) {
  const msgCosmos = new protocols.MsgUpdateProtocol(params)
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
