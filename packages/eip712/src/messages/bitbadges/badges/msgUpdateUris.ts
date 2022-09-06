import { UriObject, URI_OBJECT_TYPE } from './typeUtils'

const MsgUpdateUrisValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'uri', type: 'UriObject' },
]

export const MSG_UPDATE_URIS_TYPES = {
  UriObject: URI_OBJECT_TYPE,
  MsgValue: MsgUpdateUrisValueType,
}

export function createMsgUpdateUris(
  creator: string,
  badgeId: number,
  uri: UriObject,
) {
  return {
    type: 'badges/UpdateUris',
    value: {
      creator,
      badgeId,
      uri,
    },
  }
}
