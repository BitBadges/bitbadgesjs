/**
 * Deterministic SVG placeholder-art generator for the AI Builder.
 *
 * Given a seed string (e.g. the collection name), produces a
 * `data:image/svg+xml;base64,...` URI that can be set directly as
 * any image field on a BitBadges transaction. No IPFS roundtrip,
 * no external dependencies — looks intentional, not placeholder-y.
 *
 * Six curated presets × 24 palettes → ~144 visual combinations,
 * chosen deterministically from the seed so the same input always
 * produces the same art.
 */

import { PALETTES, pickPalette, type Palette } from './palettes.js';
import { toDataUri } from './encode.js';
import { renderGradientMono } from './presets/gradient-mono.js';
import { renderGeometricTile } from './presets/geometric-tile.js';
import { renderLetterform } from './presets/letterform.js';
import { renderOrbital } from './presets/orbital.js';
import { renderMesh } from './presets/mesh.js';
import { renderGlyph } from './presets/glyph.js';

export type PlaceholderArtStyle =
  | 'auto'
  | 'gradient-mono'
  | 'geometric-tile'
  | 'letterform'
  | 'orbital'
  | 'mesh'
  | 'glyph';

export type PlaceholderArtVibe = 'playful' | 'serious' | 'tech' | 'organic';

export interface GeneratePlaceholderArtInput {
  /** Deterministic seed — usually the asset's name. Empty → `'BitBadges'`. */
  seed: string;
  /** Style override. `'auto'` (default) picks from hash + vibe. */
  style?: PlaceholderArtStyle;
  /**
   * Text overlay on presets that use one. 1-3 chars recommended.
   * Omit to derive from the seed (first letter, or initials).
   */
  symbol?: string;
  /** Biases the auto-style pick toward styles that match the vibe. */
  vibe?: PlaceholderArtVibe;
  /** Pin a specific palette name. Case-sensitive. Overrides hash. */
  paletteName?: string;
}

export interface GeneratePlaceholderArtResult {
  /** `data:image/svg+xml;base64,...` — drop directly into any image field. */
  imageUri: string;
  /** The style that was actually chosen (resolved if `style === 'auto'`). */
  style: Exclude<PlaceholderArtStyle, 'auto'>;
  /** The palette that was used — name + stops + text color. */
  palette: Palette;
  /** Size of the data URI in bytes (post-base64). */
  bytes: number;
  /** The minified SVG string (pre-base64) — useful for debugging / previews. */
  svg: string;
  /** The symbol that actually got rendered on the art. */
  symbol: string;
}

/**
 * djb2 — short, fast, deterministic 32-bit string hash. Good enough
 * for picking palettes/presets; we're not using it for security.
 */
export function hashSeed(seed: string): number {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  return h >>> 0; // unsigned
}

/** Turn a seed into 1-3 character monogram. Strips non-letters, uppercases. */
export function deriveSymbol(seed: string): string {
  const words = seed
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'BB';
  if (words.length === 1) {
    // Single word: first 2 letters, or 1 if length 1.
    return words[0].slice(0, 2).toUpperCase();
  }
  // Multi-word: initials from the first 3 words.
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const ALL_STYLES: Array<Exclude<PlaceholderArtStyle, 'auto'>> = [
  'gradient-mono',
  'geometric-tile',
  'letterform',
  'orbital',
  'mesh',
  'glyph'
];

const VIBE_BIAS: Record<PlaceholderArtVibe, Array<Exclude<PlaceholderArtStyle, 'auto'>>> = {
  playful: ['mesh', 'gradient-mono', 'orbital'],
  serious: ['letterform', 'geometric-tile', 'glyph'],
  tech: ['orbital', 'geometric-tile', 'gradient-mono'],
  organic: ['mesh', 'gradient-mono', 'letterform']
};

/** Resolve `style: 'auto'` to a concrete preset, optionally vibe-biased. */
export function resolveStyle(
  style: PlaceholderArtStyle | undefined,
  vibe: PlaceholderArtVibe | undefined,
  hash: number
): Exclude<PlaceholderArtStyle, 'auto'> {
  if (style && style !== 'auto') return style;
  const pool = vibe ? VIBE_BIAS[vibe] : ALL_STYLES;
  return pool[Math.abs(hash) % pool.length];
}

/** Main entry point — hash → palette + style → render → encode. */
export function generatePlaceholderArt(
  input: GeneratePlaceholderArtInput
): GeneratePlaceholderArtResult {
  const seed = (input.seed ?? '').trim() || 'BitBadges';
  const hash = hashSeed(seed);
  const palette = input.paletteName
    ? PALETTES.find((p) => p.name === input.paletteName) ?? pickPalette(hash)
    : pickPalette(hash);
  const style = resolveStyle(input.style, input.vibe, hash >>> 5);
  const symbol = (input.symbol?.trim() || deriveSymbol(seed)).slice(0, 3);

  let svg: string;
  switch (style) {
    case 'gradient-mono':
      svg = renderGradientMono({ palette, symbol, hash });
      break;
    case 'geometric-tile':
      svg = renderGeometricTile({ palette, symbol, hash });
      break;
    case 'letterform':
      svg = renderLetterform({ palette, symbol, hash });
      break;
    case 'orbital':
      svg = renderOrbital({ palette, symbol, hash });
      break;
    case 'mesh':
      svg = renderMesh({ palette, symbol, hash });
      break;
    case 'glyph':
      svg = renderGlyph({ palette, hash });
      break;
  }

  const { uri, bytes, minified } = toDataUri(svg);
  return { imageUri: uri, style, palette, bytes, svg: minified, symbol };
}

// Re-exports for tool consumers + tests
export { PALETTES, pickPalette } from './palettes.js';
export type { Palette } from './palettes.js';
export { toDataUri, minifySvg, base64Encode } from './encode.js';
export { GLYPH_NAMES } from './presets/glyph.js';
