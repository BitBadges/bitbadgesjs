import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import * as uri from '../../../proto/badges/uris'

export function createMsgNewBadge(
  creator: string,
  uri: uri.trevormil.bitbadgeschain.badges.UriObject,
  arbitraryBytes: Uint8Array,
  permissions: number,
  defaultSubassetSupply: number,
  freezeAddressRanges: ranges.trevormil.bitbadgeschain.badges.IdRange[],
  standard: number,
  subassetSupplys: number[],
  subassetAmountsToCreate: number[],
) {
  const message = new tx.trevormil.bitbadgeschain.badges.MsgNewBadge({
    creator,
    uri,
    arbitraryBytes,
    permissions,
    defaultSubassetSupply,
    freezeAddressRanges,
    standard,
    subassetSupplys,
    subassetAmountsToCreate,
  })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgNewBadge',
  }
}
