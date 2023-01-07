import * as badges from '../../../proto/badges/tx'
import { SubassetSupplyAndAmount } from './typeUtils'

export function createMsgNewSubBadge(
  creator: string,
  badgeId: number,
  subassetSupplysAndAmounts: SubassetSupplyAndAmount[],
) {
  const wrappedSupplys: badges.bitbadges.bitbadgeschain.badges.SubassetSupplyAndAmount[] =
    []
  for (const supplyObj of subassetSupplysAndAmounts) {
    wrappedSupplys.push(
      new badges.bitbadges.bitbadgeschain.badges.SubassetSupplyAndAmount(
        supplyObj,
      ),
    )
  }

  const message = new badges.bitbadges.bitbadgeschain.badges.MsgNewSubBadge({
    creator,
    badgeId,
    subassetSupplysAndAmounts: wrappedSupplys,
  })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgNewSubBadge',
  }
}
