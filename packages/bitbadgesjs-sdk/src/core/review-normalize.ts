/**
 * Collection value normalization for the review pipeline.
 *
 * Extracted into a standalone file so `verifyStandardsCompliance` and
 * `auditCollection` can import it without creating a circular
 * dependency with `review.ts` (which depends on them).
 *
 * Every review consumer runs `normalizeForReview` on its input so
 * downstream checks can assume a single canonical shape:
 *
 * - All numeric fields are bigints. Numbers are converted via the
 *   registered `MsgUniversalUpdateCollection` class + each nested
 *   class's `getNumberFieldNames()` — addresses, URIs, denoms, IDs
 *   stay as strings. This is strictly safer than a recursive walk.
 * - Alias path / wrapper path field names are mirrored so both
 *   `aliasPaths` (frontend/on-chain shape) and `aliasPathsToAdd`
 *   (Msg create shape) are always populated together.
 *
 * The function is idempotent: passing an already-normalized value
 * through again is a no-op (the class constructor just rewraps).
 */

import { BigIntify } from '../common/string-numbers.js';
import { MsgUniversalUpdateCollection } from '../transactions/messages/bitbadges/tokenization/msgUniversalUpdateCollection.js';

/**
 * Unwrap any of: transaction (`{ messages: [...] }`), raw message
 * (`{ typeUrl, value }`), or a bare collection value object. Ported from
 * the frontend `extractValue` helper in `reviewItems.ts`.
 */
export function extractCollectionValue(input: unknown): any {
  if (!input || typeof input !== 'object') return input;
  const obj = input as any;
  const messages = obj.messages || (Array.isArray(obj) ? obj : undefined);
  if (messages && Array.isArray(messages) && messages.length > 0) {
    const msg = messages[0];
    return msg?.value || msg || input;
  }
  if (obj.value && typeof obj.value === 'object') return obj.value;
  return obj;
}

function mirrorPathFieldNames(value: Record<string, any>): Record<string, any> {
  const out = { ...value };
  if (out.aliasPaths && !out.aliasPathsToAdd) out.aliasPathsToAdd = out.aliasPaths;
  if (out.aliasPathsToAdd && !out.aliasPaths) out.aliasPaths = out.aliasPathsToAdd;
  if (out.cosmosCoinWrapperPaths && !out.cosmosCoinWrapperPathsToAdd)
    out.cosmosCoinWrapperPathsToAdd = out.cosmosCoinWrapperPaths;
  if (out.cosmosCoinWrapperPathsToAdd && !out.cosmosCoinWrapperPaths)
    out.cosmosCoinWrapperPaths = out.cosmosCoinWrapperPathsToAdd;
  return out;
}

/**
 * Re-attach fields that the proto-spec classes strip during conversion
 * but that review checks still need to see. The SDK has two parallel
 * class hierarchies: the "Msg" shape (proto-spec only) used by
 * MsgUniversalUpdateCollection, and the "WithDetails" shape used by
 * the frontend / on-chain hydrated state, which adds nested inline
 * content not present in the proto. When we run the Msg class to get
 * BigIntify conversion, the extra WithDetails fields are dropped.
 *
 * Specifically:
 *   - PathMetadata only keeps { uri, customData }; WithDetails adds
 *     a nested `metadata: { name, image, description }` for
 *     pre-upload inline content.
 *   - CollectionMetadata same.
 *   - CollectionApproval only keeps proto fields; WithDetails adds
 *     `details: { name, description, image }` for the approval card.
 *
 * This helper walks the raw (pre-conversion) input and copies those
 * dropped fields onto the converted output. Non-mutating to the raw
 * input; mutates the converted result in place.
 */
function reattachInlineMetadata(converted: any, raw: any): void {
  // Collection metadata
  const rawCm = raw?.collectionMetadata;
  if (rawCm?.metadata && converted?.collectionMetadata) {
    converted.collectionMetadata.metadata = rawCm.metadata;
  }
  // Alias paths (both field names may exist after mirroring)
  for (const field of ['aliasPathsToAdd', 'aliasPaths'] as const) {
    const rawList = raw?.[field];
    const outList = converted?.[field];
    if (!Array.isArray(rawList) || !Array.isArray(outList)) continue;
    for (let i = 0; i < Math.min(rawList.length, outList.length); i++) {
      const rawInline = rawList[i]?.metadata?.metadata;
      if (rawInline && outList[i]?.metadata) outList[i].metadata.metadata = rawInline;
      const rawUnits = rawList[i]?.denomUnits || [];
      const outUnits = outList[i]?.denomUnits || [];
      for (let j = 0; j < Math.min(rawUnits.length, outUnits.length); j++) {
        const rawUnitInline = rawUnits[j]?.metadata?.metadata;
        if (rawUnitInline && outUnits[j]?.metadata) outUnits[j].metadata.metadata = rawUnitInline;
      }
    }
  }
  // Approval details — each collectionApproval may have a WithDetails
  // `details: { name, description, image }` sibling that the proto
  // CollectionApproval class strips. The unnamed_approvals review check
  // reads `a.details?.name`, so we need this back on the converted list.
  const rawApprovals = raw?.collectionApprovals;
  const outApprovals = converted?.collectionApprovals;
  if (Array.isArray(rawApprovals) && Array.isArray(outApprovals)) {
    for (let i = 0; i < Math.min(rawApprovals.length, outApprovals.length); i++) {
      const rawDetails = rawApprovals[i]?.details;
      if (rawDetails && outApprovals[i] !== undefined && outApprovals[i] !== null) {
        outApprovals[i].details = rawDetails;
      }
    }
  }
}

export function normalizeForReview(input: unknown): any {
  const raw = extractCollectionValue(input);
  if (!raw || typeof raw !== 'object') return raw;
  const mirrored = mirrorPathFieldNames(raw as Record<string, any>);
  try {
    // Wrap in the Msg class and convert numeric fields to bigints via
    // each nested class's registered number-field list.
    const msg = new MsgUniversalUpdateCollection(mirrored as any);
    const converted = msg.convert(BigIntify) as any;
    // The class only stores Msg-shape fields; downstream checks may
    // still look up `aliasPaths` (frontend shape). Copy the converted
    // list into both names.
    if (converted.aliasPathsToAdd && !converted.aliasPaths) converted.aliasPaths = converted.aliasPathsToAdd;
    if (converted.cosmosCoinWrapperPathsToAdd && !converted.cosmosCoinWrapperPaths)
      converted.cosmosCoinWrapperPaths = converted.cosmosCoinWrapperPathsToAdd;
    // Re-attach WithDetails inline metadata that the proto classes drop.
    reattachInlineMetadata(converted, mirrored);
    return converted;
  } catch {
    // Fallback: if class construction/conversion fails (unknown shape),
    // return the mirrored-but-unconverted value. Checks that expect
    // bigints may misfire, but the pipeline doesn't crash.
    return mirrored;
  }
}
