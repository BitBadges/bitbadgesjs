import * as badges from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import {
  BadgeSupplyAndAmountWithType,
  BadgeUriWithType,
  ClaimWithType,
  convertToProtoBadgeSupplysAndAmounts,
  convertToProtoBadgeUris,
  convertToProtoClaims,
  convertToProtoTransfers,
  TransferWithType
} from './typeUtils'

export function createMsgMintAndDistributeBadges<T extends NumberType>(
  creator: string,
  collectionId: T,
  badgeSupplys: BadgeSupplyAndAmountWithType<T>[],
  transfers: TransferWithType<T>[],
  claims: ClaimWithType<T>[],
  collectionUri: string,
  badgeUris: BadgeUriWithType<T>[],
  balancesUri: string
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgMintAndDistributeBadges({
    creator,
    collectionId: collectionId.toString(),
    transfers: convertToProtoTransfers(transfers),
    claims: convertToProtoClaims(claims),
    badgeSupplys: convertToProtoBadgeSupplysAndAmounts(badgeSupplys),
    collectionUri,
    badgeUris: convertToProtoBadgeUris(badgeUris),
    balancesUri,
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgMintAndDistributeBadges',
  }
}
