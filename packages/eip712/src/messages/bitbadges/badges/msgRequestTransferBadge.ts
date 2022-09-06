import { IdRange, ID_RANGE_TYPE } from './utils'

const MsgRequestTransferBadgeValueType = [
  { name: 'creator', type: 'string' },
  { name: 'from', type: 'uint64' },
  { name: 'amount', type: 'uint64' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'subbadgeRanges', type: 'IdRange[]' },
  { name: 'expiration_time', type: 'uint64' },
  { name: 'cantCancelBeforeTime', type: 'uint64' },
]

export const MSG_REQUEST_TRANSFER_BADGE_TYPES = {
  IdRange: ID_RANGE_TYPE,
  MsgValue: MsgRequestTransferBadgeValueType,
}

export function createMsgRequestTransferBadge(
  creator: string,
  from: number,
  amount: number,
  badgeId: number,
  subbadgeRanges: IdRange[],
  expirationTime: number,
  cantCancelBeforeTime: number,
) {
  return {
    type: 'badges/RequestTransferBadge',
    value: {
      creator,
      from,
      amount,
      badgeId,
      subbadgeRanges,
      expiration_time: expirationTime,
      cantCancelBeforeTime,
    },
  }
}
