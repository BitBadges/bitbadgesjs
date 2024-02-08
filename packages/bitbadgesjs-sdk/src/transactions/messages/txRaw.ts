import {
  createTxRaw,
  createAnyMessage,
  MessageGenerated,
} from '../..'
import { AuthInfo, TxBody } from '../../proto/cosmos/tx/v1beta1/tx_pb'

/**
 * This function is used to create the raw transaction to be sent to the blockchain for EIP712 transactions.
 */
export function createTxRawWithExtension(
  body: TxBody,
  authInfo: AuthInfo,
  extension: MessageGenerated,
) {
  body.extensionOptions.push(createAnyMessage(extension))

  return createTxRaw(body.toBinary(), authInfo.toBinary(), [
    new Uint8Array(),
  ])
}
