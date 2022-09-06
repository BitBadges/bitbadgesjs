const NewSubBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
  { name: 'supplys', type: 'uint64[]' },
  { name: 'amountsToCreate', type: 'uint64[]' },
]

export const MSG_NEW_SUB_BADGE_TYPES = {
  MsgValue: NewSubBadgeMsgValueType,
}

export function createMsgNewSubBadge(
  creator: string,
  badgeId: number,
  supplys: number[],
  amountsToCreate: number[],
) {
  return {
    type: 'badges/NewSubBadge',
    value: {
      creator,
      badgeId,
      supplys,
      amountsToCreate,
    },
  }
}
