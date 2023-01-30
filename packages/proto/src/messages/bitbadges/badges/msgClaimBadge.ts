import * as badges from '../../../proto/badges/tx'
import { getWrappedProof, Proof } from './typeUtils'

export function createMsgClaimBadge(
  creator: string,
  claimId: number,
  collectionId: number,
  proof: Proof,
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgClaimBadge({
    creator,
    collectionId,
    claimId,
    proof: getWrappedProof(proof),
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgClaimBadge',
  }
}
