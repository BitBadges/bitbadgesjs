import { type Message, type MessageType } from '@bufbuild/protobuf';
import { SigningKey, computeAddress, hexlify } from 'ethers';
import { convertToBitBadgesAddress } from '../address-converter/converter.js';
import { AuthInfo, TxBody, TxRaw } from '../proto/cosmos/tx/v1beta1/tx_pb.js';
import { PubKey } from '../proto/cosmos/evm/crypto/v1/ethsecp256k1/keys_pb.js';
import { ProtoTypeRegistry } from '../transactions/amino/objectConverter.js';
import { toUint64 } from '../transactions/messages/common.js';
import { buildEIP712TypedData } from './build.js';
import { hashTypedData } from './hash.js';

function decodeCanonical<T extends Message<T>>(type: MessageType<T>, bytes: Uint8Array): T {
  const value = type.fromBinary(bytes, { readUnknownFields: false });
  if (hexlify(value.toBinary()) !== hexlify(bytes)) throw new Error('Unsupported non-canonical transaction encoding');
  return value;
}

export async function verifyEip712Tx(
  bytes: Uint8Array,
  options: {
    cosmosChainId: string;
    eip155ChainId: number;
    getAccountNumber: (signer: string) => Promise<bigint>;
  }
): Promise<{ signer: string; memo: string }> {
  if (bytes.length === 0 || bytes.length > 1024 * 1024) throw new Error('Invalid transaction size');
  const tx = decodeCanonical(TxRaw, bytes);
  const body = decodeCanonical(TxBody, tx.bodyBytes);
  const auth = decodeCanonical(AuthInfo, tx.authInfoBytes);
  const info = auth.signerInfos[0];
  const fee = auth.fee;
  if (
    tx.signatures.length !== 1 ||
    tx.signatures[0].length !== 64 ||
    auth.signerInfos.length !== 1 ||
    info.publicKey?.typeUrl !== '/cosmos.evm.crypto.v1.ethsecp256k1.PubKey' ||
    info.modeInfo?.sum.case !== 'single' ||
    info.modeInfo.sum.value.mode !== 127 ||
    !fee ||
    fee.amount.length !== 1 ||
    fee.payer ||
    fee.granter ||
    auth.tip ||
    body.messages.length === 0 ||
    body.extensionOptions.length ||
    body.nonCriticalExtensionOptions.length ||
    body.timeoutHeight !== 0n ||
    body.unordered ||
    body.timeoutTimestamp ||
    fee.gasLimit > BigInt(Number.MAX_SAFE_INTEGER)
  )
    throw new Error('Unsupported EIP-712 transaction');
  const pubkey = decodeCanonical(PubKey, info.publicKey.value).key;
  if (pubkey.length !== 33) throw new Error('Invalid public key');
  const signer = convertToBitBadgesAddress(computeAddress(hexlify(pubkey)));
  const accountNumber = toUint64(await options.getAccountNumber(signer), 'accountNumber');
  const messages = body.messages.map((any) => {
    if (!any.typeUrl.startsWith('/')) throw new Error('Invalid message type');
    const type = ProtoTypeRegistry.findMessage(any.typeUrl.slice(1));
    if (!type) throw new Error('Unsupported message type');
    return decodeCanonical(type, any.value);
  });
  const typed = buildEIP712TypedData({
    messages,
    cosmosChainId: options.cosmosChainId,
    eip155ChainId: options.eip155ChainId,
    accountNumber,
    sequence: info.sequence,
    memo: body.memo,
    fee: { amount: fee.amount[0].amount, denom: fee.amount[0].denom, gas: Number(fee.gasLimit) }
  });
  const digest = hashTypedData(typed);
  const signature = tx.signatures[0];
  for (const yParity of [0, 1] as const) {
    try {
      const recovered = SigningKey.recoverPublicKey(digest, { r: hexlify(signature.slice(0, 32)), s: hexlify(signature.slice(32)), yParity });
      if (SigningKey.computePublicKey(recovered, true) === hexlify(pubkey)) return { signer, memo: body.memo };
    } catch {
      /* The other recovery parity may still match. */
    }
  }
  throw new Error('Invalid EIP-712 signature');
}
