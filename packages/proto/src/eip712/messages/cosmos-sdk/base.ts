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
    return {
        account_number: accountNumber,
        chain_id: chainCosmosId,
        fee,
        memo,
        msgs,
        sequence,
    }
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

export function generateTypes(msgValues: object) {
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
            { name: 'msgs', type: 'Msg[]' },
            { name: 'sequence', type: 'string' },
        ],
        Fee: [
            { name: 'feePayer', type: 'string' },
            { name: 'amount', type: 'Coin[]' },
            { name: 'gas', type: 'string' },
        ],
        Coin: [
            { name: 'denom', type: 'string' },
            { name: 'amount', type: 'string' },
        ],
        Msg: [
            { name: 'type', type: 'string' },
            { name: 'value', type: 'MsgValue' },
        ],
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