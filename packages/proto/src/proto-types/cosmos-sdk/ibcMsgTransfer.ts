import * as coin from '../../proto/cosmos/base/v1beta1/coin_pb'
import * as ibcMsg from '../../proto/ibc/applications/transfer/v1/tx_pb'
import * as ibcCore from '../../proto/ibc/core/client/v1/client_pb'

export function createIBCMsgTransfer(
  // Channel
  sourcePort: string,
  sourceChannel: string,
  // Token
  amount: string,
  denom: string,
  // Addresses
  sender: string,
  receiver: string,
  // Timeout
  revisionNumber: number,
  revisionHeight: number,
  timeoutTimestamp: string,
) {
  const token = new coin.Coin({
    denom,
    amount,
  })

  const timeoutHeight = new ibcCore.Height({
    revisionNumber: BigInt(revisionNumber),
    revisionHeight: BigInt(revisionHeight),
  })

  const ibcMessage = new ibcMsg.MsgTransfer({
    sourcePort: sourcePort,
    sourceChannel: sourceChannel,
    token,
    sender,
    receiver,
    timeoutHeight: timeoutHeight,
    timeoutTimestamp: BigInt(parseInt(timeoutTimestamp, 10)),
  })

  return {
    message: ibcMessage,
    path: 'ibc.applications.transfer.v1.MsgTransfer',
  }
}
