import {
  ADDRESSES_MAPPING_TYPES,
  BADGE_SUPPLY_AND_AMOUNT_TYPES,
  BADGE_URI_TYPES,
  BALANCE_TYPES,
  CHALLENGE_TYPES,
  CLAIMS_TYPES,
  ID_RANGE_TYPES,
  TRANSFERS_TYPES,
  TRANSFER_MAPPING_TYPES,
} from './eip712HelperTypes'

import { BadgeSupplyAndAmountWithType, BadgeUriWithType, ClaimWithType, NumberType, TransferMappingWithType, TransferWithType, convertToProtoBadgeSupplysAndAmounts, convertToProtoBadgeUris, convertToProtoClaims, convertToProtoTransferMappings, convertToProtoTransfers } from 'bitbadgesjs-proto'

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
  IdRange: ID_RANGE_TYPES,
  AddressesMapping: ADDRESSES_MAPPING_TYPES,
  BadgeUri: BADGE_URI_TYPES,
  Challenge: CHALLENGE_TYPES
}

export function createMsgNewCollection<T extends NumberType>(
  creator: string,
  collectionUri: string,
  badgeUris: BadgeUriWithType<T>[],
  balancesUri: string,
  bytes: string,
  permissions: T,
  allowedTransfers: TransferMappingWithType<T>[],
  managerApprovedTransfers: TransferMappingWithType<T>[],
  standard: T,
  badgeSupplys: BadgeSupplyAndAmountWithType<T>[],
  transfers: TransferWithType<T>[],
  claims: ClaimWithType<T>[],
) {
  return {
    type: 'badges/NewCollection',
    value: {
      creator,
      collectionUri,
      badgeUris: convertToProtoBadgeUris(badgeUris).map((s) => s.toObject()),
      balancesUri,
      bytes,
      permissions: permissions.toString(),
      allowedTransfers: convertToProtoTransferMappings(allowedTransfers).map((s) => s.toObject()),
      managerApprovedTransfers: convertToProtoTransferMappings(managerApprovedTransfers).map((s) => s.toObject()),
      standard: standard.toString(),
      badgeSupplys: convertToProtoBadgeSupplysAndAmounts(badgeSupplys).map((s) => s.toObject()),
      transfers: convertToProtoTransfers(transfers).map((s) => s.toObject()),
      claims: convertToProtoClaims(claims).map((s) => s.toObject()),
    },
  }
}
