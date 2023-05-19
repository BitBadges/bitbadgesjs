import * as tx from '../../../proto/badges/tx'

import { Transfer, getWrappedTransfers } from './typeUtils'

export function createMsgTransferBadge(
  creator: string,
  from: string,
  collectionId: bigint,
  transfers: Transfer[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgTransferBadge({
    creator,
    collectionId: collectionId.toString(),
    from,
    transfers: getWrappedTransfers(transfers),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgTransferBadge',
  }
}
