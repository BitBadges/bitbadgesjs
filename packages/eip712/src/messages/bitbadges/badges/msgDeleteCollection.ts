const DeleteCollectionMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
]

export const MSG_DELETE_COLLECTION_TYPES = {
  MsgValue: DeleteCollectionMsgValueType,
}

export function createMsgDeleteCollection(
  creator: string,
  collectionId: bigint,
) {
  return {
    type: 'badges/DeleteCollection',
    value: {
      creator,
      collectionId: collectionId.toString(),
    },
  }
}
