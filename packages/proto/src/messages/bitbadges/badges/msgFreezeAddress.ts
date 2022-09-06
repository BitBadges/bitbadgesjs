import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'

export function createMsgFreezeAddress(
  creator: string,
  addressRanges: ranges.trevormil.bitbadgeschain.badges.IdRange[],
  badgeId: number,
  add: boolean,
) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgFreezeAddress({
    creator,
    addressRanges,
    badgeId,
    add,
  })
  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgFreezeAddress',
  }
}
