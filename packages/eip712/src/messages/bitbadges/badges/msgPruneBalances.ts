const PruneBalancesMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'badgeIds', type: 'uint64[]' },
  { name: 'addresses', type: 'uint64[]' },
]

export const MSG_PRUNE_BALANCES_TYPES = {
  // Amount: AmountType,
  // Fee: FeeType,
  MsgValue: PruneBalancesMsgValueType,
  // StandardTxn: StandardRegisterAddressTxn,
}

export function createMsgPruneBalances(
  creator: string,
  badgeIds: number[],
  addresses: number[],
) {
  return {
    type: 'badges/PruneBalances',
    value: {
      creator,
      badgeIds,
      addresses,
    },
  }
}
