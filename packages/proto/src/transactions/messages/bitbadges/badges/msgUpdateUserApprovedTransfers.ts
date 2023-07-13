import * as badges from '../../../../proto/badges/tx'

import { generateFee, generateTypes, MSG_UPDATE_USER_APPROVED_TRANSFERS_TYPES, generateMessage, createEIP712, createEIP712MsgUpdateUserApprovedTransfers } from "../../../../eip712"
import { createTransaction } from "../../../transaction"
import { Chain, Sender, Fee } from "../../common"
import { getDefaultDomainWithChainId } from "../../domain"
import { NumberType, UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline, UserPermissions, convertUserApprovedIncomingTransferTimeline, convertUserApprovedOutgoingTransferTimeline, convertUserPermissions, createMsgUpdateUserApprovedTransfers as protoMsgUpdateUserApprovedTransfers } from '../../../../'

export interface MsgUpdateUserApprovedTransfers<T extends NumberType> {
  creator: string
  collectionId: T
  updateApprovedOutgoingTransfersTimeline: boolean
  approvedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline<T>[]
  updateApprovedIncomingTransfersTimeline: boolean
  approvedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline<T>[]
  updateUserPermissions: boolean
  userPermissions: UserPermissions<T>
}

export function convertMsgUpdateUserApprovedTransfers<T extends NumberType, U extends NumberType>(
  msg: MsgUpdateUserApprovedTransfers<T>,
  convertFunction: (item: T) => U
): MsgUpdateUserApprovedTransfers<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    approvedOutgoingTransfersTimeline: msg.approvedOutgoingTransfersTimeline.map(x => convertUserApprovedOutgoingTransferTimeline(x, convertFunction)),
    approvedIncomingTransfersTimeline: msg.approvedIncomingTransfersTimeline.map(x => convertUserApprovedIncomingTransferTimeline(x, convertFunction)),
    userPermissions: convertUserPermissions(msg.userPermissions, convertFunction),
  }
}

export function convertFromProtoToMsgUpdateUserApprovedTransfers(
  protoMsg: badges.bitbadges.bitbadgeschain.badges.MsgUpdateUserApprovedTransfers,
): MsgUpdateUserApprovedTransfers<bigint> {
  return {
    creator: protoMsg.creator,
    collectionId: BigInt(protoMsg.collectionId),
    updateApprovedOutgoingTransfersTimeline: protoMsg.updateApprovedOutgoingTransfersTimeline,
    approvedOutgoingTransfersTimeline: protoMsg.approvedOutgoingTransfersTimeline.map(x => convertUserApprovedOutgoingTransferTimeline(x, BigInt)),
    updateApprovedIncomingTransfersTimeline: protoMsg.updateApprovedIncomingTransfersTimeline,
    approvedIncomingTransfersTimeline: protoMsg.approvedIncomingTransfersTimeline.map(x => convertUserApprovedIncomingTransferTimeline(x, BigInt)),
    updateUserPermissions: protoMsg.updateUserPermissions,
    userPermissions: convertUserPermissions(protoMsg.userPermissions, BigInt),
  }
}

export function createTxMsgUpdateUserApprovedTransfers<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateUserApprovedTransfers<T>,
  domain?: object,
) {
  // EIP712
  const feeObject = generateFee(
    fee.amount,
    fee.denom,
    fee.gas,
    sender.accountAddress,
  )
  const types = generateTypes(MSG_UPDATE_USER_APPROVED_TRANSFERS_TYPES)

  const msg = createEIP712MsgUpdateUserApprovedTransfers(
    params.creator,
    params.collectionId,
    params.updateApprovedOutgoingTransfersTimeline,
    params.approvedOutgoingTransfersTimeline,
    params.updateApprovedIncomingTransfersTimeline,
    params.approvedIncomingTransfersTimeline,
    params.updateUserPermissions,
    params.userPermissions,
  )
  const messages = generateMessage(
    sender.accountNumber.toString(),
    sender.sequence.toString(),
    chain.cosmosChainId,
    memo,
    feeObject,
    msg,
  )
  let domainObj = domain
  if (!domain) {
    domainObj = getDefaultDomainWithChainId(chain.chainId)
  }
  const eipToSign = createEIP712(types, messages, domainObj)

  // Cosmos
  const msgCosmos = protoMsgUpdateUserApprovedTransfers(
    params.creator,
    params.collectionId,
    params.updateApprovedOutgoingTransfersTimeline,
    params.approvedOutgoingTransfersTimeline,
    params.updateApprovedIncomingTransfersTimeline,
    params.approvedIncomingTransfersTimeline,
    params.updateUserPermissions,
    params.userPermissions,
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
