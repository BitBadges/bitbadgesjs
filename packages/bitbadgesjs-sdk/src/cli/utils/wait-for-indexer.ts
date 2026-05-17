/**
 * Post-broadcast indexer-readiness poller.
 *
 * Cosmos broadcasts return `txHash` as soon as the tx lands in a block,
 * but the BitBadges indexer is eventually-consistent — it watches the
 * chain async, parses events, and writes to mongo. A caller who hits
 * `/collection/<id>` immediately after a successful broadcast can see a
 * 404 for several seconds before the doc appears.
 *
 * This helper closes that race for scripted callers: given an entity id
 * extracted from the tx events, it polls the indexer until the entity is
 * visible (HTTP 200) or until a caller-provided timeout elapses. The
 * underlying tx already broadcast successfully — the poll just confirms
 * the indexer caught up — so timeouts are *not* fatal. We surface them
 * as a soft message and let the caller move on.
 *
 * Recognized entity types (event-key → indexer endpoint):
 *   `collectionId` / `collection_id` → /collection/<id>
 *   `store_id`                       → /onChainDynamicStore/<id>
 *
 * Anything else (txs without an emitted id, e.g. delete/transfer/
 * set-approvals on existing entities) returns null from
 * `extractEntityFromEvents` and the deploy command skips polling
 * entirely. Don't add an entry here unless the chain actually emits
 * the matching event attribute on create — guessing leads to forever-404
 * polls.
 */

/** Entity types the wait-for-indexer poller knows how to look up. */
export type WaitableEntity = 'collection' | 'dynamic-store';

export interface ExtractedEntity {
  entity: WaitableEntity;
  id: string;
}

/**
 * Walk the events array from a Cosmos `tx_response` and return the first
 * recognizable `{entity, id}` pair. Returns null when nothing matches —
 * the caller MUST treat that as "skip the wait" rather than retrying or
 * failing.
 *
 * Event shape: `{type, attributes: [{key, value}]}`. Some chain modules
 * wrap attribute keys/values in double-quotes (legacy event encoding);
 * we strip those defensively so the matcher works either way.
 */
export function extractEntityFromEvents(events: any[] | undefined): ExtractedEntity | null {
  if (!Array.isArray(events)) return null;
  for (const ev of events) {
    const attrs: Array<{ key?: string; value?: string }> = ev?.attributes || [];
    for (const a of attrs) {
      if (!a?.key) continue;
      const k = a.key.replace(/"/g, '');
      const v = a.value != null ? String(a.value).replace(/"/g, '') : '';
      if (!v || v === '0') continue;
      if (k === 'collectionId' || k === 'collection_id') {
        return { entity: 'collection', id: v };
      }
      if (k === 'store_id' || k === 'storeId') {
        return { entity: 'dynamic-store', id: v };
      }
    }
  }
  return null;
}

/**
 * Surface-only entity-id extractor — DISTINCT from
 * `extractEntityFromEvents` above.
 *
 * `extractEntityFromEvents` is deliberately narrow: it only returns ids
 * the poller has a known indexer endpoint for (collection, dynamic
 * store), because returning an id with no endpoint would cause a
 * forever-404 poll. This function has the opposite goal: it does NOT
 * poll anything, it just hoists *every* recognizable id attribute out
 * of the raw tx events into a flat `{ collectionId, storeId, bidId,
 * ... }` map so callers (`tx status`, `deploy --exec`) don't have to
 * hand-parse `events[]`. Adding a key here is safe — there is no
 * endpoint lookup, so no 404 risk.
 *
 * An attribute is treated as an entity id when its key ends in `_id`
 * (snake) or `<lower>Id` (camel) with a non-empty, non-zero value.
 * Keys are normalized to camelCase; first non-zero occurrence wins.
 */
export function extractEntityIds(events: any[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!Array.isArray(events)) return out;
  for (const ev of events) {
    const attrs: Array<{ key?: string; value?: string }> = ev?.attributes || [];
    for (const a of attrs) {
      if (!a?.key) continue;
      const rawKey = a.key.replace(/"/g, '');
      if (!/(_id$|[a-z]Id$)/.test(rawKey)) continue;
      const v = a.value != null ? String(a.value).replace(/"/g, '') : '';
      if (!v || v === '0') continue;
      const camelKey = rawKey.replace(/_([a-z0-9])/g, (_m, c: string) => c.toUpperCase());
      if (!(camelKey in out)) out[camelKey] = v;
    }
  }
  return out;
}

/** Indexer path each waitable entity is fetched from. */
export function indexerPathFor(entity: ExtractedEntity): string {
  switch (entity.entity) {
    case 'collection':
      return `/collection/${encodeURIComponent(entity.id)}`;
    case 'dynamic-store':
      return `/onChainDynamicStore/${encodeURIComponent(entity.id)}`;
  }
}

export interface WaitForIndexerOptions {
  /** Full indexer base URL (already network-resolved, e.g. `https://api.bitbadges.io/api/v0`). */
  apiUrl: string;
  /** API key for `x-api-key`. Empty string is allowed on local. */
  apiKey?: string;
  /** Total wallclock budget (ms). Default 30_000. */
  timeoutMs?: number;
  /**
   * Injected `fetch` for tests. Defaults to the global. Kept narrow on
   * purpose so the helper has zero runtime deps beyond the standard
   * fetch + AbortController surface.
   */
  fetchImpl?: typeof fetch;
  /**
   * Injected `sleep` for tests so the polling loop can run synchronously.
   * Default is a real setTimeout-based delay.
   */
  sleepImpl?: (ms: number) => Promise<void>;
  /**
   * Injected wall-clock source for tests. Default is `Date.now`. Lets the
   * test harness simulate a 30s wait in microseconds.
   */
  nowImpl?: () => number;
}

export interface WaitForIndexerSuccess {
  ok: true;
  entity: WaitableEntity;
  id: string;
  attempts: number;
  elapsedMs: number;
  /** Parsed JSON body returned by the indexer. */
  body: any;
}

export interface WaitForIndexerTimeout {
  ok: false;
  entity: WaitableEntity;
  id: string;
  attempts: number;
  elapsedMs: number;
  /** Last HTTP status observed (may be 404 throughout, or e.g. 500 on a flake). */
  lastStatus?: number;
}

export type WaitForIndexerResult = WaitForIndexerSuccess | WaitForIndexerTimeout;

const DEFAULT_SLEEP = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Poll the indexer for an entity until it returns 200 or the timeout
 * elapses. Interval is 500ms for the first 3 tries, then 2_000ms after
 * that — slow-start avoids hammering the indexer for a tx that lands in
 * <1s, while the 2s cadence keeps the worst-case poll count low.
 *
 * Anything other than a network error or a 404 is also considered a
 * "not yet" — the indexer occasionally serves a 500 mid-write and a
 * follow-up retry succeeds. The error is captured as `lastStatus` for
 * the diagnostic so the caller can see "still 500 after 30s" if it
 * persisted.
 */
export async function waitForIndexer(
  target: ExtractedEntity,
  opts: WaitForIndexerOptions
): Promise<WaitForIndexerResult> {
  const fetchFn = opts.fetchImpl ?? fetch;
  const sleep = opts.sleepImpl ?? DEFAULT_SLEEP;
  const now = opts.nowImpl ?? Date.now;
  const timeoutMs = opts.timeoutMs ?? 30_000;
  const start = now();
  const url = `${opts.apiUrl}${indexerPathFor(target)}`;
  const headers: Record<string, string> = { 'x-api-key': opts.apiKey ?? '' };

  let attempts = 0;
  let lastStatus: number | undefined;

  while (true) {
    attempts++;
    let res: Response | undefined;
    try {
      res = await fetchFn(url, { method: 'GET', headers });
      lastStatus = res.status;
      if (res.ok) {
        const text = await res.text();
        let body: any;
        try {
          body = JSON.parse(text);
        } catch {
          body = { raw: text };
        }
        return {
          ok: true,
          entity: target.entity,
          id: target.id,
          attempts,
          elapsedMs: now() - start,
          body
        };
      }
    } catch {
      // Network blip — same back-off as a 404. The tx has already
      // broadcast, so this is not fatal.
      lastStatus = undefined;
    }

    const elapsed = now() - start;
    if (elapsed >= timeoutMs) {
      return {
        ok: false,
        entity: target.entity,
        id: target.id,
        attempts,
        elapsedMs: elapsed,
        lastStatus
      };
    }

    // Slow-start: first three attempts at 500ms, then 2s thereafter.
    const intervalMs = attempts < 3 ? 500 : 2_000;
    const remaining = timeoutMs - elapsed;
    await sleep(Math.min(intervalMs, remaining));
  }
}
