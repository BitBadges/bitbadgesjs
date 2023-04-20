import * as tx from '../../../proto/badges/tx'
import * as ranges from '../../../proto/badges/ranges'
import * as claims from '../../../proto/badges/claims'
import * as balances from '../../../proto/badges/balances'
import * as badges from '../../../proto/badges/badges'



export interface IdRange {
    start: number
    end: number
}

export interface BadgeUri {
    uri: string
    badgeIds: IdRange[]
}

export interface BadgeSupplyAndAmount {
    amount: number
    supply: number
}

export interface Balance {
    balance: number
    badgeIds: IdRange[]
}

export interface Addresses {
    accountIds: IdRange[]
    options: number
}

export interface TransferMapping {
    to: Addresses
    from: Addresses
}

export interface Transfers {
    toAddresses: number[]
    balances: Balance[]
}

export interface Claims {
    balances: Balance[]
    codeRoot: string
    whitelistRoot: string
    incrementIdsBy: number
    amount: number
    badgeIds: IdRange[]
    restrictOptions: number
    uri: string
    timeRange: IdRange
    expectedMerkleProofLength: number
}

interface ClaimProofItem {
    aunt: string
    onRight: boolean
}

export interface ClaimProof {
    aunts: ClaimProofItem[]
    leaf: string
}

export function getWrappedBadgeIds(badgeIds: IdRange[]) {
    const wrappedBadgeIds: ranges.bitbadges.bitbadgeschain.badges.IdRange[] = []
    for (const range of badgeIds) {
        wrappedBadgeIds.push(
            new ranges.bitbadges.bitbadgeschain.badges.IdRange(range),
        )
    }

    return wrappedBadgeIds
}

export function getWrappedBadgeUris(badgeUris: BadgeUri[]) {
    const wrappedBadgeUris: badges.bitbadges.bitbadgeschain.badges.BadgeUri[] = [];
    for (const badgeUri of badgeUris) {
        wrappedBadgeUris.push(
            new badges.bitbadges.bitbadgeschain.badges.BadgeUri({
                uri: badgeUri.uri,
                badgeIds: getWrappedBadgeIds(badgeUri.badgeIds),
            }),
        )
    }

    return wrappedBadgeUris
}


export function getWrappedBalances(balanceArr: Balance[]) {
    const formattedBalances: balances.bitbadges.bitbadgeschain.badges.Balance[] =
        []

    for (const balance of balanceArr) {
        const wrappedBadgeIds = getWrappedBadgeIds(balance.badgeIds)

        formattedBalances.push(
            new balances.bitbadges.bitbadgeschain.badges.Balance({
                badgeIds: wrappedBadgeIds,
                balance: balance.balance,
            }),
        )
    }
    return formattedBalances
}

export function getWrappedProof(proof: ClaimProof) {
    const wrappedAunts: tx.bitbadges.bitbadgeschain.badges.ClaimProofItem[] = []
    for (const aunt of proof.aunts) {
        wrappedAunts.push(
            new tx.bitbadges.bitbadgeschain.badges.ClaimProofItem({
                aunt: aunt.aunt,
                onRight: aunt.onRight,
            }),
        )
    }

    const wrappedProof: tx.bitbadges.bitbadgeschain.badges.ClaimProof =
        new tx.bitbadges.bitbadgeschain.badges.ClaimProof({
            aunts: wrappedAunts,
            leaf: proof.leaf,
        })
    return wrappedProof
}

export function getWrappedTransfers(transfers: Transfers[]) {
    const wrappedTransfers: tx.bitbadges.bitbadgeschain.badges.Transfers[] = []
    for (const transfer of transfers) {
        const formattedBalances = getWrappedBalances(transfer.balances)

        wrappedTransfers.push(
            new tx.bitbadges.bitbadgeschain.badges.Transfers({
                toAddresses: transfer.toAddresses,
                balances: formattedBalances,
            }),
        )
    }
    return wrappedTransfers
}

export function getWrappedClaims(claimsArr: Claims[]) {
    const formattedClaims: claims.bitbadges.bitbadgeschain.badges.Claim[] = []
    for (const claim of claimsArr) {
        formattedClaims.push(
            new claims.bitbadges.bitbadgeschain.badges.Claim({
                balances: getWrappedBalances(claim.balances),
                codeRoot: claim.codeRoot,
                whitelistRoot: claim.whitelistRoot,
                incrementIdsBy: claim.incrementIdsBy,
                amount: claim.amount,
                badgeIds: getWrappedBadgeIds(claim.badgeIds),
                restrictOptions: claim.restrictOptions,
                uri: claim.uri,
                timeRange: new ranges.bitbadges.bitbadgeschain.badges.IdRange({
                    start: claim.timeRange.start,
                    end: claim.timeRange.end,
                }),
                expectedMerkleProofLength: claim.expectedMerkleProofLength,
            }),
        )
    }
    return formattedClaims
}

export function getWrappedBadgeSupplysAndAmounts(
    badgeSupplys: BadgeSupplyAndAmount[],
) {
    const wrappedSupplys: tx.bitbadges.bitbadgeschain.badges.BadgeSupplyAndAmount[] =
        []
    for (const supplyObj of badgeSupplys) {
        wrappedSupplys.push(
            new tx.bitbadges.bitbadgeschain.badges.BadgeSupplyAndAmount(supplyObj),
        )
    }
    return wrappedSupplys
}

export function getWrappedTransferMappings(
    transferMappingsArr: TransferMapping[],
) {
    const wrappedTransferMappings: ranges.bitbadges.bitbadgeschain.badges.TransferMapping[] =
        []
    for (const transferMapping of transferMappingsArr) {
        wrappedTransferMappings.push(
            new ranges.bitbadges.bitbadgeschain.badges.TransferMapping({
                to: new ranges.bitbadges.bitbadgeschain.badges.Addresses({
                    accountIds: getWrappedBadgeIds(transferMapping.to.accountIds),
                    options: transferMapping.to.options,
                }),
                from: new ranges.bitbadges.bitbadgeschain.badges.Addresses({
                    accountIds: getWrappedBadgeIds(transferMapping.from.accountIds),
                    options: transferMapping.from.options,
                }),
            }),
        )
    }
    return wrappedTransferMappings
}
