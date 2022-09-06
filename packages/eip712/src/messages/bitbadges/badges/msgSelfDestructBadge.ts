const MsgSelfDestructBadgeValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeId', type: 'uint64' },
]

export const MSG_SELF_DESTRUCT_BADGE_TYPES = {
  MsgValue: MsgSelfDestructBadgeValueType,
}

export function createMsgSelfDestructBadge(creator: string, badgeId: number) {
  return {
    type: 'badges/SelfDestructBadge',
    value: {
      creator,
      badgeId,
    },
  }
}
