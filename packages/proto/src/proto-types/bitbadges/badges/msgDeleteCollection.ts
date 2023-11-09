import * as badges from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'

export function createMsgDeleteCollection<T extends NumberType>(
  creator: string,
  collectionId: T,
) {
  const message = new badges.badges.MsgDeleteCollection({
    creator,
    collectionId: collectionId.toString(),
  })
  return {
    message,
    path: 'badges.MsgDeleteCollection',
  }
}
