import type { SupportedChain } from '@/common/types.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';

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
