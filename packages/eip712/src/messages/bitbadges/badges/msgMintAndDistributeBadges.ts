import { BadgeSupplyAndAmount, BadgeUri, Claim, NumberType, Transfer, convertToProtoBadgeSupplysAndAmounts, convertToProtoBadgeUris, convertToProtoClaims, convertToProtoTransfers } from 'bitbadgesjs-proto'
import {
  BADGE_SUPPLY_AND_AMOUNT_TYPES,
  BADGE_URI_TYPES,
  BALANCE_TYPES,
  CHALLENGE_TYPES,
  CLAIMS_TYPES,
  ID_RANGE_TYPES,
  TRANSFERS_TYPES,
} from './eip712HelperTypes'

const MintAndDistributeBadgesMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'badgeSupplys', type: 'BadgeSupplyAndAmount[]' },
  { name: 'transfers', type: 'Transfer[]' },
  { name: 'claims', type: 'Claim[]' },
  { name: 'collectionUri', type: 'string' },
  { name: 'badgeUris', type: 'BadgeUri[]' },
  { name: 'balancesUri', type: 'string' },
]

export const MSG_MINT_BADGE_TYPES = {
  MsgValue: MintAndDistributeBadgesMsgValueType,
  BadgeSupplyAndAmount: BADGE_SUPPLY_AND_AMOUNT_TYPES,
  Transfer: TRANSFERS_TYPES,
  Claim: CLAIMS_TYPES,
  Balance: BALANCE_TYPES,
  UintRange: UINT_RANGE_TYPES,
  BadgeUri: BADGE_URI_TYPES,
  Challenge: CHALLENGE_TYPES
}

export function createMsgMintAndDistributeBadges<T extends NumberType>(
  creator: string,
  collectionId: T,
  badgeSupplys: BadgeSupplyAndAmount<T>[],
  transfers: Transfer<T>[],
  claims: Claim<T>[],
  collectionUri: string,
  badgeUris: BadgeUri<T>[],
  balancesUri: string,
) {
  return {
    type: 'badges/MintAndDistributeBadges',
    value: {
      creator,
      collectionId: collectionId.toString(),
      badgeSupplys: convertToProtoBadgeSupplysAndAmounts(badgeSupplys).map((s) => s.toObject()),
      transfers: convertToProtoTransfers(transfers).map((s) => s.toObject()),
      claims: convertToProtoClaims(claims).map((s) => s.toObject()),
      collectionUri,
      badgeUris: convertToProtoBadgeUris(badgeUris).map((s) => s.toObject()),
      balancesUri,
    },
  }
}
