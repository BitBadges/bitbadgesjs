import { BadgeUri, getWrappedBadgeUris } from 'bitbadgesjs-proto'
import { BADGE_URI_TYPES, UINT_RANGE_TYPES } from "./eip712HelperTypes"

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
  UintRange: UINT_RANGE_TYPES,
}

export function createMsgUpdateUris(
  creator: string,
  collectionId: bigint,
  collectionUri: string,
  badgeUris: BadgeUri[],
  balancesUri: string,
) {
  return {
    type: 'badges/UpdateUris',
    value: {
      creator,
      collectionId: collectionId.toString(),
      collectionUri,
      badgeUris: getWrappedBadgeUris(badgeUris).map((s) => s.toObject()),
      balancesUri,
    },
  }
}
