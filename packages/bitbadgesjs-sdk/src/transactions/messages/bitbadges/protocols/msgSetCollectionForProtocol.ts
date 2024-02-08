import { NumberType } from '../../../..'
import * as protocols from '../../../../proto/protocols/tx_pb'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

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
  const msgCosmos = new protocols.MsgSetCollectionForProtocol({ ...params, collectionId: params.collectionId.toString() })
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
