/**
 * Metadata-completeness decisions.
 *
 * Answers "is every metadata slot populated with real content?" — a
 * cross-field roll-up that can't be derived from any single field.
 * Distinct from the metadata review checks (which emit findings when
 * something is missing) — this is the inverse, stating the positive
 * outcome when everything is in place.
 */

import type { DesignDecision } from '../review-types.js';

const PLACEHOLDER_PREFIX = 'ipfs://METADATA_';

function isPlaceholderUri(uri: unknown): boolean {
  return typeof uri === 'string' && uri.startsWith(PLACEHOLDER_PREFIX);
}

function hasInlineContent(meta: any): boolean {
  if (!meta || typeof meta !== 'object') return false;
  return !!(meta.name || meta.image || meta.description);
}

export function metadataDecisions(collection: any): DesignDecision[] {
  if (!collection || typeof collection !== 'object') return [];
  const out: DesignDecision[] = [];

  // Collection metadata — slot is either a concrete URI or inline
  // content ready to upload. Placeholder URI with no inline content
  // means the slot is empty.
  const cm = collection.collectionMetadata;
  const cmUri = cm?.uri;
  const cmInline = cm?.metadata;
  const cmMissing = !cmUri || (isPlaceholderUri(cmUri) && !hasInlineContent(cmInline));

  // Token metadata — same rule, applied to each entry.
  const tm: any[] = Array.isArray(collection.tokenMetadata) ? collection.tokenMetadata : [];
  let tmMissingCount = 0;
  for (const t of tm) {
    const uri = t?.uri;
    const inline = t?.metadata;
    if (!uri || (isPlaceholderUri(uri) && !hasInlineContent(inline))) tmMissingCount++;
  }

  const allFilled = !cmMissing && tmMissingCount === 0;
  const parts: string[] = [];
  if (cmMissing) parts.push('collection metadata missing');
  if (tmMissingCount > 0) parts.push(`${tmMissingCount} token metadata entr${tmMissingCount === 1 ? 'y' : 'ies'} missing`);

  out.push({
    code: 'design.metadata.all_populated',
    category: 'metadata',
    title: { en: 'All metadata populated' },
    detail: allFilled
      ? { en: 'Every metadata slot (collection + tokens) has either a concrete URI or inline content ready to upload.' }
      : { en: 'At least one metadata slot is empty or still a placeholder URI with no inline content.' },
    status: allFilled ? 'pass' : 'fail',
    evidence: allFilled
      ? `${tm.length} token metadata ${tm.length === 1 ? 'entry' : 'entries'} populated`
      : parts.join('; ')
  });

  return out;
}
