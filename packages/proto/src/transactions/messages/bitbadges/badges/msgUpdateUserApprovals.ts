import * as badges from '../../../../proto/badges/tx_pb'

import { createProtoMsg } from '../../../../proto-types/base'
import { NumberType, UserIncomingApproval, UserOutgoingApproval, UserPermissions, convertUserIncomingApproval, convertUserOutgoingApproval, convertUserPermissions } from '../../../..'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

export interface MsgUpdateUserApprovals<T extends NumberType> {
  creator: string
  collectionId: T
  updateOutgoingApprovals?: boolean
  outgoingApprovals?: UserOutgoingApproval<T>[]
  updateIncomingApprovals?: boolean
  incomingApprovals?: UserIncomingApproval<T>[]
  updateAutoApproveSelfInitiatedOutgoingTransfers?: boolean
  autoApproveSelfInitiatedOutgoingTransfers?: boolean
  updateAutoApproveSelfInitiatedIncomingTransfers?: boolean
  autoApproveSelfInitiatedIncomingTransfers?: boolean
  updateUserPermissions?: boolean
  userPermissions?: UserPermissions<T>
}

export function convertMsgUpdateUserApprovals<T extends NumberType, U extends NumberType>(
  msg: MsgUpdateUserApprovals<T>,
  convertFunction: (item: T) => U
): MsgUpdateUserApprovals<U> {
  return {
    ...msg,
    collectionId: convertFunction(msg.collectionId),
    outgoingApprovals: msg.outgoingApprovals?.map(x => convertUserOutgoingApproval(x, convertFunction, true)) ?? undefined,
    incomingApprovals: msg.incomingApprovals?.map(x => convertUserIncomingApproval(x, convertFunction, true)) ?? undefined,
    userPermissions: msg.userPermissions ? convertUserPermissions(msg.userPermissions, convertFunction, true) : undefined,
  }
}

export function convertFromProtoToMsgUpdateUserApprovals(
  protoMsg: badges.MsgUpdateUserApprovals,
): MsgUpdateUserApprovals<bigint> {
  const msg = (protoMsg.toJson({ emitDefaultValues: true }) as any) as MsgUpdateUserApprovals<string>

  return {
    ...msg,
    creator: msg.creator,
    collectionId: BigInt(msg.collectionId),
    updateOutgoingApprovals: msg.updateOutgoingApprovals,
    outgoingApprovals: msg.outgoingApprovals?.map(x => convertUserOutgoingApproval(x, BigInt)),
    updateIncomingApprovals: msg.updateIncomingApprovals,
    incomingApprovals: msg.incomingApprovals?.map(x => convertUserIncomingApproval(x, BigInt)),
    updateUserPermissions: msg.updateUserPermissions,
    userPermissions: msg.userPermissions ? convertUserPermissions(msg.userPermissions, BigInt) : undefined,
  }
}

export function createTxMsgUpdateUserApprovals<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateUserApprovals<T>
) {
  const msgCosmos = createProtoMsg(new badges.MsgUpdateUserApprovals(convertMsgUpdateUserApprovals(params, String)))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
