import * as ranges from '../../../proto/badges/ranges'

export interface IdRange {
  start: number
  end?: number
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

export interface UriObjectWithIdRanges {
  decodeScheme?: number
  scheme?: number
  uri: string
  idxRangeToRemove?: ranges.bitbadges.bitbadgeschain.badges.IdRange
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
