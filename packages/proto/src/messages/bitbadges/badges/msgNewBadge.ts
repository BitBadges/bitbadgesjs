import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import * as uri from '../../../proto/badges/uris'

export function createMsgNewBadge(
  creator: string,
  uri: uri.bitbadges.bitbadgeschain.badges.UriObject,
  arbitraryBytes: Uint8Array,
  permissions: number,
  defaultSubassetSupply: number,
  freezeAddressRanges: ranges.bitbadges.bitbadgeschain.badges.IdRange[],
  standard: number,
  subassetSupplys: number[],
  subassetAmountsToCreate: number[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgNewBadge({
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
    path: 'bitbadges.bitbadgeschain.badges.MsgNewBadge',
  }
}
