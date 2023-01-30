import {
  ADDRESSES_TYPES,
  ID_RANGE_TYPES,
  TransferMapping,
  TRANSFER_MAPPING_TYPES,
} from './typeUtils'

const MsgUpdateDisallowedTransfersValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'disallowedTransfers', type: 'TransferMapping[]' },
]

export const MSG_UPDATE_DISALLOWED_TRANSFERS_TYPES = {
  IdRange: ID_RANGE_TYPES,
  MsgValue: MsgUpdateDisallowedTransfersValueType,
  TransferMapping: TRANSFER_MAPPING_TYPES,
  Addresses: ADDRESSES_TYPES,
}

export function createMsgUpdateDisallowedTransfers(
  creator: string,
  collectionId: number,
  disallowedTransfers: TransferMapping[],
) {
  return {
    type: 'badges/UpdateDisallowedTransfers',
    value: {
      creator,
      collectionId,
      disallowedTransfers,
    },
  }
}
