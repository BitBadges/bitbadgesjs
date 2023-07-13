import { Balance, getWrappedBalances } from 'bitbadgesjs-proto'
import { BALANCE_TYPES, UINT_RANGE_TYPES } from './eip712HelperTypes'

const MsgSetApprovalValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'address', type: 'string' },
  { name: 'balances', type: 'Balance[]' },
]

export const MSG_SET_APPROVAL_TYPES = {
  UintRange: UINT_RANGE_TYPES,
  Balance: BALANCE_TYPES,
  MsgValue: MsgSetApprovalValueType,
}

export function createMsgSetApproval(
  creator: string,
  address: string,
  collectionId: bigint,
  balances: Balance[],
) {
  return {
    type: 'badges/SetApproval',
    value: {
      creator,
      address,
      collectionId: collectionId.toString(),
      balances: getWrappedBalances(balances).map((s) => s.toObject()),
    },
  }
}
