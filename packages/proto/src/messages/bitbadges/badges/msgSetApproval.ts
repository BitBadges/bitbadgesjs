import * as tx from '../../../proto/badges/tx'
import { NumberType } from './string-numbers'
import { BalanceWithType, convertToProtoBalances } from './typeUtils'

export function createMsgSetApproval<T extends NumberType>(
  creator: string,
  collectionId: T,
  address: string,
  balances: BalanceWithType<T>[]
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgSetApproval({
    creator,
    address,
    collectionId: collectionId.toString(),
    balances: convertToProtoBalances(balances),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgSetApproval',
  }
}
