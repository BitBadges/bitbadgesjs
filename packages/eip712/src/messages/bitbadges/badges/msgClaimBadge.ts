import {
  CLAIM_PROOF_TYPES,
  CLAIM_PROOF_ITEM_TYPES,
} from './eip712HelperTypes'
import { ClaimProof } from 'bitbadgesjs-proto';

const ClaimBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'claimId', type: 'uint64' },
  { name: 'collectionId', type: 'uint64' },
  { name: 'whitelistProof', type: 'ClaimProof' },
  { name: 'codeProof', type: 'ClaimProof' },
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
  whitelistProof: ClaimProof,
  codeProof: ClaimProof,
) {
  return {
    type: 'badges/ClaimBadge',
    value: {
      creator,
      collectionId,
      claimId,
      whitelistProof,
      codeProof,
    },
  }
}
