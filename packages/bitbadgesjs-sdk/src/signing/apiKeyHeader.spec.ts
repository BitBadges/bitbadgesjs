import { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { BitBadgesSigningClient } from './BitBadgesSigningClient.js';
import type { WalletAdapter } from './adapters/WalletAdapter.js';

const KEY = 'bb-test-api-key-9f3c2a7e';

const ORIGINAL_API_KEY = process.env.BITBADGES_API_KEY;

afterEach(() => {
  if (ORIGINAL_API_KEY === undefined) delete process.env.BITBADGES_API_KEY;
  else process.env.BITBADGES_API_KEY = ORIGINAL_API_KEY;
});

class MockCosmosAdapter implements WalletAdapter {
  readonly chainType = 'cosmos' as const;
  readonly address = 'bb1test123456789abcdefghijklmnopqrstuv';
  async getPublicKey(): Promise<string> {
    return 'pub';
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
  supportsSignTypedData(): boolean {
    return false;
  }
}

function apiKeyHeader(headers: any): string | undefined {
  if (!headers) return undefined;
  const value = typeof headers.get === 'function' ? headers.get('x-api-key') : headers['x-api-key'];
  if (value == null || value === false || value === '') return undefined;
  return String(value);
}

function client(options: { apiUrl?: string; nodeUrl?: string; apiKey?: string } = {}) {
  delete process.env.BITBADGES_API_KEY;
  return new BitBadgesSigningClient({
    adapter: new MockCosmosAdapter(),
    apiKey: options.apiKey === undefined ? KEY : options.apiKey,
    apiUrl: options.apiUrl ?? 'https://api.bitbadges.io',
    nodeUrl: options.nodeUrl ?? 'https://lcd.bitbadges.io'
  });
}

function http(signingClient: BitBadgesSigningClient): AxiosInstance {
  return (signingClient as any).axiosInstance;
}

function capture(signingClient: BitBadgesSigningClient) {
  const seen: { url?: string; baseURL?: string; key?: string }[] = [];
  http(signingClient).defaults.adapter = async (config) => {
    seen.push({ url: config.url, baseURL: config.baseURL, key: apiKeyHeader(config.headers) });
    return { data: { account: { account_number: '1', sequence: '0', pub_key: { key: 'abc' } } }, status: 200, statusText: 'OK', headers: {}, config };
  };
  return seen;
}

describe('BitBadgesSigningClient API key header', () => {
  it('sends the API key header on requests to the configured API host', async () => {
    const signingClient = client({ apiUrl: 'https://indexer.example.com' });
    const seen = capture(signingClient);
    const instance = http(signingClient);

    await instance.get('https://indexer.example.com/api/v0/status');
    await instance.get('/api/v0/status', { baseURL: 'https://indexer.example.com' });
    await instance.get('https://indexer.example.com:443/api/v0/simulate');
    instance.defaults.baseURL = 'https://indexer.example.com/indexer';
    await instance.post('api/v0/broadcast', {});

    expect(seen.map((call) => call.key)).toEqual([KEY, KEY, KEY, KEY]);
  });

  it('omits the API key header on LCD, RPC, and custom node requests', async () => {
    const signingClient = client({
      apiUrl: 'https://api.bitbadges.io',
      nodeUrl: 'https://custom-node.example.com:1317'
    });
    const seen = capture(signingClient);
    const instance = http(signingClient);

    await signingClient.getAccountInfo(true);
    await instance.get('https://lcd.bitbadges.io/cosmos/base/tendermint/v1beta1/node_info');
    await instance.get('https://custom-node.example.com:1317/cosmos/auth/v1beta1/accounts/bb1');
    await instance.get('https://evm-rpc.bitbadges.io/');
    await instance.get('https://api.bitbadges.io.evil.com/api/v0/status');
    await instance.get('/cosmos/base/tendermint/v1beta1/node_info', { baseURL: 'https://lcd.bitbadges.io' });
    await instance.get('//custom-node.example.com/status', { baseURL: 'https://api.bitbadges.io' });
    await instance.get('http://127.0.0.1:1317/cosmos/auth/v1beta1/accounts/bb1');

    expect(seen[0].url).toContain('https://custom-node.example.com:1317/cosmos/auth/v1beta1/accounts/');
    expect(seen.map((call) => call.key)).toEqual([undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined]);
  });

  it('keeps the API key off a different port of the same hostname', async () => {
    const signingClient = client({ apiUrl: 'http://127.0.0.1:3001', nodeUrl: 'http://127.0.0.1:1317' });
    const seen = capture(signingClient);
    const instance = http(signingClient);

    await instance.get('http://127.0.0.1:3001/api/v0/status');
    await instance.get('http://127.0.0.1:1317/cosmos/auth/v1beta1/accounts/bb1');

    expect(seen.map((call) => call.key)).toEqual([KEY, undefined]);
  });

  it('does not leave the API key on a thrown axios error', async () => {
    const signingClient = client();
    const instance = http(signingClient);
    let seenByAdapter: string | undefined;

    instance.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      seenByAdapter = apiKeyHeader(config.headers);
      const request = { _header: `POST /api/v0/simulate HTTP/1.1\r\nx-api-key: ${KEY}\r\nAuthorization: Bearer ${KEY}\r\n` };
      const error = new AxiosError('Request failed with status code 500', AxiosError.ERR_BAD_RESPONSE, config, request);
      error.response = {
        status: 500,
        statusText: 'Server Error',
        data: { errorMessage: 'nope' },
        headers: { 'x-api-key': KEY },
        config,
        request
      };
      throw error;
    };

    let thrown: any;
    try {
      await instance.post('https://api.bitbadges.io/api/v0/simulate', { ping: true });
    } catch (error) {
      thrown = error;
    }

    expect(seenByAdapter).toBe(KEY);
    expect(thrown).toBeDefined();
    expect(apiKeyHeader(thrown.config.headers)).toBe('[REDACTED]');
    expect(JSON.stringify(thrown)).not.toContain(KEY);
    expect(JSON.stringify(thrown.config.headers)).not.toContain(KEY);
    expect(JSON.stringify(thrown.toJSON())).not.toContain(KEY);
    expect(JSON.stringify(thrown.request)).not.toContain(KEY);
    expect(JSON.stringify(thrown.response.config)).not.toContain(KEY);
    expect(JSON.stringify(thrown.response.headers)).not.toContain(KEY);
    expect(thrown.request._header).toContain('[REDACTED]');
  });
});
