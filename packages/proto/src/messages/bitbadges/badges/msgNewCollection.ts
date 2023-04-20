import * as tx from '../../../proto/badges/tx'
import {
    BadgeSupplyAndAmount,
    BadgeUri,
    Claims,
    getWrappedBadgeSupplysAndAmounts,
    getWrappedBadgeUris,
    getWrappedClaims,
    getWrappedTransferMappings,
    getWrappedTransfers,
    TransferMapping,
    Transfers,
} from './typeUtils'

export function createMsgNewCollection(
    creator: string,
    collectionUri: string,
    badgeUris: BadgeUri[],
    bytes: string,
    permissions: number,
    disallowedTransfers: TransferMapping[],
    managerApprovedTransfers: TransferMapping[],
    standard: number,
    badgeSupplys: BadgeSupplyAndAmount[],
    transfers: Transfers[],
    claims: Claims[],
) {
    const message = new tx.bitbadges.bitbadgeschain.badges.MsgNewCollection({
        creator,
        collectionUri,
        badgeUris: getWrappedBadgeUris(badgeUris),
        bytes,
        permissions,
        disallowedTransfers: getWrappedTransferMappings(disallowedTransfers),
        managerApprovedTransfers: getWrappedTransferMappings(
            managerApprovedTransfers,
        ),
        standard,
        badgeSupplys: getWrappedBadgeSupplysAndAmounts(badgeSupplys),
        transfers: getWrappedTransfers(transfers),
        claims: getWrappedClaims(claims),
    })

    return {
        message,
        path: 'bitbadges.bitbadgeschain.badges.MsgNewCollection',
    }
}
