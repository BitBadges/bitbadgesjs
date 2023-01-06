import * as tx from '../../../proto/badges/tx'

export function createMsgUpdateBytes(
  creator: string,
  badgeId: number,
  newBytes: string,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateBytes({
    creator,
    badgeId,
    newBytes,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateBytes',
  }
}
