/**
 * Collection-msg normalization helpers.
 *
 * Internal tooling (templates, validate, audit, interpret, builder sessions)
 * historically speaks a single superset message type:
 * `/tokenization.MsgUniversalUpdateCollection`. The chain accepts that form
 * for legacy reasons but exposes two narrower types in its proto:
 *
 *   - `MsgCreateCollection` for new collections — no `collectionId`, no
 *     `updateXxxTimeline` flags, keeps `defaultBalances` + `invariants`.
 *   - `MsgUpdateCollection`  for edits — keeps `collectionId` + flags,
 *     rejects `defaultBalances` + `invariants` (the latter is genesis-only
 *     per the proto comment, even though the proto field still appears).
 *
 * We keep Universal as the in-memory representation everywhere internal (it's
 * a superset, so every piece of logic naturally covers both cases) and
 * normalize at the narrow set of agent/user-facing output boundaries:
 * CLI template stdout, `builder preview` upload, `getTransaction` MCP tool,
 * indexer session export. Input boundaries accept all three shapes via
 * `isCollectionMsg` / `coerceToUniversal`.
 */

export const TYPE_URL_UNIVERSAL = '/tokenization.MsgUniversalUpdateCollection';
export const TYPE_URL_CREATE = '/tokenization.MsgCreateCollection';
export const TYPE_URL_UPDATE = '/tokenization.MsgUpdateCollection';

const COLLECTION_TYPE_URLS = new Set([TYPE_URL_UNIVERSAL, TYPE_URL_CREATE, TYPE_URL_UPDATE]);

const UPDATE_FLAGS = [
  'updateValidTokenIds',
  'updateCollectionPermissions',
  'updateManager',
  'updateCollectionMetadata',
  'updateTokenMetadata',
  'updateCustomData',
  'updateCollectionApprovals',
  'updateStandards',
  'updateIsArchived'
] as const;

/** True if `msg.typeUrl` is any of the three collection create/update msgs. */
export function isCollectionMsg(msg: any): boolean {
  if (!msg || typeof msg !== 'object') return false;
  const t = typeof msg.typeUrl === 'string' ? msg.typeUrl : '';
  if (COLLECTION_TYPE_URLS.has(t)) return true;
  return (
    t.endsWith('.MsgCreateCollection') ||
    t.endsWith('.MsgUpdateCollection') ||
    t.endsWith('.MsgUniversalUpdateCollection')
  );
}

/**
 * Given a collection msg in any of the three shapes, return a plain Universal
 * superset shape so internal logic (validate, audit, interpret, review,
 * frontend auto-apply) doesn't need to branch on typeUrl. Create → fills in
 * `collectionId = "0"` and sets every `updateXxxTimeline` flag to true
 * (matches the handler adapter pattern in the indexer). Update → just
 * rewrites the typeUrl; collectionId + flags are already there. Universal →
 * returned as-is.
 */
export function coerceToUniversal(msg: any): any {
  if (!isCollectionMsg(msg)) return msg;
  const t = msg.typeUrl as string;
  const value = { ...(msg.value || {}) };

  if (t.endsWith('.MsgCreateCollection')) {
    if (!('collectionId' in value)) value.collectionId = '0';
    for (const f of UPDATE_FLAGS) value[f] = true;
  }

  return { ...msg, typeUrl: TYPE_URL_UNIVERSAL, value };
}

/**
 * Narrow a Universal-shaped msg into either MsgCreateCollection (new
 * collection — `collectionId` absent or `"0"`) or MsgUpdateCollection. If
 * the input is already Create or Update, returned unchanged.
 *
 * Field-strip rules (locked against `proto/tokenization/tx.proto`):
 *   - Create: drops `collectionId` and every `updateXxxTimeline` flag.
 *     Keeps `defaultBalances` and `invariants` (both create-only).
 *   - Update: drops `defaultBalances` and `invariants`. Keeps
 *     `collectionId` + flags so the chain knows what to mutate.
 */
export function normalizeToCreateOrUpdate(msg: any): any {
  if (!msg || typeof msg !== 'object') return msg;
  const t = typeof msg.typeUrl === 'string' ? msg.typeUrl : '';
  if (!t.endsWith('.MsgUniversalUpdateCollection')) return msg;

  const value = { ...(msg.value || {}) };
  const rawId = value.collectionId;
  const isNew = rawId === undefined || rawId === null || rawId === '0' || rawId === 0;

  if (isNew) {
    delete value.collectionId;
    for (const f of UPDATE_FLAGS) delete value[f];
    return { ...msg, typeUrl: TYPE_URL_CREATE, value };
  }

  delete value.defaultBalances;
  delete value.invariants;
  for (const f of UPDATE_FLAGS) {
    if (value[f] === undefined) value[f] = true;
  }
  return { ...msg, typeUrl: TYPE_URL_UPDATE, value };
}

/** Apply `normalizeToCreateOrUpdate` to every collection msg in a tx body. */
export function normalizeTxMessages<T extends { messages?: any[] }>(tx: T): T {
  if (!tx || !Array.isArray(tx.messages)) return tx;
  return { ...tx, messages: tx.messages.map((m) => normalizeToCreateOrUpdate(m)) };
}
