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
 * Walk the transaction and replace every unresolved `IMAGE_N` string
 * with a single generated placeholder-art data URI. We generate ONCE
 * per call (seeded by the collection name) and reuse the result for
 * every placeholder — this matches the common real-world pattern
 * where a collection uses one image across collection + tokens +
 * alias paths + denom units. Callers that want per-asset variety
 * should invoke `generate_placeholder_art` directly before setting
 * metadata — this post-step only fills what the LLM left unresolved.
 *
 * Existing strings that look like real URIs (https://, ipfs://,
 * data:) are NEVER touched.
 */
function replaceUnresolvedImagePlaceholders(obj: any, fallbackUri: string): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') {
    return IMAGE_PLACEHOLDER_REGEX.test(obj) ? fallbackUri : obj;
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

/** Cheap scan for any lingering `IMAGE_N` strings. Short-circuits when it finds one. */
function hasUnresolvedImagePlaceholder(obj: any): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj === 'string') return IMAGE_PLACEHOLDER_REGEX.test(obj);
  if (Array.isArray(obj)) return obj.some(hasUnresolvedImagePlaceholder);
  if (typeof obj === 'object') {
    for (const val of Object.values(obj)) {
      if (hasUnresolvedImagePlaceholder(val)) return true;
    }
  }
  return false;
}

export function handleGetTransaction(input: GetTransactionInput) {
  const transaction = getTransactionFromSession(input.sessionId, input.creatorAddress);
  // Ensure all numbers are strings (common LLM mistake)
  const sanitized = ensureStringNumbers(transaction);

  // Post-step: fill any unresolved IMAGE_N with generated placeholder
  // art. Generated ONCE per call and reused for every placeholder —
  // matches the common "one image across the collection" pattern and
  // avoids token-counts explosion when a collection has many tokens.
  let cleaned = sanitized;
  if (hasUnresolvedImagePlaceholder(sanitized)) {
    const seed = extractCollectionName(sanitized);
    const art = generatePlaceholderArt({ seed });
    cleaned = replaceUnresolvedImagePlaceholders(sanitized, art.imageUri);
  }

  // Narrow Universal → MsgCreateCollection / MsgUpdateCollection at this
  // agent-facing boundary. Session storage stays on Universal (superset)
  // so internal mutators don't have to branch on message type.
  const normalized = normalizeTxMessages(cleaned);
  return { success: true, transaction: normalized };
}
