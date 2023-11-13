import * as badges from '../../proto/badges/tx_pb'
import { NumberType } from './string-numbers'

export function createMsgDeleteCollection<T extends NumberType>(
  creator: string,
  collectionId: T,
) {
  const message = new badges.MsgDeleteCollection({
    creator,
    collectionId: collectionId.toString(),
  })

  return {
    message,
    path: message.getType().typeName  
  }
}
