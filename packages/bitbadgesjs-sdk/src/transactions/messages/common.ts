import type { SupportedChain } from '@/common/types.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';

/**
 * A uint64 chain value (account number, sequence) as accepted by the SDK.
 *
 * Chain v34 (cosmos-sdk 0.54) assigns hash-derived account numbers larger
 * than 2^53 to every new account, and unordered-tx sequence nonces can be
 * nanosecond timestamps — neither fits a JS `number`. Pass strings or
 * bigints; `number` stays accepted for small pre-v34 values only.
 *
 * @category Transactions
 */
export type Uint64Like = number | string | bigint;

/**
 * Pubkey type declared in AuthInfo. Selects the sign-doc digest:
 * SHA-256 for `cosmos.crypto.secp256k1.PubKey`, keccak256 for
 * `cosmos.evm.crypto.v1.ethsecp256k1.PubKey`.
 *
 * @category Transactions
 */
export type SignerPubKeyType = 'secp256k1' | 'ethsecp256k1';

/**
 * Hash already applied to produce `signBytes`. External signers sign
 * those 32 bytes directly and must not hash again.
 *
 * @category Transactions
 */
export type SignHashAlgorithm = 'sha256' | 'keccak256';

/**
 * Convert a {@link Uint64Like} to a bigint, rejecting anything that cannot
 * represent a uint64 exactly. This is the single conversion point for
 * account numbers and sequences — a `number` above 2^53 has ALREADY lost
 * precision by the time it gets here, so it is rejected loudly instead of
 * silently signing for the wrong account.
 *
 * @category Transactions
 */
export function toUint64(value: Uint64Like, label = 'value'): bigint {
  let big: bigint;
  if (typeof value === 'bigint') {
    big = value;
  } else if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new Error(
        `${label} ${value} is not a safe integer. Post-v34 account numbers and unordered-tx nonces exceed 2^53 — ` +
          `pass the chain's string value (or a bigint) through unchanged; never convert it with Number().`
      );
    }
    big = BigInt(String(value));
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(`${label} "${value}" is not an unsigned integer string.`);
    }
    big = BigInt(trimmed);
  } else {
    throw new Error(`${label} has unsupported type ${typeof value}; expected number | string | bigint.`);
  }
  if (big < 0n || big > 0xffffffffffffffffn) {
    throw new Error(`${label} ${big} is outside the uint64 range.`);
  }
  return big;
}

/**
 * Fee represents a Cosmos SDK transaction fee object.
 *
 * @category Transactions
 */
export interface Fee {
  amount: string;
  denom: string;
  gas: string;
}

/**
 * Sender represents a Cosmos SDK Transaction signer.
 *
 * @remarks
 * A sender object is used to populate the Cosmos SDK's SignerInfo field,
 * which is used to declare transaction signers.
 *
 * @category Transactions
 */
export interface Sender {
  accountAddress: BitBadgesAddress;
  sequence: Uint64Like;
  accountNumber: Uint64Like;
  pubkey: string;
  /**
   * Key type written into AuthInfo. `secp256k1` (default) hashes the
   * sign doc with SHA-256; `ethsecp256k1` hashes it with keccak256.
   */
  pubKeyType?: SignerPubKeyType;
}

/**
 * Chain represents the base chain's chainID.
 *
 * @category Transactions
 */
export interface Chain {
  chainId: number;
  cosmosChainId: string;
  chain: SupportedChain;
}
