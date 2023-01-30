import * as tx from '../../../proto/badges/tx'
import {
  BadgeSupplyAndAmount,
  Claims,
  getWrappedBadgeSupplysAndAmounts,
  getWrappedClaims,
  getWrappedTransferMappings,
  getWrappedTransfers,
  TransferMapping,
  Transfers,
} from './typeUtils'

export function createMsgNewCollection(
  creator: string,
  collectionUri: string,
  badgeUri: string,
  bytes: string,
  permissions: number,
  disallowedTransfers: TransferMapping[],
  managerApprovedTransfers: TransferMapping[],
  standard: number,
  badgeSupplys: BadgeSupplyAndAmount[],
  transfers: Transfers[],
  claims: Claims[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgNewCollection({
    creator,
    collectionUri,
    badgeUri,
    bytes,
    permissions,
    disallowedTransfers: getWrappedTransferMappings(disallowedTransfers),
    managerApprovedTransfers: getWrappedTransferMappings(
      managerApprovedTransfers,
    ),
    standard,
    badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys),
    transfers: getWrappedTransfers(transfers),
    claims: getWrappedClaims(claims),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgNewCollection',
  }
}
