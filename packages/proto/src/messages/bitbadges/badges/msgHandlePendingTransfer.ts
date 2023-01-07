import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import { IdRange } from './typeUtils'

export function createMsgHandlePendingTransfer(
  creator: string,
  actions: number[],
  badgeId: number,
  nonceRanges: IdRange[],
) {
  const wrappedRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
  for (const range of nonceRanges) {
    wrappedRanges.push(
      new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
    )
  }

  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgHandlePendingTransfer({
      creator,
      actions,
      badgeId,
      nonceRanges: wrappedRanges,
    })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgHandlePendingTransfer',
  }
}
