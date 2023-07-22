import * as badges from '../../../../proto/badges/tx'

import { NumberType, Transfer, convertTransfer, createMsgTransferBadges as protoMsgTransferBadges } from '../../../../'
import { MSG_TRANSFER_BADGES_TYPES, createEIP712, createEIP712MsgTransferBadges, generateFee, generateMessage, generateTypes } from "../../../../"
import { createTransaction } from "../../transaction"
import { Chain, Fee, Sender } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"


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
  msg: badges.bitbadges.bitbadgeschain.badges.MsgTransferBadges,
): MsgTransferBadges<bigint> {
  return {
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    transfers: msg.transfers.map((x) => convertTransfer(x.toObject() as any, BigInt)),
  }
}

export function createTxMsgTransferBadges<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgTransferBadges<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_TRANSFER_BADGES_TYPES)

  const msg = createEIP712MsgTransferBadges(
    params.creator,
    params.collectionId,
    params.transfers,
  )
  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  let domainObj = domain;
  if (!domain) {
    domainObj = getDefaultDomainWithChainId(chain.chainId);
  }
  const eipToSign = createEIP712(types, messages, domainObj);

  // Cosmos
  const msgCosmos = protoMsgTransferBadges(
    params.creator,
    params.collectionId,
    params.transfers,
  )
  const tx = createTransaction(
    msgCosmos,
    memo,
    fee.amount,
    fee.denom,
    parseInt(fee.gas, 10),
    'ethsecp256',
    sender.pubkey,
    sender.sequence,
    sender.accountNumber,
    chain.cosmosChainId,
  )

  return {
    signDirect: tx.signDirect,
    legacyAmino: tx.legacyAmino,
    eipToSign,
  }
}
