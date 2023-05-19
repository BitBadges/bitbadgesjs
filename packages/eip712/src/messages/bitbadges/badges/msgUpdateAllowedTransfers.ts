import {
  ADDRESSES_MAPPING_TYPES,
  ID_RANGE_TYPES,
  TRANSFER_MAPPING_TYPES,
} from './eip712HelperTypes'

import { TransferMapping, getWrappedTransferMappings } from 'bitbadgesjs-proto'

const MsgUpdateAllowedTransfersValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'allowedTransfer', type: 'TransferMapping[]' },
]

export const MSG_UPDATE_ALLOWED_TRANSFERS_TYPES = {
  IdRange: ID_RANGE_TYPES,
  MsgValue: MsgUpdateAllowedTransfersValueType,
  TransferMapping: TRANSFER_MAPPING_TYPES,
  AddressesMapping: ADDRESSES_MAPPING_TYPES,
}

export function createMsgUpdateAllowedTransfers(
  creator: string,
  collectionId: bigint,
  allowedTransfers: TransferMapping[],
) {
  return {
    type: 'badges/UpdateAllowedTransfers',
    value: {
      creator,
      collectionId: collectionId.toString(),
      allowedTransfers: getWrappedTransferMappings(allowedTransfers).map((s) => s.toObject()),
    },
  }
}
