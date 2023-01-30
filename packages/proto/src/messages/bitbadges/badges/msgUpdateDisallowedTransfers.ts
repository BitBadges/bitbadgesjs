import * as tx from '../../../proto/badges/tx'
import { getWrappedTransferMappings, TransferMapping } from './typeUtils'

export function createMsgUpdateDisallowedTransfers(
  creator: string,
  collectionId: number,
  disallowedTransfers: TransferMapping[],
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgUpdateDisallowedTransfers({
      creator,
      collectionId,
      disallowedTransfers: getWrappedTransferMappings(disallowedTransfers),
    })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateDisallowedTransfers',
  }
}
