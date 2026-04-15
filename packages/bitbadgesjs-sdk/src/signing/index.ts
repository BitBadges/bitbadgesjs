/**
 * BitBadges Signing Client
 *
 * This module provides a wallet-agnostic signing client for the BitBadges blockchain.
 * It supports both Cosmos wallets (Keplr, Leap, Cosmostation) and EVM wallets (MetaMask via ethers.js).
 *
 * @example
 * ```typescript
 * // Browser wallet (Keplr)
 * import { BitBadgesSigningClient, GenericCosmosAdapter } from 'bitbadges';
 *
 * const adapter = await GenericCosmosAdapter.fromKeplr('bitbadges-1');
 * const client = new BitBadgesSigningClient({ adapter });
 *
 * const result = await client.signAndBroadcast([
 *   MsgTransferBadges.create({ ... }).toProto()
 * ]);
 * console.log('TX Hash:', result.txHash);
 *
 * // Server-side with mnemonic
 * const adapter = await GenericCosmosAdapter.fromMnemonic('word1 word2 ...', 'bitbadges-1');
 * const client = new BitBadgesSigningClient({ adapter });
 *
 * // EVM wallet (ethers.js)
 * import { BitBadgesSigningClient, GenericEvmAdapter } from 'bitbadges';
 * import { BrowserProvider } from 'ethers';
 *
 * const provider = new BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 * const adapter = await GenericEvmAdapter.fromSigner(signer);
 * const client = new BitBadgesSigningClient({ adapter });
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
export { NETWORK_CONFIGS } from './types.js';

// Adapters
export {
  WalletAdapter,
  BaseWalletAdapter,
  GenericCosmosAdapter,
  GenericEvmAdapter,
  type GenericCosmosAdapterConfig,
  type EvmAdapterOptions
} from './adapters/index.js';
