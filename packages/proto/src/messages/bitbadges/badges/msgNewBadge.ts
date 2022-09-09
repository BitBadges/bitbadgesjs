import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import * as uri from '../../../proto/badges/uris'
import { IdRange, UriObject, UriObjectWithIdRanges } from './typeUtils'

export function createMsgNewBadge(
  creator: string,
  uriObject: UriObject,
  arbitraryBytes: Uint8Array,
  permissions: number,
  defaultSubassetSupply: number,
  freezeAddressRanges: IdRange[],
  standard: number,
  subassetSupplys: number[],
  subassetAmountsToCreate: number[],
) {
  const wrappedRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
  for (const range of freezeAddressRanges) {
    wrappedRanges.push(
      new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
    )
  }

  const uriObjectWithIdRanges: UriObjectWithIdRanges = {
    ...uriObject,
    idxRangeToRemove: new ranges.bitbadges.bitbadgeschain.badges.IdRange(
      uriObject.idxRangeToRemove,
    ),
  }
  const wrappedUri = new uri.bitbadges.bitbadgeschain.badges.UriObject(
    uriObjectWithIdRanges,
  )

  const message = new tx.bitbadges.bitbadgeschain.badges.MsgNewBadge({
    creator,
    uri: wrappedUri,
    arbitraryBytes,
    permissions,
    defaultSubassetSupply,
    freezeAddressRanges: wrappedRanges,
    standard,
    subassetSupplys,
    subassetAmountsToCreate,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgNewBadge',
  }
}
