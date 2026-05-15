/**
 * Tests for the shared CSV / repeatable-flag splitter (ticket 0423).
 * Replaces two byte-identical private `splitCsv` clones + three inlined
 * sites — this is the single source of truth they now delegate to.
 */

import { splitCsv } from './csv-options.js';

describe('splitCsv', () => {
  it('splits a single comma-joined value', () => {
    expect(splitCsv(['a,b,c'])).toEqual(['a', 'b', 'c']);
  });

  it('flattens repeatable + comma-joined occurrences', () => {
    expect(splitCsv(['a,b', 'c', 'd,e'])).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('trims whitespace and drops empty tokens', () => {
    expect(splitCsv([' a , ,b ', '', '  ', ',c,'])).toEqual(['a', 'b', 'c']);
  });

  it('returns an empty array for no usable input', () => {
    expect(splitCsv([])).toEqual([]);
    expect(splitCsv(['', ' , , '])).toEqual([]);
  });

  it('does not dedupe (callers decide)', () => {
    expect(splitCsv(['x,x', 'x'])).toEqual(['x', 'x', 'x']);
  });
});
