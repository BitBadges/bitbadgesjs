import * as protocols from '../../../../proto/protocols/tx_pb'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

export interface MsgCreateProtocol {
  creator: string,
  name: string,
  uri: string,
  customData: string,
  isFrozen: boolean,
}

export function createTxMsgCreateProtocol(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgCreateProtocol,
) {
  const msgCosmos = new protocols.MsgCreateProtocol(params)
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}