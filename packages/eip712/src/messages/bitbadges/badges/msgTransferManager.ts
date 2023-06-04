import { NumberType } from "bitbadgesjs-proto"

const MsgTransferManagerValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'address', type: 'string' },
]

export const MSG_TRANSFER_MANAGER_TYPES = {
  MsgValue: MsgTransferManagerValueType,
}

export function createMsgTransferManager<T extends NumberType>(
  creator: string,
  collectionId: T,
  address: string,
) {
  return {
    type: 'badges/TransferManager',
    value: {
      creator,
      collectionId: collectionId.toString(),
      address,
    },
  }
}
