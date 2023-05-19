import {
  CLAIM_PROOF_TYPES,
  CLAIM_PROOF_ITEM_TYPES,
  CHALLENGE_SOLUTION_TYPES,
} from './eip712HelperTypes'
import { ChallengeSolution, getWrappedSolutions } from 'bitbadgesjs-proto';

const ClaimBadgeMsgValueType = [
  { name: 'creator', type: 'string' },
  { name: 'claimId', type: 'string' },
  { name: 'collectionId', type: 'string' },
  { name: 'solutions', type: 'ChallengeSolution[]' },
]

export const MSG_CLAIM_BADGE_TYPES = {
  MsgValue: ClaimBadgeMsgValueType,
  ClaimProof: CLAIM_PROOF_TYPES,
  ClaimProofItem: CLAIM_PROOF_ITEM_TYPES,
  ChallengeSolution: CHALLENGE_SOLUTION_TYPES
}

export function createMsgClaimBadge(
  creator: string,
  claimId: bigint,
  collectionId: bigint,
  solutions: ChallengeSolution[],
) {
  return {
    type: 'badges/ClaimBadge',
    value: {
      creator,
      collectionId: collectionId.toString(),
      claimId: claimId.toString(),
      solutions: getWrappedSolutions(solutions).map((s) => s.toObject()),
    },
  }
}
