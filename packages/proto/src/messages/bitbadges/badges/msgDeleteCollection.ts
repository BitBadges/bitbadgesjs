import * as badges from '../../../proto/badges/tx'

export function createMsgDeleteCollection(
    creator: string,
    collectionId: number,
) {
    const message = new badges.bitbadges.bitbadgeschain.badges.MsgDeleteCollection({
        creator,
        collectionId,
    })
    return {
        message,
        path: 'bitbadges.bitbadgeschain.badges.MsgDeleteCollection',
    }
}
