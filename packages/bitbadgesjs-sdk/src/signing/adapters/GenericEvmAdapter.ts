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
}

/**
 * Minimal EIP-1193 provider interface (window.ethereum).
 */
interface EIP1193Provider {
  request(args: { method: string; params?: any[] }): Promise<any>;
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
   * Create an adapter from an ethers.js Signer (v6).
   *
   * @param signer - An ethers.js Signer instance
   * @returns A new GenericEvmAdapter connected to the signer
   */
  static async fromSigner(signer: EthersSigner): Promise<GenericEvmAdapter> {
    const address = await signer.getAddress();
    return new GenericEvmAdapter(address, signer);
  }

  /**
   * Create an adapter from an EIP-1193 provider (like window.ethereum).
   *
   * @param provider - An EIP-1193 compliant provider
   * @returns A new GenericEvmAdapter connected to the provider
   */
  static async fromProvider(provider: EIP1193Provider): Promise<GenericEvmAdapter> {
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
   * @returns A new GenericEvmAdapter connected to the browser wallet
   */
  static async fromBrowserWallet(): Promise<GenericEvmAdapter> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask or another wallet.');
    }
    return GenericEvmAdapter.fromProvider((window as any).ethereum);
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
