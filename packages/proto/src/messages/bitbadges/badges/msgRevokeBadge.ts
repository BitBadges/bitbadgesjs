import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import { IdRange } from './typeUtils'

export function createMsgRevokeBadge(
  creator: string,
  addresses: number[],
  amounts: number[],
  badgeId: number,
  subbadgeRanges: IdRange[],
) {
  const wrappedRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
  for (const range of subbadgeRanges) {
    wrappedRanges.push(
      new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
    )
  }
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgRevokeBadge({
    creator,
    addresses,
    amounts,
    badgeId,
    subbadgeRanges: wrappedRanges,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRevokeBadge',
  }
}
