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

export const BADGE_URI_TYPES = [
    { name: 'uri', type: 'string' },
    { name: 'badgeIds', type: 'IdRange[]' },
]

export const TRANSFER_MAPPING_TYPES = [
    { name: 'from', type: 'Addresses' },
    { name: 'to', type: 'Addresses' },
]

export const ADDRESSES_TYPES = [
    { name: 'accountIds', type: 'IdRange[]' },
    { name: 'options', type: 'uint64' },
]

export const ID_RANGE_TYPES = [
    { name: 'start', type: 'uint64' },
    { name: 'end', type: 'uint64' },
]

export const BALANCE_TYPES = [
    { name: 'balance', type: 'uint64' },
    { name: 'badgeIds', type: 'IdRange[]' },
]

export const BADGE_SUPPLY_AND_AMOUNT_TYPES = [
    { name: 'supply', type: 'uint64' },
    { name: 'amount', type: 'uint64' },
]

export const TRANSFERS_TYPES = [
    { name: 'toAddresses', type: 'uint64[]' },
    { name: 'balances', type: 'Balance[]' },
]

export const CLAIMS_TYPES = [
    { name: 'balances', type: 'Balance[]' },
    { name: 'codeRoot', type: 'string' },
    { name: 'whitelistRoot', type: 'string' },
    { name: 'incrementIdsBy', type: 'uint64' },
    { name: 'amount', type: 'uint64' },
    { name: 'badgeIds', type: 'IdRange[]' },
    { name: 'restrictOptions', type: 'uint64' },
    { name: 'uri', type: 'string' },
    { name: 'timeRange', type: 'IdRange' },
    { name: 'expectedMerkleProofLength', type: 'uint64' },
]

export const CLAIM_PROOF_TYPES = [
    { name: 'aunts', type: 'ClaimProofItem[]' },
    { name: 'leaf', type: 'string' },
]

export const CLAIM_PROOF_ITEM_TYPES = [
    { name: 'aunt', type: 'string' },
    { name: 'onRight', type: 'bool' },
]
