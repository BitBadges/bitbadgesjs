const MsgUpdateUrisValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'collectionUri', type: 'string' },
  { name: 'badgeUri', type: 'string' },
]

export const MSG_UPDATE_URIS_TYPES = {
  MsgValue: MsgUpdateUrisValueType,
}

export function createMsgUpdateUris(
  creator: string,
  collectionId: number,
  collectionUri: string,
  badgeUri: string,
) {
  return {
    type: 'badges/UpdateUris',
    value: {
      creator,
      collectionId,
      collectionUri,
      badgeUri,
    },
  }
}
