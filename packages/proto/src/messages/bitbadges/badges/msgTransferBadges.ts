import * as tx from '../../../proto/badges/tx'
import { Transfer } from './typeutils/typeUtils'
import { getWrappedTransfers } from './typeutils/wrappers'


export function createMsgTransferBadges(
  creator: string,
  collectionId: bigint,
  transfers: Transfer[],
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
