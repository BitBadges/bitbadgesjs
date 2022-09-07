import * as tx from '../../../proto/badges/tx'

export function createMsgTransferManager(
  creator: string,
  badgeId: number,
  address: number,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferManager({
    creator,
    badgeId,
    address,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferManager',
  }
}
