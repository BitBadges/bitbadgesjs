import * as tx from '../../../proto/badges/tx'

export function createMsgTransferManager(
  creator: string,
  badgeId: number,
  address: number,
) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgTransferManager({
    creator,
    badgeId,
    address,
  })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgTransferManager',
  }
}
