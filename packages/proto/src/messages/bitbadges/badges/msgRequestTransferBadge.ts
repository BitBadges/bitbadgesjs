import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'

export function createMsgRequestTransferBadge(
  creator: string,
  from: number,
  amount: number,
  badgeId: number,
  subbadgeRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[],
  expirationTime: number,
  cantCancelBeforeTime: number,
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgRequestTransferBadge({
      creator,
      from,
      amount,
      badgeId,
      subbadgeRanges,
      expiration_time: expirationTime,
      cantCancelBeforeTime,
    })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRequestTransferBadge',
  }
}
