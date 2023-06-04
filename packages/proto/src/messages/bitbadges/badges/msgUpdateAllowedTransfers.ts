import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { convertToProtoTransferMappings, TransferMappingWithType } from './typeUtils'

export function createMsgUpdateAllowedTransfers<T extends NumberType>(
  creator: string,
  collectionId: T,
  allowedTransfers: TransferMappingWithType<T>[],
) {
  const message =
    new tx.bitbadges.bitbadgeschain.badges.MsgUpdateAllowedTransfers({
      creator,
      collectionId: collectionId.toString(),
      allowedTransfers: convertToProtoTransferMappings(allowedTransfers),
    })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdateAllowedTransfers',
  }
}
