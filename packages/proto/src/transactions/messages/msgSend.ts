import {
  NumberType,
  createMsgSend as protoMsgSend
} from '../../'
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
  const msgSend = protoMsgSend(
    sender.accountAddress,
    params.destinationAddress,
    params.amount,
    params.denom,
  )
  return createTransactionPayload({ chain, sender, fee, memo, }, msgSend)
}
