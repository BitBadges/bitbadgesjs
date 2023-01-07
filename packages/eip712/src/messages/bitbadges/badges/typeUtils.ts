export interface IdRange {
  start: number
  end?: number
}

export interface SubassetAmountAndSupply {
  amount: number
  supply: number
}

export interface UriObject {
  decodeScheme?: number
  scheme?: number
  uri: string
  idxRangeToRemove?: IdRange
  insertSubassetBytesIdx?: number
  bytesToInsert?: string
  insertIdIdx?: number
}

export interface BalanceObject {
  balance: number
  idRanges: IdRange[]
}

export interface WhitelistMintInfo {
  addresses: number[]
  balanceAmounts: BalanceObject[]
}

export const BALANCE_OBJECT_TYPE = [
  { name: 'balance', type: 'uint64' },
  { name: 'idRanges', type: 'IdRange[]' },
]

export const WHITELIST_MINT_INFO_TYPE = [
  { name: 'addresses', type: 'uint64[]' },
  { name: 'balanceAmounts', type: 'BalanceObject[]' },
]

// IMPORTANT: Note that when including this, you must also include the IdRange type in your types.
export const URI_OBJECT_TYPE = [
  { name: 'decodeScheme', type: 'uint64' },
  { name: 'scheme', type: 'uint64' },
  { name: 'uri', type: 'string' },
  { name: 'idxRangeToRemove', type: 'IdRange' },
  { name: 'insertSubassetBytesIdx', type: 'uint64' },
  { name: 'bytesToInsert', type: 'string' },
  { name: 'insertIdIdx', type: 'uint64' },
]

export const ID_RANGE_TYPE = [
  { name: 'start', type: 'uint64' },
  { name: 'end', type: 'uint64' },
]

export const SUBASSET_AMOUNT_AND_SUPPLY_TYPE = [
  { name: 'supply', type: 'uint64' },
  { name: 'amount', type: 'uint64' },
]
