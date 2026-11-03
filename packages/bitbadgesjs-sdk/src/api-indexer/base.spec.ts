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
