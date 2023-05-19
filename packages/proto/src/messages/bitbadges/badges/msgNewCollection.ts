import * as tx from '../../../proto/badges/tx'
import {
  BadgeSupplyAndAmount,
  BadgeUri,
  Claim,
  getWrappedBadgeSupplysAndAmounts,
  getWrappedBadgeUris,
  getWrappedClaims,
  getWrappedTransferMappings,
  getWrappedTransfers,
  TransferMapping,
  Transfer,
} from './typeUtils'

export function createMsgNewCollection(
  creator: string,
  collectionUri: string,
  badgeUris: BadgeUri[],
  balancesUri: string,
  bytes: string,
  permissions: bigint,
  allowedTransfers: TransferMapping[],
  managerApprovedTransfers: TransferMapping[],
  standard: bigint,
  badgeSupplys: BadgeSupplyAndAmount[],
  transfers: Transfer[],
  claims: Claim[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgNewCollection({
    creator,
    collectionUri,
    badgeUris: getWrappedBadgeUris(badgeUris),
    balancesUri,
    bytes,
    permissions: permissions.toString(),
    allowedTransfers: getWrappedTransferMappings(allowedTransfers),
    managerApprovedTransfers: getWrappedTransferMappings(
      managerApprovedTransfers,
    ),
    standard: standard.toString(),
    badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys),
    transfers: getWrappedTransfers(transfers),
    claims: getWrappedClaims(claims),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgNewCollection',
  }
}
