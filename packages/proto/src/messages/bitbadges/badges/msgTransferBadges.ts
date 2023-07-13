import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { Transfer } from './typeutils/typeUtils'

import { getWrappedTransfers } from './typeutils/wrappers'

export function createMsgTransferBadges<T extends NumberType>(
  creator: string,
  collectionId: T,
  transfers: Transfer<T>[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferBadges({
    creator,
    collectionId: collectionId.toString(),
    transfers: getWrappedTransfers(transfers),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferBadges',
  }
}
