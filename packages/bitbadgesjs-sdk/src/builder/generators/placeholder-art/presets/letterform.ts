import type { Palette } from '../palettes.js';
import { escapeAttr, escapeText } from './gradient-mono.js';

/**
 * Oversized single letter, off-center, gradient-filled. The letter
 * bleeds slightly off the canvas — editorial feel.
 */
export function renderLetterform(opts: {
  palette: Palette;
  symbol: string;
  hash: number;
}): string {
  const { palette, symbol, hash } = opts;
  const [c1, c2] = palette.stops;
  const letter = symbol[0] || 'B';
  const grad = `l${hash.toString(36).slice(-4)}`;
  // Off-center placement driven by hash for variety
  const tx = 100 + (hash % 40);
  const ty = 80 + ((hash >> 4) % 40);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeAttr(letter)} placeholder">
  <defs>
    <linearGradient id="${grad}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c2}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="${c1}"/>
  <rect x="32" y="32" width="336" height="336" fill="none" stroke="${palette.text}" stroke-opacity="0.2" stroke-width="1"/>
  <text x="${tx}" y="${ty + 280}" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="900" font-size="380" fill="url(#${grad})" letter-spacing="-20">${escapeText(letter)}</text>
  <text x="368" y="376" text-anchor="end" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="500" font-size="11" fill="${palette.text}" fill-opacity="0.6" letter-spacing="3">${escapeText(symbol.slice(0, 8).toUpperCase())}</text>
</svg>`;
}
