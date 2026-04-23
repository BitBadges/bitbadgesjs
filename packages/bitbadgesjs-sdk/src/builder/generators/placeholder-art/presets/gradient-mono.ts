import type { Palette } from '../palettes.js';

/** Oversized monogram on a diagonal gradient. Safe workhorse preset. */
export function renderGradientMono(opts: {
  palette: Palette;
  symbol: string;
  hash: number;
}): string {
  const { palette, symbol } = opts;
  const [c1, c2] = palette.stops;
  const grad = `g${opts.hash.toString(36).slice(-4)}`;
  const angle = (opts.hash % 4) * 45; // 0 / 45 / 90 / 135
  const fontSize = symbol.length >= 3 ? 160 : symbol.length === 2 ? 200 : 240;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${escapeAttr(symbol)} placeholder">
  <defs>
    <linearGradient id="${grad}" gradientTransform="rotate(${angle} .5 .5)">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="400" fill="url(#${grad})"/>
  <text x="200" y="200" text-anchor="middle" dominant-baseline="central" font-family="system-ui,-apple-system,Segoe UI,sans-serif" font-weight="800" font-size="${fontSize}" fill="${palette.text}" letter-spacing="-6">${escapeText(symbol)}</text>
</svg>`;
}

export function escapeAttr(v: string): string {
  return v.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}
export function escapeText(v: string): string {
  return v.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}
