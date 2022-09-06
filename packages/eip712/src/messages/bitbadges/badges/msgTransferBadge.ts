import { IdRange, ID_RANGE_TYPE } from './utils'

const MsgTransferBadgeValueType = [
  { name: 'creator', type: 'string' },
  { name: 'from', type: 'uint64' },
  { name: 'toAddresses', type: 'uint64[]' },
  { name: 'amounts', type: 'uint64[]' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'subbadgeRanges', type: 'IdRange[]' },
  { name: 'expiration_time', type: 'uint64' },
  { name: 'cantCancelBeforeTime', type: 'uint64' },
]

export const MSG_TRANSFER_BADGE_TYPES = {
  IdRange: ID_RANGE_TYPE,
  MsgValue: MsgTransferBadgeValueType,
}

export function createMsgTransferBadge(
  creator: string,
  from: number,
  toAddresses: number[],
  amounts: number[],
  badgeId: number,
  subbadgeRanges: IdRange[],
  expirationTime: number,
  cantCancelBeforeTime: number,
) {
  return {
    type: 'badges/TransferBadge',
    value: {
      creator,
      from,
      toAddresses,
      amounts,
      badgeId,
      subbadgeRanges,
      expiration_time: expirationTime,
      cantCancelBeforeTime,
    },
  }
}
