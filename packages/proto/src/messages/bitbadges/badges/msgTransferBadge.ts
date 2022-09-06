import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'

export function createMsgTransferBadge(
  creator: string,
  from: number,
  toAddresses: number[],
  amounts: number[],
  badgeId: number,
  subbadgeRanges: ranges.trevormil.bitbadgeschain.badges.IdRange[],
  expirationTime: number,
  cantCancelBeforeTime: number,
) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgTransferBadge({
    creator,
    from,
    toAddresses,
    amounts,
    badgeId,
    subbadgeRanges,
    expiration_time: expirationTime,
    cantCancelBeforeTime,
  })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgTransferBadge',
  }
}
