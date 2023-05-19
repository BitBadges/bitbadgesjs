import * as badges from '../../../proto/badges/tx'
import { ChallengeSolution, getWrappedSolutions } from './typeUtils'

export function createMsgClaimBadge(
  creator: string,
  claimId: bigint,
  collectionId: bigint,
  solutions: ChallengeSolution[],
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgClaimBadge({
    creator,
    collectionId: collectionId.toString(),
    claimId: claimId.toString(),
    solutions: getWrappedSolutions(solutions),
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgClaimBadge',
  }
}
