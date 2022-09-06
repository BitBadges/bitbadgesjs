const MsgRequestTransferManagerValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'add', type: 'bool' },
]

export const MSG_REQUEST_TRANSFER_MANAGER_TYPES = {
  MsgValue: MsgRequestTransferManagerValueType,
}

export function createMsgRequestTransferManager(
  creator: string,
  badgeId: number,
  add: boolean,
) {
  return {
    type: 'badges/RequestTransferManager',
    value: {
      creator,
      badgeId,
      add,
    },
  }
}
