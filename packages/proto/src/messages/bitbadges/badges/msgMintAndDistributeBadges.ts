import * as badges from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import {
  BadgeSupplyAndAmount,
  BadgeUri,
  Claim,
  convertToProtoBadgeSupplysAndAmounts,
  convertToProtoBadgeUris,
  convertToProtoClaims,
  convertToProtoTransfers,
  Transfer
} from './typeUtils'

export function createMsgMintAndDistributeBadges<T extends NumberType>(
  creator: string,
  collectionId: T,
  badgeSupplys: BadgeSupplyAndAmount<T>[],
  transfers: Transfer<T>[],
  claims: Claim<T>[],
  collectionUri: string,
  badgeUris: BadgeUri<T>[],
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
