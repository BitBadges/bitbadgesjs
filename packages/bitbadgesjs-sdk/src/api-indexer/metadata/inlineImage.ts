/**
 * Inline image option for zero-hosting metadata.
 *
 * Re-export of the deterministic SVG placeholder-art generator that
 * lives under `builder/generators/placeholder-art/`. Surfaces it as a
 * public, top-level option for any caller that wants to populate the
 * `image` field of inline `customData` metadata without uploading to
 * IPFS or any other host.
 *
 * The placeholder-art generator produces 1-8 KB
 * `data:image/svg+xml;base64,...` URIs that look intentional and live
 * entirely inside the on-chain JSON. End-to-end zero-hosting:
 *
 * ```ts
 * import { generatePlaceholderArt, parseInlineCustomData } from 'bitbadges';
 *
 * const art = generatePlaceholderArt({ seed: 'My Collection' });
 * const inline = JSON.stringify({
 *   name: 'My Collection',
 *   description: '...',
 *   image: art.imageUri,   // data:image/svg+xml;base64,...
 * });
 * // Set on-chain: collectionMetadata.uri = '', collectionMetadata.customData = inline
 * ```
 *
 * Deterministic: the same seed always produces the same art (six
 * curated presets × 24 palettes, hash-picked from the seed). Pin a
 * specific look with `style` / `paletteName` if needed.
 *
 * ## Cost trade-off — inline SVG is convenient, NOT free
 *
 * Inline SVG side-steps IPFS hosting, but the bytes still live on-chain.
 * You're shifting the cost from a hosting fee to chain gas, not
 * eliminating it.
 *
 * Per the cost-considerations callout in the BitBadges docs
 * (`token-standard/learn/collection-setup-fields.md#cost-considerations-keep-images-off-chain`):
 * - Every byte of `customData` is stored on-chain forever.
 * - Gas runs roughly 10 gas/byte. An 8 KB SVG ≈ ~80,000 gas per write.
 * - Block size is hard-capped (~1 MB), so very large inline payloads
 *   start fighting block limits during bulk updates.
 *
 * Compared to the alternatives:
 * - **Inline SVG (this generator)**: zero hosting, ~1-8 KB on-chain,
 *   ~10-80k gas extra per write, deterministic, no raster detail.
 *   Great for fungible tokens, subscriptions, vaults, generic
 *   placeholder-y looks where you don't have art and don't want to
 *   maintain an IPFS pin.
 * - **Inline customData with URL image (`ipfs://...`)**: tiny on-chain
 *   wrapper (~250 B) + IPFS pin for the image only. Cheapest on-chain
 *   path when you have an image; needs hosting for the image.
 * - **Full URI mode (`uri` set, `customData` empty)**: smallest
 *   on-chain footprint (~50 B URL) + IPFS pin for JSON + image.
 *   Cheapest on-chain when you have any sizable JSON; needs hosting.
 *
 * Pick inline SVG when "no hosting setup at all" is worth more than
 * the extra ~80k gas per write. For high-frequency mints / updates,
 * or anything image-heavy, prefer a hosted image URL.
 *
 * See `parseInlineCustomData` for the read-side resolution.
 */

export {
  generatePlaceholderArt,
  hashSeed,
  deriveSymbol,
  resolveStyle,
  PALETTES,
  pickPalette,
  toDataUri,
  minifySvg,
  base64Encode,
  GLYPH_NAMES,
  type PlaceholderArtStyle,
  type PlaceholderArtVibe,
  type GeneratePlaceholderArtInput,
  type GeneratePlaceholderArtResult,
  type Palette
} from '../../builder/generators/placeholder-art/index.js';
