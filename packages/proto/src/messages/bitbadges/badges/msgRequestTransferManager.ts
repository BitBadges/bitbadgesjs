import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'

export function createMsgRequestTransferManager<T extends NumberType>(
  creator: string,
  collectionId: T,
  addRequest: boolean,
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgRequestTransferManager({
      creator,
      collectionId: collectionId.toString(),
      addRequest,
    })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRequestTransferManager',
  }
}
