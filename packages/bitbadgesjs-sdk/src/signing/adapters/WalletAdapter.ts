import type { EvmTransaction, SigningResult } from '../types.js';
import type { TransactionPayload } from '@/transactions/messages/base.js';
import type { EIP712TypedData } from '@/eip712/types.js';

/**
 * Base interface for wallet adapters.
 * Wallet adapters provide a unified interface for different wallet types (Cosmos, EVM).
 *
 * Implementations must support either Cosmos signing (signDirect) or EVM transactions (sendEvmTransaction).
 *
 * @category Signing
 */
export interface WalletAdapter {
  /** The chain type this adapter supports */
  readonly chainType: 'cosmos' | 'evm';

  /** The address managed by this adapter (BitBadges bb-prefixed for Cosmos, 0x for EVM) */
  readonly address: string;

  /**
   * Get the public key in base64 format.
   * Required for Cosmos transactions (used to build the auth info).
   * Returns empty string for EVM-only adapters.
   */
  getPublicKey(): Promise<string>;

  /**
   * Sign a transaction using Cosmos SignDirect format.
   * Only implemented by Cosmos wallet adapters.
   *
   * @param payload - The transaction payload containing signBytes
   * @param accountNumber - The account number on the blockchain
   * @returns The signature and public key
   */
  signDirect?(payload: TransactionPayload, accountNumber: number): Promise<SigningResult>;

  /**
   * Send an EVM transaction.
   * Only implemented by EVM wallet adapters.
   *
   * @param tx - The EVM transaction to send
   * @returns The transaction hash
   */
  sendEvmTransaction?(tx: EvmTransaction): Promise<string>;

  /**
   * Estimate gas for an EVM transaction.
   * Only implemented by EVM wallet adapters with a provider connection.
   */
  estimateEvmGas?(tx: EvmTransaction): Promise<bigint>;

  /**
   * Sign EIP-712 typed-data with the wallet.
   * Only implemented by EVM wallet adapters; lets BitBadges Cosmos
   * messages be signed via the standard EVM signing flow
   * (`eth_signTypedData_v4` / `Signer.signTypedData`) so any EVM
   * wallet can produce a valid Cosmos transaction signature.
   * Returns a `0x...`-prefixed 65-byte hex signature (r || s || v).
   */
  signTypedData?(typed: EIP712TypedData): Promise<string>;

  /** Check if the adapter supports SignDirect signing */
  supportsSignDirect(): boolean;

  /** Check if the adapter supports Amino signing (legacy) */
  supportsSignAmino(): boolean;

  /** Check if the adapter supports EVM transactions */
  supportsEvmTransaction(): boolean;

  /** Check if the adapter supports EIP-712 typed-data signing */
  supportsSignTypedData(): boolean;
}

/**
 * Abstract base class for wallet adapters with common functionality.
 *
 * @category Signing
 */
export abstract class BaseWalletAdapter implements WalletAdapter {
  abstract readonly chainType: 'cosmos' | 'evm';
  abstract readonly address: string;

  abstract getPublicKey(): Promise<string>;

  signDirect?(payload: TransactionPayload, accountNumber: number): Promise<SigningResult>;
  sendEvmTransaction?(tx: EvmTransaction): Promise<string>;
  estimateEvmGas?(tx: EvmTransaction): Promise<bigint>;
  signTypedData?(typed: EIP712TypedData): Promise<string>;

  supportsSignDirect(): boolean {
    return typeof this.signDirect === 'function';
  }

  supportsSignAmino(): boolean {
    return false;
  }

  supportsEvmTransaction(): boolean {
    return typeof this.sendEvmTransaction === 'function';
  }

  supportsSignTypedData(): boolean {
    return typeof this.signTypedData === 'function';
  }
}
