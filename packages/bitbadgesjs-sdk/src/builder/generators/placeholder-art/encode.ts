/**
 * SVG → base64 data URI encoding.
 *
 * Two-step pipeline: minify the SVG (strip whitespace around tags,
 * collapse runs) then base64-encode. Target total data URI length is
 * under ~4 KB — each preset's SVG should fit well under that before
 * encoding. We assert on the size in tests.
 */

const SVG_MINIFY_PATTERNS: Array<[RegExp, string]> = [
  // Drop comments
  [/<!--[\s\S]*?-->/g, ''],
  // Collapse whitespace runs inside tags
  [/\s{2,}/g, ' '],
  // Remove whitespace between tags
  [/>\s+</g, '><'],
  // Trim leading / trailing
  [/^\s+|\s+$/g, '']
];

/** Minify an SVG string conservatively — safe, lossless. */
export function minifySvg(svg: string): string {
  let out = svg;
  for (const [re, rep] of SVG_MINIFY_PATTERNS) {
    out = out.replace(re, rep);
  }
  return out;
}

/**
 * Base64-encode a UTF-8 string. Prefers Buffer (Node) and falls back
 * to btoa w/ a UTF-8-safe path for browsers — the SDK runs in both.
 */
export function base64Encode(input: string): string {
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return Buffer.from(input, 'utf-8').toString('base64');
  }
  // Browser path: encodeURIComponent → %xx → raw bytes → btoa
  const bytes = encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );
  if (typeof btoa === 'function') return btoa(bytes);
  throw new Error('placeholder-art: no base64 encoder available (Buffer or btoa)');
}

/**
 * Minify + base64 + `data:image/svg+xml;base64,...` wrap.
 * Returns `{ uri, bytes, minified }` for observability + tests.
 */
export function toDataUri(svg: string): { uri: string; bytes: number; minified: string } {
  const minified = minifySvg(svg);
  const uri = `data:image/svg+xml;base64,${base64Encode(minified)}`;
  return { uri, bytes: uri.length, minified };
}
