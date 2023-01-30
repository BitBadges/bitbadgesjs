import {
  BADGE_SUPPLY_AND_AMOUNT_TYPES,
  CLAIMS_TYPES,
  ID_RANGE_TYPES,
  BALANCE_TYPES,
  TRANSFERS_TYPES,
  BadgeSupplyAndAmount,
  Transfers,
  Claims,
} from './typeUtils'

const MintBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'badgeSupplys', type: 'BadgeSupplyAndAmount[]' },
  { name: 'transfers', type: 'Transfers[]' },
  { name: 'claims', type: 'Claim[]' },
]

export const MSG_MINT_BADGE_TYPES = {
  MsgValue: MintBadgeMsgValueType,
  BadgeSupplyAndAmount: BADGE_SUPPLY_AND_AMOUNT_TYPES,
  Transfers: TRANSFERS_TYPES,
  Claim: CLAIMS_TYPES,
  Balance: BALANCE_TYPES,
  IdRange: ID_RANGE_TYPES,
}

export function createMsgMintBadge(
  creator: string,
  collectionId: number,
  badgeSupplys: BadgeSupplyAndAmount[],
  transfers: Transfers[],
  claims: Claims[],
) {
  return {
    type: 'badges/MintBadge',
    value: {
      creator,
      collectionId,
      badgeSupplys,
      transfers,
      claims,
    },
  }
}
