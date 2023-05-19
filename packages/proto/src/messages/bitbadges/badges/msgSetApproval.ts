import * as tx from '../../../proto/badges/tx'
import { Balance, getWrappedBalances } from './typeUtils'

export function createMsgSetApproval(
  creator: string,
  collectionId: bigint,
  address: string,
  balances: Balance[],
) {
  const message = new tx.bitbadges.bitbadgeschain.badges.MsgSetApproval({
    creator,
    address,
    collectionId: collectionId.toString(),
    balances: getWrappedBalances(balances),
  })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgSetApproval',
  }
}
