import type { Palette } from '../palettes.js';
import { escapeAttr } from './gradient-mono.js';

/**
 * Curated geometric glyph over a gradient disc. No text — the glyph
 * itself is the identity. Good for NFT / collectible / trophy feel.
 *
 * Glyphs are hand-authored SVG paths tuned to a 200×200 viewBox,
 * centered and translated to (100,100).
 */
const GLYPHS: Array<{ name: string; path: string }> = [
  // Hex crest
  {
    name: 'hex-crest',
    path: 'M100 20 L172 60 L172 140 L100 180 L28 140 L28 60 Z M100 52 L146 76 L146 124 L100 148 L54 124 L54 76 Z'
  },
  // Shield
  {
    name: 'shield',
    path: 'M100 24 L168 52 L168 104 C168 140 140 170 100 184 C60 170 32 140 32 104 L32 52 Z M100 54 L148 72 L148 104 C148 130 128 152 100 162 C72 152 52 130 52 104 L52 72 Z'
  },
  // Triangle stacked
  {
    name: 'tri-stack',
    path: 'M100 28 L180 168 L20 168 Z M100 72 L150 156 L50 156 Z'
  },
  // Sunburst
  {
    name: 'sunburst',
    path: 'M100 28 L108 84 L152 52 L124 100 L176 100 L124 108 L152 148 L108 116 L100 172 L92 116 L48 148 L76 108 L24 100 L76 92 L48 52 L92 84 Z'
  },
  // Diamond-in-diamond
  {
    name: 'rhombus',
    path: 'M100 20 L180 100 L100 180 L20 100 Z M100 56 L144 100 L100 144 L56 100 Z'
  },
  // Crown
  {
    name: 'crown',
    path: 'M28 136 L28 72 L72 104 L100 48 L128 104 L172 72 L172 136 Z M28 148 L172 148 L172 172 L28 172 Z'
  }
];

export function renderGlyph(opts: {
  palette: Palette;
  hash: number;
}): string {
  const { palette, hash } = opts;
  const [c1, c2] = palette.stops;
  const glyph = GLYPHS[hash % GLYPHS.length];
  const id = hash.toString(36).slice(-4);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeAttr(glyph.name)} placeholder">
  <defs>
    <radialGradient id="g${id}" cx="0.5" cy="0.45" r="0.6">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#g${id})"/>
  <g transform="translate(100,100)">
    <path d="${glyph.path}" fill="${palette.text}" fill-opacity="0.94" fill-rule="evenodd"/>
  </g>
</svg>`;
}

export const GLYPH_NAMES = GLYPHS.map((g) => g.name);
