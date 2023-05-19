import * as tx from '../../../proto/badges/tx'

export function createMsgTransferManager(
  creator: string,
  collectionId: bigint,
  address: string,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferManager({
    creator,
    collectionId: collectionId.toString(),
    address,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferManager',
  }
}
