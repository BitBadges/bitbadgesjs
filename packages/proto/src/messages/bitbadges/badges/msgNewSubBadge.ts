import * as badges from '../../../proto/badges/tx'

export function createMsgNewSubBadge(
  creator: string,
  badgeId: number,
  supplys: number[],
  amountsToCreate: number[],
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgNewSubBadge({
    creator,
    badgeId,
    supplys,
    amountsToCreate,
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgNewSubBadge',
  }
}
