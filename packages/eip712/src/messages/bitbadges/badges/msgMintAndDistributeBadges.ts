import {
  BADGE_SUPPLY_AND_AMOUNT_TYPES,
  CLAIMS_TYPES,
  ID_RANGE_TYPES,
  BALANCE_TYPES,
  TRANSFERS_TYPES,
  BADGE_URI_TYPES,
  CHALLENGE_TYPES,
} from './eip712HelperTypes'
import { BadgeSupplyAndAmount, BadgeUri, Claim, Transfer, getWrappedBadgeSupplysAndAmounts, getWrappedBadgeUris, getWrappedClaims, getWrappedTransfers } from 'bitbadgesjs-proto'

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
  IdRange: ID_RANGE_TYPES,
  BadgeUri: BADGE_URI_TYPES,
  Challenge: CHALLENGE_TYPES
}

export function createMsgMintAndDistributeBadges(
  creator: string,
  collectionId: bigint,
  badgeSupplys: BadgeSupplyAndAmount[],
  transfers: Transfer[],
  claims: Claim[],
  collectionUri: string,
  badgeUris: BadgeUri[],
  balancesUri: string,
) {
  return {
    type: 'badges/MintAndDistributeBadges',
    value: {
      creator,
      collectionId: collectionId.toString(),
      badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys).map((s) => s.toObject()),
      transfers: getWrappedTransfers(transfers).map((s) => s.toObject()),
      claims: getWrappedClaims(claims).map((s) => s.toObject()),
      collectionUri,
      badgeUris: getWrappedBadgeUris(badgeUris).map((s) => s.toObject()),
      balancesUri,
    },
  }
}
