/**
 * collection-options.ts coverage (ticket 0433) — shipped in #0429
 * without its spec (a round-2 implementation miss caught by the
 * round-3 audit). Both helpers carry the branching logic whose absence
 * was the latent boundary bug #0429 fixed; sibling csv-options.ts from
 * the same DRY cycle is fully specced — this closes the gap.
 */

import { normalizeCollection, validateCollectionOrExit } from './collection-options.js';

describe('normalizeCollection', () => {
  // 0429's actual fix: the 4 raw command copies returned the indexer
  // envelope unmodified; normalizeCollection must unwrap + run the
  // class normalization (BigIntify of numeric fields is the
  // BitBadgesCollection class's own, separately-tested concern — here
  // we pin the boundary contract: unwrap, never-throw, raw fallback).
  it('unwraps a {collection: X} envelope (returns the inner object, not the wrapper)', () => {
    const out = normalizeCollection({ collection: { collectionId: '5', foo: 'bar' } });
    expect(out).not.toHaveProperty('collection');
    expect(out.collectionId).toBe('5');
  });
  it('processes a bare collection (no envelope) directly', () => {
    const out = normalizeCollection({ collectionId: '7' });
    expect(out).toBeTruthy();
    expect(out.collectionId).toBe('7');
  });
  it('passes null / undefined through untouched', () => {
    expect(normalizeCollection(null)).toBeNull();
    expect(normalizeCollection(undefined)).toBeUndefined();
  });
  it('never throws — falls back to raw when class construction fails', () => {
    const weird: any = 'not-a-collection';
    expect(normalizeCollection(weird)).toBe('not-a-collection');
    const broken: any = { collection: 12345 };
    expect(() => normalizeCollection(broken)).not.toThrow();
  });
});

describe('validateCollectionOrExit', () => {
  let exitSpy: jest.SpyInstance;
  let stderrSpy: jest.SpyInstance;

  beforeEach(() => {
    exitSpy = jest.spyOn(process, 'exit').mockImplementation(((_c?: number) => {
      throw new Error('process.exit');
    }) as never);
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });
  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
    delete process.env.BB_QUIET;
  });

  const ok = () => ({ valid: true, errors: [], warnings: [] });

  it('exits 2 with a not-found message when collection is missing', () => {
    expect(() => validateCollectionOrExit(null, 'ctx-x', ok, 'Bounty')).toThrow('process.exit');
    expect(exitSpy).toHaveBeenCalledWith(2);
    expect(stderrSpy.mock.calls.map((c) => c[0]).join('')).toContain('collection not found while running ctx-x');
  });

  it('prints errors + warnings and exits 2 when invalid', () => {
    const bad = () => ({ valid: false, errors: ['e1', 'e2'], warnings: ['w1'] });
    expect(() => validateCollectionOrExit({}, 'mint', bad, 'Crowdfund')).toThrow('process.exit');
    const txt = stderrSpy.mock.calls.map((c) => c[0]).join('');
    expect(txt).toContain('not a valid Crowdfund (failed in mint)');
    expect(txt).toContain('- e1');
    expect(txt).toContain('- e2');
    expect(txt).toContain('- w1');
    expect(exitSpy).toHaveBeenCalledWith(2);
  });

  it('valid + warnings → echoes warnings unless BB_QUIET, never exits', () => {
    const warn = () => ({ valid: true, errors: [], warnings: ['heads-up'] });
    validateCollectionOrExit({}, 'claim', warn, 'Auction');
    expect(exitSpy).not.toHaveBeenCalled();
    expect(stderrSpy.mock.calls.map((c) => c[0]).join('')).toContain('Warnings for claim');

    stderrSpy.mockClear();
    process.env.BB_QUIET = '1';
    validateCollectionOrExit({}, 'claim', warn, 'Auction');
    expect(stderrSpy.mock.calls.map((c) => c[0]).join('')).not.toContain('Warnings for claim');
  });

  it('valid + no warnings → silent, no exit', () => {
    validateCollectionOrExit({}, 'ctx', ok, 'Smart Token');
    expect(exitSpy).not.toHaveBeenCalled();
    expect(stderrSpy).not.toHaveBeenCalled();
  });
});
