import * as badges from '../../../proto/badges/tx'

export function createMsgRegisterAddresses(
  creator: string,
  addressesToRegister: string[],
) {
  const message =
    new badges.trevormil.bitbadgeschain.badges.MsgRegisterAddresses({
      creator,
      addressesToRegister,
    })

  return {
    message,
    path: 'trevormil.bitbadgeschain.badges.MsgRegisterAddresses',
  }
}
