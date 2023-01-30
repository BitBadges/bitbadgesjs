import * as tx from '../../../proto/badges/tx'

export function createMsgRequestTransferManager(
  creator: string,
  collectionId: number,
  addRequest: boolean,
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgRequestTransferManager({
      creator,
      collectionId,
      addRequest,
    })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRequestTransferManager',
  }
}
