import * as tx from '../../../proto/badges/tx'

export function createMsgUpdateBytes(
  creator: string,
  collectionId: number,
  newBytes: string,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateBytes({
    creator,
    collectionId,
    newBytes,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateBytes',
  }
}
