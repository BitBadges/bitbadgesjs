import * as tx from '../../../proto/badges/tx'

export function createMsgUpdatePermissions(
  creator: string,
  collectionId: number,
  permissions: number,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdatePermissions({
    creator,
    collectionId,
    permissions,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdatePermissions',
  }
}
