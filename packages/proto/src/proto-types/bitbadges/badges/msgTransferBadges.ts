import * as tx from '../../../proto/badges/tx'
import { NumberType, Stringify } from './string-numbers'
import { Transfer, convertTransfer } from './typeutils/typeUtils'

import { getWrappedTransfers } from './typeutils/wrappers'

export function createMsgTransferBadges<T extends NumberType>(
  creator: string,
  collectionId: T,
  transfers: Transfer<T>[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferBadges({
    creator,
    collectionId: collectionId.toString(),
    transfers: getWrappedTransfers(transfers.map(x => convertTransfer(x, Stringify, true))),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferBadges',
  }
}
