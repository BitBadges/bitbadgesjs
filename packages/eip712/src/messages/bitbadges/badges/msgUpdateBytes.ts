import { NumberType } from "bitbadgesjs-proto"

const MsgUpdateBytesValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'bytes', type: 'string' },
]

export const MSG_UPDATE_BYTES_TYPES = {
  MsgValue: MsgUpdateBytesValueType,
}

export function createMsgUpdateBytes<T extends NumberType>(
  creator: string,
  collectionId: T,
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
