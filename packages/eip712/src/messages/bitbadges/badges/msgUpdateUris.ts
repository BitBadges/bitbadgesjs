import { BadgeUri, NumberType, convertToProtoBadgeUris } from 'bitbadgesjs-proto'
import { BADGE_URI_TYPES, ID_RANGE_TYPES } from "./eip712HelperTypes"

const MsgUpdateUrisValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'collectionUri', type: 'string' },
  { name: 'badgeUris', type: 'BadgeUri[]' },
  { name: 'balancesUri', type: 'string' },
]

export const MSG_UPDATE_URIS_TYPES = {
  MsgValue: MsgUpdateUrisValueType,
  BadgeUri: BADGE_URI_TYPES,
  IdRange: ID_RANGE_TYPES,
}

export function createMsgUpdateUris<T extends NumberType>(
  creator: string,
  collectionId: T,
  collectionUri: string,
  badgeUris: BadgeUri<T>[],
  balancesUri: string,
) {
  return {
    type: 'badges/UpdateUris',
    value: {
      creator,
      collectionId: collectionId.toString(),
      collectionUri,
      badgeUris: convertToProtoBadgeUris(badgeUris).map((s) => s.toObject()),
      balancesUri,
    },
  }
}
