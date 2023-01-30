const MsgRequestTransferManagerValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'addRequest', type: 'bool' },
]

export const MSG_REQUEST_TRANSFER_MANAGER_TYPES = {
  MsgValue: MsgRequestTransferManagerValueType,
}

export function createMsgRequestTransferManager(
  creator: string,
  collectionId: number,
  addRequest: boolean,
) {
  return {
    type: 'badges/RequestTransferManager',
    value: {
      creator,
      collectionId,
      addRequest,
    },
  }
}
