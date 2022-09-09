import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'

export function createMsgSetApproval(
  creator: string,
  address: number,
  amount: number,
  badgeId: number,
  subbadgeRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgSetApproval({
    creator,
    address,
    amount,
    badgeId,
    subbadgeRanges,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgSetApproval',
  }
}
