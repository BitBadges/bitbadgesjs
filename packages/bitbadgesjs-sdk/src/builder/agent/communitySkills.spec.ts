/**
 * Tests for createBitBadgesCommunitySkillsFetcher — injectable fetch,
 * no real network allowed.
 */

import { createBitBadgesCommunitySkillsFetcher } from './communitySkills.js';

function mockResponse(ok: boolean, body: any, status = ok ? 200 : 500): Response {
  return {
    ok,
    status,
    json: async () => body
  } as unknown as Response;
}

describe('createBitBadgesCommunitySkillsFetcher', () => {
  const origApiKey = process.env.BITBADGES_API_KEY;
  const origApiUrl = process.env.BITBADGES_API_URL;

  beforeEach(() => {
    delete process.env.BITBADGES_API_KEY;
    delete process.env.BITBADGES_API_URL;
  });

  afterAll(() => {
    if (origApiKey) process.env.BITBADGES_API_KEY = origApiKey;
    else delete process.env.BITBADGES_API_KEY;
    if (origApiUrl) process.env.BITBADGES_API_URL = origApiUrl;
    else delete process.env.BITBADGES_API_URL;
  });

  it('empty IDs → empty array, no fetch attempted', async () => {
    const fetchFn = jest.fn();
    const fetcher = createBitBadgesCommunitySkillsFetcher({ apiKey: 'k', fetchFn: fetchFn as any });
    const result = await fetcher([], 'bb1x');
    expect(result).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('no API key + no env → empty array, no fetch attempted', async () => {
    const fetchFn = jest.fn();
    const fetcher = createBitBadgesCommunitySkillsFetcher({ fetchFn: fetchFn as any });
    const result = await fetcher(['skill-1'], 'bb1x');
    expect(result).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('successful fetch returns parsed skills', async () => {
    const fetchFn = jest.fn(async () =>
      mockResponse(true, {
        success: true,
        skills: [
          { name: 'Skill A', promptText: 'Instructions for A.' },
          { name: 'Skill B', promptText: 'Instructions for B.' }
        ]
      })
    );
    const fetcher = createBitBadgesCommunitySkillsFetcher({ apiKey: 'k', fetchFn: fetchFn as any });
    const result = await fetcher(['a', 'b'], 'bb1x');
    expect(result).toEqual([
      { name: 'Skill A', promptText: 'Instructions for A.' },
      { name: 'Skill B', promptText: 'Instructions for B.' }
    ]);
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const call = fetchFn.mock.calls[0] as any[];
    const url = call[0];
    const init = call[1];
    expect(String(url)).toContain('/api/v0/builder/community-skills');
    expect(String(url)).toContain('a%2Cb');
    expect(init.headers['x-api-key']).toBe('k');
  });

  it('500 response → empty array', async () => {
    const fetchFn = jest.fn(async () => mockResponse(false, { error: 'server down' }, 500));
    const fetcher = createBitBadgesCommunitySkillsFetcher({ apiKey: 'k', fetchFn: fetchFn as any });
    expect(await fetcher(['a'], 'bb1x')).toEqual([]);
  });

  it('network error → empty array', async () => {
    const fetchFn = jest.fn(async () => {
      throw new Error('ECONNREFUSED');
    });
    const fetcher = createBitBadgesCommunitySkillsFetcher({ apiKey: 'k', fetchFn: fetchFn as any });
    expect(await fetcher(['a'], 'bb1x')).toEqual([]);
  });

  it('timeout → empty array (AbortError swallowed)', async () => {
    // Simulate timeout by returning a rejected promise when signal aborts.
    const fetchFn = jest.fn(async (_url: string, init: any) => {
      return new Promise((_resolve, reject) => {
        const signal: AbortSignal = init.signal;
        if (signal.aborted) reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      });
    });
    const fetcher = createBitBadgesCommunitySkillsFetcher({
      apiKey: 'k',
      fetchFn: fetchFn as any,
      timeoutMs: 10
    });
    const result = await fetcher(['a'], 'bb1x');
    expect(result).toEqual([]);
  });

  it('filters out entries missing name or promptText', async () => {
    const fetchFn = jest.fn(async () =>
      mockResponse(true, {
        skills: [
          { name: 'Keep', promptText: 'good' },
          { name: 'NoText' }, // missing promptText — drop
          { promptText: 'nameless' }, // missing name — drop
          null, // falsy — drop
          { name: '', promptText: 'empty name' } // empty string name — drop
        ]
      })
    );
    const fetcher = createBitBadgesCommunitySkillsFetcher({ apiKey: 'k', fetchFn: fetchFn as any });
    const result = await fetcher(['a'], 'bb1x');
    expect(result).toEqual([{ name: 'Keep', promptText: 'good' }]);
  });

  it('uses BITBADGES_API_KEY env when no explicit key', async () => {
    process.env.BITBADGES_API_KEY = 'env-key-123';
    const fetchFn = jest.fn(async () =>
      mockResponse(true, { skills: [{ name: 'X', promptText: 'Y' }] })
    );
    const fetcher = createBitBadgesCommunitySkillsFetcher({ fetchFn: fetchFn as any });
    await fetcher(['a'], 'bb1x');
    expect(fetchFn).toHaveBeenCalled();
    const call = fetchFn.mock.calls[0] as any[];
    expect(call[1].headers['x-api-key']).toBe('env-key-123');
  });

  it('uses BITBADGES_API_URL env override when no explicit URL', async () => {
    process.env.BITBADGES_API_URL = 'https://staging.bitbadges.io';
    const fetchFn = jest.fn(async () => mockResponse(true, { skills: [] }));
    const fetcher = createBitBadgesCommunitySkillsFetcher({ apiKey: 'k', fetchFn: fetchFn as any });
    await fetcher(['a'], 'bb1x');
    const call = fetchFn.mock.calls[0] as any[];
    expect(String(call[0])).toContain('https://staging.bitbadges.io');
  });

  it('missing skills field in response → empty array', async () => {
    const fetchFn = jest.fn(async () => mockResponse(true, { success: true /* no skills */ }));
    const fetcher = createBitBadgesCommunitySkillsFetcher({ apiKey: 'k', fetchFn: fetchFn as any });
    expect(await fetcher(['a'], 'bb1x')).toEqual([]);
  });
});
