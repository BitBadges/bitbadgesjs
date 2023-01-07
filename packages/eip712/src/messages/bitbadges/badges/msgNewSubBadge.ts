import {
  SubassetAmountAndSupply,
  SUBASSET_AMOUNT_AND_SUPPLY_TYPE,
} from './typeUtils'

const NewSubBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'subassetSupplysAndAmounts', type: 'SubassetAmountAndSupply[]' },
]

export const MSG_NEW_SUB_BADGE_TYPES = {
  MsgValue: NewSubBadgeMsgValueType,
  SubassetAmountAndSupply: SUBASSET_AMOUNT_AND_SUPPLY_TYPE,
}

export function createMsgNewSubBadge(
  creator: string,
  badgeId: number,
  subassetSupplysAndAmounts: SubassetAmountAndSupply[],
) {
  return {
    type: 'badges/NewSubBadge',
    value: {
      creator,
      badgeId,
      subassetSupplysAndAmounts,
    },
  }
}
