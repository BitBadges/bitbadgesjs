import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'

import { TransferWithType, convertToProtoTransfers } from './typeUtils'

export function createMsgTransferBadge<T extends NumberType>(
  creator: string,
  from: string,
  collectionId: T,
  transfers: TransferWithType<T>[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferBadge({
    creator,
    collectionId: collectionId.toString(),
    from,
    transfers: convertToProtoTransfers(transfers),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferBadge',
  }
}
