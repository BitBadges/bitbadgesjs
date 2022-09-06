import * as badges from '../../../proto/badges/tx'

export function createMsgNewSubBadge(
  creator: string,
  badgeId: number,
  supplys: number[],
  amountsToCreate: number[],
) {
  const message = new badges.trevormil.bitbadgeschain.badges.MsgNewSubBadge({
    creator,
    badgeId,
    supplys,
    amountsToCreate,
  })
  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgNewSubBadge',
  }
}
