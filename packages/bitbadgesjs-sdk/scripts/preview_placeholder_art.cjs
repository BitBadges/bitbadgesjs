/**
 * Dev-only preview gallery for the placeholder-art generator.
 *
 * Emits `scripts/preview_placeholder_art.html` — a static page with
 * every preset × 12 sample seeds + every palette × fixed seed on
 * gradient-mono + an "auto" section that shows what the LLM gets by
 * default. Self-contained: images are data URIs so the file opens
 * anywhere without a server.
 *
 * Usage:
 *   npm run build  # once — populates dist/cjs
 *   node scripts/preview_placeholder_art.cjs
 *   open scripts/preview_placeholder_art.html
 */
/* eslint-disable @typescript-eslint/no-var-requires */

const fs = require('fs');
const path = require('path');
const { PALETTES, generatePlaceholderArt } = require('../dist/cjs/builder/generators/placeholder-art/index.js');

const ALL_STYLES = [
  'gradient-mono',
  'geometric-tile',
  'letterform',
  'orbital',
  'mesh',
  'glyph'
];

const SAMPLE_SEEDS = [
  'Premium Membership',
  '5 ATOM Monthly Subscription',
  'Cosmic Wanderers NFT',
  'Builder Season 2',
  'Alpha DAO Governance',
  'MYCOIN Fungible Token',
  'Sunrise Pass',
  'Wrapped ATOM Smart Token',
  'AI Agent Credits',
  'Treasure Map Quest',
  'Crowdfund 2026',
  'Grand Prix Auction'
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function sectionForStyle(style) {
  const cards = SAMPLE_SEEDS.map((seed) => {
    const art = generatePlaceholderArt({ seed, style });
    return `<figure class="card"><img src="${art.imageUri}" alt="${esc(seed)}"/><figcaption><span class="seed">${esc(seed)}</span><span class="meta"><span class="pill">${esc(art.palette.name)}</span><span class="bytes">${art.bytes} B</span></span></figcaption></figure>`;
  }).join('\n    ');
  return `<section><h2 id="style-${style}">${style}</h2><div class="grid">\n    ${cards}\n  </div></section>`;
}

function paletteSection() {
  const fixedSeed = 'Premium Membership';
  const cards = PALETTES.map((p) => {
    const art = generatePlaceholderArt({ seed: fixedSeed, style: 'gradient-mono', paletteName: p.name });
    const swatches = p.stops.map((s) => `<span class="swatch" style="background:${s}"></span>`).join('');
    return `<figure class="card"><img src="${art.imageUri}" alt="${esc(p.name)}"/><figcaption><span class="seed">${esc(p.name)}</span><span class="meta">${swatches}</span></figcaption></figure>`;
  }).join('\n    ');
  return `<section><h2 id="palettes">Palettes (gradient-mono · seed = "${esc(fixedSeed)}")</h2><div class="grid">\n    ${cards}\n  </div></section>`;
}

function autoSection() {
  const cards = SAMPLE_SEEDS.map((seed) => {
    const art = generatePlaceholderArt({ seed });
    return `<figure class="card"><img src="${art.imageUri}" alt="${esc(seed)}"/><figcaption><span class="seed">${esc(seed)}</span><span class="meta"><span class="pill">${esc(art.style)}</span><span class="pill">${esc(art.palette.name)}</span></span></figcaption></figure>`;
  }).join('\n    ');
  return `<section><h2 id="auto">Auto-picked (the default LLM path)</h2><p class="muted">Style and palette chosen from the seed hash. No explicit style / vibe / palette.</p><div class="grid">\n    ${cards}\n  </div></section>`;
}

const nav = [
  '<a href="#auto">auto</a>',
  ...ALL_STYLES.map((s) => `<a href="#style-${s}">${s}</a>`),
  '<a href="#palettes">palettes</a>'
].join(' · ');

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>BitBadges placeholder-art preview</title>
  <style>
    :root { color-scheme: dark light; }
    body { font-family: -apple-system, system-ui, Segoe UI, sans-serif; margin: 0; padding: 32px 48px 64px; background: #0b0f17; color: #e6eaf2; max-width: 1600px; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    h2 { margin: 48px 0 14px; font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #9aa3b2; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    p.muted { color: #9aa3b2; margin-top: 0; font-size: 13px; }
    nav { font-size: 12px; color: #9aa3b2; margin-bottom: 24px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
    nav a { color: #8fb4ff; text-decoration: none; margin-right: 6px; }
    nav a:hover { text-decoration: underline; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
    .card { margin: 0; background: #151a24; border: 1px solid #232a38; border-radius: 10px; overflow: hidden; }
    .card img { display: block; width: 100%; height: auto; aspect-ratio: 1/1; }
    figcaption { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
    figcaption .seed { color: #e6eaf2; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    figcaption .meta { display: flex; align-items: center; gap: 6px; color: #9aa3b2; font-size: 11px; flex-wrap: wrap; }
    figcaption .pill { background: #202738; padding: 2px 8px; border-radius: 999px; font-variant: tabular-nums; }
    figcaption .bytes { opacity: 0.7; font-variant: tabular-nums; }
    figcaption .swatch { display: inline-block; width: 14px; height: 14px; border-radius: 3px; border: 1px solid rgba(255,255,255,0.08); }
  </style>
</head>
<body>
  <h1>BitBadges placeholder-art preview</h1>
  <p class="muted">Every preset × 12 sample seeds + every palette on gradient-mono + auto-picked defaults. Self-contained (images are data URIs) — open directly in a browser.</p>
  <nav>${nav}</nav>
  ${autoSection()}
  ${ALL_STYLES.map(sectionForStyle).join('\n  ')}
  ${paletteSection()}
</body>
</html>
`;

const outPath = path.join(__dirname, 'preview_placeholder_art.html');
fs.writeFileSync(outPath, html, 'utf8');
console.log(`Wrote ${outPath} (${(html.length / 1024).toFixed(1)} KB)`);
console.log(`Open: file://${outPath}`);
