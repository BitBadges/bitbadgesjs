import * as tx from '../../proto/wasmx/tx_pb'

export function createMsgExecuteContractCompat(
  sender: string,
  contract: string,
  msg: string,
  funds: string,
) {
  const message =
    new tx.MsgExecuteContractCompat({
      sender,
      contract,
      msg,
      funds,
    })
  return {
    message,
    path: message.getType().typeName
  }
}
