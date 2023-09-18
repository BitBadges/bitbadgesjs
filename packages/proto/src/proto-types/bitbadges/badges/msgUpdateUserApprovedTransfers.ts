import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { UserApprovedIncomingTransfer, UserApprovedOutgoingTransfer } from './typeutils/approvedTransfers'
import { UserPermissions } from './typeutils/permissions'
import { getWrappedOutgoingTransfers, getWrappedIncomingTransfers, getWrappedUserPermissions } from './typeutils/wrappers'

export function createMsgUpdateUserApprovedTransfers<T extends NumberType>(
  creator: string,
  collectionId: T,
  updateApprovedOutgoingTransfers: boolean,
  approvedOutgoingTransfers: UserApprovedOutgoingTransfer<T>[],
  updateApprovedIncomingTransfers: boolean,
  approvedIncomingTransfers: UserApprovedIncomingTransfer<T>[],
  updateUserPermissions: boolean,
  userPermissions: UserPermissions<T>,
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUserApprovedTransfers({
      creator,
      collectionId: collectionId.toString(),
      updateApprovedOutgoingTransfers,
      approvedOutgoingTransfers: getWrappedOutgoingTransfers(approvedOutgoingTransfers),
      updateApprovedIncomingTransfers,
      approvedIncomingTransfers: getWrappedIncomingTransfers(approvedIncomingTransfers),
      updateUserPermissions,
      userPermissions: getWrappedUserPermissions(userPermissions),
    })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUserApprovedTransfers',
  }
}
