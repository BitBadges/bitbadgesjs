import { parseInlineCustomData } from './inlineCustomData.js';
import { Metadata } from './metadata.js';

describe('parseInlineCustomData', () => {
  test('parses minimal {name, image, description}', () => {
    const out = parseInlineCustomData(
      JSON.stringify({ name: 'Test', image: 'ipfs://abc', description: 'hi' })
    );
    expect(out).toBeInstanceOf(Metadata);
    expect(out!.name).toBe('Test');
    expect(out!.image).toBe('ipfs://abc');
    expect(out!.description).toBe('hi');
  });

  test('accepts name-only (legacy permissive)', () => {
    const out = parseInlineCustomData(JSON.stringify({ name: 'Solo' }));
    expect(out).not.toBeNull();
    expect(out!.name).toBe('Solo');
    expect(out!.image).toBe('');
    expect(out!.description).toBe('');
  });

  test('accepts image-only', () => {
    const out = parseInlineCustomData(JSON.stringify({ image: 'ipfs://x' }));
    expect(out).not.toBeNull();
    expect(out!.image).toBe('ipfs://x');
  });

  test('accepts description-only', () => {
    const out = parseInlineCustomData(JSON.stringify({ description: 'd' }));
    expect(out).not.toBeNull();
    expect(out!.description).toBe('d');
  });

  test('returns null on oversized payload (>32KB)', () => {
    const big = 'x'.repeat(33 * 1024);
    const payload = JSON.stringify({ name: 'X', description: big });
    expect(payload.length).toBeGreaterThan(32 * 1024);
    expect(parseInlineCustomData(payload)).toBeNull();
  });

  test('returns null on malformed JSON', () => {
    expect(parseInlineCustomData('{not valid json')).toBeNull();
    expect(parseInlineCustomData('hello')).toBeNull();
  });

  test('returns null on JSON array', () => {
    expect(parseInlineCustomData('[]')).toBeNull();
    expect(parseInlineCustomData('[{"name":"x"}]')).toBeNull();
  });

  test('returns null on JSON primitive', () => {
    expect(parseInlineCustomData('"a string"')).toBeNull();
    expect(parseInlineCustomData('42')).toBeNull();
    expect(parseInlineCustomData('true')).toBeNull();
  });

  test('returns null on JSON null', () => {
    expect(parseInlineCustomData('null')).toBeNull();
  });

  test('returns null on empty string', () => {
    expect(parseInlineCustomData('')).toBeNull();
  });

  test('returns null on empty object (no required field)', () => {
    expect(parseInlineCustomData('{}')).toBeNull();
  });

  test('returns null when required fields are not strings', () => {
    expect(parseInlineCustomData(JSON.stringify({ name: 0 }))).toBeNull();
    expect(parseInlineCustomData(JSON.stringify({ name: null }))).toBeNull();
    expect(parseInlineCustomData(JSON.stringify({ name: '', image: '' }))).toBeNull();
  });

  test('drops wrong-typed image but keeps valid name', () => {
    const out = parseInlineCustomData(JSON.stringify({ name: 'Solo', image: 12345 }));
    expect(out).not.toBeNull();
    expect(out!.name).toBe('Solo');
    expect(out!.image).toBe('');
  });

  test('drops unknown keys', () => {
    const out = parseInlineCustomData(
      JSON.stringify({ name: 'X', evil: '<script>', _internal: 'x', randomGarbage: { a: 1 } })
    );
    expect(out).not.toBeNull();
    expect((out as any).evil).toBeUndefined();
    expect((out as any)._internal).toBeUndefined();
    expect((out as any).randomGarbage).toBeUndefined();
  });

  test('coerces optional string fields when valid', () => {
    const out = parseInlineCustomData(
      JSON.stringify({
        name: 'X',
        bannerImage: 'ipfs://b',
        category: 'Education',
        externalUrl: 'https://example.com'
      })
    );
    expect(out).not.toBeNull();
    expect(out!.bannerImage).toBe('ipfs://b');
    expect(out!.category).toBe('Education');
    expect(out!.externalUrl).toBe('https://example.com');
  });

  test('drops wrong-typed optional string fields', () => {
    const out = parseInlineCustomData(
      JSON.stringify({ name: 'X', bannerImage: 5, category: { foo: 'bar' } })
    );
    expect(out).not.toBeNull();
    expect(out!.bannerImage).toBeUndefined();
    expect(out!.category).toBeUndefined();
  });

  test('coerces tags as string array', () => {
    const out = parseInlineCustomData(JSON.stringify({ name: 'X', tags: ['a', 'b', 3, null] }));
    expect(out).not.toBeNull();
    expect(out!.tags).toEqual(['a', 'b']);
  });

  test('drops tags entirely when not an array', () => {
    const out = parseInlineCustomData(JSON.stringify({ name: 'X', tags: 'not-an-array' }));
    expect(out).not.toBeNull();
    expect(out!.tags).toBeUndefined();
  });

  test('coerces attributes when shape matches', () => {
    const out = parseInlineCustomData(
      JSON.stringify({
        name: 'X',
        attributes: [
          { type: 'string', name: 'rarity', value: 'rare' },
          { type: 'number', name: 'level', value: 5 },
          { name: 'malformed', value: 'no type' },
          { type: 'string', name: 'good', value: true }
        ]
      })
    );
    expect(out).not.toBeNull();
    expect(out!.attributes).toEqual([
      { type: 'string', name: 'rarity', value: 'rare' },
      { type: 'number', name: 'level', value: 5 },
      { type: 'string', name: 'good', value: true }
    ]);
  });

  test('coerces socials as string-keyed string map', () => {
    const out = parseInlineCustomData(
      JSON.stringify({
        name: 'X',
        socials: { twitter: '@bitbadges', evil: 5, github: 'bitbadges' }
      })
    );
    expect(out).not.toBeNull();
    expect(out!.socials).toEqual({ twitter: '@bitbadges', github: 'bitbadges' });
  });

  test('drops malformed sub-fields without rejecting whole metadata', () => {
    const out = parseInlineCustomData(
      JSON.stringify({
        name: 'Survivor',
        attributes: 'not-an-array',
        socials: 'not-an-object',
        tags: { not: 'an-array' }
      })
    );
    expect(out).not.toBeNull();
    expect(out!.name).toBe('Survivor');
    expect(out!.attributes).toBeUndefined();
    expect(out!.socials).toBeUndefined();
    expect(out!.tags).toBeUndefined();
  });

  test('returns a fresh Metadata instance, not the raw parsed object', () => {
    const raw = { name: 'X', __proto__: { polluted: true } };
    const out = parseInlineCustomData(JSON.stringify(raw));
    expect(out).toBeInstanceOf(Metadata);
    expect((out as any).polluted).toBeUndefined();
  });
});
