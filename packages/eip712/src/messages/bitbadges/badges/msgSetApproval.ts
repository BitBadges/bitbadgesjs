import { IdRange, ID_RANGE_TYPE } from './typeUtils'

const MsgSetApprovalValueType = [
  { name: 'creator', type: 'string' },
  { name: 'amount', type: 'uint64' },
  { name: 'address', type: 'uint64' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'subbadgeRanges', type: 'IdRange[]' },
]

export const MSG_SET_APPROVAL_TYPES = {
  IdRange: ID_RANGE_TYPE,
  MsgValue: MsgSetApprovalValueType,
}

export function createMsgSetApproval(
  creator: string,
  amount: number,
  address: number,
  badgeId: number,
  subbadgeRanges: IdRange[],
) {
  return {
    type: 'badges/SetApproval',
    value: {
      creator,
      amount,
      address,
      badgeId,
      subbadgeRanges,
    },
  }
}
