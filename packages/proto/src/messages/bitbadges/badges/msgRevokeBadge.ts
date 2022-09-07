import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'

export function createMsgRevokeBadge(
  creator: string,
  addresses: number[],
  amounts: number[],
  badgeId: number,
  subbadgeRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgRevokeBadge({
    creator,
    addresses,
    amounts,
    badgeId,
    subbadgeRanges,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRevokeBadge',
  }
}
