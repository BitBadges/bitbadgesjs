import { AuthInfo, TxBody, TxRaw } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';

export function bytesToTxRaw(bytes: Uint8Array) {
  return TxRaw.fromBinary(bytes);
}

export function bytesToTxBody(bytes: Uint8Array) {
  return TxBody.fromBinary(bytes);
}

export function bytesToAuthInfo(bytes: Uint8Array) {
  return AuthInfo.fromBinary(bytes);
}

/**
 * This function is used to create the raw transaction to be sent to the blockchain.
 *
 * See documentation for more details:
 */
export function createTxRaw(bodyBytes: Uint8Array, authInfoBytes: Uint8Array, signatures: Uint8Array[]) {
  const message = new TxRaw({
    bodyBytes: bodyBytes as Uint8Array<ArrayBuffer>,
    authInfoBytes: authInfoBytes as Uint8Array<ArrayBuffer>,
    signatures
  });
  return {
    message,
    path: TxRaw.typeName
  };
}
