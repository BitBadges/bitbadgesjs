import { z } from 'zod';
import { getTransaction as getTransactionFromSession, getOrCreateSession, ensureStringNumbers } from '../../session/sessionState.js';
import { normalizeTxMessages } from '../../../cli/utils/normalizeMsg.js';
import { generatePlaceholderArt } from '../../generators/placeholder-art/index.js';

export const getTransactionSchema = z.object({
  sessionId: z.string().optional().describe("Session ID for per-request isolation."),
  creatorAddress: z.string().optional().describe('Creator bb1... address.')
});

export type GetTransactionInput = z.infer<typeof getTransactionSchema>;

export const getTransactionTool = {
  name: 'get_transaction',
  description: 'Get the assembled transaction JSON with metadataPlaceholders. Call this after building to retrieve the final output. Numbers are auto-converted to strings.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      sessionId: { type: 'string', description: 'Session ID.' },
      creatorAddress: { type: 'string', description: 'Creator address (bb1... or 0x...).' }
    }
  }
};

const IMAGE_PLACEHOLDER_REGEX = /^IMAGE_\d+$/;
/**
 * Legacy BitBadges default logo URI. The prompt used to instruct the
 * LLM to hardcode this when no images were uploaded; it's been
 * removed, but we still scrub it defensively in case the prompt
 * cache / training data leaks it into the output.
 */
const LEGACY_BB_LOGO_URI = 'ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E';

/** True iff a string needs to be swapped for generated art. */
function isUnresolvedImage(s: string): boolean {
  return IMAGE_PLACEHOLDER_REGEX.test(s) || s === LEGACY_BB_LOGO_URI;
}

/**
 * Approval-metadata placeholders are REQUIRED to have `image: ""` by
 * protocol convention (see the Images section in the system prompt).
 * Non-approval placeholders (collection, token, alias path) should
 * have a real image — an empty string there means the LLM left the
 * field unfilled, and we want to fill it in. This heuristic picks
 * them apart based on the sidecar key naming convention the prompt
 * enforces.
 */
function isApprovalPlaceholderKey(key: string): boolean {
  const k = key.toUpperCase();
  return k.includes('APPROVAL') || k.includes('MERKLE');
}

/**
 * Find the collection's display name inside the built transaction.
 * Walks the first message's metadataPlaceholders sidecar — that's
 * where the LLM stores name/description/image pre-IPFS pinning.
 * Falls back to 'BitBadges Collection' if we can't find one.
 */
function extractCollectionName(tx: any): string {
  if (!tx || typeof tx !== 'object') return 'BitBadges Collection';
  const msgs = Array.isArray(tx.messages) ? tx.messages : tx.msgs;
  const body = msgs?.[0]?.value ?? msgs?.[0];
  if (!body || typeof body !== 'object') return 'BitBadges Collection';

  // Direct field on recent schema shapes
  const direct = body.name ?? body.collectionName;
  if (typeof direct === 'string' && direct.trim()) return direct.trim();

  // Look inside metadataPlaceholders sidecar — the LLM writes
  // `{ name, description, image }` objects keyed by the URI they
  // resolve into. The "collection" key is the canonical collection
  // metadata entry.
  const meta = body._meta ?? body.meta ?? body;
  const placeholders = meta?.metadataPlaceholders;
  if (placeholders && typeof placeholders === 'object') {
    // Prefer an explicit 'collection' key when present.
    const col = placeholders.collection ?? placeholders.COLLECTION ?? placeholders.collectionMetadata;
    if (col && typeof col.name === 'string' && col.name.trim()) return col.name.trim();
    // Otherwise first entry with a name.
    for (const entry of Object.values(placeholders)) {
      if (entry && typeof (entry as any).name === 'string' && (entry as any).name.trim()) {
        return (entry as any).name.trim();
      }
    }
  }
  return 'BitBadges Collection';
}

/**
 * Look for an `_artHints` sidecar on the collection's metadataPlaceholders
 * entry. The LLM can optionally include it to influence the placeholder
 * art — all fields optional:
 *   { symbol?, style?, vibe?, paletteName? }
 *
 * Returns null if the sidecar isn't present or doesn't parse. Silently
 * ignores unknown keys — we only forward the four we document.
 */
function extractArtHints(tx: any): { symbol?: string; style?: string; vibe?: string; paletteName?: string } | null {
  if (!tx || typeof tx !== 'object') return null;
  const msgs = Array.isArray(tx.messages) ? tx.messages : tx.msgs;
  const body = msgs?.[0]?.value ?? msgs?.[0];
  if (!body || typeof body !== 'object') return null;
  const placeholders = (body._meta ?? body.meta)?.metadataPlaceholders;
  if (!placeholders || typeof placeholders !== 'object') return null;
  for (const [, entry] of Object.entries(placeholders)) {
    if (!entry || typeof entry !== 'object') continue;
    const hints = (entry as any)._artHints;
    if (hints && typeof hints === 'object') {
      const out: { symbol?: string; style?: string; vibe?: string; paletteName?: string } = {};
      if (typeof hints.symbol === 'string') out.symbol = hints.symbol;
      if (typeof hints.style === 'string') out.style = hints.style;
      if (typeof hints.vibe === 'string') out.vibe = hints.vibe;
      if (typeof hints.paletteName === 'string') out.paletteName = hints.paletteName;
      return out;
    }
  }
  return null;
}

/**
 * Generic recursive replace — swaps any string that qualifies as
 * "unresolved" (IMAGE_N or the legacy BitBadges default-logo URI)
 * with the single per-build generated art URI. Runs on every field
 * in the transaction, including the sidecar.
 *
 * We generate ONCE per call (seeded by the collection name) and
 * reuse the result — matches the common real-world pattern where
 * a collection uses one image across collection + tokens + alias
 * paths + denom units. Callers that want per-asset variety should
 * invoke `generate_placeholder_art` directly before setting
 * metadata; this post-step only fills what the LLM left unresolved.
 *
 * Real URIs (https://, ipfs://, data:) are NEVER touched EXCEPT the
 * one legacy BitBadges default-logo hash that we explicitly scrub.
 */
function replaceUnresolvedImagePlaceholders(obj: any, fallbackUri: string): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return isUnresolvedImage(obj) ? fallbackUri : obj;
  }
  if (Array.isArray(obj)) return obj.map((v) => replaceUnresolvedImagePlaceholders(v, fallbackUri));
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = replaceUnresolvedImagePlaceholders(val, fallbackUri);
    }
    return result;
  }
  return obj;
}

/**
 * Targeted sidecar pass — walks `_meta.metadataPlaceholders` on each
 * message and fills EMPTY-STRING images for non-approval entries.
 * Approval placeholders are required to have `image: ""` by protocol
 * convention and are left alone.
 *
 * Returns a count of fills performed so the caller can include it in
 * observability / log output.
 */
function fillEmptyImagesInSidecar(tx: any, fallbackUri: string): number {
  if (!tx || typeof tx !== 'object') return 0;
  const msgs = Array.isArray(tx.messages) ? tx.messages : tx.msgs;
  if (!Array.isArray(msgs)) return 0;
  let filled = 0;
  for (const msg of msgs) {
    const body = msg?.value ?? msg;
    const meta = body?._meta ?? body?.meta;
    const placeholders = meta?.metadataPlaceholders;
    if (!placeholders || typeof placeholders !== 'object') continue;
    for (const [key, entry] of Object.entries(placeholders)) {
      if (!entry || typeof entry !== 'object') continue;
      if (isApprovalPlaceholderKey(key)) continue;
      const e = entry as any;
      if (e.image === '' || e.image === undefined || e.image === null) {
        e.image = fallbackUri;
        filled++;
      }
    }
  }
  return filled;
}

/** Predicate: is there any string in the tree that needs a swap? */
function hasUnresolvedImagePlaceholder(obj: any): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'string') return isUnresolvedImage(obj);
  if (Array.isArray(obj)) return obj.some(hasUnresolvedImagePlaceholder);
  if (typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      if (hasUnresolvedImagePlaceholder(val)) return true;
    }
  }
  return false;
}

/** Predicate: is there any empty image on a non-approval sidecar entry? */
function hasEmptyNonApprovalImage(tx: any): boolean {
  if (!tx || typeof tx !== 'object') return false;
  const msgs = Array.isArray(tx.messages) ? tx.messages : tx.msgs;
  if (!Array.isArray(msgs)) return false;
  for (const msg of msgs) {
    const body = msg?.value ?? msg;
    const placeholders = (body?._meta ?? body?.meta)?.metadataPlaceholders;
    if (!placeholders || typeof placeholders !== 'object') continue;
    for (const [key, entry] of Object.entries(placeholders)) {
      if (!entry || typeof entry !== 'object') continue;
      if (isApprovalPlaceholderKey(key)) continue;
      const img = (entry as any).image;
      if (img === '' || img === undefined || img === null) return true;
    }
  }
  return false;
}

export function handleGetTransaction(input: GetTransactionInput) {
  const transaction = getTransactionFromSession(input.sessionId, input.creatorAddress);
  // Ensure all numbers are strings (common LLM mistake)
  const sanitized = ensureStringNumbers(transaction);

  // Post-step: fill any unresolved image slot with generated
  // placeholder art. Generated ONCE per call and reused for every
  // slot — matches the common "one image across the collection"
  // pattern and avoids token-cost explosion on many-token builds.
  //
  // Three kinds of slots get filled:
  //   1. IMAGE_N placeholders the LLM wrote but nothing substituted
  //   2. The legacy BitBadges default-logo URI (scrubbed defensively
  //      in case prompt-cache residue or training data leaks it)
  //   3. Empty-string images on NON-approval sidecar placeholders
  //      (approval placeholders require image="" and are left alone)
  let cleaned = sanitized;
  const needsGenericFill = hasUnresolvedImagePlaceholder(sanitized);
  const needsSidecarFill = hasEmptyNonApprovalImage(sanitized);
  if (needsGenericFill || needsSidecarFill) {
    const seed = extractCollectionName(sanitized);
    const hints = extractArtHints(sanitized);
    const art = generatePlaceholderArt({
      seed,
      symbol: hints?.symbol,
      style: hints?.style as any,
      vibe: hints?.vibe as any,
      paletteName: hints?.paletteName
    });
    if (needsGenericFill) {
      cleaned = replaceUnresolvedImagePlaceholders(sanitized, art.imageUri);
    }
    if (needsSidecarFill) {
      fillEmptyImagesInSidecar(cleaned, art.imageUri);
    }
  }

  // Narrow Universal → MsgCreateCollection / MsgUpdateCollection at this
  // agent-facing boundary. Session storage stays on Universal (superset)
  // so internal mutators don't have to branch on message type.
  const normalized = normalizeTxMessages(cleaned);
  return { success: true, transaction: normalized };
}
