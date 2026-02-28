import type { Message } from '@bufbuild/protobuf';

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
 * Options for the signing client.
 *
 * @category Signing
 */
export interface SigningClientOptions {
  /** The wallet adapter to use for signing */
  adapter: WalletAdapterInterface;
  /** BitBadges API URL. Default: https://api.bitbadges.io */
  apiUrl?: string;
  /** Node REST API URL. Default: https://node.bitbadges.io:1317 */
  nodeUrl?: string;
  /** Node RPC URL. Default: https://node.bitbadges.io:26657 */
  rpcUrl?: string;
  /** Use testnet instead of mainnet. Default: false */
  testnet?: boolean;
  /** Override the chain ID */
  chainIdOverride?: string;
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

  /** Check if the adapter supports SignDirect signing */
  supportsSignDirect(): boolean;
  /** Check if the adapter supports Amino signing */
  supportsSignAmino(): boolean;
  /** Check if the adapter supports EVM transactions */
  supportsEvmTransaction(): boolean;
}

/**
 * Generic message type for transactions.
 * Can be either a proto message or an SDK message with toProto() method.
 *
 * @category Signing
 */
export type TransactionMessage = Message | { toProto(): Message };
