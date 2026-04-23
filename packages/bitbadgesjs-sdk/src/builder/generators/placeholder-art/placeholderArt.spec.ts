/**
 * Unit tests for the placeholder-art generator.
 *
 * Covers:
 *   - Determinism: same seed + options → identical output
 *   - Determinism across presets when style is explicit
 *   - Size budget: full data URI stays well under 8 KB
 *   - Valid data URI shape + base64-decodable payload
 *   - Every preset renders without throwing for 20 random seeds
 *   - Seed-derived symbol + vibe biasing + explicit palette name
 *   - SVG safety: generated output has no <script>, no event handlers,
 *     no external network references (href="http…" / src="…")
 */

import {
  PALETTES,
  deriveSymbol,
  generatePlaceholderArt,
  hashSeed,
  resolveStyle,
  type PlaceholderArtStyle
} from './index.js';

const ALL_PRESETS: Exclude<PlaceholderArtStyle, 'auto'>[] = [
  'gradient-mono',
  'geometric-tile',
  'letterform',
  'orbital',
  'mesh',
  'glyph'
];

const SIZE_BUDGET_BYTES = 8 * 1024;

function extractBase64Payload(uri: string): string {
  const m = uri.match(/^data:image\/svg\+xml;base64,(.+)$/);
  if (!m) throw new Error(`not a base64 SVG data URI: ${uri.slice(0, 60)}...`);
  return m[1];
}

function decodeBase64(b64: string): string {
  return Buffer.from(b64, 'base64').toString('utf-8');
}

describe('hashSeed', () => {
  it('is deterministic for the same input', () => {
    expect(hashSeed('hello')).toBe(hashSeed('hello'));
  });
  it('produces different hashes for different seeds', () => {
    expect(hashSeed('abc')).not.toBe(hashSeed('abd'));
  });
  it('returns an unsigned 32-bit integer', () => {
    const h = hashSeed('anything goes here');
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThan(2 ** 32);
  });
});

describe('deriveSymbol', () => {
  it('returns first two letters for single-word seeds', () => {
    expect(deriveSymbol('Subscription')).toBe('SU');
  });
  it('returns initials for multi-word seeds', () => {
    expect(deriveSymbol('Premium Membership Pass')).toBe('PMP');
  });
  it('strips non-alphanumeric characters before deriving', () => {
    expect(deriveSymbol('5 ATOM Monthly')).toBe('5AM');
  });
  it('falls back to BB for empty / garbage input', () => {
    expect(deriveSymbol('')).toBe('BB');
    expect(deriveSymbol('!!!')).toBe('BB');
  });
});

describe('resolveStyle', () => {
  it('returns the explicit style when one is set', () => {
    expect(resolveStyle('orbital', undefined, 123)).toBe('orbital');
  });
  it('ignores vibe when an explicit style is set', () => {
    expect(resolveStyle('letterform', 'playful', 123)).toBe('letterform');
  });
  it('picks a vibe-biased style on auto + vibe', () => {
    const out = resolveStyle('auto', 'tech', 0);
    expect(['orbital', 'geometric-tile', 'gradient-mono']).toContain(out);
  });
  it('picks from the full pool on auto + no vibe', () => {
    const out = resolveStyle('auto', undefined, 0);
    expect(ALL_PRESETS).toContain(out);
  });
});

describe('generatePlaceholderArt — determinism', () => {
  it('same seed → same URI', () => {
    const a = generatePlaceholderArt({ seed: 'Premium Membership' });
    const b = generatePlaceholderArt({ seed: 'Premium Membership' });
    expect(a.imageUri).toBe(b.imageUri);
    expect(a.style).toBe(b.style);
    expect(a.palette.name).toBe(b.palette.name);
  });
  it('different seeds → different URIs (almost always)', () => {
    const seeds = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
    const uris = seeds.map((s) => generatePlaceholderArt({ seed: s }).imageUri);
    expect(new Set(uris).size).toBe(seeds.length);
  });
  it('explicit style overrides auto', () => {
    const art = generatePlaceholderArt({ seed: 'test', style: 'orbital' });
    expect(art.style).toBe('orbital');
  });
  it('paletteName pin survives hash selection', () => {
    const art = generatePlaceholderArt({ seed: 'anything', paletteName: 'emerald' });
    expect(art.palette.name).toBe('emerald');
  });
  it('unknown paletteName falls back to hash-picked', () => {
    const art = generatePlaceholderArt({ seed: 'test', paletteName: 'nonexistent' });
    expect(PALETTES.map((p) => p.name)).toContain(art.palette.name);
  });
});

describe('generatePlaceholderArt — size + encoding', () => {
  it('stays under the 8 KB data URI budget for every preset', () => {
    for (const style of ALL_PRESETS) {
      for (let i = 0; i < 10; i++) {
        const art = generatePlaceholderArt({ seed: `preset-${style}-${i}`, style });
        expect(art.bytes).toBeLessThan(SIZE_BUDGET_BYTES);
        expect(art.imageUri.length).toBe(art.bytes);
      }
    }
  });
  it('produces a valid data:image/svg+xml;base64 URI', () => {
    const art = generatePlaceholderArt({ seed: 'foo' });
    expect(art.imageUri.startsWith('data:image/svg+xml;base64,')).toBe(true);
  });
  it('base64 payload decodes to valid SVG markup', () => {
    const art = generatePlaceholderArt({ seed: 'foo', style: 'mesh' });
    const payload = extractBase64Payload(art.imageUri);
    const svg = decodeBase64(payload);
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 400 400"');
    expect(svg).toContain('</svg>');
  });
});

describe('generatePlaceholderArt — every preset renders', () => {
  const seeds = Array.from({ length: 20 }, (_, i) => `seed-${i}-${Math.random().toString(36).slice(-4)}`);
  for (const style of ALL_PRESETS) {
    it(`preset "${style}" renders cleanly for 20 random seeds`, () => {
      for (const seed of seeds) {
        const art = generatePlaceholderArt({ seed, style });
        expect(art.style).toBe(style);
        expect(art.imageUri.length).toBeGreaterThan(200); // sanity — not empty
        expect(art.svg).toContain('<svg');
      }
    });
  }
});

describe('generatePlaceholderArt — SVG safety', () => {
  // We author the SVG ourselves — no user HTML gets injected. This
  // test is a regression guard: if someone later adds a preset that
  // embeds an external image/script/event-handler, fail fast.
  const badPatterns: Array<[string, RegExp]> = [
    ['<script>', /<script\b/i],
    ['onload handler', /\bon(load|click|error|mouseover)\s*=/i],
    ['<foreignObject>', /<foreignObject\b/i],
    // External refs — the tool output must stay self-contained.
    ['http:// in href', /href\s*=\s*"http:/i],
    ['https:// in href', /href\s*=\s*"https:/i],
    ['http:// in src', /src\s*=\s*"http:/i],
    ['https:// in src', /src\s*=\s*"https:/i]
  ];
  it.each(ALL_PRESETS)('preset %s contains no unsafe patterns', (style) => {
    for (let i = 0; i < 5; i++) {
      const art = generatePlaceholderArt({ seed: `safety-${style}-${i}`, style });
      for (const [label, re] of badPatterns) {
        expect(`[${style}] ${label}: ${re.test(art.svg) ? 'FOUND' : 'ok'}`).toContain('ok');
      }
    }
  });
});

describe('generatePlaceholderArt — text safety', () => {
  it('escapes < > & in a symbol override', () => {
    const art = generatePlaceholderArt({ seed: 'test', symbol: '<&>' });
    // The symbol gets sliced to 3 chars — verify escaping survived.
    expect(art.svg).not.toContain('<&>');
    expect(art.svg).toContain('&lt;&amp;&gt;');
  });
});

describe('generatePlaceholderArt — vibe biasing', () => {
  it('tech vibe only returns tech-biased presets on auto', () => {
    const allowed = ['orbital', 'geometric-tile', 'gradient-mono'];
    for (let i = 0; i < 20; i++) {
      const art = generatePlaceholderArt({ seed: `vibe-${i}`, vibe: 'tech' });
      expect(allowed).toContain(art.style);
    }
  });
});
