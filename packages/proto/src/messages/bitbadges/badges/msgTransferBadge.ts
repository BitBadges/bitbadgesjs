import * as tx from '../../../proto/badges/tx'

import { Transfers, getWrappedTransfers } from './typeUtils'

export function createMsgTransferBadge(
  creator: string,
  from: number,
  collectionId: number,
  transfers: Transfers[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferBadge({
    creator,
    collectionId,
    from,
    transfers: getWrappedTransfers(transfers),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferBadge',
  }
}
