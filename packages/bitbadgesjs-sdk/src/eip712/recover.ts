/**
 * Public-key recovery from an EIP-712 signature.
 *
 * The Cosmos EVM ante handler dispatches on `ethsecp256k1.PubKey`
 * specifically — that's the only PubKey type whose `VerifySignature`
 * has the EIP-712 fallback. So when we broadcast an EIP-712-signed tx
 * we need an `ethsecp256k1.PubKey` in the SignerInfo, and to construct
 * one we need the signer's compressed public key. Most EVM wallets
 * don't expose `eth_getPublicKey`, so the cleanest way to obtain the
 * pubkey is to recover it from the very signature the user just
 * produced.
 */

import { computeAddress, getBytes, hexlify, SigningKey } from 'ethers';
import { hashTypedData } from './hash.js';
import type { EIP712TypedData } from './types.js';

export interface RecoveredKey {
  /** 33-byte compressed secp256k1 pubkey, hex-encoded with 0x prefix. */
  compressedPubKeyHex: string;
  /** 33-byte compressed secp256k1 pubkey as bytes. Suitable for the
   * `key` field of `cosmos.evm.crypto.v1.ethsecp256k1.PubKey`. */
  compressedPubKeyBytes: Uint8Array;
  /** 0x... checksummed Ethereum address derived from the pubkey. */
  ethAddress: string;
}

/**
 * Given an EIP-712 typed-data payload and the 65-byte signature
 * produced by signing it, recover the signer's compressed pubkey and
 * matching Ethereum address.
 */
export function recoverEvmPublicKey(typed: EIP712TypedData, signature: string): RecoveredKey {
  const digest = hashTypedData(typed);
  const uncompressedHex = SigningKey.recoverPublicKey(digest, signature);
  const compressedHex = SigningKey.computePublicKey(uncompressedHex, /* compressed = */ true);
  const compressedBytes = getBytes(compressedHex);
  return {
    compressedPubKeyHex: compressedHex,
    compressedPubKeyBytes: compressedBytes,
    ethAddress: computeAddress(uncompressedHex)
  };
}

/**
 * Strip the trailing recovery byte (`v`) from a 65-byte EIP-712
 * signature, leaving the 64-byte `r || s` form that the chain's
 * `ethsecp256k1.VerifySignature` (and underlying geth
 * `crypto.VerifySignature`) expects. Wallet outputs always include
 * `v`; the chain's verifier always discards it.
 */
export function stripRecoveryByte(signatureHex: string): Uint8Array {
  const bytes = getBytes(signatureHex);
  if (bytes.length !== 65) {
    throw new Error(`stripRecoveryByte: expected 65-byte signature, got ${bytes.length}`);
  }
  return bytes.slice(0, 64);
}

export { hexlify as toHex };
