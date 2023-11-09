import * as tx from '../../../proto/wasmx/tx'

export function createMsgExecuteContractCompat(
  sender: string,
  contract: string,
  msg: string,
  funds: string,
) {
  const message =
    new tx.wasmx.MsgExecuteContractCompat({
      sender,
      contract,
      msg,
      funds,
    })
  return {
    message,
    path: 'wasmx.MsgExecuteContractCompat',
  }
}
