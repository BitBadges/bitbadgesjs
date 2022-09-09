import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import { IdRange } from './typeUtils'

export function createMsgFreezeAddress(
  creator: string,
  addressRanges: IdRange[],
  badgeId: number,
  add: boolean,
) {
  const wrappedRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
  for (const range of addressRanges) {
    wrappedRanges.push(
      new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
    )
  }

  const message = new tx.bitbadges.bitbadgeschain.badges.MsgFreezeAddress({
    creator,
    addressRanges: wrappedRanges,
    badgeId,
    add,
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgFreezeAddress',
  }
}
