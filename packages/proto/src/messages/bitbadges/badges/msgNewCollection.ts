import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import {
  BadgeSupplyAndAmount,
  BadgeUri,
  Claim,
  TransferMapping,
  Transfer,
  convertToProtoBadgeSupplysAndAmounts,
  convertToProtoBadgeUris,
  convertToProtoClaims,
  convertToProtoTransferMappings,
  convertToProtoTransfers
} from './typeUtils'

export function createMsgNewCollection<T extends NumberType>(
  creator: string,
  collectionUri: string,
  badgeUris: BadgeUri<T>[],
  balancesUri: string,
  bytes: string,
  permissions: T,
  allowedTransfers: TransferMapping<T>[],
  managerApprovedTransfers: TransferMapping<T>[],
  standard: T,
  badgeSupplys: BadgeSupplyAndAmount<T>[],
  transfers: Transfer<T>[],
  claims: Claim<T>[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgNewCollection({
    creator,
    collectionUri,
    badgeUris: convertToProtoBadgeUris(badgeUris),
    balancesUri,
    bytes,
    permissions: permissions.toString(),
    allowedTransfers: convertToProtoTransferMappings(allowedTransfers),
    managerApprovedTransfers: convertToProtoTransferMappings(
      managerApprovedTransfers,
    ),
    standard: standard.toString(),
    badgeSupplys: convertToProtoBadgeSupplysAndAmounts(badgeSupplys),
    transfers: convertToProtoTransfers(transfers),
    claims: convertToProtoClaims(claims),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgNewCollection',
  }
}
