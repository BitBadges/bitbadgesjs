import { IdRange, ID_RANGE_TYPE } from './typeUtils'

const MsgFreezeAddressValueType = [
  { name: 'creator', type: 'string' },
  { name: 'addressRanges', type: 'IdRange[]' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'add', type: 'bool' },
]

export const MSG_FREEZE_ADDRESS_TYPES = {
  IdRange: ID_RANGE_TYPE,
  MsgValue: MsgFreezeAddressValueType,
}

export function createMsgFreezeAddress(
  creator: string,
  addressRanges: IdRange[],
  badgeId: number,
  add: boolean,
) {
  return {
    type: 'badges/FreezeAddress',
    value: {
      creator,
      addressRanges,
      badgeId,
      add,
    },
  }
}
