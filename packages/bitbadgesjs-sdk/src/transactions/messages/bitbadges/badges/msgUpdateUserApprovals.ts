import * as badges from '../../../../proto/badges/tx_pb'

import { NumberType, UserIncomingApproval, UserOutgoingApproval, UserPermissions, convertUserIncomingApproval, convertUserOutgoingApproval, convertUserPermissions } from '../../../..'
import { createTransactionPayload } from '../../base'
import { Chain, Fee, Sender } from "../../common"

/**
 * MsgUpdateUserApprovals represents the message for updating user approvals.
 *
 * For a transfer to be successful, the transfer has to satisfy the following conditions:
 * - Be approved on the collection level
 * - Be approved by the recipient's incoming transfers (if not forcefully overriden by the collection)
 * - Be approved by the sender's outgoing transfers (if not forcefully overriden by the collection)
 * - The sender must have enough badges to transfer
 * - All restrictions and challenges for each approval must be satisfied (merkle challenges, approved amounts, max num transfers, ...)
 *
 * For successful execution, the user must have the necessary permissions to update the corresponding fields. If not, it will throw an error.
 * Permissions are updated last, so any permissions checked are the permissions BEFORE the update.
 *
 * To specify you would like to update a field, the corresponding update field must be set to true. If it is set to false, we ignore it.
 *
 * @typedef
 * @property {string} creator - The creator of the transaction.
 * @property {T} collectionId - The ID of the collection to transfer badges from.
 * @property {boolean} updateOutgoingApprovals - Whether or not to update the outgoing approvals.
 * @property {UserOutgoingApproval<T>[]} outgoingApprovals - The new outgoing approvals. Must have the necessary permissions to update.
 * @property {boolean} updateIncomingApprovals - Whether or not to update the incoming approvals.
 * @property {UserIncomingApproval<T>[]} incomingApprovals - The new incoming approvals. Must have the necessary permissions to update.
 * @property {boolean} updateAutoApproveSelfInitiatedOutgoingTransfers - Whether or not to update the auto approve self initiated outgoing transfers (i.e. from == the user and initiator == the user).
 * @property {boolean} autoApproveSelfInitiatedOutgoingTransfers - The new auto approve self initiated outgoing transfers. Must have the necessary permissions to update.
 * @property {boolean} updateAutoApproveSelfInitiatedIncomingTransfers - Whether or not to update the auto approve self initiated incoming transfers (i.e. to == the user and initiator == the user).
 * @property {boolean} autoApproveSelfInitiatedIncomingTransfers - The new auto approve self initiated incoming transfers. Must have the necessary permissions to update.
 * @property {boolean} updateUserPermissions - Whether or not to update the user permissions.
 * @property {UserPermissions<T>} userPermissions - The new user permissions. Must have the necessary permissions to update.
 */
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

/**
 * Creates a new transaction with the MsgUpdateUserApprovals message.
 *
 * Note this only creates a transaction with one Msg. For multi-msg transactions, you can custom build using createTransactionPayload. See docs for tutorials.
 *
 * @param {Chain} chain - The chain to create the transaction for.
 * @param {Sender} sender - The sender details for the transaction.
 * @param {Fee} fee - The fee of the transaction.
 * @param {string} memo - The memo of the transaction.
 * @param {MsgUpdateUserApprovals} params - The parameters of the UpdateUserApprovals message.
 */
export function createTxMsgUpdateUserApprovals<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgUpdateUserApprovals<T>
) {
  const msgCosmos = new badges.MsgUpdateUserApprovals(convertMsgUpdateUserApprovals(params, String))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgCosmos)
}
