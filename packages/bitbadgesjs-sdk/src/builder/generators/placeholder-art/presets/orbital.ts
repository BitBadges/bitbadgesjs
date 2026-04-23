import type { Palette } from '../palettes.js';
import { escapeAttr, escapeText } from './gradient-mono.js';

/**
 * Concentric rings / dotted orbits — POAP feel, works nicely on
 * tokens. Ring count and dot rhythm are hash-varied.
 */
export function renderOrbital(opts: {
  palette: Palette;
  symbol: string;
  hash: number;
}): string {
  const { palette, symbol, hash } = opts;
  const [bg, accent] = palette.stops;
  const ringCount = 3 + (hash % 3); // 3..5
  const dotsPerRing = 12 + ((hash >> 3) % 8); // 12..19

  let rings = '';
  for (let i = 0; i < ringCount; i++) {
    const r = 80 + i * 38;
    const opacity = 0.2 + i * 0.15;
    rings += `<circle cx="200" cy="200" r="${r}" fill="none" stroke="${palette.text}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="1"/>`;
  }
  // Accent dot orbit on the outermost ring
  let dots = '';
  const outerR = 80 + (ringCount - 1) * 38;
  for (let i = 0; i < dotsPerRing; i++) {
    const theta = (i / dotsPerRing) * Math.PI * 2;
    const cx = 200 + outerR * Math.cos(theta);
    const cy = 200 + outerR * Math.sin(theta);
    dots += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="${accent}"/>`;
  }

  const fontSize = symbol.length >= 3 ? 62 : symbol.length === 2 ? 84 : 104;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeAttr(symbol)} placeholder">
  <rect width="400" height="400" fill="${bg}"/>
  ${rings}
  <circle cx="200" cy="200" r="62" fill="${accent}" fill-opacity="0.88"/>
  ${dots}
  <text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="700" font-size="${fontSize}" fill="${palette.text}" letter-spacing="-2">${escapeText(symbol)}</text>
</svg>`;
}
