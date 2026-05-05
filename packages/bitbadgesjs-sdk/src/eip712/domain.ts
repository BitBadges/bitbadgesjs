import type { EIP712Domain } from './types.js';

export const COSMOS_EVM_EIP712_DOMAIN_NAME = 'Cosmos Web3';
export const COSMOS_EVM_EIP712_DOMAIN_VERSION = '1.0.0';
export const COSMOS_EVM_EIP712_VERIFYING_CONTRACT = 'cosmos';
export const COSMOS_EVM_EIP712_SALT = '0';

/**
 * Builds the EIP-712 domain for a Cosmos EVM chain.
 *
 * Mirrors `cosmos/evm/ethereum/eip712/domain.go::createEIP712Domain`.
 * The chain's ante handler reconstructs this exact domain when verifying
 * an EIP-712-signed Cosmos tx, so any deviation here will fail verification.
 */
export function createEIP712Domain(eip155ChainId: number | bigint): EIP712Domain {
  return {
    name: COSMOS_EVM_EIP712_DOMAIN_NAME,
    version: COSMOS_EVM_EIP712_DOMAIN_VERSION,
    chainId: typeof eip155ChainId === 'bigint' ? eip155ChainId : BigInt(eip155ChainId),
    verifyingContract: COSMOS_EVM_EIP712_VERIFYING_CONTRACT,
    salt: COSMOS_EVM_EIP712_SALT
  };
}
