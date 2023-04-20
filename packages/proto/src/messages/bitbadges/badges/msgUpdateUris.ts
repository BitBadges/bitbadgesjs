import * as tx from '../../../proto/badges/tx'
import { BadgeUri, getWrappedBadgeUris } from './typeUtils'

export function createMsgUpdateUris(
    creator: string,
    collectionId: number,
    collectionUri: string,
    badgeUris: BadgeUri[],
) {
    const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUris({
        creator,
        collectionId,
        collectionUri,
        badgeUris: getWrappedBadgeUris(badgeUris),
    })

    return {
        message,
        path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUris',
    }
}
