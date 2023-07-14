import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline } from './typeutils/approvedTransfers'
import { UserPermissions } from './typeutils/permissions'
import { getWrappedOutgoingTransfersTimeline, getWrappedIncomingTransfersTimeline, getWrappedUserPermissions } from './typeutils/wrappers'

export function createMsgUpdateUserApprovedTransfers<T extends NumberType>(
  creator: string,
  collectionId: T,
  updateApprovedOutgoingTransfersTimeline: boolean,
  approvedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline<T>[],
  updateApprovedIncomingTransfersTimeline: boolean,
  approvedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline<T>[],
  updateUserPermissions: boolean,
  userPermissions: UserPermissions<T>,
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUserApprovedTransfers({
      creator,
      collectionId: collectionId.toString(),
      updateApprovedOutgoingTransfersTimeline,
      approvedOutgoingTransfersTimeline: getWrappedOutgoingTransfersTimeline(approvedOutgoingTransfersTimeline),
      updateApprovedIncomingTransfersTimeline,
      approvedIncomingTransfersTimeline: getWrappedIncomingTransfersTimeline(approvedIncomingTransfersTimeline),
      updateUserPermissions,
      userPermissions: getWrappedUserPermissions(userPermissions),
    })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUserApprovedTransfers',
  }
}
