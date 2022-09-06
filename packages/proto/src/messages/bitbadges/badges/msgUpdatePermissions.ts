import * as tx from '../../../proto/badges/tx'

export function createMsgUpdatePermissions(
  creator: string,
  badgeId: number,
  permissions: number,
) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgUpdatePermissions({
    creator,
    badgeId,
    permissions,
  })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgUpdatePermissions',
  }
}
