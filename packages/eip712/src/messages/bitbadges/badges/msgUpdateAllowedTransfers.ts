import {
  ADDRESSES_MAPPING_TYPES,
  UINT_RANGE_TYPES,
  TRANSFER_MAPPING_TYPES,
} from './eip712HelperTypes'

import { NumberType, TransferMapping, convertToProtoTransferMappings } from 'bitbadgesjs-proto'

const MsgUpdateAllowedTransfersValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'allowedTransfer', type: 'TransferMapping[]' },
]

export const MSG_UPDATE_ALLOWED_TRANSFERS_TYPES = {
  UintRange: UINT_RANGE_TYPES,
  MsgValue: MsgUpdateAllowedTransfersValueType,
  TransferMapping: TRANSFER_MAPPING_TYPES,
  AddressesMapping: ADDRESSES_MAPPING_TYPES,
}

export function createMsgUpdateAllowedTransfers<T extends NumberType>(
  creator: string,
  collectionId: T,
  allowedTransfers: TransferMapping<T>[],
) {
  return {
    type: 'badges/UpdateAllowedTransfers',
    value: {
      creator,
      collectionId: collectionId.toString(),
      allowedTransfers: convertToProtoTransferMappings(allowedTransfers).map((s) => s.toObject()),
    },
  }
}
