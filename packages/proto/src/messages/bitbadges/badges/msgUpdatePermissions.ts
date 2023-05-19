import * as tx from '../../../proto/badges/tx'

export function createMsgUpdatePermissions(
  creator: string,
  collectionId: bigint,
  permissions: bigint,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdatePermissions({
    creator,
    collectionId: collectionId.toString(),
    permissions: permissions.toString(),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdatePermissions',
  }
}
