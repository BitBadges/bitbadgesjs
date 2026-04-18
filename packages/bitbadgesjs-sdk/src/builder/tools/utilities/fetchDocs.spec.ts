/**
 * Tests for `fetch_docs`.
 *
 * Per backlog #0237, this tool now has a single source — the curated
 * `llms-full.txt` export on docs.bitbadges.io — and a single algorithm:
 * split on markdown headers, score sections by keyword, return top 3.
 *
 * We mock `global.fetch` and exercise:
 *   - successful keyword match (header bonus + body hits)
 *   - no-match miss returns a friendly error
 *   - network failure is reported, not thrown
 *   - cache hit avoids a second network call
 */

import { __resetFetchDocsCache, handleFetchDocs } from './fetchDocs.js';

const SAMPLE_LLMS_FULL = `## Overview

BitBadges is a programmable token standard.

## Approvals

Approvals describe who can transfer what between which lists. Approvals are
the core primitive for transferability. An approval specifies transfer
times, token IDs, and other criteria.

## Minting

Minting happens through approvals where the fromListId is "Mint".

## Quest

A quest rewards users with a token on completion.
`;

describe('handleFetchDocs', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    __resetFetchDocsCache();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    __resetFetchDocsCache();
  });

  function mockFetchOk(body: string) {
    const mock = jest.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => body
    }));
    (global as any).fetch = mock;
    return mock;
  }

  it('returns ranked sections when the topic matches', async () => {
    mockFetchOk(SAMPLE_LLMS_FULL);
    const res = await handleFetchDocs({ topic: 'approvals' });
    expect(res.success).toBe(true);
    expect(res.url).toBe('https://docs.bitbadges.io/llms-full.txt');
    expect(res.content).toContain('Approvals');
    // Header bonus should float the Approvals section above others that
    // also mention the word.
    const first = (res.content || '').split('---')[0];
    expect(first).toMatch(/Approvals/);
  });

  it('returns a friendly error when no section matches the topic', async () => {
    mockFetchOk(SAMPLE_LLMS_FULL);
    const res = await handleFetchDocs({ topic: 'xyznonexistentterm' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/No docs sections matched/);
    expect(res.error).toMatch(/xyznonexistentterm/);
  });

  it('reports HTTP failures without throwing', async () => {
    (global as any).fetch = jest.fn(async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => ''
    }));
    const res = await handleFetchDocs({ topic: 'anything' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Failed to fetch docs/);
    expect(res.error).toMatch(/500/);
  });

  it('reports network errors without throwing', async () => {
    (global as any).fetch = jest.fn(async () => {
      throw new Error('ECONNRESET');
    });
    const res = await handleFetchDocs({ topic: 'anything' });
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/ECONNRESET/);
  });

  it('caches the llms-full.txt body across calls within the TTL', async () => {
    const mock = mockFetchOk(SAMPLE_LLMS_FULL);
    await handleFetchDocs({ topic: 'approvals' });
    await handleFetchDocs({ topic: 'minting' });
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('short query tokens (<=2 chars) are filtered out of scoring', async () => {
    // "is" and "a" are filtered; only longer terms score. So a query of
    // "is a" against our fixture should match nothing.
    mockFetchOk(SAMPLE_LLMS_FULL);
    const res = await handleFetchDocs({ topic: 'is a' });
    expect(res.success).toBe(false);
  });
});
