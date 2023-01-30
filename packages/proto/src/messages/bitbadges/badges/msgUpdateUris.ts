import * as tx from '../../../proto/badges/tx'

export function createMsgUpdateUris(
  creator: string,
  collectionId: number,
  collectionUri: string,
  badgeUri: string,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUris({
    creator,
    collectionId,
    collectionUri,
    badgeUri,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUris',
  }
}
