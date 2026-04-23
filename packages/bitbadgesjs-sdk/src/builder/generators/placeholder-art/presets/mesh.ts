import type { Palette } from '../palettes.js';
import { escapeAttr, escapeText } from './gradient-mono.js';

/**
 * Layered radial gradients — fake mesh-gradient look. Three soft
 * blobs positioned by hash, stacked over a base color. Looks modern
 * without needing any SVG filter / feGaussianBlur (keeps size down).
 */
export function renderMesh(opts: {
  palette: Palette;
  symbol: string;
  hash: number;
}): string {
  const { palette, symbol, hash } = opts;
  const [c1, c2] = palette.stops;
  const accent = palette.text;
  const id = hash.toString(36).slice(-4);

  const positions: Array<{ x: number; y: number; r: number; color: string; op: number }> = [
    { x: 80 + (hash % 60), y: 80 + ((hash >> 3) % 60), r: 220, color: c2, op: 0.85 },
    { x: 320 - ((hash >> 5) % 80), y: 90 + ((hash >> 7) % 80), r: 200, color: accent, op: 0.55 },
    { x: 160 + ((hash >> 9) % 120), y: 320 - ((hash >> 11) % 80), r: 240, color: c2, op: 0.7 }
  ];

  const defs = positions
    .map(
      (p, i) =>
        `<radialGradient id="m${id}_${i}" cx="${(p.x / 400).toFixed(3)}" cy="${(p.y / 400).toFixed(3)}" r="${(p.r / 400).toFixed(3)}"><stop offset="0%" stop-color="${p.color}" stop-opacity="${p.op}"/><stop offset="100%" stop-color="${p.color}" stop-opacity="0"/></radialGradient>`
    )
    .join('');

  const blobs = positions
    .map((_, i) => `<rect width="400" height="400" fill="url(#m${id}_${i})"/>`)
    .join('');

  const fontSize = symbol.length >= 3 ? 72 : symbol.length === 2 ? 96 : 116;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeAttr(symbol)} placeholder">
  <defs>${defs}</defs>
  <rect width="400" height="400" fill="${c1}"/>
  ${blobs}
  <text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="700" font-size="${fontSize}" fill="${palette.text}" letter-spacing="-3">${escapeText(symbol)}</text>
</svg>`;
}
