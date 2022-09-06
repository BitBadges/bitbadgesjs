const MsgTransferManagerValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'address', type: 'uint64' },
]

export const MSG_TRANSFER_MANAGER_TYPES = {
  MsgValue: MsgTransferManagerValueType,
}

export function createMsgTransferManager(
  creator: string,
  badgeId: number,
  address: number,
) {
  return {
    type: 'badges/TransferManager',
    value: {
      creator,
      badgeId,
      address,
    },
  }
}
