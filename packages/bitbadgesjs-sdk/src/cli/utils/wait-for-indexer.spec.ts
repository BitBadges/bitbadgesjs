/**
 * Tests for the surface-only `extractEntityIds` hoister (#0443).
 * The narrow polling extractor `extractEntityFromEvents` is exercised
 * indirectly by the deploy specs; this locks the broad id-map behavior.
 */

import { extractEntityIds, extractEntityFromEvents } from './wait-for-indexer.js';

describe('extractEntityIds (#0443 — surface-only id hoister)', () => {
  it('hoists collectionId, storeId and bidId from mixed events', () => {
    const events = [
      { type: 'create_collection', attributes: [{ key: 'collection_id', value: '42' }] },
      { type: 'create_dynamic_store', attributes: [{ key: 'store_id', value: '7' }] },
      { type: 'place_bid', attributes: [{ key: 'bid_id', value: '900' }] }
    ];
    expect(extractEntityIds(events)).toEqual({
      collectionId: '42',
      storeId: '7',
      bidId: '900'
    });
  });

  it('normalizes snake_case keys to camelCase and accepts camelCase as-is', () => {
    const events = [
      { type: 'x', attributes: [{ key: 'collection_id', value: '1' }] },
      { type: 'y', attributes: [{ key: 'bidId', value: '2' }] }
    ];
    expect(extractEntityIds(events)).toEqual({ collectionId: '1', bidId: '2' });
  });

  it('skips zero / empty values and strips quote-wrapped keys/values', () => {
    const events = [
      { type: 'a', attributes: [{ key: '"collection_id"', value: '"0"' }] },
      { type: 'b', attributes: [{ key: 'collection_id', value: '55' }] },
      { type: 'c', attributes: [{ key: 'store_id', value: '' }] }
    ];
    // First collection_id is '0' (skipped); the second non-zero one wins.
    expect(extractEntityIds(events)).toEqual({ collectionId: '55' });
  });

  it('first non-zero occurrence wins', () => {
    const events = [
      { type: 'a', attributes: [{ key: 'collection_id', value: '10' }] },
      { type: 'b', attributes: [{ key: 'collection_id', value: '20' }] }
    ];
    expect(extractEntityIds(events)).toEqual({ collectionId: '10' });
  });

  it('ignores non-id attributes and returns {} for missing / non-array input', () => {
    expect(
      extractEntityIds([{ type: 'transfer', attributes: [{ key: 'amount', value: '5' }] }])
    ).toEqual({});
    expect(extractEntityIds(undefined)).toEqual({});
    expect(extractEntityIds(null as any)).toEqual({});
  });

  it('does not broaden the narrow polling extractor', () => {
    // bid_id has no poll endpoint — extractEntityFromEvents must still
    // return null for it (only collection / dynamic-store are poll-able).
    const events = [{ type: 'place_bid', attributes: [{ key: 'bid_id', value: '900' }] }];
    expect(extractEntityFromEvents(events)).toBeNull();
    expect(extractEntityIds(events)).toEqual({ bidId: '900' });
  });
});
