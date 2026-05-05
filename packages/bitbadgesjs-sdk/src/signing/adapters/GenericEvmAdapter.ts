import { BaseWalletAdapter, type WalletAdapter } from './WalletAdapter.js';
import type { EvmTransaction } from '../types.js';
import type { EIP712TypedData } from '@/eip712/types.js';

/**
 * Minimal ethers.js Signer interface (v6).
 * Users should install ethers for full type support.
 */
interface EthersSigner {
  getAddress(): Promise<string>;
  /**
   * EIP-712 typed-data signing. Optional on the type because the
   * subset of ethers' Signer interface we want here is small; both
   * ethers v6 `Signer` and any `JsonRpcSigner` produced by
   * `BrowserProvider.getSigner()` ship this. We narrow it for our
   * own `signTypedData` path below.
   */
  signTypedData?(
    domain: any,
    types: Record<string, { name: string; type: string }[]>,
    value: Record<string, unknown>
  ): Promise<string>;
  sendTransaction(tx: {
    to: string;
    data: string;
    value?: string | bigint;
    gasLimit?: number | bigint;
  }): Promise<{
    hash: string;
    wait(): Promise<any>;
  }>;
  estimateGas?(tx: {
    to: string;
    data: string;
    value?: string | bigint;
  }): Promise<bigint>;
  provider?: {
    getNetwork(): Promise<{ chainId: bigint }>;
    estimateGas?(tx: {
      to: string;
      data: string;
      value?: string | bigint;
      from?: string;
    }): Promise<bigint>;
    call?(tx: {
      to: string;
      data: string;
      value?: string | bigint;
      from?: string;
    }): Promise<string>;
  };
}

/**
 * Minimal EIP-1193 provider interface (window.ethereum).
 */
interface EIP1193Provider {
  request(args: { method: string; params?: any[] }): Promise<any>;
}

/**
 * Options for creating an EVM adapter with chain validation.
 */
export interface EvmAdapterOptions {
  /**
   * Expected EVM chain ID. If provided, the adapter will validate that
   * the wallet is connected to this chain.
   */
  expectedChainId?: number;
}

/**
 * GenericEvmAdapter provides wallet adapter functionality for EVM wallets
 * like MetaMask via ethers.js or direct EIP-1193 providers.
 *
 * EVM transactions are sent through precompile contracts on the BitBadges chain.
 *
 * @example
 * ```typescript
 * // With ethers.js v6
 * import { BrowserProvider } from 'ethers';
 *
 * const provider = new BrowserProvider(window.ethereum);
 * const signer = await provider.getSigner();
 * const adapter = await GenericEvmAdapter.fromSigner(signer);
 * const client = new BitBadgesSigningClient({ adapter });
 *
 * // Direct from window.ethereum
 * const adapter = await GenericEvmAdapter.fromProvider(window.ethereum);
 * ```
 *
 * @category Signing
 */
export class GenericEvmAdapter extends BaseWalletAdapter implements WalletAdapter {
  readonly chainType = 'evm' as const;
  readonly address: string;

  private readonly signer?: EthersSigner;
  private readonly provider?: EIP1193Provider;

  private constructor(address: string, signer?: EthersSigner, provider?: EIP1193Provider) {
    super();
    this.address = address;
    this.signer = signer;
    this.provider = provider;
  }

  /**
   * Get the current chain ID from the provider.
   *
   * @param provider - The EIP-1193 provider
   * @returns The current chain ID as a number
   */
  private static async getChainId(provider: EIP1193Provider): Promise<number> {
    const chainIdHex = await provider.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  }

  /**
   * Validate that the wallet is connected to the expected chain.
   *
   * @param provider - The EIP-1193 provider
   * @param expectedChainId - The expected EVM chain ID
   * @throws Error if wallet is on wrong network
   */
  private static async validateChainId(provider: EIP1193Provider, expectedChainId: number): Promise<void> {
    const currentChainId = await GenericEvmAdapter.getChainId(provider);
    if (currentChainId !== expectedChainId) {
      throw new Error(
        `Wallet is connected to chain ${currentChainId}, but expected chain ${expectedChainId}. ` +
          `Please switch your wallet to the correct network.`
      );
    }
  }

  /**
   * Create an adapter from an ethers.js Signer (v6).
   *
   * @param signer - An ethers.js Signer instance
   * @param options - Optional configuration including expected chain ID
   * @returns A new GenericEvmAdapter connected to the signer
   * @throws Error if expectedChainId is provided and wallet is on wrong network
   */
  static async fromSigner(signer: EthersSigner, options?: EvmAdapterOptions): Promise<GenericEvmAdapter> {
    // Validate chain ID if expected chain is specified
    if (options?.expectedChainId !== undefined && signer.provider) {
      const network = await signer.provider.getNetwork();
      const currentChainId = Number(network.chainId);
      if (currentChainId !== options.expectedChainId) {
        throw new Error(
          `Wallet is connected to chain ${currentChainId}, but expected chain ${options.expectedChainId}. ` +
            `Please switch your wallet to the correct network.`
        );
      }
    }

    const address = await signer.getAddress();
    return new GenericEvmAdapter(address, signer);
  }

  /**
   * Create an adapter from an EIP-1193 provider (like window.ethereum).
   *
   * @param provider - An EIP-1193 compliant provider
   * @param options - Optional configuration including expected chain ID
   * @returns A new GenericEvmAdapter connected to the provider
   * @throws Error if expectedChainId is provided and wallet is on wrong network
   */
  static async fromProvider(provider: EIP1193Provider, options?: EvmAdapterOptions): Promise<GenericEvmAdapter> {
    // Validate chain ID if expected chain is specified
    if (options?.expectedChainId !== undefined) {
      await GenericEvmAdapter.validateChainId(provider, options.expectedChainId);
    }

    // Request accounts
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please connect your wallet.');
    }
    return new GenericEvmAdapter(accounts[0], undefined, provider);
  }

  // ==================== Server-Side Factory Methods ====================

  /**
   * Create an adapter from a mnemonic phrase for server-side EVM signing.
   *
   * Uses ETH HD path (m/44'/60'/0'/0/0) and connects to an EVM JSON-RPC provider.
   *
   * **Security Note**: Only use in secure server-side environments.
   *
   * @param mnemonic - The BIP-39 mnemonic phrase (12 or 24 words)
   * @param evmRpcUrl - The EVM JSON-RPC endpoint URL
   * @param options - Optional configuration including expected chain ID
   * @returns A new GenericEvmAdapter for server-side signing
   *
   * @example
   * ```typescript
   * const adapter = await GenericEvmAdapter.fromMnemonic(
   *   'word1 word2 ...',
   *   'https://evm-rpc-testnet.bitbadges.io'
   * );
   * const client = new BitBadgesSigningClient({ adapter, network: 'testnet' });
   * ```
   */
  static async fromMnemonic(mnemonic: string, evmRpcUrl: string, options?: EvmAdapterOptions): Promise<GenericEvmAdapter> {
    const { HDNodeWallet, JsonRpcProvider } = await import('ethers');
    const provider = new JsonRpcProvider(evmRpcUrl);
    const hdWallet = HDNodeWallet.fromPhrase(mnemonic, undefined, "m/44'/60'/0'/0/0");
    const wallet = hdWallet.connect(provider);

    if (options?.expectedChainId !== undefined) {
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      if (currentChainId !== options.expectedChainId) {
        throw new Error(
          `EVM RPC is on chain ${currentChainId}, but expected chain ${options.expectedChainId}.`
        );
      }
    }

    return new GenericEvmAdapter(wallet.address, wallet as unknown as EthersSigner);
  }

  /**
   * Create an adapter from a private key for server-side EVM signing.
   *
   * Connects to an EVM JSON-RPC provider for transaction broadcasting.
   *
   * **Security Note**: Only use in secure server-side environments.
   *
   * @param privateKey - The private key (hex string, with or without 0x prefix)
   * @param evmRpcUrl - The EVM JSON-RPC endpoint URL
   * @param options - Optional configuration including expected chain ID
   * @returns A new GenericEvmAdapter for server-side signing
   */
  static async fromPrivateKey(privateKey: string, evmRpcUrl: string, options?: EvmAdapterOptions): Promise<GenericEvmAdapter> {
    const { Wallet, JsonRpcProvider } = await import('ethers');
    const provider = new JsonRpcProvider(evmRpcUrl);
    const wallet = new Wallet(privateKey, provider);

    if (options?.expectedChainId !== undefined) {
      const network = await provider.getNetwork();
      const currentChainId = Number(network.chainId);
      if (currentChainId !== options.expectedChainId) {
        throw new Error(
          `EVM RPC is on chain ${currentChainId}, but expected chain ${options.expectedChainId}.`
        );
      }
    }

    return new GenericEvmAdapter(wallet.address, wallet as unknown as EthersSigner);
  }

  // ==================== Browser Wallet Factory Methods ====================

  /**
   * Create an adapter from window.ethereum (MetaMask, etc.).
   *
   * @param options - Optional configuration including expected chain ID
   * @returns A new GenericEvmAdapter connected to the browser wallet
   * @throws Error if expectedChainId is provided and wallet is on wrong network
   */
  static async fromBrowserWallet(options?: EvmAdapterOptions): Promise<GenericEvmAdapter> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.');
    }
    return GenericEvmAdapter.fromProvider((window as any).ethereum, options);
  }

  /**
   * Get the public key.
   * Note: EVM wallets don't directly expose public keys for Cosmos signing.
   */
  async getPublicKey(): Promise<string> {
    // EVM wallets don't expose public keys in the same way as Cosmos wallets
    // Return empty string - EVM path doesn't need it
    return '';
  }

  /**
   * Sign EIP-712 typed-data with the connected EVM wallet.
   *
   * The output is a `0x...`-prefixed 65-byte hex signature (r || s || v).
   * Pair with `recoverEvmPublicKey()` from `@/eip712` to derive the
   * pubkey used in the Cosmos AuthInfo, or strip the trailing recovery
   * byte to feed the chain's ethsecp256k1 verifier directly.
   *
   * Routes through the wallet's `eth_signTypedData_v4` (EIP-1193) when
   * available, otherwise through ethers' `Signer.signTypedData`. Native
   * MetaMask / Privy / Coinbase Smart Wallet take the canonical Cosmos
   * EVM domain (`verifyingContract: "cosmos"`, `salt: "0"`) without
   * complaint; ethers v6 hard-rejects it, so prefer the EIP-1193 path
   * when both are wired.
   */
  async signTypedData(typed: EIP712TypedData): Promise<string> {
    const wireTyped = serializeTypedDataForJsonRpc(typed);

    if (this.provider) {
      const sig = await this.provider.request({
        method: 'eth_signTypedData_v4',
        params: [this.address, JSON.stringify(wireTyped)]
      });
      if (typeof sig !== 'string' || !sig.startsWith('0x')) {
        throw new Error(`signTypedData: provider returned unexpected value: ${String(sig)}`);
      }
      return sig;
    }

    if (this.signer && this.signer.signTypedData) {
      const { EIP712Domain: _drop, ...typesWithoutDomain } = typed.types;
      void _drop;
      // ethers will reject the canonical Cosmos EVM domain — callers
      // who use the ethers path are expected to provide a domain with
      // a real `0x...` verifyingContract and bytes32 salt. Surface the
      // problem early rather than letting it fail at hash time.
      assertEthersDomainCompatible(typed.domain);
      return await this.signer.signTypedData(
        { ...typed.domain, chainId: Number(typed.domain.chainId) },
        typesWithoutDomain as any,
        typed.message as any
      );
    }

    throw new Error('signTypedData: no signer or provider available on this adapter');
  }

  /**
   * Send an EVM transaction to a precompile contract.
   *
   * @param tx - The EVM transaction to send
   * @returns The transaction hash
   */
  async sendEvmTransaction(tx: EvmTransaction): Promise<string> {
    if (this.signer) {
      // Use ethers.js signer
      const txResponse = await this.signer.sendTransaction({
        to: tx.to,
        data: tx.data,
        value: tx.value || '0',
        gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : undefined
      });
      return txResponse.hash;
    }

    if (this.provider) {
      // Use direct EIP-1193 provider
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: this.address,
            to: tx.to,
            data: tx.data,
            value: tx.value ? `0x${BigInt(tx.value).toString(16)}` : '0x0',
            gas: tx.gasLimit ? `0x${tx.gasLimit.toString(16)}` : undefined
          }
        ]
      });
      return txHash;
    }

    throw new Error('No signer or provider available');
  }

  /**
   * Estimate gas for an EVM transaction via the connected provider.
   *
   * @param tx - The EVM transaction to estimate
   * @returns Estimated gas as bigint
   */
  async estimateEvmGas(tx: EvmTransaction): Promise<bigint> {
    if (this.signer?.provider?.estimateGas) {
      return this.signer.provider.estimateGas({
        from: this.address,
        to: tx.to,
        data: tx.data,
        value: tx.value || '0'
      });
    }

    if (this.signer?.estimateGas) {
      return this.signer.estimateGas({
        to: tx.to,
        data: tx.data,
        value: tx.value || '0'
      });
    }

    if (this.provider) {
      const result = await this.provider.request({
        method: 'eth_estimateGas',
        params: [
          {
            from: this.address,
            to: tx.to,
            data: tx.data,
            value: tx.value ? `0x${BigInt(tx.value).toString(16)}` : '0x0'
          }
        ]
      });
      return BigInt(result);
    }

    throw new Error('No provider available for gas estimation');
  }

  supportsSignDirect(): boolean {
    return false;
  }

  supportsSignAmino(): boolean {
    return false;
  }

  supportsEvmTransaction(): boolean {
    return true;
  }

  supportsSignTypedData(): boolean {
    return Boolean(this.provider) || Boolean(this.signer && this.signer.signTypedData);
  }
}

/**
 * Convert our `EIP712TypedData` (with `chainId: bigint` and a
 * user-supplied EIP712Domain entry) into the JSON shape that
 * `eth_signTypedData_v4` expects when serialized as a string. Wallets
 * accept the user-supplied domain types and treat `verifyingContract`
 * as bytes20 / `salt` as bytes32 even when the values are plain
 * strings — this is what makes the canonical Cosmos EVM domain
 * (`"cosmos"` + `"0"`) signable by MetaMask et al.
 */
function serializeTypedDataForJsonRpc(typed: EIP712TypedData): any {
  return {
    types: typed.types,
    primaryType: typed.primaryType,
    domain: {
      name: typed.domain.name,
      version: typed.domain.version,
      // `eth_signTypedData_v4` accepts chainId as decimal string.
      chainId: typed.domain.chainId.toString(),
      verifyingContract: typed.domain.verifyingContract,
      salt: typed.domain.salt
    },
    message: typed.message
  };
}

/**
 * The ethers v6 typed-data path strictly validates `verifyingContract`
 * as a 0x-prefixed 20-byte hex string and `salt` as a 32-byte hex
 * string. The canonical Cosmos EVM domain violates both. Callers who
 * route through ethers must override the domain to supply spec-shaped
 * values; we surface the violation immediately rather than letting it
 * fail at hashing time inside ethers.
 */
function assertEthersDomainCompatible(domain: EIP712TypedData['domain']): void {
  const isHexAddress = /^0x[0-9a-fA-F]{40}$/.test(domain.verifyingContract);
  const isHexBytes32 = /^0x[0-9a-fA-F]{64}$/.test(domain.salt);
  if (!isHexAddress || !isHexBytes32) {
    throw new Error(
      'signTypedData: ethers Signer path cannot sign the canonical Cosmos EVM domain ' +
        `(verifyingContract="${domain.verifyingContract}", salt="${domain.salt}"). ` +
        'Use the EIP-1193 provider path (window.ethereum / Privy / Coinbase) for byte-exact ' +
        'compatibility with the chain\'s ante handler, or supply a 0x-shaped domain override.'
    );
  }
}
