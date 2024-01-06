import { createProtoMsg } from '../../../../proto-types/base'
import * as protocols from '../../../../proto/protocols/tx_pb'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

export interface MsgUnsetCollectionForProtocol {
  creator: string,
  name: string,
}

export function createTxMsgUnsetCollectionForProtocol(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUnsetCollectionForProtocol,
) {
  const msgCosmos = createProtoMsg(new protocols.MsgUnsetCollectionForProtocol({ ...params }))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
