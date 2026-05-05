import { createEIP712Domain } from './domain.js';
import { flattenPayloadMessages, isPlainObject } from './message.js';
import { buildEIP712Types } from './types-builder.js';
import type { EIP712TypedData } from './types.js';

/**
 * Wraps an Amino StdSignDoc-shaped object into an EIP-712 TypedData object
 * that's accepted by `eth_signTypedData_v4` and ethers `Signer.signTypedData`.
 *
 * Mirrors `cosmos/evm/ethereum/eip712/eip712.go::WrapTxToTypedData`. The
 * resulting typed-data is what the BitBadges chain ante handler reconstructs
 * during EIP-712 signature verification — drift here breaks verification.
 *
 * @param signDoc Cosmos Amino StdSignDoc (object form, same shape as the
 *   output of `makeSignDoc` in `transactions/messages/signDoc.ts`).
 * @param eip155ChainId The numeric EIP-155 chain id. Note this is the EVM
 *   chain id (e.g. 50025 for BitBadges testnet), NOT the Cosmos chain-id
 *   string.
 */
export function wrapTxToTypedData(signDoc: Record<string, unknown>, eip155ChainId: number | bigint): EIP712TypedData {
  if (!isPlainObject(signDoc)) {
    throw new Error('eip712: signDoc must be a JSON object');
  }

  const { payload, numPayloadMsgs } = flattenPayloadMessages(signDoc);
  const types = buildEIP712Types(payload, numPayloadMsgs);
  const domain = createEIP712Domain(eip155ChainId);

  return {
    types,
    primaryType: 'Tx',
    domain,
    message: payload
  };
}
