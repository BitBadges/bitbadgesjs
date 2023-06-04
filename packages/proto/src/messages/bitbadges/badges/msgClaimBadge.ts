import * as badges from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { ChallengeSolution, convertToProtoSolutions } from './typeUtils'

export function createMsgClaimBadge<T extends NumberType>(
  creator: string,
  claimId: T,
  collectionId: T,
  solutions: ChallengeSolution[]
) {
  const message = new badges.bitbadges.bitbadgeschain.badges.MsgClaimBadge({
    creator,
    collectionId: collectionId.toString(),
    claimId: claimId.toString(),
    solutions: convertToProtoSolutions(solutions),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgClaimBadge',
  }
}
