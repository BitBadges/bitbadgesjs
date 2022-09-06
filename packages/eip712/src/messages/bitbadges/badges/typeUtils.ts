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

// IMPORTANT: Note that when including this, you must also include the IdRange type in your types.
export const URI_OBJECT_TYPE = [
  { name: 'decodeScheme', type: 'uint64' },
  { name: 'scheme', type: 'uint64' },
  { name: 'uri', type: 'bytes' },
  { name: 'idxRangeToRemove', type: 'IdRange' },
  { name: 'insertSubassetBytesIdx', type: 'uint64' },
  { name: 'bytesToInsert', type: 'bytes' },
  { name: 'insertIdIdx', type: 'uint64' },
]

export const ID_RANGE_TYPE = [
  { name: 'start', type: 'uint64' },
  { name: 'end', type: 'uint64' },
]
