/**
 * SupportedChain is an enum of all the supported chains.
 *
 * Has an UNKNOWN value for when we don't know the chain yet.
 *
 * @category Address Utils
 */
export enum SupportedChain {
  COSMOS = 'Cosmos',
  UNKNOWN = 'Unknown' //If unknown address, we don't officially know the chain yet.
}

/**
 * @category Address Utils
 */
export type SupportedChainType = 'Cosmos' | 'Unknown';
