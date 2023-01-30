import { PROOF_TYPES, Proof, PROOF_ITEM_TYPES } from './typeUtils'

const ClaimBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'claimId', type: 'uint64' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'proof', type: 'Proof' },
]

export const MSG_CLAIM_BADGE_TYPES = {
  MsgValue: ClaimBadgeMsgValueType,
  Proof: PROOF_TYPES,
  ProofItem: PROOF_ITEM_TYPES,
}

export function createMsgClaimBadge(
  creator: string,
  claimId: number,
  collectionId: number,
  proof: Proof,
) {
  return {
    type: 'badges/ClaimBadge',
    value: {
      creator,
      collectionId,
      claimId,
      proof,
    },
  }
}
