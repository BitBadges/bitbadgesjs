const MsgTransferManagerValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'address', type: 'uint64' },
]

export const MSG_TRANSFER_MANAGER_TYPES = {
  MsgValue: MsgTransferManagerValueType,
}

export function createMsgTransferManager(
  creator: string,
  collectionId: number,
  address: number,
) {
  return {
    type: 'badges/TransferManager',
    value: {
      creator,
      collectionId,
      address,
    },
  }
}
