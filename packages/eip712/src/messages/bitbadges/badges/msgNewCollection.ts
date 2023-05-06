import {
  ADDRESSES_TYPES,
  BADGE_SUPPLY_AND_AMOUNT_TYPES,
  BADGE_URI_TYPES,
  BALANCE_TYPES,
  CLAIMS_TYPES,
  ID_RANGE_TYPES,
  TRANSFERS_TYPES,
  TRANSFER_MAPPING_TYPES,
} from './eip712HelperTypes'

import { BadgeSupplyAndAmount, BadgeUri, Claims, TransferMapping, Transfers } from 'bitbadgesjs-proto'

const NewCollectionMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionUri', type: 'string' },
  { name: 'badgeUris', type: 'BadgeUri[]' },
  { name: 'bytes', type: 'string' },
  { name: 'permissions', type: 'uint64' },
  { name: 'disallowedTransfers', type: 'TransferMapping[]' },
  { name: 'managerApprovedTransfers', type: 'TransferMapping[]' },
  { name: 'standard', type: 'uint64' },
  { name: 'badgeSupplys', type: 'BadgeSupplyAndAmount[]' },
  { name: 'transfers', type: 'Transfers[]' },
  { name: 'claims', type: 'Claim[]' },
]

export const MSG_NEW_COLLECTION_TYPES = {
  MsgValue: NewCollectionMsgValueType,
  TransferMapping: TRANSFER_MAPPING_TYPES,
  BadgeSupplyAndAmount: BADGE_SUPPLY_AND_AMOUNT_TYPES,
  Transfers: TRANSFERS_TYPES,
  Claim: CLAIMS_TYPES,
  Balance: BALANCE_TYPES,
  IdRange: ID_RANGE_TYPES,
  Addresses: ADDRESSES_TYPES,
  BadgeUri: BADGE_URI_TYPES
}

export function createMsgNewCollection(
  creator: string,
  collectionUri: string,
  badgeUris: BadgeUri[],
  bytes: string,
  permissions: number,
  disallowedTransfers: TransferMapping[],
  managerApprovedTransfers: TransferMapping[],
  standard: number,
  badgeSupplys: BadgeSupplyAndAmount[],
  transfers: Transfers[],
  claims: Claims[],
) {
  return {
    type: 'badges/NewCollection',
    value: {
      creator,
      collectionUri,
      badgeUris,
      bytes,
      permissions,
      disallowedTransfers,
      managerApprovedTransfers,
      standard,
      badgeSupplys,
      transfers,
      claims,
    },
  }
}
