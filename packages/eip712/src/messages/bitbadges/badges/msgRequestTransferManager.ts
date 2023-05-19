const MsgRequestTransferManagerValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'addRequest', type: 'bool' },
]

export const MSG_REQUEST_TRANSFER_MANAGER_TYPES = {
  MsgValue: MsgRequestTransferManagerValueType,
}

export function createMsgRequestTransferManager(
  creator: string,
  collectionId: bigint,
  addRequest: boolean,
) {
  return {
    type: 'badges/RequestTransferManager',
    value: {
      creator,
      collectionId: collectionId.toString(),
      addRequest,
    },
  }
}
