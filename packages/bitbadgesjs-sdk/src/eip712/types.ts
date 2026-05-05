/**
 * EIP-712 type definitions, mirrored from
 * `github.com/ethereum/go-ethereum/signer/core/apitypes`.
 *
 * Field schema matches the canonical Cosmos EVM Go reference at
 * `cosmos/evm/ethereum/eip712/`. Anything that diverges here will fail
 * chain-side verification, so changes must be benchmarked against the
 * Go reference.
 */
export interface EIP712Domain {
  name: string;
  version: string;
  chainId: bigint;
  verifyingContract: string;
  salt: string;
}

export interface EIP712TypeField {
  name: string;
  type: string;
}

export type EIP712Types = Record<string, EIP712TypeField[]>;

export interface EIP712TypedData {
  types: EIP712Types;
  primaryType: string;
  domain: EIP712Domain;
  message: Record<string, unknown>;
}
