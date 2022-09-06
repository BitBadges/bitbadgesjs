import * as tx from '../../../proto/badges/tx'

export function createMsgRequestTransferManager(
  creator: string,
  badgeId: number,
  add: boolean,
) {
  const message =
    new tx.trevormil.bitbadgeschain.badges.MsgRequestTransferManager({
      creator,
      badgeId,
      add,
    })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgRequestTransferManager',
  }
}
