import * as tx from '../../../proto/badges/tx'
import { Balance, getWrappedBalances } from './typeUtils'

export function createMsgSetApproval(
  creator: string,
  collectionId: number,
  address: number,
  balances: Balance[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgSetApproval({
    creator,
    address,
    collectionId,
    balances: getWrappedBalances(balances),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgSetApproval',
  }
}
