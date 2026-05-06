/**
 * Build a broadcast-ready TxRaw from an EIP-712 signature.
 *
 * Wire format is intentionally identical to a regular legacyAmino-mode
 * Cosmos tx — the chain's `cosmos/evm` ante handler detects the
 * EIP-712 case via the dual-path verifier inside
 * `ethsecp256k1.PubKey.VerifySignature`, so no `ExtensionOptionsWeb3Tx`
 * or other envelope is needed. The only differences from a standard
 * Cosmos broadcast are:
 *
 *   1. `SignerInfo.publicKey` is wrapped as
 *      `cosmos.evm.crypto.v1.ethsecp256k1.PubKey` rather than the
 *      standard `cosmos.crypto.secp256k1.PubKey` — this is what
 *      routes verification through the EIP-712-aware code path.
 *   2. The signature is the 64-byte `r || s` form (EVM wallets emit
 *      65 bytes; the `v` recovery byte is stripped).
 */

import { generatePostBodyBroadcast } from '@/node-rest-api/broadcast.js';
import { TxRaw } from '@/proto/cosmos/tx/v1beta1/tx_pb.js';
import { createAuthInfo, createBodyWithMultipleMessages, createFee, createSignerInfoEthsecp256k1, LEGACY_AMINO } from '@/transactions/messages/transaction.js';
import { stripRecoveryByte } from './recover.js';

export interface BuildEip712TxRawArgs {
  /** Proto messages (already wrapped via `createProtoMsg`) included in the tx. */
  messages: any[];
  /** 33-byte compressed pubkey of the EVM signer (recovered from the signature). */
  compressedPubKey: Uint8Array;
  /** Cosmos sequence at the time of signing. */
  sequence: number;
  /** Fee parameters that match what the user signed in the EIP-712 typed-data. */
  fee: { amount: string; denom: string; gas: number };
  memo?: string;
  /** 65-byte hex signature returned by `eth_signTypedData_v4` / `Signer.signTypedData`. */
  signatureHex: string;
}

export function buildEip712TxRaw(args: BuildEip712TxRawArgs): TxRaw {
  const body = createBodyWithMultipleMessages(args.messages, args.memo ?? '');
  const feeMessage = createFee(args.fee.amount, args.fee.denom, args.fee.gas);
  const signerInfo = createSignerInfoEthsecp256k1(args.compressedPubKey, args.sequence, LEGACY_AMINO);
  const authInfo = createAuthInfo(signerInfo, feeMessage);

  const signature = stripRecoveryByte(args.signatureHex);
  return new TxRaw({
    bodyBytes: body.toBinary() as Uint8Array<ArrayBuffer>,
    authInfoBytes: authInfo.toBinary() as Uint8Array<ArrayBuffer>,
    signatures: [signature as Uint8Array<ArrayBuffer>]
  });
}

/**
 * Convenience wrapper around `buildEip712TxRaw` that returns the
 * `application/json` POST body Cosmos LCD `/cosmos/tx/v1beta1/txs`
 * (and our own `/api/v0/broadcast` proxy) accepts.
 */
export function buildEip712TxBroadcastBody(args: BuildEip712TxRawArgs): string {
  const txRaw = buildEip712TxRaw(args);
  return generatePostBodyBroadcast({ message: txRaw, path: TxRaw.typeName });
}
