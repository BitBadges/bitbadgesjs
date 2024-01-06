import * as protocols from '../../../../proto/protocols/tx_pb'
import { createProtoMsg } from '../../../../proto-types/base'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"
import { NumberType } from '../../../..'

export interface MsgSetCollectionForProtocol<T extends NumberType> {
  creator: string,
  name: string,
  collectionId: T
}

export function createTxMsgSetCollectionForProtocol<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgSetCollectionForProtocol<T>,
) {
  const msgCosmos = createProtoMsg(new protocols.MsgSetCollectionForProtocol({ ...params, collectionId: params.collectionId.toString() }))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
