import * as badges from '../../../proto/badges/tx'

export function createMsgDeleteCollection(
  creator: string,
  collectionId: bigint,
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgDeleteCollection({
    creator,
    collectionId: collectionId.toString(),
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgDeleteCollection',
  }
}
