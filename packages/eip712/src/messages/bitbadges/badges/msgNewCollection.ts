import {
  ADDRESSES_MAPPING_TYPES,
  BADGE_SUPPLY_AND_AMOUNT_TYPES,
  BADGE_URI_TYPES,
  BALANCE_TYPES,
  CHALLENGE_TYPES,
  CLAIMS_TYPES,
  UINT_RANGE_TYPES,
  TRANSFERS_TYPES,
  TRANSFER_MAPPING_TYPES,
} from './eip712HelperTypes'

import { BadgeSupplyAndAmount, BadgeUri, Claim, Transfer, TransferMapping, getWrappedBadgeSupplysAndAmounts, getWrappedBadgeUris, getWrappedClaims, getWrappedTransferMappings, getWrappedTransfers } from 'bitbadgesjs-proto'

const NewCollectionMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionUri', type: 'string' },
  { name: 'badgeUris', type: 'BadgeUri[]' },
  { name: 'balancesUri', type: 'string' },
  { name: 'bytes', type: 'string' },
  { name: 'permissions', type: 'string' },
  { name: 'allowedTransfers', type: 'TransferMapping[]' },
  { name: 'managerApprovedTransfers', type: 'TransferMapping[]' },
  { name: 'standard', type: 'string' },
  { name: 'badgeSupplys', type: 'BadgeSupplyAndAmount[]' },
  { name: 'transfers', type: 'Transfer[]' },
  { name: 'claims', type: 'Claim[]' },
]

export const MSG_NEW_COLLECTION_TYPES = {
  MsgValue: NewCollectionMsgValueType,
  TransferMapping: TRANSFER_MAPPING_TYPES,
  BadgeSupplyAndAmount: BADGE_SUPPLY_AND_AMOUNT_TYPES,
  Transfer: TRANSFERS_TYPES,
  Claim: CLAIMS_TYPES,
  Balance: BALANCE_TYPES,
  UintRange: UINT_RANGE_TYPES,
  AddressesMapping: ADDRESSES_MAPPING_TYPES,
  BadgeUri: BADGE_URI_TYPES,
  Challenge: CHALLENGE_TYPES
}

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
  return {
    type: 'badges/NewCollection',
    value: {
      creator,
      collectionUri,
      badgeUris: getWrappedBadgeUris(badgeUris).map((s) => s.toObject()),
      balancesUri,
      bytes,
      permissions: permissions.toString(),
      allowedTransfers: getWrappedTransferMappings(allowedTransfers).map((s) => s.toObject()),
      managerApprovedTransfers: getWrappedTransferMappings(managerApprovedTransfers).map((s) => s.toObject()),
      standard: standard.toString(),
      badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys).map((s) => s.toObject()),
      transfers: getWrappedTransfers(transfers).map((s) => s.toObject()),
      claims: getWrappedClaims(claims).map((s) => s.toObject()),
    },
  }
}
