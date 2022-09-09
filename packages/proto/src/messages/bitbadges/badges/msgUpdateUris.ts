import * as tx from '../../../proto/badges/tx'
import * as uri from '../../../proto/badges/uris'
import * as ranges from '../../../proto/badges/ranges'
import { UriObject, UriObjectWithIdRanges } from './typeUtils'

export function createMsgUpdateUris(
  creator: string,
  badgeId: number,
  uriObject: UriObject,
) {
  const uriObjectWithIdRanges: UriObjectWithIdRanges = {
    ...uriObject,
    idxRangeToRemove: new ranges.bitbadges.bitbadgeschain.badges.IdRange(
      uriObject.idxRangeToRemove,
    ),
  }

  const wrappedUri = new uri.bitbadges.bitbadgeschain.badges.UriObject(
    uriObjectWithIdRanges,
  )
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUris({
    creator,
    badgeId,
    uri: wrappedUri,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUris',
  }
}
