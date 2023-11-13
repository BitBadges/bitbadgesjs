import * as tx from '../../proto/badges/tx_pb'
import { NumberType, Stringify } from './string-numbers'
import { UserIncomingApproval, UserOutgoingApproval, convertUserIncomingApproval, convertUserOutgoingApproval } from './typeutils/approvals'
import { UserPermissions, convertUserPermissions } from './typeutils/permissions'
import { getWrappedOutgoingTransfers, getWrappedIncomingTransfers, getWrappedUserPermissions } from './typeutils/wrappers'

export function createMsgUpdateUserApprovals<T extends NumberType>(
  creator: string,
  collectionId: T,
  updateOutgoingApprovals: boolean,
  outgoingApprovals: UserOutgoingApproval<T>[],
  updateIncomingApprovals: boolean,
  incomingApprovals: UserIncomingApproval<T>[],
  updateAutoApproveSelfInitiatedOutgoingTransfers: boolean,
  autoApproveSelfInitiatedOutgoingTransfers: boolean,
  updateAutoApproveSelfInitiatedIncomingTransfers: boolean,
  autoApproveSelfInitiatedIncomingTransfers: boolean,
  updateUserPermissions: boolean,
  userPermissions: UserPermissions<T>,
) {
  const message =
    new tx.MsgUpdateUserApprovals({
      creator,
      collectionId: collectionId.toString(),
      updateOutgoingApprovals,
      outgoingApprovals: getWrappedOutgoingTransfers(outgoingApprovals.map((x) => convertUserOutgoingApproval(x, Stringify, true))),
      updateIncomingApprovals,
      incomingApprovals: getWrappedIncomingTransfers(incomingApprovals.map((x) => convertUserIncomingApproval(x, Stringify, true))),

      updateAutoApproveSelfInitiatedOutgoingTransfers,
      autoApproveSelfInitiatedOutgoingTransfers,
      updateAutoApproveSelfInitiatedIncomingTransfers,
      autoApproveSelfInitiatedIncomingTransfers,
      updateUserPermissions,
      userPermissions: getWrappedUserPermissions(convertUserPermissions(userPermissions, Stringify, true)),
    })
  return {
    message,
    path: message.getType().typeName
  }
}
