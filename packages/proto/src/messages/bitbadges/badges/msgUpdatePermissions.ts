import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'

export function createMsgUpdatePermissions<T extends NumberType>(
  creator: string,
  collectionId: T,
  permissions: T,
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgUpdatePermissions({
    creator,
    collectionId: collectionId.toString(),
    permissions: permissions.toString(),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgUpdatePermissions',
  }
}
