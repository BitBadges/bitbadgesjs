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
    return converted;
  } catch {
    // Fallback: if class construction/conversion fails (unknown shape),
    // return the mirrored-but-unconverted value. Checks that expect
    // bigints may misfire, but the pipeline doesn't crash.
    return mirrored;
  }
}
