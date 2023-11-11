export function createEIP712(types: object, message: object, domain?: object) {
  return {
    types,
    primaryType: 'Tx',
    domain,
    message,
  }
}

export function generateMessageWithMultipleTransactions(
  accountNumber: string,
  sequence: string,
  chainCosmosId: string,
  memo: string,
  fee: object,
  msgs: object[],
) {
  const tx: any = {
    account_number: accountNumber,
    chain_id: chainCosmosId,
    fee,
    memo,
    sequence,

  }

  for (let i = 0; i < msgs.length; i++) {
    tx['msg' + i] = msgs[i]
  }

  return tx
}

export function generateMessage(
  accountNumber: string,
  sequence: string,
  chainCosmosId: string,
  memo: string,
  fee: object,
  msg: object,
) {
  return generateMessageWithMultipleTransactions(
    accountNumber,
    sequence,
    chainCosmosId,
    memo,
    fee,
    [msg],
  )
}

export function generateTypes(msgValues: object, msgTypes: string[]) {

  const msgTypeDefs = [];
  const msgValueTypes: any = {};
  for (let i = 0; i < msgTypes.length; i++) {
    msgTypeDefs.push({ name: 'msg' + i, type: "MsgValue" + i });
    msgValueTypes["MsgValue" + i] = [
      { name: 'type', type: 'string' },
      { name: 'value', type: msgTypes[i] },
    ]
  }

  const types = {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
      { name: 'salt', type: 'bytes32' },
    ],
    Tx: [
      { name: 'account_number', type: 'string' },
      { name: 'chain_id', type: 'string' },
      { name: 'fee', type: 'Fee' },
      { name: 'memo', type: 'string' },
      { name: 'sequence', type: 'string' },
      ...msgTypeDefs,
    ],
    Fee: [
      // { name: 'feePayer', type: 'string' }, //No longer needed with non-legacy EIP712
      { name: 'amount', type: 'Coin[]' },
      { name: 'gas', type: 'string' },
    ],
    Coin: [
      { name: 'denom', type: 'string' },
      { name: 'amount', type: 'string' },
    ],
    ...msgValueTypes,
  }
  Object.assign(types, msgValues)
  return types
}

export function generateFee(
  amount: string,
  denom: string,
  gas: string,
  feePayer: string,
) {
  return {
    amount: [
      {
        amount,
        denom,
      },
    ],
    gas,
    feePayer,
  }
}
