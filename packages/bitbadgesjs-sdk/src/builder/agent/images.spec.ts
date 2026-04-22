/**
 * Tests for image placeholder substitution helpers.
 */

import { substituteImages, collectImageReferences } from './images.js';

describe('substituteImages', () => {
  it('replaces a top-level IMAGE_N placeholder', () => {
    const tx = { image: 'IMAGE_1' };
    const out = substituteImages(tx, { IMAGE_1: 'https://cdn/a.png' });
    expect((out as any).image).toBe('https://cdn/a.png');
  });

  it('recurses into nested structures (objects + arrays)', () => {
    const tx = {
      messages: [
        {
          value: {
            _meta: {
              metadataPlaceholders: {
                'ipfs://METADATA_COLLECTION': { image: 'IMAGE_1' },
                'ipfs://METADATA_TOKEN_1': { image: 'IMAGE_2' }
              }
            }
          }
        }
      ]
    };
    const out = substituteImages(tx, { IMAGE_1: 'url-a', IMAGE_2: 'url-b' });
    const ph = (out as any).messages[0].value._meta.metadataPlaceholders;
    expect(ph['ipfs://METADATA_COLLECTION'].image).toBe('url-a');
    expect(ph['ipfs://METADATA_TOKEN_1'].image).toBe('url-b');
  });

  it('does not mutate the original transaction', () => {
    const tx = { image: 'IMAGE_1', nested: { image: 'IMAGE_1' } };
    const out = substituteImages(tx, { IMAGE_1: 'replaced' });
    expect(tx.image).toBe('IMAGE_1');
    expect(tx.nested.image).toBe('IMAGE_1');
    expect((out as any).image).toBe('replaced');
    expect((out as any).nested.image).toBe('replaced');
    // Object identity should differ since a new tree was allocated
    expect(out).not.toBe(tx);
    expect((out as any).nested).not.toBe(tx.nested);
  });

  it('leaves non-IMAGE_N strings untouched', () => {
    const tx = {
      image: 'IMAGE_1',
      name: 'IMAGE_X', // not IMAGE_N format
      desc: 'an image called IMAGE_1', // substring, not full match
      url: 'https://example.com'
    };
    const out = substituteImages(tx, { IMAGE_1: 'replaced' });
    expect((out as any).image).toBe('replaced');
    expect((out as any).name).toBe('IMAGE_X');
    expect((out as any).desc).toBe('an image called IMAGE_1');
    expect((out as any).url).toBe('https://example.com');
  });

  it('partial substitution leaves unresolved tokens in place', () => {
    const tx = { a: 'IMAGE_1', b: 'IMAGE_2', c: 'IMAGE_3' };
    const out = substituteImages(tx, { IMAGE_2: 'filled' });
    expect((out as any).a).toBe('IMAGE_1');
    expect((out as any).b).toBe('filled');
    expect((out as any).c).toBe('IMAGE_3');
  });

  it('empty image map short-circuits and returns the same reference', () => {
    const tx = { image: 'IMAGE_1' };
    const out = substituteImages(tx, {});
    // Implementation returns the original reference when images map is empty.
    expect(out).toBe(tx);
  });

  it('handles arrays of IMAGE_N placeholders', () => {
    const tx = { images: ['IMAGE_1', 'IMAGE_2', 'IMAGE_3'] };
    const out = substituteImages(tx, { IMAGE_1: 'a', IMAGE_2: 'b', IMAGE_3: 'c' });
    expect((out as any).images).toEqual(['a', 'b', 'c']);
  });

  it('null / undefined values are preserved', () => {
    const tx: any = { a: null, b: undefined, c: 'IMAGE_1' };
    const out = substituteImages(tx, { IMAGE_1: 'x' });
    expect((out as any).a).toBeNull();
    expect((out as any).b).toBeUndefined();
    expect((out as any).c).toBe('x');
  });
});

describe('collectImageReferences', () => {
  it('deduplicates and sorts IMAGE_N references', () => {
    const tx = {
      a: { image: 'IMAGE_1' },
      b: [{ image: 'IMAGE_3' }, { image: 'IMAGE_2' }],
      c: 'not a placeholder',
      d: { image: 'IMAGE_1' } // duplicate
    };
    expect(collectImageReferences(tx)).toEqual(['IMAGE_1', 'IMAGE_2', 'IMAGE_3']);
  });

  it('empty when nothing matches', () => {
    expect(collectImageReferences({ foo: 'bar', nested: { n: 1 } })).toEqual([]);
  });

  it('handles null, undefined, and primitives without throwing', () => {
    expect(collectImageReferences(null)).toEqual([]);
    expect(collectImageReferences(undefined)).toEqual([]);
    expect(collectImageReferences('IMAGE_5')).toEqual(['IMAGE_5']);
    expect(collectImageReferences(42)).toEqual([]);
  });

  it('rejects near-misses like IMAGE_ or IMAGE_1A', () => {
    const tx = { a: 'IMAGE_', b: 'IMAGE_1A', c: 'IMAGE_42' };
    expect(collectImageReferences(tx)).toEqual(['IMAGE_42']);
  });

  it('natural sort: lexicographic — IMAGE_10 before IMAGE_2', () => {
    // The implementation uses default Array.sort (lexicographic) — document that.
    const tx = { a: 'IMAGE_2', b: 'IMAGE_10' };
    const refs = collectImageReferences(tx);
    // Lexicographic: '1' < '2', so IMAGE_10 < IMAGE_2
    expect(refs).toEqual(['IMAGE_10', 'IMAGE_2']);
  });
});
