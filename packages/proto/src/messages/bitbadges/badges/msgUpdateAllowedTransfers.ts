import * as tx from '../../../proto/badges/tx'
import { getWrappedTransferMappings, TransferMapping } from './typeUtils'

export function createMsgUpdateAllowedTransfers(
  creator: string,
  collectionId: bigint,
  allowedTransfers: TransferMapping[],
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgUpdateAllowedTransfers({
      creator,
      collectionId: collectionId.toString(),
      allowedTransfers: getWrappedTransferMappings(allowedTransfers),
    })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateAllowedTransfers',
  }
}
