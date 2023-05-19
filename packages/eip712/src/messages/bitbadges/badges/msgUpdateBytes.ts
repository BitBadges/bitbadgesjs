const MsgUpdateBytesValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'bytes', type: 'string' },
]

export const MSG_UPDATE_BYTES_TYPES = {
  MsgValue: MsgUpdateBytesValueType,
}

export function createMsgUpdateBytes(
  creator: string,
  collectionId: bigint,
  bytes: string,
) {
  return {
    type: 'badges/UpdateBytes',
    value: {
      creator,
      collectionId: collectionId.toString(),
      bytes,
    },
  }
}
