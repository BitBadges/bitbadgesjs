export interface IdRange {
  start: number
  end?: number
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
  accountNums: IdRange[]
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
  amountPerClaim: number
  badgeIds: IdRange[]
  incrementIdsBy: number
  type: number
  data: string
  uri: string
  timeRange: IdRange
}

interface ProofItem {
  aunt: string
  onRight: boolean
}

export interface Proof {
  aunts: ProofItem[]
  leaf: string
}

export const TRANSFER_MAPPING_TYPES = [
  { name: 'from', type: 'Addresses' },
  { name: 'to', type: 'Addresses' },
]

export const ADDRESSES_TYPES = [
  { name: 'accountNums', type: 'IdRange[]' },
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
  { name: 'badgeIds', type: 'IdRange[]' },
  { name: 'incrementIdsBy', type: 'uint64' },
  { name: 'amountPerClaim', type: 'uint64' },
  { name: 'type', type: 'uint64' },
  { name: 'data', type: 'string' },
  { name: 'uri', type: 'string' },
  { name: 'timeRange', type: 'IdRange' },
]

export const PROOF_TYPES = [
  { name: 'aunts', type: 'ProofItem[]' },
  { name: 'leaf', type: 'string' },
]

export const PROOF_ITEM_TYPES = [
  { name: 'aunt', type: 'string' },
  { name: 'onRight', type: 'bool' },
]
