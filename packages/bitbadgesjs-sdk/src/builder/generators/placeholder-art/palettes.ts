/**
 * Curated palettes for placeholder art.
 *
 * Each palette is a small hand-picked set of colors (2-4 stops) that
 * look intentional side-by-side. Values are tuned for:
 *   - Contrast against white AND dark dashboards
 *   - Sans-serif monograms legibility (first stop ~ background, last stop ~ accent)
 *   - Tasteful range: jewel tones, duotones, muted pastels, sunset/ocean gradients
 *
 * Adding palettes is additive and deterministic — the hash % palettes.length
 * selection in `index.ts` stays stable for existing seeds as long as new
 * palettes are appended to the END of this array (never inserted mid-list).
 */

export interface Palette {
  /** Human-readable label — surfaced in tool result for debugging. */
  name: string;
  /** Gradient stops, ordered light → dark (or cool → warm). 2-4 entries. */
  stops: string[];
  /** Text color used for monograms / glyphs. High-contrast against the mid-stop. */
  text: string;
}

export const PALETTES: Palette[] = [
  // Jewel tones
  { name: 'amethyst', stops: ['#5B2A86', '#8C3DCA'], text: '#F5E9FF' },
  { name: 'ruby', stops: ['#6A0F1A', '#C0223A'], text: '#FFEEEF' },
  { name: 'emerald', stops: ['#0E4D3E', '#1E8A6B'], text: '#E6FFF5' },
  { name: 'sapphire', stops: ['#0C2D6B', '#2A5BD7'], text: '#E9F0FF' },
  { name: 'topaz', stops: ['#7A4E0E', '#DCA13D'], text: '#FFF6E1' },
  // Sunsets / warms
  { name: 'sunset', stops: ['#FF6B6B', '#FFB347'], text: '#2B1500' },
  { name: 'coral', stops: ['#F06A5C', '#F7A072'], text: '#3A1408' },
  { name: 'peach', stops: ['#F6B7A5', '#FAD3B2'], text: '#4A2210' },
  { name: 'rose-noir', stops: ['#2A0B13', '#B03A5B'], text: '#FFE6EB' },
  // Ocean / cools
  { name: 'ocean', stops: ['#0F4C5C', '#5F9EA0'], text: '#E9F7FA' },
  { name: 'arctic', stops: ['#2E6F95', '#A9D6E5'], text: '#08121A' },
  { name: 'lagoon', stops: ['#034F58', '#29A19C'], text: '#E8FBFA' },
  { name: 'midnight', stops: ['#0B132B', '#3A506B'], text: '#E9EEF7' },
  // Greens
  { name: 'sage', stops: ['#606C38', '#BDCFB4'], text: '#1D2411' },
  { name: 'forest', stops: ['#1B3A2A', '#3B8E5A'], text: '#E8F7EE' },
  { name: 'lime-noir', stops: ['#0D1F0A', '#6FB24A'], text: '#F2FFEA' },
  // Neutrals / mono duotones
  { name: 'graphite', stops: ['#1F1F23', '#4B4B55'], text: '#EDEDEF' },
  { name: 'paper', stops: ['#F2ECE3', '#CBB89D'], text: '#2B241A' },
  { name: 'slate', stops: ['#2C3E50', '#4CA1AF'], text: '#E8F6F9' },
  { name: 'bone', stops: ['#E8E4D9', '#9B8E74'], text: '#2B2116' },
  // Vibrant accents
  { name: 'cyber', stops: ['#0E0E52', '#E94560'], text: '#FFE9ED' },
  { name: 'neon-dusk', stops: ['#1A1A2E', '#E94584'], text: '#FFE9F3' },
  { name: 'tropic', stops: ['#11998E', '#38EF7D'], text: '#06382E' },
  { name: 'plum-gold', stops: ['#2B0A3D', '#D4AF37'], text: '#FFF5D6' }
];

/** Helper — pick a palette deterministically by integer hash. */
export function pickPalette(hash: number): Palette {
  return PALETTES[Math.abs(hash) % PALETTES.length];
}
