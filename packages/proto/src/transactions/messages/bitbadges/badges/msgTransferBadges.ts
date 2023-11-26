import * as badges from '../../../../proto/badges/tx_pb';

import { createProtoMsg } from '../../../../proto-types/base';
import { NumberType, Transfer, convertTransfer } from '../../../../';
import { createTransactionPayload } from '../../base';
import { Chain, Fee, Sender } from "../../common";


/**
 * MsgTransferBadges represents a message to transfer badges from one user to another.
 * For a transfer to be successful, the transfer has to satisfy the following conditions:
 * - Be approved on the collection level
 * - Be approved by the recipient's incoming transfers (if not forcefully overriden by the collection)
 * - Be approved by the sender's outgoing transfers (if not forcefully overriden by the collection)
 * - The sender must have enough badges to transfer
 * - All restrictions and challenges for each approval must be satisfied (merkle challenges, approved amounts, max num transfers, ...)
 *
 * Note that the transfer transaction is atomic, meaning that either all transfers succeed or all fail.
 *
 * @typedef
 * @property {string} creator - The creator of the transaction.
 * @property {T} collectionId - The ID of the collection to transfer badges from.
 * @property {Transfer<T>[]} transfers - The transfers to perform.
 */
export interface MsgTransferBadges<T extends NumberType> {
  creator: string;
  collectionId: T;
  transfers: Transfer<T>[];
}

export function convertMsgTransferBadges<T extends NumberType, U extends NumberType>(
  msg: MsgTransferBadges<T>,
  convertFunction: (item: T) => U
): MsgTransferBadges<U> {
  return {
    ...msg,

    collectionId: convertFunction(msg.collectionId),
    transfers: msg.transfers.map((x) => convertTransfer(x, convertFunction)),
  }
}


export function convertFromProtoToMsgTransferBadges(
  protoMsg: badges.MsgTransferBadges,
): MsgTransferBadges<bigint> {
  const msg = (protoMsg.toJson({ emitDefaultValues: true }) as any) as MsgTransferBadges<string>;

  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    transfers: msg.transfers.map((x) => convertTransfer(x, BigInt)),
  }
}

export function createTxMsgTransferBadges<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgTransferBadges<T>
) {
  const msgCosmos = createProtoMsg(new badges.MsgTransferBadges(convertMsgTransferBadges(params, String)))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
