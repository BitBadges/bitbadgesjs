/**
 * BitBadges Signing Client
 *
 * This module provides a wallet-agnostic signing client for the BitBadges blockchain.
 * It supports both Cosmos wallets (Keplr, Leap, Cosmostation) and EVM wallets (MetaMask via ethers.js).
 *
 * @example
 * ```typescript
 * import { BitBadgesSigningClient, GenericCosmosAdapter, GenericEvmAdapter, MsgTransferTokens } from 'bitbadges';
 *
 * const adapter = await GenericCosmosAdapter.fromKeplr('bitbadges-1');
 * // For an EVM wallet, replace the adapter above with:
 * // const adapter = await GenericEvmAdapter.fromBrowserWallet({ expectedChainId: 50024 });
 * const client = new BitBadgesSigningClient({ adapter });
 * const msg = new MsgTransferTokens({
 *   creator: client.address,
 *   collectionId: '1',
 *   transfers: [{
 *     from: client.address,
 *     toAddresses: ['bb1py4mfpg6uf59qkyzg0nmau322c5873eeysp5ue'],
 *     balances: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: [{ start: '1', end: '18446744073709551615' }] }]
 *   }]
 * });
 * const result = await client.signAndBroadcast([msg]);
 * console.log(result.success ? result.txHash : result.error);
 * ```
 *
 * @module signing
 */

// Main client
export { BitBadgesSigningClient } from './BitBadgesSigningClient.js';

// Types
// Note: TransactionPayload and Fee are already exported from transactions module
export type {
  AccountInfo,
  BroadcastResult,
  EvmTransaction,
  NetworkConfig,
  NetworkMode,
  SignAndBroadcastOptions,
  SigningClientOptions,
  SigningFee,
  SigningResult,
  SimulateAndReviewResult,
  SimulateResult,
  TransactionMessage,
  WalletAdapterInterface
} from './types.js';

// Network configuration presets
export { NETWORK_CONFIGS, assertNetworkAvailable } from './types.js';

// Adapters
export {
  WalletAdapter,
  BaseWalletAdapter,
  GenericCosmosAdapter,
  GenericEvmAdapter,
  type GenericCosmosAdapterConfig,
  type EvmAdapterOptions
} from './adapters/index.js';
