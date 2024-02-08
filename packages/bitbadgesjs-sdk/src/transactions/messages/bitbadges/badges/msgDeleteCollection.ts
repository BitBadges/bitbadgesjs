import * as badges from '../../../../proto/badges/tx_pb'

import { NumberType } from '../../../..'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

/**
 * MsgDeleteCollection represents the message for deleting a collection. Once deleted, the collection cannot be recovered.
 *
 * Note that the collection can be archived instead of deleted, which will prevent any transactions but not delete the collection from the storage.
 *
 * Only executable by the manager. Must have adequate permissions.
 *
 * @typedef {Object} MsgDeleteCollection
 * @property {string} creator - The creator of the transaction.
 * @property {T} collectionId - The ID of the collection to delete.
 */
export interface MsgDeleteCollection<T extends NumberType> {
  creator: string
  collectionId: T
}

export function convertMsgDeleteCollection<T extends NumberType, U extends NumberType>(
  msg: MsgDeleteCollection<T>,
  convertFunction: (item: T) => U
): MsgDeleteCollection<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
  }
}

export function convertFromProtoToMsgDeleteCollection(
  protoMsg: badges.MsgDeleteCollection,
): MsgDeleteCollection<bigint> {
  const msg = (protoMsg.toJson({ emitDefaultValues: true }) as any) as MsgDeleteCollection<string>;

  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
  }
}

/**
 * Creates a new transaction with the MsgDeleteCollection message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgDeleteCollection} params - The parameters of the DeleteCollection message.
 */
export function createTxMsgDeleteCollection<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgDeleteCollection<T>
) {
  const msgCosmos = new badges.MsgDeleteCollection(convertMsgDeleteCollection(params, String))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
