import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import * as uri from '../../../proto/badges/uris'
import * as balances from '../../../proto/badges/balances'
import {
  IdRange,
  UriObject,
  UriObjectWithIdRanges,
  WhitelistMintInfo,
} from './typeUtils'

export function createMsgNewBadge(
  creator: string,
  uriObject: UriObject,
  arbitraryBytes: string,
  permissions: number,
  defaultSubassetSupply: number,
  freezeAddressRanges: IdRange[],
  standard: number,
  subassetSupplys: number[],
  subassetAmountsToCreate: number[],
  whitelistedRecipients: WhitelistMintInfo[],
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

  const wrappedWhitelistedRecipients: balances.bitbadges.bitbadgeschain.badges.WhitelistMintInfo[] =
    []
  for (const whitelistedRecipient of whitelistedRecipients) {
    const wrappedBalanceAmounts = []
    for (const balance of whitelistedRecipient.balanceAmounts) {
      const wrappedRanges = []
      for (const range of balance.idRanges) {
        wrappedRanges.push(
          new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
        )
      }

      const balanceObj =
        new ranges.bitbadges.bitbadgeschain.badges.BalanceObject({
          balance: balance.balance,
          idRanges: wrappedRanges,
        })

      wrappedBalanceAmounts.push(
        new ranges.bitbadges.bitbadgeschain.badges.BalanceObject(balanceObj),
      )
    }

    const wrappedWhitelistedRecipient =
      new balances.bitbadges.bitbadgeschain.badges.WhitelistMintInfo({
        addresses: whitelistedRecipient.addresses,
        balanceAmounts: wrappedBalanceAmounts,
      })

    wrappedWhitelistedRecipients.push(
      new balances.bitbadges.bitbadgeschain.badges.WhitelistMintInfo(
        wrappedWhitelistedRecipient,
      ),
    )
  }

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
    whitelistedRecipients: wrappedWhitelistedRecipients,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgNewBadge',
  }
}
