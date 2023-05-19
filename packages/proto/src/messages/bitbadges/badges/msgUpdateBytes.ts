import * as tx from '../../../proto/badges/tx'

export function createMsgUpdateBytes(
  creator: string,
  collectionId: bigint,
  bytes: string,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateBytes({
    creator,
    collectionId: collectionId.toString(),
    bytes,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateBytes',
  }
}
