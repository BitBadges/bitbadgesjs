import { NumberType } from '../badges/string-numbers'
import * as bank from '../../proto/cosmos/bank/v1beta1/tx_pb'
import * as coin from '../../proto/cosmos/base/v1beta1/coin_pb'

export function createMsgSend(
  fromAddress: string,
  toAddress: string,
  amount: NumberType,
  denom: string,
) {
  const value = new coin.Coin({
    denom,
    amount: amount.toString(),
  })

  const message = new bank.MsgSend({
    fromAddress: fromAddress,
    toAddress: toAddress,
    amount: [value],
  })

  return {
    message,
    path: 'cosmos.bank.v1beta1.MsgSend',
  }
}
