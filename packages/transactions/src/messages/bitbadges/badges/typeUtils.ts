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
