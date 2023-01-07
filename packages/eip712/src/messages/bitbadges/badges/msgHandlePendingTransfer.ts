import { IdRange, ID_RANGE_TYPE } from './typeUtils'

const MsgHandlePendingTransferValueType = [
  { name: 'creator', type: 'string' },
  { name: 'actions', type: 'uint64[]' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'nonceRanges', type: 'IdRange[]' },
]

export const MSG_HANDLE_PENDING_TRANSFER_TYPES = {
  IdRange: ID_RANGE_TYPE,
  MsgValue: MsgHandlePendingTransferValueType,
}

export function createMsgHandlePendingTransfer(
  creator: string,
  actions: number[],
  badgeId: number,
  nonceRanges: IdRange[],
) {
  return {
    type: 'badges/HandlePendingTransfer',
    value: {
      creator,
      actions,
      badgeId,
      nonceRanges,
    },
  }
}
