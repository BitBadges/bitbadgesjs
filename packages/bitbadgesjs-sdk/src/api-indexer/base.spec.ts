import axios from 'axios';
import { BaseBitBadgesApi } from './base.js';

const KEY = 'test-secret-key-123';
const TOKEN = 'test-secret-token-456';

function makeAxiosError(withResponse: boolean) {
  const headers = { 'Content-type': 'application/json', 'x-api-key': KEY, Authorization: `Bearer ${TOKEN}` };
  const config = { method: 'post', url: `https://api.example.com/api/v0/thing?token=querysecret`, headers };
  const err: any = new Error('Request failed with status code 401');
  err.isAxiosError = true;
  err.config = config;
  err.request = { _header: `POST /api/v0/thing\r\nx-api-key: ${KEY}\r\n` };
  if (withResponse) {
    err.response = { status: 401, data: { errorMessage: 'Unauthorized' }, config, headers: {}, request: err.request };
  }
  return err;
}

describe('handleApiError', () => {
  const api = new BaseBitBadgesApi({ apiKey: KEY, apiUrl: 'https://api.example.com', convertFunction: BigInt });

  for (const withResponse of [true, false]) {
    it(`never logs or surfaces credentials (response=${withResponse})`, async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let rejected: any;
      try {
        await api.handleApiError(makeAxiosError(withResponse));
      } catch (e) {
        rejected = e;
      }
      const logged = JSON.stringify(spy.mock.calls);
      spy.mockRestore();
      expect(logged).not.toContain(KEY);
      expect(logged).not.toContain(TOKEN);
      expect(logged).not.toContain('querysecret');
      expect(logged).toContain('/api/v0/thing');
      expect(logged).toContain('POST');
      if (withResponse) expect(logged).toContain('401');
      expect(rejected).toBeDefined();
      const surfaced =
        JSON.stringify(rejected, (_k, v) => (typeof v === 'bigint' ? v.toString() : v)) + String(rejected?.config && JSON.stringify(rejected.config));
      expect(surfaced).not.toContain(KEY);
      expect(surfaced).not.toContain(TOKEN);
    });
  }
});

describe('BaseBitBadgesApi API key header', () => {
  function headerValue(headers: any): string | undefined {
    if (!headers) return undefined;
    const value = typeof headers.get === 'function' ? headers.get('x-api-key') : headers['x-api-key'];
    if (value == null || value === false || value === '') return undefined;
    return String(value);
  }

  it('sends the API key only to the configured API host', async () => {
    const api = new BaseBitBadgesApi({ apiKey: KEY, apiUrl: 'https://api.example.com', convertFunction: BigInt });
    const seen: Array<string | undefined> = [];
    api.axios.defaults.adapter = async (config) => {
      seen.push(headerValue(config.headers));
      return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
    };

    await api.axios.get('https://api.example.com/api/v0/status');
    await api.axios.get('/api/v0/search', { baseURL: 'https://api.example.com' });
    await api.axios.get('https://lcd.bitbadges.io/cosmos/auth/v1beta1/accounts/bb1');
    await api.axios.get('https://custom-node.example.com/status');

    expect(seen).toEqual([KEY, KEY, undefined, undefined]);
  });

  it('does not leave the API key on a thrown axios error', async () => {
    const api = new BaseBitBadgesApi({ apiKey: KEY, apiUrl: 'https://api.example.com', convertFunction: BigInt });
    api.axios.defaults.adapter = async (config) => {
      const request = { _header: `GET /api/v0/status HTTP/1.1\r\nx-api-key: ${KEY}\r\n` };
      const error = new axios.AxiosError('Request failed with status code 500', axios.AxiosError.ERR_BAD_RESPONSE, config, request);
      error.response = { status: 500, statusText: 'Server Error', data: { errorMessage: 'nope' }, headers: {}, config, request };
      throw error;
    };

    let thrown: any;
    try {
      await api.axios.get('https://api.example.com/api/v0/status');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeDefined();
    expect(JSON.stringify(thrown)).not.toContain(KEY);
    expect(JSON.stringify(thrown.config.headers)).not.toContain(KEY);
    expect(JSON.stringify(thrown.toJSON())).not.toContain(KEY);
    expect(JSON.stringify(thrown.request)).not.toContain(KEY);
    expect(thrown.config.headers.get('x-api-key')).toBe('[REDACTED]');
  });
});
