import * as tx from '../../../proto/wasmx/tx'

export function createMsgExecuteContractCompat(
  sender: string,
  contract: string,
  msg: string,
  funds: string,
) {
  const message =
    new tx.bitbadges.bitbadgeschain.wasmx.MsgExecuteContractCompat({
      sender,
      contract,
      msg,
      funds,
    })
  return {
    message,
    path: 'bitbadges.bitbadgeschain.wasmx.MsgExecuteContractCompat',
  }
}
