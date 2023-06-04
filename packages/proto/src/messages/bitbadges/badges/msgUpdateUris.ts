import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { BadgeUriWithType, convertToProtoBadgeUris } from './typeUtils'

export function createMsgUpdateUris<T extends NumberType>(
  creator: string,
  collectionId: T,
  collectionUri: string,
  badgeUris: BadgeUriWithType<T>[],
  balancesUri: string
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateUris({
    creator,
    collectionId: collectionId.toString(),
    collectionUri,
    badgeUris: convertToProtoBadgeUris(badgeUris),
    balancesUri,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateUris',
  }
}
