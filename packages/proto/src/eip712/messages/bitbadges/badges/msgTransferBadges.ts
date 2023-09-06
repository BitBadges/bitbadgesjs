import { NumberType, Stringify, Transfer, convertTransfer } from '../../../../'
import {
  BALANCE_TYPES,
  UINT_RANGE_TYPES,
} from './eip712HelperTypes'

const MsgTransferBadgesValueType = [
  { name: 'creator', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'transfers', type: 'Transfer[]' },
]

const TRANSFERS_TYPES = [
  { name: 'from', type: 'string' },
  { name: 'toAddresses', type: 'string[]' },
  { name: 'balances', type: 'Balance[]' },
  { name: 'precalculationDetails', type: 'PrecalculationDetails' },
  { name: 'merkleProofs', type: 'MerkleProof[]' },
  { name: 'memo', type: 'string' },
]



const MERKLE_PROOF_TYPES = [
  { name: 'aunts', type: 'MerklePathItem[]' },
  { name: 'leaf', type: 'string' },
]

const MERKLE_PATH_ITEM_TYPES = [
  { name: 'aunt', type: 'string' },
  { name: 'onRight', type: 'bool' },
]

const PRECALCULATION_DETAILS_TYPES = [
  { name: 'precalculationId', type: 'string' },
  { name: 'approvalLevel', type: 'string' },
  { name: 'approverAddress', type: 'string' },
]




export const MSG_TRANSFER_BADGES_TYPES = {
  MsgValue: MsgTransferBadgesValueType,
  UintRange: UINT_RANGE_TYPES,
  Balance: BALANCE_TYPES,
  Transfer: TRANSFERS_TYPES,
  MerkleProof: MERKLE_PROOF_TYPES,
  MerklePathItem: MERKLE_PATH_ITEM_TYPES,
  PrecalculationDetails: PRECALCULATION_DETAILS_TYPES,
}

export function createEIP712MsgTransferBadges<T extends NumberType>(
  creator: string,
  collectionId: T,
  transfers: Transfer<T>[],
) {
  return {
    type: 'badges/TransferBadges',
    value: {
      creator,
      collectionId: collectionId.toString(),
      transfers: transfers.map((x) => convertTransfer(x, Stringify)),
    },
  }
}
