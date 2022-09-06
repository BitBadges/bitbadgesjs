import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'

export function createMsgRevokeBadge(
  creator: string,
  addresses: number[],
  amounts: number[],
  badgeId: number,
  subbadgeRanges: ranges.trevormil.bitbadgeschain.badges.IdRange[],
) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgRevokeBadge({
    creator,
    addresses,
    amounts,
    badgeId,
    subbadgeRanges,
  })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgRevokeBadge',
  }
}
