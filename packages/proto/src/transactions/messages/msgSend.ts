import {
  NumberType
} from '../../'
import { MsgSend as ProtoMsgSend } from '../../proto/cosmos/bank/v1beta1/tx_pb'
import { createProtoMsg } from '../../proto-types/base'
import { createTransactionPayload } from './base'
import { Chain, Fee, Sender } from './common'

export interface MsgSend<T extends NumberType> {
  destinationAddress: string
  amount: T
  denom: string
}

export function createTxMsgSend<T extends NumberType>(
  chain: Chain,
  sender: Sender,
  fee: Fee,
  memo: string,
  params: MsgSend<T>,
) {
  // Cosmos
  const msgSend = createProtoMsg(new ProtoMsgSend({
    fromAddress: sender.accountAddress,
    toAddress: params.destinationAddress,
    amount: [{
      denom: params.denom,
      amount: params.amount.toString(),
    }],
  }))
  return createTransactionPayload({ chain, sender, fee, memo, }, msgSend)
}
