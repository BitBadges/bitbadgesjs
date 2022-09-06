import * as tx from '../../../proto/badges/tx'
import * as uri from '../../../proto/badges/uris'

export function createMsgUpdateUris(
  creator: string,
  badgeId: number,
  uri: uri.trevormil.bitbadgeschain.badges.UriObject,
) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgUpdateUris({
    creator,
    badgeId,
    uri,
  })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgUpdateUris',
  }
}
