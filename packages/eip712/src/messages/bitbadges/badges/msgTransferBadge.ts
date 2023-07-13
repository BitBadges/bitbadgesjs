import {
  BALANCE_TYPES,
  UINT_RANGE_TYPES,
  TRANSFERS_TYPES,
} from './eip712HelperTypes'
import { Transfer, getWrappedTransfers } from 'bitbadgesjs-proto'

const MsgTransferBadgeValueType = [
  { name: 'creator', type: 'string' },
  { name: 'from', type: 'string' },
  { name: 'transfers', type: 'Transfer[]' },
  { name: 'collectionId', type: 'string' },
]

export const MSG_TRANSFER_BADGE_TYPES = {
  UintRange: UINT_RANGE_TYPES,
  MsgValue: MsgTransferBadgeValueType,
  Balance: BALANCE_TYPES,
  Transfer: TRANSFERS_TYPES,
}

export function createMsgTransferBadge(
  creator: string,
  from: string,
  collectionId: bigint,
  transfers: Transfer[],
) {
  return {
    type: 'badges/TransferBadge',
    value: {
      creator,
      from,
      transfers: getWrappedTransfers(transfers).map((s) => s.toObject()),
      collectionId: collectionId.toString(),
    },
  }
}
