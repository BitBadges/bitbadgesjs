import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'

export function createMsgUpdateBytes<T extends NumberType>(
  creator: string,
  collectionId: T,
  bytes: string,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdateBytes({
    creator,
    collectionId: collectionId.toString(),
    bytes,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateBytes',
  }
}
