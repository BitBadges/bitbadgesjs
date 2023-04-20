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
