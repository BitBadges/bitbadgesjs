import * as tx from '../../../proto/badges/tx'

export function createMsgTransferManager(
  creator: string,
  collectionId: number,
  address: number,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferManager({
    creator,
    collectionId,
    address,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferManager',
  }
}
