import {
  createTxRaw,
  createAnyMessage,
  MessageGenerated,
} from '../../'
import { AuthInfo, TxBody } from '../../proto/cosmos/tx/v1beta1/tx_pb'

export function createTxRawEIP712(
  body: TxBody,
  authInfo: AuthInfo,
  extension: MessageGenerated,
) {
  body.extensionOptions.push(createAnyMessage(extension))

  return createTxRaw(body.toBinary(), authInfo.toBinary(), [
    new Uint8Array(),
  ])
}
