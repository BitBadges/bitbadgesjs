const DeleteCollectionMsgValueType = [
    { name: 'creator', type: 'string' },
    { name: 'collectionId', type: 'uint64' },
]

export const MSG_DELETE_COLLECTION_TYPES = {
    MsgValue: DeleteCollectionMsgValueType,
}

export function createMsgDeleteCollection(
    creator: string,
    collectionId: number,
) {
    return {
        type: 'badges/DeleteCollection',
        value: {
            creator,
            collectionId,
        },
    }
}
