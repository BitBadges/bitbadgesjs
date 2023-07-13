const ExecuteContractCompatMsgValueType = [
  { name: 'sender', type: 'string' },
  { name: 'contract', type: 'string' },
  { name: 'msg', type: 'string' },
  { name: 'funds', type: 'string' },
]

export const MSG_EXECUTE_CONTRACT_COMPAT_TYPES = {
  MsgValue: ExecuteContractCompatMsgValueType,
}

export function createEIP712MsgExecuteContractCompat(
  sender: string,
  contract: string,
  msg: string,
  funds: string,
) {
  return {
    type: 'wasmx/MsgExecuteContractCompat',
    value: {
      sender,
      contract,
      msg,
      funds,
    },
  }
}
