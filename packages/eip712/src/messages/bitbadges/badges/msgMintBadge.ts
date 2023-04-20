import {
    BADGE_SUPPLY_AND_AMOUNT_TYPES,
    CLAIMS_TYPES,
    ID_RANGE_TYPES,
    BALANCE_TYPES,
    TRANSFERS_TYPES,
    BadgeSupplyAndAmount,
    Transfers,
    Claims,
    BADGE_URI_TYPES,
    BadgeUri,
} from './typeUtils'

const MintBadgeMsgValueType = [
    { name: 'creator', type: 'string' },
    { name: 'collectionId', type: 'uint64' },
    { name: 'badgeSupplys', type: 'BadgeSupplyAndAmount[]' },
    { name: 'transfers', type: 'Transfers[]' },
    { name: 'claims', type: 'Claim[]' },
    { name: 'collectionUri', type: 'string' },
    { name: 'badgeUris', type: 'BadgeUri[]' },
]

export const MSG_MINT_BADGE_TYPES = {
    MsgValue: MintBadgeMsgValueType,
    BadgeSupplyAndAmount: BADGE_SUPPLY_AND_AMOUNT_TYPES,
    Transfers: TRANSFERS_TYPES,
    Claim: CLAIMS_TYPES,
    Balance: BALANCE_TYPES,
    IdRange: ID_RANGE_TYPES,
    BadgeUri: BADGE_URI_TYPES
}

export function createMsgMintBadge(
    creator: string,
    collectionId: number,
    badgeSupplys: BadgeSupplyAndAmount[],
    transfers: Transfers[],
    claims: Claims[],
    collectionUri: string,
    badgeUris: BadgeUri[],
) {
    return {
        type: 'badges/MintBadge',
        value: {
            creator,
            collectionId,
            badgeSupplys,
            transfers,
            claims,
            collectionUri,
            badgeUris,
        },
    }
}
