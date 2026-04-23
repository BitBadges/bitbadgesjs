import type { Palette } from '../palettes.js';
import { escapeAttr, escapeText } from './gradient-mono.js';

/**
 * Repeating hex / chevron / diamond tile + centered monogram badge.
 * Tile shape is hash-selected so two different seeds pick different
 * patterns even on the same palette.
 */
export function renderGeometricTile(opts: {
  palette: Palette;
  symbol: string;
  hash: number;
}): string {
  const { palette, symbol, hash } = opts;
  const [bg, fg] = palette.stops;
  const shape = (['hex', 'chevron', 'diamond'] as const)[hash % 3];
  const patId = `p${hash.toString(36).slice(-4)}`;

  const tile = shape === 'hex'
    ? `<polygon points="20,0 40,12 40,36 20,48 0,36 0,12" fill="none" stroke="${fg}" stroke-opacity="0.28" stroke-width="1.5"/>`
    : shape === 'chevron'
    ? `<path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="${fg}" stroke-opacity="0.3" stroke-width="1.5"/>`
    : `<path d="M20 0 L40 20 L20 40 L0 20 Z" fill="${fg}" fill-opacity="0.18"/>`;

  const badgeR = 100;
  const fontSize = symbol.length >= 3 ? 56 : symbol.length === 2 ? 72 : 96;
  const tileSize = shape === 'hex' ? '40' : '40';
  const tileH = shape === 'hex' ? '48' : '40';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeAttr(symbol)} placeholder">
  <defs>
    <pattern id="${patId}" x="0" y="0" width="${tileSize}" height="${tileH}" patternUnits="userSpaceOnUse">${tile}</pattern>
  </defs>
  <rect width="400" height="400" fill="${bg}"/>
  <rect width="400" height="400" fill="url(#${patId})"/>
  <circle cx="200" cy="200" r="${badgeR}" fill="${palette.text}" fill-opacity="0.08"/>
  <circle cx="200" cy="200" r="${badgeR - 4}" fill="none" stroke="${palette.text}" stroke-opacity="0.75" stroke-width="2"/>
  <text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="700" font-size="${fontSize}" fill="${palette.text}" letter-spacing="-2">${escapeText(symbol)}</text>
</svg>`;
}
