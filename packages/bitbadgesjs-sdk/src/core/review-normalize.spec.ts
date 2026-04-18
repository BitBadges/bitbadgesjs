/**
 * Tests for review-normalize.ts — the normalization pipeline used by every
 * review consumer (auditCollection, verifyStandardsCompliance). Covers:
 *
 *   extractCollectionValue — unwrap tx ({messages:[...]}) / msg ({typeUrl, value})
 *                            / array / bare collection.
 *   normalizeForReview    — run the MsgUniversalUpdateCollection + BigIntify
 *                            conversion, mirror aliasPaths fields, and
 *                            reattach WithDetails inline metadata that the
 *                            proto class drops.
 *
 * normalizeForReview must be idempotent and non-mutating on the input.
 */

import { extractCollectionValue, normalizeForReview } from './review-normalize.js';

// ---------------------------------------------------------------------------
// extractCollectionValue
// ---------------------------------------------------------------------------

describe('extractCollectionValue', () => {
  it('returns primitives unchanged', () => {
    expect(extractCollectionValue(null)).toBe(null);
    expect(extractCollectionValue(undefined)).toBe(undefined);
    expect(extractCollectionValue(42)).toBe(42);
    expect(extractCollectionValue('abc')).toBe('abc');
    expect(extractCollectionValue(true)).toBe(true);
  });

  it('unwraps a transaction with messages[0].value', () => {
    const tx = { messages: [{ typeUrl: '/some.MsgType', value: { creator: 'bb1a', name: 'x' } }] };
    expect(extractCollectionValue(tx)).toEqual({ creator: 'bb1a', name: 'x' });
  });

  it('unwraps a bare array of messages (non-object wrapper)', () => {
    const arr = [{ typeUrl: '/some.MsgType', value: { a: 1 } }];
    expect(extractCollectionValue(arr)).toEqual({ a: 1 });
  });

  it('falls back to the message itself if value is missing', () => {
    const tx = { messages: [{ creator: 'bb1x' }] };
    expect(extractCollectionValue(tx)).toEqual({ creator: 'bb1x' });
  });

  it('returns input when messages is an empty array', () => {
    const tx = { messages: [] };
    expect(extractCollectionValue(tx)).toBe(tx);
  });

  it('unwraps a single message with {typeUrl, value}', () => {
    const msg = { typeUrl: '/some.MsgType', value: { creator: 'bb1y' } };
    expect(extractCollectionValue(msg)).toEqual({ creator: 'bb1y' });
  });

  it('returns a bare object (no messages / no value) as-is', () => {
    const raw = { creator: 'bb1z', name: 'My Collection' };
    expect(extractCollectionValue(raw)).toBe(raw);
  });

  it('ignores value when it is not an object (e.g. string)', () => {
    const msg = { typeUrl: '/some.MsgType', value: 'not-an-object' };
    // typeUrl check requires value to be an object; this falls through
    expect(extractCollectionValue(msg)).toBe(msg);
  });

  it('ignores messages when it is not an array', () => {
    const tx = { messages: 'not-an-array' };
    expect(extractCollectionValue(tx)).toBe(tx);
  });

  it('prefers messages over value when both present', () => {
    const tx = { messages: [{ value: { a: 1 } }], value: { a: 2 } };
    expect(extractCollectionValue(tx)).toEqual({ a: 1 });
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — primitives / fallback
// ---------------------------------------------------------------------------

describe('normalizeForReview — primitives', () => {
  it('returns primitives unchanged after extraction', () => {
    expect(normalizeForReview(null)).toBe(null);
    expect(normalizeForReview(undefined)).toBe(undefined);
    expect(normalizeForReview(42)).toBe(42);
    expect(normalizeForReview('abc')).toBe('abc');
  });

  it('empty object goes through normalization without throwing', () => {
    const r = normalizeForReview({});
    expect(r).toBeDefined();
    expect(typeof r).toBe('object');
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — mirrored aliasPaths fields
// ---------------------------------------------------------------------------

describe('normalizeForReview — aliasPath field mirroring', () => {
  it('mirrors aliasPathsToAdd from aliasPaths on input, both present on output', () => {
    const collection = {
      creator: 'bb1abc',
      aliasPaths: [{ some: 'entry' }]
    };
    const normalized = normalizeForReview(collection);
    // The Msg class carries aliasPathsToAdd; we also re-copy it into aliasPaths.
    expect(normalized.aliasPathsToAdd).toBeDefined();
    expect(normalized.aliasPaths).toBeDefined();
  });

  it('mirrors aliasPaths when only aliasPathsToAdd is set', () => {
    const collection = {
      creator: 'bb1abc',
      aliasPathsToAdd: [{ some: 'entry' }]
    };
    const normalized = normalizeForReview(collection);
    expect(normalized.aliasPaths).toBeDefined();
    expect(normalized.aliasPathsToAdd).toBeDefined();
  });

  it('mirrors cosmosCoinWrapperPathsToAdd field', () => {
    const collection = {
      creator: 'bb1abc',
      cosmosCoinWrapperPaths: [{ some: 'wrapper' }]
    };
    const normalized = normalizeForReview(collection);
    expect(normalized.cosmosCoinWrapperPathsToAdd).toBeDefined();
    // cosmosCoinWrapperPaths may or may not survive conversion; mirroring
    // ensures at least one side is present for downstream checks.
    expect(
      Boolean(normalized.cosmosCoinWrapperPaths) || Boolean(normalized.cosmosCoinWrapperPathsToAdd)
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — _meta sidecar preservation
// ---------------------------------------------------------------------------

describe('normalizeForReview — _meta preservation', () => {
  it('preserves _meta on the output', () => {
    const collection = {
      creator: 'bb1abc',
      _meta: { metadataPlaceholders: [{ k: 'placeholder' }] }
    };
    const normalized = normalizeForReview(collection);
    expect(normalized._meta).toEqual({ metadataPlaceholders: [{ k: 'placeholder' }] });
  });

  it('does not copy _meta when it is a primitive', () => {
    const collection = {
      creator: 'bb1abc',
      _meta: 'not-an-object'
    };
    const normalized = normalizeForReview(collection);
    // Check: the reattach helper only copies when typeof _meta === 'object'.
    // Strings should not propagate onto the output.
    expect(normalized._meta).not.toBe('not-an-object');
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — transaction/message unwrapping
// ---------------------------------------------------------------------------

describe('normalizeForReview — extraction', () => {
  it('unwraps a transaction and normalizes', () => {
    const tx = {
      messages: [
        {
          typeUrl: '/badges.MsgUniversalUpdateCollection',
          value: { creator: 'bb1abc' }
        }
      ]
    };
    const normalized = normalizeForReview(tx);
    expect(normalized.creator).toBe('bb1abc');
  });

  it('unwraps a raw message { typeUrl, value }', () => {
    const msg = { typeUrl: '/any', value: { creator: 'bb1xyz' } };
    const normalized = normalizeForReview(msg);
    expect(normalized.creator).toBe('bb1xyz');
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — idempotency
// ---------------------------------------------------------------------------

describe('normalizeForReview — idempotency', () => {
  it('passing an already-normalized value through again yields the same shape', () => {
    const input = { creator: 'bb1abc', aliasPaths: [{ x: 1 }] };
    const first = normalizeForReview(input);
    const second = normalizeForReview(first);
    // Both should have the same sets of keys (no data lost/added on re-run).
    expect(Object.keys(second).sort()).toEqual(Object.keys(first).sort());
    expect(second.creator).toBe(first.creator);
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — non-mutation of input
// ---------------------------------------------------------------------------

describe('normalizeForReview — does not mutate input', () => {
  it('leaves the original collection object untouched', () => {
    const original = {
      creator: 'bb1abc',
      aliasPaths: [{ some: 'v' }]
    };
    const snapshot = JSON.stringify(original);
    normalizeForReview(original);
    expect(JSON.stringify(original)).toBe(snapshot);
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — WithDetails inline metadata reattachment
// ---------------------------------------------------------------------------

describe('normalizeForReview — inline metadata reattachment', () => {
  it('reattaches collectionMetadata.metadata (WithDetails inline field)', () => {
    const input = {
      creator: 'bb1abc',
      collectionMetadata: {
        uri: 'ipfs://x',
        customData: '',
        metadata: { name: 'InlineName', description: 'desc', image: 'img' }
      }
    };
    const normalized = normalizeForReview(input);
    expect(normalized.collectionMetadata?.metadata).toEqual({
      name: 'InlineName',
      description: 'desc',
      image: 'img'
    });
  });

  it('reattaches approval details onto collectionApprovals', () => {
    const input = {
      creator: 'bb1abc',
      collectionApprovals: [
        {
          approvalId: 'a1',
          fromListId: 'Mint',
          toListId: 'All',
          initiatedByListId: 'All',
          details: { name: 'Approval A', description: 'd', image: 'img' }
        }
      ]
    };
    const normalized = normalizeForReview(input);
    expect(Array.isArray(normalized.collectionApprovals)).toBe(true);
    expect(normalized.collectionApprovals[0].details).toEqual({
      name: 'Approval A',
      description: 'd',
      image: 'img'
    });
  });
});

// ---------------------------------------------------------------------------
// normalizeForReview — fallback on unknown shapes
// ---------------------------------------------------------------------------

describe('normalizeForReview — fallback path', () => {
  it('returns the mirrored-but-not-crashed value when MsgUniversalUpdateCollection cannot handle the shape', () => {
    // Force a value that is object but hostile to the class constructor —
    // a cyclic structure. The try/catch in normalizeForReview should fall
    // back to the mirrored raw object rather than throwing.
    const cyclic: any = { creator: 'bb1abc' };
    cyclic.self = cyclic;
    let r: any;
    expect(() => {
      r = normalizeForReview(cyclic);
    }).not.toThrow();
    expect(r).toBeDefined();
    // Creator should still be accessible either on the converted obj or the
    // fallback mirrored raw.
    expect(r.creator).toBe('bb1abc');
  });
});
