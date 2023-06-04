import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'

export function createMsgTransferManager<T extends NumberType>(
  creator: string,
  collectionId: T,
  address: string,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferManager({
    creator,
    collectionId: collectionId.toString(),
    address,
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferManager',
  }
}
