import * as ranges from '../../../proto/badges/ranges'

export interface IdRange {
  start: number
  end?: number
}

export interface UriObject {
  decodeScheme?: number
  scheme?: number
  uri: Uint8Array
  idxRangeToRemove?: IdRange
  insertSubassetBytesIdx?: number
  bytesToInsert?: Uint8Array
  insertIdIdx?: number
}

export interface UriObjectWithIdRanges {
  decodeScheme?: number
  scheme?: number
  uri: Uint8Array
  idxRangeToRemove?: ranges.bitbadges.bitbadgeschain.badges.IdRange
  insertSubassetBytesIdx?: number
  bytesToInsert?: Uint8Array
  insertIdIdx?: number
}
