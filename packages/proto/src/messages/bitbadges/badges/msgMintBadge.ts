import * as badges from '../../../proto/badges/tx'
import {
  BadgeSupplyAndAmount,
  Claims,
  getWrappedBadgeSupplysAndAmounts,
  getWrappedClaims,
  getWrappedTransfers,
  Transfers,
} from './typeUtils'

export function createMsgMintBadge(
  creator: string,
  collectionId: number,
  badgeSupplys: BadgeSupplyAndAmount[],
  transfers: Transfers[],
  claims: Claims[],
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgMintBadge({
    creator,
    collectionId,
    transfers: getWrappedTransfers(transfers),
    claims: getWrappedClaims(claims),
    badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys),
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgMintBadge',
  }
}
