import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'

export function createMsgHandlePendingTransfer(
  creator: string,
  accept: boolean,
  badgeId: number,
  nonceRanges: ranges.trevormil.bitbadgeschain.badges.IdRange[],
  forcefulAccept: boolean,
) {
  const message =
    new tx.trevormil.bitbadgeschain.badges.MsgHandlePendingTransfer({
      creator,
      accept,
      badgeId,
      nonceRanges,
      forcefulAccept,
    })
  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgHandlePendingTransfer',
  }
}
