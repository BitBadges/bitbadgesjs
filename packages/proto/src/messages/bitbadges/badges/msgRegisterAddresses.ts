import * as badges from '../../../proto/badges/tx'

export function createMsgRegisterAddresses(
  creator: string,
  addressesToRegister: string[],
) {
  const message =
    new badges.bitbadges.bitbadgeschain.badges.MsgRegisterAddresses({
      creator,
      addressesToRegister,
    })

  return {
    message,
    path: 'bitbadges.bitbadgeschain.badges.MsgRegisterAddresses',
  }
}
