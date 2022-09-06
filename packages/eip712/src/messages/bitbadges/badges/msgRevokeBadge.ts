import { IdRange, ID_RANGE_TYPE } from './typeUtils'

const MsgRevokeBadgeValueType = [
  { name: 'creator', type: 'string' },
  { name: 'addresses', type: 'uint64[]' },
  { name: 'amounts', type: 'uint64[]' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'subbadgeRanges', type: 'IdRange[]' },
]

export const MSG_REVOKE_BADGE_TYPES = {
  IdRange: ID_RANGE_TYPE,
  MsgValue: MsgRevokeBadgeValueType,
}

export function createMsgRevokeBadge(
  creator: string,
  addresses: number[],
  amounts: number[],
  badgeId: number,
  subbadgeRanges: IdRange[],
) {
  return {
    type: 'badges/RevokeBadge',
    value: {
      creator,
      addresses,
      amounts,
      badgeId,
      subbadgeRanges,
    },
  }
}
