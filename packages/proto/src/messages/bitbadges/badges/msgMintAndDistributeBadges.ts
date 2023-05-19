import * as badges from '../../../proto/badges/tx'
import {
  BadgeSupplyAndAmount,
  BadgeUri,
  Claim,
  getWrappedBadgeSupplysAndAmounts,
  getWrappedBadgeUris,
  getWrappedClaims,
  getWrappedTransfers,
  Transfer,
} from './typeUtils'

export function createMsgMintAndDistributeBadges(
  creator: string,
  collectionId: bigint,
  badgeSupplys: BadgeSupplyAndAmount[],
  transfers: Transfer[],
  claims: Claim[],
  collectionUri: string,
  badgeUris: BadgeUri[],
  balancesUri: string
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgMintAndDistributeBadges({
    creator,
    collectionId: collectionId.toString(),
    transfers: getWrappedTransfers(transfers),
    claims: getWrappedClaims(claims),
    badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys),
    collectionUri,
    badgeUris: getWrappedBadgeUris(badgeUris),
    balancesUri,
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgMintAndDistributeBadges',
  }
}
