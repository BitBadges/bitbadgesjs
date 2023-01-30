import {
  ADDRESSES_TYPES,
  BadgeSupplyAndAmount,
  BADGE_SUPPLY_AND_AMOUNT_TYPES,
  BALANCE_TYPES,
  Claims,
  CLAIMS_TYPES,
  ID_RANGE_TYPES,
  TransferMapping,
  Transfers,
  TRANSFERS_TYPES,
  TRANSFER_MAPPING_TYPES,
} from './typeUtils'

const NewCollectionMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionUri', type: 'string' },
  { name: 'badgeUri', type: 'string' },
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
}

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
  return {
    type: 'badges/NewCollection',
    value: {
      creator,
      collectionUri,
      badgeUri,
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
