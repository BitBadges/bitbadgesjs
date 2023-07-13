import * as tx from '../../../proto/badges/tx'
import { UserApprovedIncomingTransferTimeline, UserApprovedOutgoingTransferTimeline } from './typeutils/approvedTransfers'
import { UserPermissions } from './typeutils/permissions'
import { getWrappedOutgoingTransfersTimeline, getWrappedIncomingTransfersTimeline, getWrappedUserPermissions } from './typeutils/wrappers'

export function createMsgUpdateUserApprovedTransfers(
  creator: string,
  collectionId: bigint,
  updateApprovedOutgoingTransfersTimeline: boolean,
  approvedOutgoingTransfersTimeline: UserApprovedOutgoingTransferTimeline[],
  updateApprovedIncomingTransfersTimeline: boolean,
  approvedIncomingTransfersTimeline: UserApprovedIncomingTransferTimeline[],
  updateUserPermissions: boolean,
  userPermissions: UserPermissions,
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
