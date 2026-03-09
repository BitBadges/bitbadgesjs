import { convertToBitBadgesAddress } from '@/address-converter/converter.js';
import { generateEndpointAccount, type AccountResponse } from '@/node-rest-api/account.js';
import { createTransactionPayload, createTxBroadcastBody, type TxContext } from '@/transactions/messages/base.js';
import type { Fee } from '@/transactions/messages/common.js';
import type { Message } from '@bufbuild/protobuf';
import axios, { type AxiosInstance } from 'axios';
import type { WalletAdapter } from './adapters/WalletAdapter.js';
import {
  NETWORK_CONFIGS,
  type AccountInfo,
  type BroadcastResult,
  type NetworkConfig,
  type NetworkMode,
  type SignAndBroadcastOptions,
  type SigningClientOptions,
  type SimulateResult,
  type TransactionMessage
} from './types.js';

/** Default gas limit for Cosmos transactions */
const DEFAULT_GAS_LIMIT = 400000;
/** Default gas limit for EVM precompile transactions */
const DEFAULT_EVM_PRECOMPILE_GAS_LIMIT = 2000000;
/** Default gas multiplier for simulated transactions */
const DEFAULT_GAS_MULTIPLIER = 1.3;
/** Default maximum sequence retry attempts */
const DEFAULT_MAX_SEQUENCE_RETRIES = 3;
/** Default fee denomination */
const DEFAULT_FEE_DENOM = 'ubadge';
/** Default gas price in ubadge */
const DEFAULT_GAS_PRICE = 0.025;

/**
 * BitBadgesSigningClient provides a wallet-agnostic interface for signing and broadcasting
 * transactions on the BitBadges blockchain.
 *
 * It supports both Cosmos wallets (Keplr, Leap, etc.) and EVM wallets (MetaMask via ethers.js)
 * through the adapter pattern.
 *
 * @example
 * ```typescript
 * // With a Cosmos wallet (Keplr)
 * const adapter = await GenericCosmosAdapter.fromKeplr('bitbadges-1');
 * const client = new BitBadgesSigningClient({ adapter });
 *
 * const result = await client.signAndBroadcast([
 *   MsgTransferBadges.create({ ... }).toProto()
 * ]);
 *
 * // With an EVM wallet (ethers.js)
 * const provider = new BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 * const adapter = await GenericEvmAdapter.fromSigner(signer);
 * const client = new BitBadgesSigningClient({ adapter });
 *
 * const result = await client.signAndBroadcast([msg]); // Uses precompile path
 * ```
 *
 * @category Signing
 */
export class BitBadgesSigningClient {
  private readonly adapter: WalletAdapter;
  private readonly networkConfig: NetworkConfig;
  private readonly sequenceRetryEnabled: boolean;
  private readonly maxSequenceRetries: number;
  private readonly gasMultiplier: number;
  private readonly defaultGasLimit: number;
  private readonly evmPrecompileGasLimit: number;
  private readonly apiKey?: string;
  private readonly axiosInstance: AxiosInstance;

  // Cached account info
  private cachedAccountInfo: AccountInfo | null = null;

  /**
   * Create a new BitBadgesSigningClient.
   *
   * @param options - Configuration options for the client
   * @throws Error if EVM adapter is used and MetaMask is on wrong network
   */
  constructor(options: SigningClientOptions) {
    this.adapter = options.adapter;

    // Resolve network configuration from preset or custom values
    const network: NetworkMode = options.network || 'mainnet';
    const baseConfig = NETWORK_CONFIGS[network];

    this.networkConfig = {
      apiUrl: options.apiUrl || baseConfig.apiUrl,
      nodeUrl: options.nodeUrl || baseConfig.nodeUrl,
      cosmosChainId: options.cosmosChainId || baseConfig.cosmosChainId,
      evmChainId: options.evmChainId ?? baseConfig.evmChainId,
      evmRpcUrl: options.evmRpcUrl || baseConfig.evmRpcUrl
    };

    this.sequenceRetryEnabled = options.sequenceRetryEnabled !== false; // Default: true
    this.maxSequenceRetries = options.maxSequenceRetries || DEFAULT_MAX_SEQUENCE_RETRIES;
    this.gasMultiplier = options.gasMultiplier || DEFAULT_GAS_MULTIPLIER;
    this.defaultGasLimit = options.defaultGasLimit || DEFAULT_GAS_LIMIT;
    this.evmPrecompileGasLimit = options.evmPrecompileGasLimit || DEFAULT_EVM_PRECOMPILE_GAS_LIMIT;

    this.apiKey = options.apiKey;

    this.axiosInstance = axios.create({
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'x-api-key': this.apiKey })
      }
    });
  }

  /**
   * Get the network configuration.
   */
  get config(): NetworkConfig {
    return this.networkConfig;
  }

  /**
   * Get the BitBadges address (bb-prefixed) for this client.
   */
  get address(): string {
    const addr = this.adapter.address;
    // Convert 0x address to bb address if needed
    if (addr.startsWith('0x')) {
      return convertToBitBadgesAddress(addr);
    }
    return addr;
  }

  /**
   * Get the chain type from the adapter.
   */
  get chainType(): 'cosmos' | 'evm' {
    return this.adapter.chainType;
  }

  /**
   * Get the Cosmos chain ID being used.
   */
  private get chainId(): string {
    return this.networkConfig.cosmosChainId;
  }

  /**
   * Get the EVM chain ID being used.
   */
  get evmChainId(): number {
    return this.networkConfig.evmChainId;
  }

  /**
   * Get the node URL (LCD endpoint).
   */
  private get nodeUrl(): string {
    return this.networkConfig.nodeUrl;
  }

  /**
   * Get the API URL (BitBadges indexer).
   */
  private get apiUrl(): string {
    return this.networkConfig.apiUrl;
  }

  /**
   * Get account information from the blockchain.
   * Results are cached to minimize RPC calls.
   *
   * @param forceRefresh - Force a refresh from the chain instead of using cache
   * @returns Account information including accountNumber, sequence, and publicKey
   */
  async getAccountInfo(forceRefresh = false): Promise<AccountInfo> {
    if (this.cachedAccountInfo && !forceRefresh) {
      return this.cachedAccountInfo;
    }

    const bbAddress = this.address;

    // Fetch from node
    const endpoint = generateEndpointAccount(bbAddress);
    const response = await this.axiosInstance.get<AccountResponse>(`${this.nodeUrl}${endpoint}`);

    // Handle various account response structures
    // The response can be nested differently depending on account type
    const account = response.data?.account;
    const baseAccount = account?.base_account || account;

    // Handle case where account doesn't exist yet (new account)
    if (!baseAccount) {
      // For new accounts, we need the public key from the adapter
      let publicKey = '';
      try {
        publicKey = await this.adapter.getPublicKey();
      } catch {
        // Public key not available yet - that's ok for new accounts
      }

      this.cachedAccountInfo = {
        address: bbAddress,
        accountNumber: 0,
        sequence: 0,
        publicKey
      };
      return this.cachedAccountInfo;
    }

    // Get public key from adapter or chain response
    let publicKey = baseAccount.pub_key?.key || '';
    if (!publicKey) {
      try {
        publicKey = await this.adapter.getPublicKey();
      } catch {
        // Public key not available yet
      }
    }

    this.cachedAccountInfo = {
      address: bbAddress,
      accountNumber: parseInt(baseAccount.account_number || '0', 10),
      sequence: parseInt(baseAccount.sequence || '0', 10),
      publicKey
    };

    return this.cachedAccountInfo;
  }

  /**
   * Clear the cached account info. Call this after transactions to force a refresh.
   */
  clearCache(): void {
    this.cachedAccountInfo = null;
  }

  /**
   * Calculate a fee based on gas limit.
   */
  private calculateFee(gasLimit: number): Fee {
    const amount = Math.ceil(gasLimit * DEFAULT_GAS_PRICE);
    return {
      amount: amount.toString(),
      denom: DEFAULT_FEE_DENOM,
      gas: gasLimit.toString()
    };
  }

  /**
   * Simulate a transaction to estimate gas usage.
   *
   * @param messages - Messages to include in the transaction
   * @param options - Optional memo
   * @returns Simulation result with gas estimates
   */
  async simulate(messages: TransactionMessage[], options?: { memo?: string }): Promise<SimulateResult> {
    // EVM path: use eth_estimateGas via the adapter's provider
    if (this.adapter.chainType === 'evm') {
      return this.simulateEvm(messages, options);
    }

    // Cosmos path: use the standard simulate endpoint
    return this.simulateCosmos(messages, options);
  }

  /**
   * Simulate via Cosmos SDK endpoint.
   */
  private async simulateCosmos(messages: TransactionMessage[], options?: { memo?: string }): Promise<SimulateResult> {
    const accountInfo = await this.getAccountInfo();

    if (!accountInfo.publicKey) {
      throw new Error('Public key is required for simulation. Sign a transaction first to register the public key on chain.');
    }

    // Convert messages to proto format
    const protoMessages = this.normalizeMessages(messages);

    // Create a dummy signature for simulation
    const dummySignature = '0'.repeat(128);

    const txContext: TxContext = {
      chainIdOverride: this.chainId,
      sender: {
        address: this.address as any,
        sequence: accountInfo.sequence,
        accountNumber: accountInfo.accountNumber,
        publicKey: accountInfo.publicKey
      },
      fee: this.calculateFee(this.defaultGasLimit),
      memo: options?.memo || ''
    };

    const broadcastBody = createTxBroadcastBody(txContext, protoMessages, dummySignature);

    // Send to simulate endpoint
    const response = await this.axiosInstance.post(`${this.apiUrl}/api/v0/simulate`, JSON.parse(broadcastBody));

    const gasUsed = parseInt(response.data.gas_info?.gas_used || '0', 10);
    const gasLimit = Math.ceil(gasUsed * this.gasMultiplier);

    return {
      gasUsed,
      gasLimit,
      fee: this.calculateFee(gasLimit)
    };
  }

  /**
   * Simulate via EVM eth_estimateGas.
   */
  private async simulateEvm(messages: TransactionMessage[], options?: { memo?: string }): Promise<SimulateResult> {
    if (!this.adapter.estimateEvmGas) {
      throw new Error('EVM adapter does not support gas estimation. Ensure a provider is connected.');
    }

    const protoMessages = this.normalizeMessages(messages);

    // Build the precompile call data
    const txContext: TxContext = {
      chainIdOverride: this.chainId,
      evmAddress: this.adapter.address,
      fee: this.calculateFee(this.evmPrecompileGasLimit),
      memo: options?.memo || ''
    };

    const payload = createTransactionPayload(txContext, protoMessages);

    if (!payload.evmTx) {
      throw new Error('Messages are not supported for EVM precompile simulation');
    }

    const gasUsed = Number(await this.adapter.estimateEvmGas({
      to: payload.evmTx.to,
      data: payload.evmTx.data,
      value: payload.evmTx.value
    }));

    const gasLimit = Math.ceil(gasUsed * this.gasMultiplier);

    return {
      gasUsed,
      gasLimit,
      fee: this.calculateFee(gasLimit)
    };
  }

  /**
   * Normalize messages to proto format.
   */
  private normalizeMessages(messages: TransactionMessage[]): Message[] {
    return messages.map((msg) => {
      if (msg && typeof (msg as any).toProto === 'function') {
        return (msg as any).toProto();
      }
      return msg as Message;
    });
  }

  /**
   * Sign and broadcast a transaction.
   *
   * @param messages - Messages to include in the transaction
   * @param options - Signing and broadcast options
   * @returns Broadcast result including transaction hash
   */
  async signAndBroadcast(messages: TransactionMessage[], options?: SignAndBroadcastOptions): Promise<BroadcastResult> {
    // EVM path
    if (this.adapter.chainType === 'evm') {
      return this.signAndBroadcastEvm(messages, options);
    }

    // Cosmos path
    return this.signAndBroadcastCosmos(messages, options);
  }

  /**
   * Sign and broadcast using Cosmos signing.
   */
  private async signAndBroadcastCosmos(messages: TransactionMessage[], options?: SignAndBroadcastOptions, retryCount = 0): Promise<BroadcastResult> {
    const accountInfo = await this.getAccountInfo();

    if (!accountInfo.publicKey) {
      // Try to get public key from adapter
      const pubKey = await this.adapter.getPublicKey();
      if (!pubKey) {
        throw new Error('Public key is required for Cosmos transactions');
      }
      accountInfo.publicKey = pubKey;
      this.cachedAccountInfo = accountInfo;
    }

    const protoMessages = this.normalizeMessages(messages);

    // Determine fee
    let fee: Fee;
    if (options?.fee) {
      fee = options.fee;
    } else if (options?.simulate !== false) {
      // Simulate to get gas estimate (default behavior)
      try {
        const simResult = await this.simulate(messages, { memo: options?.memo });
        const multiplier = options?.gasMultiplier || this.gasMultiplier;
        const adjustedGas = Math.ceil(simResult.gasUsed * multiplier);
        fee = this.calculateFee(adjustedGas);
      } catch {
        // Fallback to default gas if simulation fails
        fee = this.calculateFee(this.defaultGasLimit);
      }
    } else {
      fee = this.calculateFee(this.defaultGasLimit);
    }

    // Create transaction context
    const txContext: TxContext = {
      chainIdOverride: this.chainId,
      sender: {
        address: this.address as any,
        sequence: accountInfo.sequence,
        accountNumber: accountInfo.accountNumber,
        publicKey: accountInfo.publicKey
      },
      fee,
      memo: options?.memo || ''
    };

    // Create transaction payload
    const payload = createTransactionPayload(txContext, protoMessages);

    // Sign with adapter
    if (!this.adapter.signDirect) {
      throw new Error('Cosmos adapter must implement signDirect');
    }

    const signResult = await this.adapter.signDirect(payload, accountInfo.accountNumber);

    // Create broadcast body using the same approach as the frontend:
    // Use createTxBroadcastBody with the original context and messages
    // This ensures the bytes are recreated identically to what was signed
    const broadcastBody = createTxBroadcastBody(txContext, protoMessages, signResult.signature);

    // Broadcast
    try {
      const response = await this.axiosInstance.post(`${this.apiUrl}/api/v0/broadcast`, JSON.parse(broadcastBody));

      const txResponse = response.data.tx_response;
      const code = txResponse?.code || 0;

      // Check for sequence mismatch error
      if (code !== 0 && this.isSequenceMismatchError(txResponse?.raw_log)) {
        if (this.sequenceRetryEnabled && retryCount < this.maxSequenceRetries) {
          // Clear cache and retry
          this.clearCache();
          return this.signAndBroadcastCosmos(messages, options, retryCount + 1);
        }
      }

      // Increment cached sequence on success
      if (code === 0 && this.cachedAccountInfo) {
        this.cachedAccountInfo.sequence += 1;
      }

      return {
        txHash: txResponse?.txhash || '',
        rawResponse: response.data,
        success: code === 0,
        error: code !== 0 ? txResponse?.raw_log : undefined,
        code
      };
    } catch (error: any) {
      // Check for sequence mismatch in error response
      const rawLog = error?.response?.data?.tx_response?.raw_log || error?.message || '';
      if (this.isSequenceMismatchError(rawLog)) {
        if (this.sequenceRetryEnabled && retryCount < this.maxSequenceRetries) {
          this.clearCache();
          return this.signAndBroadcastCosmos(messages, options, retryCount + 1);
        }
      }

      return {
        txHash: '',
        rawResponse: error?.response?.data,
        success: false,
        error: error?.message || 'Unknown error',
        code: error?.response?.data?.tx_response?.code || -1
      };
    }
  }

  /**
   * Check if an error is a sequence mismatch.
   */
  private isSequenceMismatchError(message?: string): boolean {
    if (!message) return false;
    return message.includes('account sequence mismatch') || message.includes('incorrect account sequence');
  }

  /**
   * Sign and broadcast using EVM precompile path.
   */
  private async signAndBroadcastEvm(messages: TransactionMessage[], options?: SignAndBroadcastOptions): Promise<BroadcastResult> {
    if (!this.adapter.sendEvmTransaction) {
      throw new Error('EVM adapter must implement sendEvmTransaction');
    }

    const protoMessages = this.normalizeMessages(messages);

    // Create transaction payload with EVM address
    const evmAddress = this.adapter.address;

    // Create payload - only evmAddress, no sender (for EVM-only path)
    const txContext: TxContext = {
      chainIdOverride: this.chainId,
      evmAddress,
      fee: this.calculateFee(this.evmPrecompileGasLimit),
      memo: options?.memo || ''
    };

    const payload = createTransactionPayload(txContext, protoMessages);

    if (!payload.evmTx) {
      throw new Error('Messages are not supported for EVM precompile conversion');
    }

    // Send via EVM
    try {
      const txHash = await this.adapter.sendEvmTransaction({
        to: payload.evmTx.to,
        data: payload.evmTx.data,
        value: payload.evmTx.value,
        gasLimit: this.evmPrecompileGasLimit
      });

      return {
        txHash,
        rawResponse: { evmTx: payload.evmTx },
        success: true,
        code: 0
      };
    } catch (error: any) {
      return {
        txHash: '',
        rawResponse: null,
        success: false,
        error: error?.message || 'EVM transaction failed',
        code: -1
      };
    }
  }
}
