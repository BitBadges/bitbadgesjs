import { IdRange, ID_RANGE_TYPE, UriObject, URI_OBJECT_TYPE } from './utils'

const NewBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'uri', type: 'UriObject' },
  { name: 'arbitraryBytes', type: 'bytes' },
  { name: 'permissions', type: 'uint64' },
  { name: 'defaultSubassetSupply', type: 'uint64' },
  { name: 'freezeAddressRanges', type: 'IdRange[]' },
  { name: 'standard', type: 'uint64' },
  { name: 'subassetSupplys', type: 'uint64[]' },
  { name: 'subassetAmountsToCreate', type: 'uint64[]' },
]

export const MSG_NEW_BADGE_TYPES = {
  UriObject: URI_OBJECT_TYPE,
  IdRange: ID_RANGE_TYPE,
  MsgValue: NewBadgeMsgValueType,
}

export function createMsgNewBadge(
  creator: string,
  uri: UriObject,
  arbitraryBytes: Uint8Array,
  permissions: number,
  defaultSubassetSupply: number,
  freezeAddressRanges: IdRange[],
  standard: number,
  subassetSupplys: number[],
  subassetAmountsToCreate: number[],
) {
  return {
    type: 'badges/NewBadge',
    value: {
      creator,
      uri,
      arbitraryBytes,
      permissions,
      defaultSubassetSupply,
      freezeAddressRanges,
      standard,
      subassetSupplys,
      subassetAmountsToCreate,
    },
  }
}
