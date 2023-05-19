import * as tx from '../../../proto/badges/tx'
import { BadgeUri, getWrappedBadgeUris } from './typeUtils'

export function createMsgUpdateUris(
  creator: string,
  collectionId: bigint,
  collectionUri: string,
  badgeUris: BadgeUri[],
  balancesUri: string
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUris({
    creator,
    collectionId: collectionId.toString(),
    collectionUri,
    badgeUris: getWrappedBadgeUris(badgeUris),
    balancesUri,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUris',
  }
}
