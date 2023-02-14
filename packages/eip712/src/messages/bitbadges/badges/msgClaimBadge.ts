import {
  CLAIM_PROOF_TYPES,
  ClaimProof,
  CLAIM_PROOF_ITEM_TYPES,
} from './typeUtils'

const ClaimBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'claimId', type: 'uint64' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'proof', type: 'ClaimProof' },
]

export const MSG_CLAIM_BADGE_TYPES = {
  MsgValue: ClaimBadgeMsgValueType,
  ClaimProof: CLAIM_PROOF_TYPES,
  ClaimProofItem: CLAIM_PROOF_ITEM_TYPES,
}

export function createMsgClaimBadge(
  creator: string,
  claimId: number,
  collectionId: number,
  proof: ClaimProof,
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
