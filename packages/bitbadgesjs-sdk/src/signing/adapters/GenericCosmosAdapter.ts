import { convertToBitBadgesAddress } from '@/address-converter/converter.js';
import { BaseWalletAdapter, type WalletAdapter } from './WalletAdapter.js';
import type { SigningResult } from '../types.js';
import type { TransactionPayload } from '@/transactions/messages/base.js';

/**
 * Keplr window interface (subset of full interface).
 * Users should install @keplr-wallet/types for full type support.
 */
interface KeplrLike {
  enable(chainId: string): Promise<void>;
  getKey(chainId: string): Promise<{
    name: string;
    algo: string;
    pubKey: Uint8Array;
    address: Uint8Array;
    bech32Address: string;
    isNanoLedger: boolean;
  }>;
  signDirect(
    chainId: string,
    signer: string,
    signDoc: {
      bodyBytes: Uint8Array;
      authInfoBytes: Uint8Array;
      chainId: string;
      accountNumber: bigint | string;
    },
    signOptions?: {
      preferNoSetFee?: boolean;
      preferNoSetMemo?: boolean;
      disableBalanceCheck?: boolean;
    }
  ): Promise<{
    signed: {
      bodyBytes: Uint8Array;
      authInfoBytes: Uint8Array;
      chainId: string;
      accountNumber: string;
    };
    signature: {
      pub_key: {
        type: string;
        value: string;
      };
      signature: string;
    };
  }>;
}

// Use the 'long' library for proper Keplr compatibility

/**
 * Internal signing strategy interface.
 */
interface SigningStrategy {
  sign(signBytes: Uint8Array, chainId: string, address: string, accountNumber: number): Promise<SigningResult>;
}

/**
 * Sign document structure for Keplr-like wallets.
 */
interface KeplrSignDoc {
  bodyBytes: Uint8Array;
  authInfoBytes: Uint8Array;
  chainId: string;
  accountNumber: bigint;
}

/**
 * Browser wallet signing strategy (Keplr, Leap, etc.)
 */
class BrowserWalletStrategy implements SigningStrategy {
  constructor(
    private wallet: KeplrLike,
    private chainId: string
  ) {}

  async sign(_signBytes: Uint8Array, _chainId: string, address: string, _accountNumber: number): Promise<SigningResult> {
    // This method is not used for browser wallets - signWithDoc is used instead
    throw new Error('BrowserWalletStrategy.sign should not be called directly. Use signWithDoc instead.');
  }

  async signWithDoc(signDoc: KeplrSignDoc, address: string): Promise<SigningResult> {
    const result = await this.wallet.signDirect(this.chainId, address, signDoc, {
      preferNoSetFee: true,
      preferNoSetMemo: true
    });

    const signatureBytes = Buffer.from(result.signature.signature, 'base64');
    const signatureHex = signatureBytes.toString('hex');

    return {
      signature: signatureHex,
      publicKey: result.signature.pub_key.value
    };
  }
}

/**
 * Direct key signing strategy (mnemonic/private key)
 */
class DirectKeyStrategy implements SigningStrategy {
  constructor(
    private signFn: (digest: Uint8Array) => { r: string; s: string },
    private publicKeyBase64: string
  ) {}

  async sign(signBytes: Uint8Array, _chainId: string, _address: string, _accountNumber: number): Promise<SigningResult> {
    const signature = this.signFn(signBytes);

    let r = signature.r.startsWith('0x') ? signature.r.slice(2) : signature.r;
    let s = signature.s.startsWith('0x') ? signature.s.slice(2) : signature.s;

    r = r.padStart(64, '0');
    s = s.padStart(64, '0');

    return {
      signature: r + s,
      publicKey: this.publicKeyBase64
    };
  }
}

/**
 * Configuration options for the GenericCosmosAdapter.
 */
export interface GenericCosmosAdapterConfig {
  /** The chain ID to use (e.g., 'bitbadges-1') */
  chainId: string;
  /** Optional prefix for bech32 addresses. Default: 'bb' */
  prefix?: string;
}

/**
 * GenericCosmosAdapter provides wallet adapter functionality for Cosmos signing.
 *
 * Supports both browser wallets (Keplr, Leap, Cosmostation) and server-side
 * signing with mnemonic or private key.
 *
 * @example
 * ```typescript
 * // Browser wallet (Keplr)
 * const adapter = await GenericCosmosAdapter.fromKeplr('bitbadges-1');
 *
 * // Browser wallet (Leap)
 * const adapter = await GenericCosmosAdapter.fromLeap('bitbadges-1');
 *
 * // Server-side with mnemonic
 * const adapter = await GenericCosmosAdapter.fromMnemonic('word1 word2 ...', 'bitbadges-1');
 *
 * // Server-side with private key
 * const adapter = await GenericCosmosAdapter.fromPrivateKey('0x...', 'bitbadges-1');
 *
 * // Use with signing client
 * const client = new BitBadgesSigningClient({ adapter });
 * ```
 *
 * @category Signing
 */
export class GenericCosmosAdapter extends BaseWalletAdapter implements WalletAdapter {
  readonly chainType = 'cosmos' as const;
  readonly address: string;

  private readonly chainId: string;
  private readonly prefix: string;
  private readonly publicKeyBase64: string;
  private readonly signingStrategy: SigningStrategy;
  private readonly isBrowserWallet: boolean;

  private constructor(
    address: string,
    publicKey: string,
    config: GenericCosmosAdapterConfig,
    signingStrategy: SigningStrategy,
    isBrowserWallet = false
  ) {
    super();
    this.address = address;
    this.publicKeyBase64 = publicKey;
    this.chainId = config.chainId;
    this.prefix = config.prefix || 'bb';
    this.signingStrategy = signingStrategy;
    this.isBrowserWallet = isBrowserWallet;
  }

  // ==================== Browser Wallet Factory Methods ====================

  /**
   * Create an adapter from Keplr wallet.
   *
   * @param chainId - The chain ID to connect to
   * @returns A new GenericCosmosAdapter connected to Keplr
   */
  static async fromKeplr(chainId: string): Promise<GenericCosmosAdapter> {
    if (typeof window === 'undefined' || !(window as any).keplr) {
      throw new Error('Keplr wallet not found. Please install Keplr extension.');
    }
    return GenericCosmosAdapter.fromBrowserWallet((window as any).keplr, chainId);
  }

  /**
   * Create an adapter from Leap wallet.
   *
   * @param chainId - The chain ID to connect to
   * @returns A new GenericCosmosAdapter connected to Leap
   */
  static async fromLeap(chainId: string): Promise<GenericCosmosAdapter> {
    if (typeof window === 'undefined' || !(window as any).leap) {
      throw new Error('Leap wallet not found. Please install Leap extension.');
    }
    return GenericCosmosAdapter.fromBrowserWallet((window as any).leap, chainId);
  }

  /**
   * Create an adapter from Cosmostation wallet.
   *
   * @param chainId - The chain ID to connect to
   * @returns A new GenericCosmosAdapter connected to Cosmostation
   */
  static async fromCosmostation(chainId: string): Promise<GenericCosmosAdapter> {
    if (typeof window === 'undefined' || !(window as any).cosmostation?.providers?.keplr) {
      throw new Error('Cosmostation wallet not found. Please install Cosmostation extension.');
    }
    return GenericCosmosAdapter.fromBrowserWallet((window as any).cosmostation.providers.keplr, chainId);
  }

  /**
   * Create an adapter from any Keplr-compatible wallet interface.
   *
   * @param wallet - A Keplr-compatible wallet instance
   * @param chainId - The chain ID to connect to
   * @param prefix - Optional address prefix (default: 'bb')
   * @returns A new GenericCosmosAdapter connected to the wallet
   */
  static async fromBrowserWallet(wallet: KeplrLike, chainId: string, prefix = 'bb'): Promise<GenericCosmosAdapter> {
    await wallet.enable(chainId);

    const keyInfo = await wallet.getKey(chainId);

    let address = keyInfo.bech32Address;
    if (!address.startsWith(prefix)) {
      address = convertToBitBadgesAddress(address);
    }

    const publicKeyBase64 = Buffer.from(keyInfo.pubKey).toString('base64');

    const strategy = new BrowserWalletStrategy(wallet, chainId);

    return new GenericCosmosAdapter(address, publicKeyBase64, { chainId, prefix }, strategy, true);
  }

  /**
   * @deprecated Use fromBrowserWallet instead
   */
  static async fromWallet(wallet: KeplrLike, chainId: string, prefix = 'bb'): Promise<GenericCosmosAdapter> {
    return GenericCosmosAdapter.fromBrowserWallet(wallet, chainId, prefix);
  }

  // ==================== Server-Side Factory Methods ====================

  /**
   * Create an adapter from a mnemonic phrase (server-side).
   *
   * **Security Note**: Only use in secure server-side environments.
   *
   * @param mnemonic - The BIP-39 mnemonic phrase (12 or 24 words)
   * @param chainId - The chain ID to use
   * @param prefix - Optional address prefix (default: 'bb')
   * @returns A new GenericCosmosAdapter for server-side signing
   */
  static async fromMnemonic(mnemonic: string, chainId: string, prefix = 'bb'): Promise<GenericCosmosAdapter> {
    const { HDNodeWallet } = await import('ethers');
    const wallet = HDNodeWallet.fromPhrase(mnemonic);
    return GenericCosmosAdapter.createFromEthersWallet(wallet, chainId, prefix);
  }

  /**
   * Create an adapter from a private key (server-side).
   *
   * **Security Note**: Only use in secure server-side environments.
   *
   * @param privateKey - The private key (hex string, with or without 0x prefix)
   * @param chainId - The chain ID to use
   * @param prefix - Optional address prefix (default: 'bb')
   * @returns A new GenericCosmosAdapter for server-side signing
   */
  static async fromPrivateKey(privateKey: string, chainId: string, prefix = 'bb'): Promise<GenericCosmosAdapter> {
    const { Wallet } = await import('ethers');
    const wallet = new Wallet(privateKey);
    return GenericCosmosAdapter.createFromEthersWallet(wallet, chainId, prefix);
  }

  /**
   * Internal method to create adapter from ethers wallet.
   */
  private static async createFromEthersWallet(
    wallet: { address: string; signingKey: { publicKey: string; sign(digest: string | Uint8Array): { r: string; s: string } } },
    chainId: string,
    prefix: string
  ): Promise<GenericCosmosAdapter> {
    const address = convertToBitBadgesAddress(wallet.address);
    if (!address) {
      throw new Error('Failed to convert address to BitBadges format');
    }

    const compressedPubKey = GenericCosmosAdapter.compressPublicKey(wallet.signingKey.publicKey);
    const publicKeyBase64 = Buffer.from(compressedPubKey, 'hex').toString('base64');

    const strategy = new DirectKeyStrategy((digest: Uint8Array) => wallet.signingKey.sign(digest), publicKeyBase64);

    return new GenericCosmosAdapter(address, publicKeyBase64, { chainId, prefix }, strategy);
  }

  /**
   * Compress an uncompressed public key (65 bytes) to compressed format (33 bytes).
   */
  private static compressPublicKey(uncompressedPubKey: string): string {
    let pubKey = uncompressedPubKey.startsWith('0x') ? uncompressedPubKey.slice(2) : uncompressedPubKey;

    if (pubKey.length === 66 && (pubKey.startsWith('02') || pubKey.startsWith('03'))) {
      return pubKey;
    }

    if (pubKey.length !== 130 || !pubKey.startsWith('04')) {
      throw new Error('Invalid uncompressed public key format');
    }

    const x = pubKey.slice(2, 66);
    const y = pubKey.slice(66);
    const yLastByte = parseInt(y.slice(-2), 16);
    const prefix = yLastByte % 2 === 0 ? '02' : '03';

    return prefix + x;
  }

  // ==================== WalletAdapter Interface ====================

  async getPublicKey(): Promise<string> {
    return this.publicKeyBase64;
  }

  async signDirect(payload: TransactionPayload, accountNumber: number): Promise<SigningResult> {
    // For browser wallets, we need to use the full signDirect flow with Keplr
    if (this.isBrowserWallet) {
      const signDoc: KeplrSignDoc = {
        bodyBytes: payload.signDirect.body.toBinary(),
        authInfoBytes: payload.signDirect.authInfo.toBinary(),
        chainId: this.chainId,
        accountNumber: BigInt(accountNumber)
      };

      const strategy = this.signingStrategy as BrowserWalletStrategy;
      return strategy.signWithDoc(signDoc, this.address);
    }

    // For direct key signing, we sign the signBytes hash
    const signBytesBase64 = payload.signDirect.signBytes;
    const signBytesBuffer = Buffer.from(signBytesBase64, 'base64');
    return this.signingStrategy.sign(signBytesBuffer, this.chainId, this.address, accountNumber);
  }

  supportsSignDirect(): boolean {
    return true;
  }

  supportsSignAmino(): boolean {
    return false;
  }

  supportsEvmTransaction(): boolean {
    return false;
  }
}
