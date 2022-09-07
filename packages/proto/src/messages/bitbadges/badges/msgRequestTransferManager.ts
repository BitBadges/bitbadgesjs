import * as tx from '../../../proto/badges/tx'

export function createMsgRequestTransferManager(
  creator: string,
  badgeId: number,
  add: boolean,
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgRequestTransferManager({
      creator,
      badgeId,
      add,
    })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRequestTransferManager',
  }
}
