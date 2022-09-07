import * as tx from '../../../proto/badges/tx'
import * as uri from '../../../proto/badges/uris'

export function createMsgUpdateUris(
  creator: string,
  badgeId: number,
  uri: uri.bitbadges.bitbadgeschain.badges.UriObject,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUris({
    creator,
    badgeId,
    uri,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUris',
  }
}
