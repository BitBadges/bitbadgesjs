import * as badges from '../../../proto/badges/tx'
import {
    BadgeSupplyAndAmount,
    BadgeUri,
    Claims,
    getWrappedBadgeSupplysAndAmounts,
    getWrappedBadgeUris,
    getWrappedClaims,
    getWrappedTransfers,
    Transfers,
} from './typeUtils'

export function createMsgMintBadge(
    creator: string,
    collectionId: number,
    badgeSupplys: BadgeSupplyAndAmount[],
    transfers: Transfers[],
    claims: Claims[],
    collectionUri: string,
    badgeUris: BadgeUri[],
) {
    const message = new badges.bitbadges.bitbadgeschain.badges.MsgMintBadge({
        creator,
        collectionId,
        transfers: getWrappedTransfers(transfers),
        claims: getWrappedClaims(claims),
        badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys),
        collectionUri,
        badgeUris: getWrappedBadgeUris(badgeUris),
    })
    return {
        message,
        path: 'bitbadges.bitbadgeschain.badges.MsgMintBadge',
    }
}
