const MsgUpdateBytesValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'newBytes', type: 'string' },
]

export const MSG_UPDATE_BYTES_TYPES = {
  MsgValue: MsgUpdateBytesValueType,
}

export function createMsgUpdateBytes(
  creator: string,
  badgeId: number,
  newBytes: string,
) {
  return {
    type: 'badges/UpdateBytes',
    value: {
      creator,
      badgeId,
      newBytes,
    },
  }
}
