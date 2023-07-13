import * as badges from '../../../../proto/badges/tx'

import { NumberType, Transfer, convertTransfer, createMsgTransferBadges as protoMsgTransferBadges } from '../../../../'
import { MSG_TRANSFER_BADGES_TYPES, createEIP712, createEIP712MsgTransferBadges, generateFee, generateMessage, generateTypes } from "../../../../eip712"
import { createTransaction } from "../../../transaction"
import { Chain, Fee, Sender } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"


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
    transfers: msg.transfers.map((x) => convertTransfer(x, BigInt)),
  }
}

export function createTxMsgTransferBadge<T extends NumberType>(
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
