/**
 * Tests for the deploy command's wait-for-indexer flag.
 *
 * The deploy command's full broadcast path requires a live chain + signer;
 * those live in the integration spec. This unit spec targets the new
 * post-broadcast polling helper:
 *   - `extractEntityFromEvents`: recognizes the chain's collectionId /
 *     store_id event attributes, returns null for unrecognized txs.
 *   - `waitForIndexer`: polls the indexer with back-off, succeeds on a
 *     200, times out gracefully on persistent 404s.
 *   - `deployCommand` surface: `--wait-for-indexer` flag is wired through
 *     so flag drift surfaces in CI.
 */

import {
  extractEntityFromEvents,
  waitForIndexer
} from '../utils/wait-for-indexer.js';
import { deployCommand } from './deploy.js';

describe('extractEntityFromEvents', () => {
  it('pulls collectionId from a tx_response events array', () => {
    const events = [
      {
        type: 'message',
        attributes: [
          { key: 'sender', value: 'bb1abc' }
        ]
      },
      {
        type: 'indexer',
        attributes: [
          { key: 'collectionId', value: '42' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toEqual({ entity: 'collection', id: '42' });
  });

  it('pulls collection_id (snake_case variant) and strips quotes', () => {
    const events = [
      {
        type: 'create_collection',
        attributes: [
          { key: '"collection_id"', value: '"99"' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toEqual({ entity: 'collection', id: '99' });
  });

  it('pulls store_id and maps to dynamic-store', () => {
    const events = [
      {
        type: 'tokenization',
        attributes: [
          { key: 'store_id', value: '7' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toEqual({ entity: 'dynamic-store', id: '7' });
  });

  it('returns null when no recognizable id is present', () => {
    const events = [
      {
        type: 'message',
        attributes: [
          { key: 'sender', value: 'bb1abc' },
          { key: 'msg_type', value: 'set_incoming_approval' }
        ]
      }
    ];
    expect(extractEntityFromEvents(events)).toBeNull();
  });

  it('treats id "0" as "no entity emitted"', () => {
    const events = [
      { type: 'indexer', attributes: [{ key: 'collectionId', value: '0' }] }
    ];
    expect(extractEntityFromEvents(events)).toBeNull();
  });

  it('returns null on a missing/non-array events payload', () => {
    expect(extractEntityFromEvents(undefined)).toBeNull();
    expect(extractEntityFromEvents(null as any)).toBeNull();
    expect(extractEntityFromEvents('events' as any)).toBeNull();
  });
});

describe('waitForIndexer', () => {
  it('returns ok after a 404 → 404 → 200 sequence', async () => {
    const responses = [
      new Response('not found', { status: 404 }),
      new Response('not found', { status: 404 }),
      new Response(JSON.stringify({ collection: { id: '42', name: 'Test' } }), { status: 200 })
    ];
    let callIdx = 0;
    const sentUrls: string[] = [];
    const fetchImpl = (async (input: any) => {
      sentUrls.push(String(input));
      return responses[callIdx++];
    }) as unknown as typeof fetch;

    let nowVal = 0;
    const sleepImpl = async (ms: number) => {
      nowVal += ms;
    };
    const nowImpl = () => nowVal;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: 'k',
        timeoutMs: 30_000,
        fetchImpl,
        sleepImpl,
        nowImpl
      }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.entity).toBe('collection');
      expect(result.id).toBe('42');
      expect(result.attempts).toBe(3);
      expect(result.body).toEqual({ collection: { id: '42', name: 'Test' } });
    }
    expect(sentUrls[0]).toBe('http://test.local/collection/42');
    expect(callIdx).toBe(3);
  });

  it('hits each URL with the correct path for a dynamic-store target', async () => {
    let url = '';
    const fetchImpl = (async (input: any) => {
      url = String(input);
      return new Response('{}', { status: 200 });
    }) as unknown as typeof fetch;

    await waitForIndexer(
      { entity: 'dynamic-store', id: 'store-7' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 5_000,
        fetchImpl,
        sleepImpl: async () => undefined,
        nowImpl: () => 0
      }
    );
    expect(url).toBe('http://test.local/onChainDynamicStore/store-7');
  });

  it('times out gracefully (returns ok=false) when indexer never recovers', async () => {
    const fetchImpl = (async () =>
      new Response('not found', { status: 404 })) as unknown as typeof fetch;

    let nowVal = 0;
    const sleepImpl = async (ms: number) => {
      nowVal += ms;
    };
    const nowImpl = () => nowVal;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 5_000,
        fetchImpl,
        sleepImpl,
        nowImpl
      }
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.lastStatus).toBe(404);
      expect(result.elapsedMs).toBeGreaterThanOrEqual(5_000);
      // 500ms × 3 + 2_000ms × N should fit roughly into 5s; at minimum
      // we want more than 3 attempts to prove back-off was exercised.
      expect(result.attempts).toBeGreaterThan(3);
    }
  });

  it('survives a transient network blip mid-poll (fetch throws once, then succeeds)', async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls++;
      if (calls === 1) throw new Error('ECONNRESET');
      return new Response('{"ok":true}', { status: 200 });
    }) as unknown as typeof fetch;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 10_000,
        fetchImpl,
        sleepImpl: async () => undefined,
        nowImpl: () => 0
      }
    );
    expect(result.ok).toBe(true);
    expect(calls).toBe(2);
  });

  it('respects timeout-ms exactly: a 100ms budget exits fast with no sleep overrun', async () => {
    const fetchImpl = (async () =>
      new Response('nope', { status: 404 })) as unknown as typeof fetch;

    let nowVal = 0;
    const slept: number[] = [];
    const sleepImpl = async (ms: number) => {
      slept.push(ms);
      nowVal += ms;
    };
    const nowImpl = () => nowVal;

    const result = await waitForIndexer(
      { entity: 'collection', id: '42' },
      {
        apiUrl: 'http://test.local',
        apiKey: '',
        timeoutMs: 100,
        fetchImpl,
        sleepImpl,
        nowImpl
      }
    );
    expect(result.ok).toBe(false);
    // First sleep is min(500, 100) = 100 → second attempt → exit. No
    // sleep should ever exceed the remaining budget.
    for (const s of slept) expect(s).toBeLessThanOrEqual(100);
  });
});

describe('deployCommand surface', () => {
  it('exposes --wait-for-indexer with an optional value', () => {
    const opt = (deployCommand as any).options.find(
      (o: any) => o.long === '--wait-for-indexer'
    );
    expect(opt).toBeDefined();
    // Commander encodes "optional" args as `[name]` in flags; we just
    // assert the flag string carries brackets so future code doesn't
    // accidentally swap it to `<required>`.
    expect(String(opt.flags)).toMatch(/\[/);
  });
});
