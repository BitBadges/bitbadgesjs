import { NumberType } from "../../../../";

const DeleteCollectionMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
]

export const MSG_DELETE_COLLECTION_TYPES = {
  MsgDeleteCollection: DeleteCollectionMsgValueType,
}

export function createEIP712MsgDeleteCollection<T extends NumberType>(
  creator: string,
  collectionId: T,
) {
  return {
    type: 'badges/DeleteCollection',
    value: {
      creator,
      collectionId: collectionId.toString(),
    },
  }
}
