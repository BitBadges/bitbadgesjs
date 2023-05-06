import {
  BALANCE_TYPES,
  ID_RANGE_TYPES,
  TRANSFERS_TYPES,
} from './eip712HelperTypes'
import {  Transfers } from 'bitbadgesjs-proto'

const MsgTransferBadgeValueType = [
  { name: 'creator', type: 'string' },
  { name: 'from', type: 'uint64' },
  { name: 'transfers', type: 'Transfers[]' },
  { name: 'collectionId', type: 'uint64' },
]

export const MSG_TRANSFER_BADGE_TYPES = {
  IdRange: ID_RANGE_TYPES,
  MsgValue: MsgTransferBadgeValueType,
  Balance: BALANCE_TYPES,
  Transfers: TRANSFERS_TYPES,
}

export function createMsgTransferBadge(
  creator: string,
  from: number,
  collectionId: number,
  transfers: Transfers[],
) {
  return {
    type: 'badges/TransferBadge',
    value: {
      creator,
      from,
      transfers,
      collectionId,
    },
  }
}
