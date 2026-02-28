import { BaseWalletAdapter, type WalletAdapter } from './WalletAdapter.js';
import type { EvmTransaction } from '../types.js';

/**
 * Minimal ethers.js Signer interface (v6).
 * Users should install ethers for full type support.
 */
interface EthersSigner {
  getAddress(): Promise<string>;
  sendTransaction(tx: {
    to: string;
    data: string;
    value?: string | bigint;
    gasLimit?: number | bigint;
  }): Promise<{
    hash: string;
    wait(): Promise<any>;
  }>;
  provider?: {
    getNetwork(): Promise<{ chainId: bigint }>;
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

  supportsSignDirect(): boolean {
    return false;
  }

  supportsSignAmino(): boolean {
    return false;
  }

  supportsEvmTransaction(): boolean {
    return true;
  }
}
