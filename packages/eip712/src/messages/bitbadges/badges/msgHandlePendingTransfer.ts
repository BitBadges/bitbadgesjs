import { IdRange, ID_RANGE_TYPE } from './typeUtils'

const MsgHandlePendingTransferValueType = [
  { name: 'creator', type: 'string' },
  { name: 'accept', type: 'bool' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'nonceRanges', type: 'IdRange[]' },
  { name: 'forcefulAccept', type: 'bool' },
]

export const MSG_HANDLE_PENDING_TRANSFER_TYPES = {
  IdRange: ID_RANGE_TYPE,
  MsgValue: MsgHandlePendingTransferValueType,
}

export function createMsgHandlePendingTransfer(
  creator: string,
  accept: boolean,
  badgeId: number,
  nonceRanges: IdRange[],
  forcefulAccept: boolean,
) {
  return {
    type: 'badges/HandlePendingTransfer',
    value: {
      creator,
      accept,
      badgeId,
      nonceRanges,
      forcefulAccept,
    },
  }
}
