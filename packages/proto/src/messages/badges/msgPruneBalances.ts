import * as badges from '../../proto/badges/tx'

export function createMsgPruneBalances(
  creator: string,
  badgeIds: number[],
  addresses: number[],
) {
  const message = new badges.trevormil.bitbadgeschain.badges.MsgPruneBalances({
    creator,
    badgeIds,
    addresses,
  })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgPruneBalances',
  }
}
