import * as tx from '../../../proto/badges/tx'

export function createMsgSelfDestructBadge(creator: string, badgeId: number) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgSelfDestructBadge({
    creator,
    badgeId,
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgSelfDestructBadge',
  }
}
