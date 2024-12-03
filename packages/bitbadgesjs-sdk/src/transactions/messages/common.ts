import type { SupportedChain } from '@/common/types.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';

/**
 * EI712ToSign represents a signable EIP-712 payload that can be signed using MetaMask or Keplr.
 *
 * @category Transactions
 */
export interface EIP712ToSign {
  types: object;
  primaryType: string;
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
    salt: string;
  };
  message: object;
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
  sequence: number;
  accountNumber: number;
  pubkey: string;
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
