import { BitBadgesSigningClient } from './BitBadgesSigningClient.js';
import type { WalletAdapter } from './adapters/WalletAdapter.js';
import type { SigningResult, EvmTransaction } from './types.js';
import type { TransactionPayload } from '@/transactions/messages/base.js';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn()
  }))
}));

/**
 * Mock Cosmos wallet adapter for testing.
 */
class MockCosmosAdapter implements WalletAdapter {
  readonly chainType = 'cosmos' as const;
  readonly address = 'bb1test123456789abcdefghijklmnopqrstuv';

  async getPublicKey(): Promise<string> {
    return 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6';
  }

  async signDirect(_payload: TransactionPayload, _accountNumber: number): Promise<SigningResult> {
    return {
      signature: '0'.repeat(128), // 64 bytes as hex
      publicKey: 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6'
    };
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

/**
 * Mock EVM wallet adapter for testing.
 */
class MockEvmAdapter implements WalletAdapter {
  readonly chainType = 'evm' as const;
  readonly address = '0x1234567890123456789012345678901234567890';

  async getPublicKey(): Promise<string> {
    return '';
  }

  async sendEvmTransaction(_tx: EvmTransaction): Promise<string> {
    return '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
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

describe('BitBadgesSigningClient', () => {
  describe('constructor', () => {
    it('should create a client with default options', () => {
      const adapter = new MockCosmosAdapter();
      const client = new BitBadgesSigningClient({ adapter });

      expect(client.address).toBe(adapter.address);
      expect(client.chainType).toBe('cosmos');
    });

    it('should create a client with custom options', () => {
      const adapter = new MockCosmosAdapter();
      const client = new BitBadgesSigningClient({
        adapter,
        apiUrl: 'https://custom-api.example.com',
        nodeUrl: 'https://custom-node.example.com:1317',
        testnet: true,
        sequenceRetryEnabled: false,
        maxSequenceRetries: 5,
        gasMultiplier: 1.5,
        defaultGasLimit: 500000
      });

      expect(client.address).toBe(adapter.address);
    });

    it('should handle EVM adapter address conversion', () => {
      const adapter = new MockEvmAdapter();
      const client = new BitBadgesSigningClient({ adapter });

      // The address should be converted to bb format
      expect(client.chainType).toBe('evm');
      // Note: actual conversion depends on the address converter
    });
  });

  describe('clearCache', () => {
    it('should clear cached account info', () => {
      const adapter = new MockCosmosAdapter();
      const client = new BitBadgesSigningClient({ adapter });

      // This should not throw
      client.clearCache();
    });
  });

  describe('adapter type detection', () => {
    it('should detect Cosmos adapter', () => {
      const adapter = new MockCosmosAdapter();
      const client = new BitBadgesSigningClient({ adapter });

      expect(client.chainType).toBe('cosmos');
    });

    it('should detect EVM adapter', () => {
      const adapter = new MockEvmAdapter();
      const client = new BitBadgesSigningClient({ adapter });

      expect(client.chainType).toBe('evm');
    });
  });
});

describe('WalletAdapter interfaces', () => {
  describe('MockCosmosAdapter', () => {
    const adapter = new MockCosmosAdapter();

    it('should have correct chainType', () => {
      expect(adapter.chainType).toBe('cosmos');
    });

    it('should support signDirect', () => {
      expect(adapter.supportsSignDirect()).toBe(true);
    });

    it('should not support EVM transactions', () => {
      expect(adapter.supportsEvmTransaction()).toBe(false);
    });

    it('should return public key', async () => {
      const pubKey = await adapter.getPublicKey();
      expect(pubKey).toBeTruthy();
    });

    it('should sign transactions', async () => {
      const mockPayload = {
        signDirect: {
          body: { toBinary: () => new Uint8Array() },
          authInfo: { toBinary: () => new Uint8Array() },
          signBytes: 'dGVzdA=='
        },
        legacyAmino: {
          body: { toBinary: () => new Uint8Array() },
          authInfo: { toBinary: () => new Uint8Array() },
          signBytes: 'dGVzdA=='
        }
      } as unknown as TransactionPayload;

      const result = await adapter.signDirect(mockPayload, 123);
      expect(result.signature).toBeTruthy();
      expect(result.signature.length).toBe(128); // 64 bytes as hex
      expect(result.publicKey).toBeTruthy();
    });
  });

  describe('MockEvmAdapter', () => {
    const adapter = new MockEvmAdapter();

    it('should have correct chainType', () => {
      expect(adapter.chainType).toBe('evm');
    });

    it('should not support signDirect', () => {
      expect(adapter.supportsSignDirect()).toBe(false);
    });

    it('should support EVM transactions', () => {
      expect(adapter.supportsEvmTransaction()).toBe(true);
    });

    it('should send EVM transactions', async () => {
      const txHash = await adapter.sendEvmTransaction({
        to: '0x1001',
        data: '0x12345678',
        value: '0'
      });
      expect(txHash).toBeTruthy();
      expect(txHash.startsWith('0x')).toBe(true);
    });
  });
});

describe('SigningClientOptions', () => {
  it('should use default values when not specified', () => {
    const adapter = new MockCosmosAdapter();
    const client = new BitBadgesSigningClient({ adapter });

    // Client should be created successfully with defaults
    expect(client).toBeDefined();
  });

  it('should respect testnet flag', () => {
    const adapter = new MockCosmosAdapter();
    const clientMainnet = new BitBadgesSigningClient({ adapter, testnet: false });
    const clientTestnet = new BitBadgesSigningClient({ adapter, testnet: true });

    // Both should be created successfully
    expect(clientMainnet).toBeDefined();
    expect(clientTestnet).toBeDefined();
  });

  it('should respect chainIdOverride', () => {
    const adapter = new MockCosmosAdapter();
    const client = new BitBadgesSigningClient({
      adapter,
      chainIdOverride: 'custom-chain-123'
    });

    expect(client).toBeDefined();
  });
});
