import { NumberType } from "../../../"

export const MSG_SEND_TYPES = {
  "MsgSend": [
    { name: 'from_address', type: 'string' },
    { name: 'to_address', type: 'string' },
    { name: 'amount', type: 'TypeAmount[]' },
  ],
  TypeAmount: [
    { name: 'denom', type: 'string' },
    { name: 'amount', type: 'string' },
  ],
}

export function createEIP712MsgSend(
  amount: NumberType,
  denom: string,
  fromAddress: string,
  toAddress: string,
) {
  return {
    type: 'cosmos-sdk/MsgSend',
    value: {
      amount: [
        {
          amount: amount.toString(),
          denom,
        },
      ],
      from_address: fromAddress,
      to_address: toAddress,
    },
  }
}
