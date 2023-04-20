import { BadgeUri, BADGE_URI_TYPES, ID_RANGE_TYPES } from "./typeUtils"

const MsgUpdateUrisValueType = [
    { name: 'creator', type: 'string' },
    { name: 'collectionId', type: 'uint64' },
    { name: 'collectionUri', type: 'string' },
    { name: 'badgeUris', type: 'BadgeUri[]' },
]

export const MSG_UPDATE_URIS_TYPES = {
    MsgValue: MsgUpdateUrisValueType,
    BadgeUri: BADGE_URI_TYPES,
    IdRange: ID_RANGE_TYPES,
}

export function createMsgUpdateUris(
    creator: string,
    collectionId: number,
    collectionUri: string,
    badgeUris: BadgeUri[],
) {
    return {
        type: 'badges/UpdateUris',
        value: {
            creator,
            collectionId,
            collectionUri,
            badgeUris,
        },
    }
}
