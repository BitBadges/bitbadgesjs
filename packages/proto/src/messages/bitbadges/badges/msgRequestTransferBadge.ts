import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import { IdRange } from './typeUtils'

export function createMsgRequestTransferBadge(
  creator: string,
  from: number,
  amount: number,
  badgeId: number,
  subbadgeRanges: IdRange[],
  expirationTime: number,
  cantCancelBeforeTime: number,
) {
  const wrappedRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
  for (const range of subbadgeRanges) {
    wrappedRanges.push(
      new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
    )
  }

  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgRequestTransferBadge({
      creator,
      from,
      amount,
      badgeId,
      subbadgeRanges: wrappedRanges,
      expiration_time: expirationTime,
      cantCancelBeforeTime,
    })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRequestTransferBadge',
  }
}
