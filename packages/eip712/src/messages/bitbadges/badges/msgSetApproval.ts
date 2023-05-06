import { Balance } from 'bitbadgesjs-proto'
import { BALANCE_TYPES, ID_RANGE_TYPES } from './eip712HelperTypes'

const MsgSetApprovalValueType = [
  { name: 'creator', type: 'string' },
  { name: 'address', type: 'uint64' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'balances', type: 'Balance[]' },
]

export const MSG_SET_APPROVAL_TYPES = {
  IdRange: ID_RANGE_TYPES,
  Balance: BALANCE_TYPES,
  MsgValue: MsgSetApprovalValueType,
}

export function createMsgSetApproval(
  creator: string,
  address: number,
  collectionId: number,
  balances: Balance[],
) {
  return {
    type: 'badges/SetApproval',
    value: {
      creator,
      address,
      collectionId,
      balances,
    },
  }
}
