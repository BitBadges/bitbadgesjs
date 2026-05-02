/**
 * Inline customData JSON metadata parser.
 *
 * Every metadata-bearing entity on chain (collection, token, approval,
 * address list, dynamic store, alias path, wrapper path) carries a
 * `(uri, customData)` pair. Phase 1 makes inline JSON in `customData`
 * a first-class fallback for the read path: when `uri` is empty, the
 * indexer / SDK / frontend try to parse `customData` as off-chain
 * metadata before giving up.
 *
 * `customData` is a free-form on-chain string — anyone can stuff
 * anything in it. The pipeline below validates and sanitizes
 * defensively, returning `null` on any failure rather than throwing or
 * surfacing attacker-controlled shapes.
 *
 * ## Cost note
 *
 * Inline customData is stored on-chain — every byte costs gas
 * (~10 gas/byte) and the bytes live in chain state forever. Use it
 * for the metadata wrapper (name, description, attributes, links to
 * images) — NOT for image bytes or any large/binary payload.
 *
 * If you want zero-hosting AND an image, see `generatePlaceholderArt`
 * (re-exported from this module): produces a deterministic 1-8 KB
 * `data:image/svg+xml;base64,...` URI you can drop straight into the
 * `image` field. You still pay ~80k gas for the 8 KB of SVG bytes,
 * so it's a convenience trade-off, not a free lunch.
 *
 * For full pricing breakdown see the cost-considerations callout in
 * the BitBadges docs (`token-standard/learn/collection-setup-fields.md
 * #cost-considerations-keep-images-off-chain`).
 */
import { BigIntify } from '@/common/string-numbers.js';
import { Metadata, type iMetadata } from './metadata.js';

/** Hard cap on customData byte length before we even try to parse. */
const MAX_INLINE_CUSTOM_DATA_BYTES = 32 * 1024;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function coerceStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v) {
    if (typeof item === 'string') out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

function coerceAttributes(v: unknown): iMetadata<bigint>['attributes'] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: NonNullable<iMetadata<bigint>['attributes']> = [];
  for (const item of v) {
    if (!isPlainObject(item)) continue;
    const type = item.type;
    const name = item.name;
    const value = item.value;
    if (typeof type !== 'string' || typeof name !== 'string') continue;
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') continue;
    out.push({ type, name, value });
  }
  return out.length > 0 ? out : undefined;
}

function coerceSocials(v: unknown): Record<string, string> | undefined {
  if (!isPlainObject(v)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'string') out[k] = val;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function coerceAdditionalInfo(v: unknown): iMetadata<bigint>['additionalInfo'] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: NonNullable<iMetadata<bigint>['additionalInfo']> = [];
  for (const item of v) {
    if (!isPlainObject(item)) continue;
    const name = item.name;
    const image = item.image;
    const description = item.description;
    if (typeof name !== 'string' || typeof image !== 'string' || typeof description !== 'string') continue;
    const entry: NonNullable<iMetadata<bigint>['additionalInfo']>[number] = { name, image, description };
    if (typeof item.url === 'string') entry.url = item.url;
    out.push(entry);
  }
  return out.length > 0 ? out : undefined;
}

/**
 * Parse + sanitize a free-form `customData` string into a `Metadata`
 * object. Returns `null` on any failure (oversized, malformed JSON,
 * wrong type, missing required shape, etc.). Never throws, never
 * returns the raw parsed object.
 *
 * Required shape gate: must have at least one of `name`, `image`, or
 * `description` as a non-empty string. Per-preset stricter shapes are
 * enforced at write time by builders / CLI; this read-side helper
 * stays permissive on optionals so legacy customData with name-only
 * still resolves.
 */
export function parseInlineCustomData(customData: string): Metadata<bigint> | null {
  if (typeof customData !== 'string') return null;
  if (customData.length === 0) return null;
  if (customData.length > MAX_INLINE_CUSTOM_DATA_BYTES) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(customData);
  } catch {
    return null;
  }

  if (!isPlainObject(parsed)) return null;

  const hasRequired =
    isNonEmptyString(parsed.name) || isNonEmptyString(parsed.image) || isNonEmptyString(parsed.description);
  if (!hasRequired) return null;

  const cleaned: iMetadata<bigint> = {
    name: typeof parsed.name === 'string' ? parsed.name : '',
    description: typeof parsed.description === 'string' ? parsed.description : '',
    image: typeof parsed.image === 'string' ? parsed.image : ''
  };

  if (typeof parsed.bannerImage === 'string') cleaned.bannerImage = parsed.bannerImage;
  if (typeof parsed.category === 'string') cleaned.category = parsed.category;
  if (typeof parsed.externalUrl === 'string') cleaned.externalUrl = parsed.externalUrl;

  const tags = coerceStringArray(parsed.tags);
  if (tags) cleaned.tags = tags;

  const socials = coerceSocials(parsed.socials);
  if (socials) cleaned.socials = socials;

  const attributes = coerceAttributes(parsed.attributes);
  if (attributes) cleaned.attributes = attributes;

  const additionalInfo = coerceAdditionalInfo(parsed.additionalInfo);
  if (additionalInfo) cleaned.additionalInfo = additionalInfo;

  return new Metadata<bigint>(cleaned).convert(BigIntify);
}
