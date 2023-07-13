import { Balance, NumberType, convertToProtoBalances } from 'bitbadgesjs-proto'
import { BALANCE_TYPES, ID_RANGE_TYPES } from './eip712HelperTypes'

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

export function createMsgSetApproval<T extends NumberType>(
  creator: string,
  address: string,
  collectionId: T,
  balances: Balance<T>[]
) {
  return {
    type: 'badges/SetApproval',
    value: {
      creator,
      address,
      collectionId: collectionId.toString(),
      balances: convertToProtoBalances(balances).map((s) => s.toObject()),
    },
  }
}
