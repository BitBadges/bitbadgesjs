import type { Message } from '@bufbuild/protobuf';
import type { SimulationEvent, ParsedSimulationEvents, NetBalanceChanges } from '@/core/simulation.js';

// Note: TransactionPayload and Fee are imported from transactions module when needed.
// They are NOT re-exported here to avoid conflicts with the main SDK exports.

/**
 * Account information from the blockchain.
 *
 * @category Signing
 */
export interface AccountInfo {
  /** Account number on the blockchain */
  accountNumber: number;
  /** Current sequence (nonce) for the account */
  sequence: number;
  /** Public key in base64 format */
  publicKey: string;
  /** BitBadges address (bb-prefixed) */
  address: string;
}

/**
 * Result from signing a transaction.
 *
 * @category Signing
 */
export interface SigningResult {
  /** Signature as a hex string */
  signature: string;
  /** Public key in base64 format */
  publicKey: string;
}

/**
 * EVM transaction for precompile calls.
 *
 * @category Signing
 */
export interface EvmTransaction {
  /** Target contract address (precompile address) */
  to: string;
  /** Encoded function call data */
  data: string;
  /** Value to send (typically "0" for precompiles) */
  value: string;
  /** Gas limit for the transaction */
  gasLimit?: number;
}

/**
 * Fee configuration for signing client (local alias).
 * Uses the same structure as the transactions module Fee.
 *
 * @category Signing
 */
export interface SigningFee {
  /** Amount in base units (e.g., "5000000000" for 5 BADGE) */
  amount: string;
  /** Denomination (e.g., "ubadge") */
  denom: string;
  /** Gas limit as string */
  gas: string;
}

/**
 * Network mode for the signing client.
 * - 'mainnet': BitBadges mainnet (default)
 * - 'testnet': BitBadges testnet
 * - 'local': Local development environment
 *
 * @category Signing
 */
export type NetworkMode = 'mainnet' | 'testnet' | 'local';

/**
 * Network configuration with all endpoints and chain IDs.
 *
 * @category Signing
 */
export interface NetworkConfig {
  /** BitBadges API URL (indexer) */
  apiUrl: string;
  /** Node REST API URL (LCD) */
  nodeUrl: string;
  /** Cosmos chain ID (e.g., 'bitbadges-1') */
  cosmosChainId: string;
  /** EVM chain ID for MetaMask (e.g., 90123 for local) */
  evmChainId: number;
  /** EVM JSON-RPC URL for server-side EVM signing */
  evmRpcUrl: string;
  /**
   * If true, this network is currently offline / disabled. Selecting it
   * will throw via `assertNetworkAvailable` unless the override env var
   * `BITBADGES_TESTNET_OFFLINE=false` is set. URL fields are kept intact
   * so the network can be revived by flipping this flag back to false.
   */
  disabled?: boolean;
}

/**
 * Preset network configurations.
 *
 * @category Signing
 */
export const NETWORK_CONFIGS: Record<NetworkMode, NetworkConfig> = {
  mainnet: {
    apiUrl: 'https://api.bitbadges.io',
    nodeUrl: 'https://lcd.bitbadges.io',
    cosmosChainId: 'bitbadges-1',
    evmChainId: 50024,
    evmRpcUrl: 'https://evm-rpc.bitbadges.io'
  },
  testnet: {
    // NOTE: Testnet is temporarily offline as of 2026-04-25 to reduce hosting
    // costs. URL fields are intentionally preserved so the network can be
    // revived by flipping `disabled` back to false. See `assertNetworkAvailable`.
    apiUrl: 'https://api.bitbadges.io/testnet',
    nodeUrl: 'https://lcd-testnet.bitbadges.io',
    cosmosChainId: 'bitbadges-2',
    evmChainId: 50025,
    evmRpcUrl: 'https://evm-rpc-testnet.bitbadges.io',
    disabled: true
  },
  local: {
    apiUrl: 'http://localhost:3001',
    nodeUrl: 'http://localhost:1317',
    cosmosChainId: 'bitbadges-1',
    evmChainId: 90123,
    evmRpcUrl: 'http://localhost:8545'
  }
};

/**
 * Throws a descriptive error if the requested network is currently
 * disabled in `NETWORK_CONFIGS`. Acts as the single choke point for the
 * temporary testnet shutdown so SDK consumers fail fast with a clear
 * message instead of silently hitting dead hosts.
 *
 * Override hatch: set `BITBADGES_TESTNET_OFFLINE=false` in the
 * environment to bypass the assertion (useful when running a private
 * chain at the testnet chain ID for local development).
 *
 * @category Signing
 */
export function assertNetworkAvailable(network: string): void {
  // Guarded process access — SDK runs in browsers too.
  const env = typeof process !== 'undefined' ? process.env : undefined;
  if (env && env.BITBADGES_TESTNET_OFFLINE === 'false') {
    return;
  }

  const config = (NETWORK_CONFIGS as Record<string, NetworkConfig | undefined>)[network];
  if (config?.disabled === true) {
    throw new Error(
      'BitBadges testnet is temporarily offline as of 2026-04-25 to reduce hosting costs. ' +
        'Mainnet now serves as a chaosnet — fully live, but safe to experiment on: ' +
        'network gas fees can be set to zero while activity is low, and you can transact ' +
        'with worthless tokens like CHAOS instead of real-value assets. ' +
        "Switch to mainnet (network: 'mainnet') to test contracts, transactions, and " +
        'integrations on the live network without spending anything real — just choose ' +
        'your assets accordingly. ' +
        'To override this guard for local dev (e.g. a private chain at the testnet chain ID), ' +
        'set BITBADGES_TESTNET_OFFLINE=false. ' +
        'See https://docs.bitbadges.io/for-developers/bitbadges-blockchain/testnet-mode for details.'
    );
  }
}

/**
 * Options for the signing client.
 *
 * @category Signing
 */
export interface SigningClientOptions {
  /** The wallet adapter to use for signing */
  adapter: WalletAdapterInterface;

  /**
   * Network mode preset. Use this for standard configurations.
   * - 'mainnet': BitBadges mainnet (default)
   * - 'testnet': BitBadges testnet
   * - 'local': Local development (localhost)
   *
   * Individual URL/chainId options below will override the preset values.
   */
  network?: NetworkMode;

  /** Override the API URL (indexer). Overrides network preset. */
  apiUrl?: string;
  /** Override the node URL (LCD). Overrides network preset. */
  nodeUrl?: string;
  /** Override the Cosmos chain ID. Overrides network preset. */
  cosmosChainId?: string;
  /** Override the EVM chain ID. Overrides network preset. */
  evmChainId?: number;
  /** Override the EVM JSON-RPC URL. Overrides network preset. */
  evmRpcUrl?: string;

  /** Enable automatic sequence retry on mismatch. Default: true */
  sequenceRetryEnabled?: boolean;
  /** Maximum sequence retry attempts. Default: 3 */
  maxSequenceRetries?: number;
  /** Gas multiplier for estimation. Default: 1.3 */
  gasMultiplier?: number;
  /** Default gas limit when not simulating. Default: 400000 */
  defaultGasLimit?: number;
  /** Gas limit for EVM precompile transactions. Default: 2000000 */
  evmPrecompileGasLimit?: number;
  /** BitBadges API key for authenticated requests */
  apiKey?: string;
}

/**
 * Options for sign and broadcast operations.
 *
 * @category Signing
 */
export interface SignAndBroadcastOptions {
  /** Transaction memo */
  memo?: string;
  /** Custom fee (overrides auto-calculation) */
  fee?: SigningFee;
  /** Whether to simulate first for gas estimation. Default: true for Cosmos, false for EVM */
  simulate?: boolean;
  /** Gas multiplier for simulation result. Default: uses client's gasMultiplier */
  gasMultiplier?: number;
  /**
   * Override the broadcast path:
   *   - `cosmos`     — sign with the adapter's `signDirect` (Keplr / Leap / mnemonic).
   *   - `precompile` — encode the message as an EVM tx through the precompile.
   *   - `eip712`     — sign as a Cosmos legacyAmino tx via `eth_signTypedData_v4`
   *                    (EVM wallet signs the Cosmos message directly).
   * Default: auto-derived from the adapter (`cosmos` for Cosmos adapters,
   * `precompile` for EVM adapters). Set `eip712` when you want to broadcast
   * a Cosmos message signed with an EVM wallet — useful for messages the
   * precompile path doesn't cover, or for off-chain proofs.
   */
  mode?: 'cosmos' | 'precompile' | 'eip712';
}

/**
 * Result from simulating a transaction.
 *
 * @category Signing
 */
export interface SimulateResult {
  /** Estimated gas used */
  gasUsed: number;
  /** Recommended gas limit (gasUsed * multiplier) */
  gasLimit: number;
  /** Calculated fee based on gas limit */
  fee: SigningFee;
  /** Raw events from Cosmos simulation (present for Cosmos path, populated via separate Cosmos sim for EVM path) */
  events?: SimulationEvent[];
}

/**
 * Result from simulating a transaction with full event parsing and net change calculation.
 *
 * @category Signing
 */
export interface SimulateAndReviewResult {
  /** Estimated gas used */
  gasUsed: number;
  /** Recommended gas limit (gasUsed * multiplier) */
  gasLimit: number;
  /** Calculated fee based on gas limit */
  fee: SigningFee;
  /** Raw events from Cosmos simulation */
  events: SimulationEvent[];
  /** Parsed simulation events (coin transfers, badge transfers, IBC transfers) */
  parsed: ParsedSimulationEvents;
  /** Net balance changes per address */
  netChanges: NetBalanceChanges;
}

/**
 * Result from broadcasting a transaction.
 *
 * @category Signing
 */
export interface BroadcastResult {
  /** Transaction hash */
  txHash: string;
  /** Raw response from the broadcast endpoint */
  rawResponse: any;
  /** Whether the broadcast was successful */
  success: boolean;
  /** Error message if broadcast failed */
  error?: string;
  /** Transaction code (0 = success) */
  code: number;
}

/**
 * Base interface for wallet adapters.
 * This is re-exported from WalletAdapter.ts for convenience.
 *
 * @category Signing
 */
export interface WalletAdapterInterface {
  /** The chain type this adapter supports */
  readonly chainType: 'cosmos' | 'evm';
  /** The address managed by this adapter */
  readonly address: string;

  /** Get the public key in base64 format */
  getPublicKey(): Promise<string>;

  /** Sign a transaction using Cosmos SignDirect (for Cosmos wallets) */
  signDirect?(payload: any, accountNumber: number): Promise<SigningResult>;

  /** Send an EVM transaction (for EVM wallets) */
  sendEvmTransaction?(tx: EvmTransaction): Promise<string>;

  /** Estimate gas for an EVM transaction (for EVM wallets) */
  estimateEvmGas?(tx: EvmTransaction): Promise<bigint>;

  /** Sign EIP-712 typed-data (for EVM wallets) */
  signTypedData?(typed: any): Promise<string>;

  /** Check if the adapter supports SignDirect signing */
  supportsSignDirect(): boolean;
  /** Check if the adapter supports Amino signing */
  supportsSignAmino(): boolean;
  /** Check if the adapter supports EVM transactions */
  supportsEvmTransaction(): boolean;
  /** Check if the adapter supports EIP-712 typed-data signing */
  supportsSignTypedData(): boolean;
}

/**
 * Generic message type for transactions.
 * Can be either a proto message or an SDK message with toProto() method.
 *
 * @category Signing
 */
export type TransactionMessage = Message | { toProto(): Message };
