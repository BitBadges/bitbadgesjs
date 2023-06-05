import { NumberType, Transfer, convertToProtoTransfers } from 'bitbadgesjs-proto'
import {
  BALANCE_TYPES,
  ID_RANGE_TYPES,
  TRANSFERS_TYPES,
} from './eip712HelperTypes'

const MsgTransferBadgeValueType = [
  { name: 'creator', type: 'string' },
  { name: 'from', type: 'string' },
  { name: 'transfers', type: 'Transfer[]' },
  { name: 'collectionId', type: 'string' },
]

export const MSG_TRANSFER_BADGE_TYPES = {
  IdRange: ID_RANGE_TYPES,
  MsgValue: MsgTransferBadgeValueType,
  Balance: BALANCE_TYPES,
  Transfer: TRANSFERS_TYPES,
}

export function createMsgTransferBadge<T extends NumberType>(
  creator: string,
  from: string,
  collectionId: T,
  transfers: Transfer<T>[],
) {
  return {
    type: 'badges/TransferBadge',
    value: {
      creator,
      from,
      transfers: convertToProtoTransfers(transfers).map((s) => s.toObject()),
      collectionId: collectionId.toString(),
    },
  }
}
