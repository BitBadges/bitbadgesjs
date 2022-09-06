import * as tx from '../../../proto/badges/tx'

export function createMsgSelfDestructBadge(creator: string, badgeId: number) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgSelfDestructBadge({
    creator,
    badgeId,
  })
  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgSelfDestructBadge',
  }
}
