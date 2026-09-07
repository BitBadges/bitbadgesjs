/**
 * `get_review_url` — the last step of an agent build. Uploads the session
 * transaction to the open preview endpoint and returns a SHORT link the
 * user opens to review + sign on bitbadges.io. Short on purpose: an LLM
 * relaying a multi-KB `#tx=` hash URL would corrupt it.
 */
import { handleGetReviewUrl } from './getReviewUrl.js';
import { getOrCreateSession, resetAllSessions, setCollectionMetadata } from '../../session/sessionState.js';

describe('handleGetReviewUrl', () => {
  const originalFetch = global.fetch;
  const originalEnv = { ...process.env };
  let calls: Array<{ url: string; init: any }> = [];

  beforeEach(() => {
    resetAllSessions();
    calls = [];
    delete process.env.BITBADGES_API_URL;
    delete process.env.BITBADGES_FRONTEND_URL;
    (global as any).fetch = jest.fn(async (url: string, init: any) => {
      calls.push({ url, init });
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, code: 'prv_a1b2c3d4', expiresAt: 1, expiresIn: '1h' }),
        text: async () => ''
      };
    });
  });
  afterAll(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it('uploads the session tx and returns review + preview URLs for a create', async () => {
    getOrCreateSession('ses_r1', 'bb1test');
    setCollectionMetadata('ses_r1', 'Test', 'desc', 'https://x/img.png');
    const res = await handleGetReviewUrl({ sessionId: 'ses_r1', creatorAddress: 'bb1test' });
    expect(res.success).toBe(true);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe('https://api.bitbadges.io/api/v0/builder/preview');
    const body = JSON.parse(calls[0].init.body);
    expect(Array.isArray(body.transaction.messages)).toBe(true);
    expect(body.transaction.messages[0].typeUrl).toMatch(/MsgCreateCollection$/);
    expect(res.code).toBe('prv_a1b2c3d4');
    expect(res.reviewUrl).toBe('https://bitbadges.io/mint/local-builder?code=prv_a1b2c3d4');
    expect(res.previewUrl).toBe('https://bitbadges.io/builder/preview?code=prv_a1b2c3d4');
    expect(res.expiresIn).toBe('1h');
  });

  it('accepts an explicit transaction, routes updates to /update/local-builder/:id, and honors env overrides', async () => {
    process.env.BITBADGES_API_URL = 'https://api.bitbadges.io/testnet';
    process.env.BITBADGES_FRONTEND_URL = 'https://testnet.bitbadges.io/';
    const transaction = { messages: [{ typeUrl: '/tokenization.MsgUpdateCollection', value: { collectionId: '42' } }] };
    const res = await handleGetReviewUrl({ transaction });
    expect(calls[0].url).toBe('https://api.bitbadges.io/testnet/api/v0/builder/preview');
    expect(res.reviewUrl).toBe('https://testnet.bitbadges.io/update/local-builder/42?code=prv_a1b2c3d4');
  });

  it('infers the testnet frontend from a testnet API URL when no frontend override is set', async () => {
    process.env.BITBADGES_API_URL = 'https://api.bitbadges.io/testnet';
    const res = await handleGetReviewUrl({ transaction: { messages: [{ typeUrl: '/tokenization.MsgCreateCollection', value: {} }] } });
    expect(res.reviewUrl).toBe('https://testnet.bitbadges.io/mint/local-builder?code=prv_a1b2c3d4');
  });

  it('returns a structured error when the upload fails', async () => {
    (global as any).fetch = jest.fn(async () => ({ ok: false, status: 503, text: async () => 'down', json: async () => ({}) }));
    const res = await handleGetReviewUrl({ transaction: { messages: [{ typeUrl: '/tokenization.MsgCreateCollection', value: {} }] } });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/503/);
  });

  it('rejects an empty transaction without calling the network', async () => {
    const res = await handleGetReviewUrl({ transaction: { messages: [] } });
    expect(res.success).toBe(false);
    expect(calls).toHaveLength(0);
  });
});
