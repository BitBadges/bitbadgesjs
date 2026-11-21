import * as fs from 'node:fs';

/**
 * collectionId "0" on a transfer / update is a chain-level alias for
 * "the newest collection" (`GetNextCollectionId() - 1`). That alias is
 * only safe in a single multi-msg transaction, where the create in an
 * earlier message increments the counter and "0" therefore names the
 * collection just created in that same tx.
 *
 * `bb deploy --with-keyring` cannot keep those messages in one tx: the
 * chain binary's `tx tokenization <verb>` subcommands accept one message
 * each, so the CLI splits the bundle into sequential txs ~6s apart.
 * After that split, "0" is the newest collection *globally*, not "the
 * one this signer just created." Bind the real id from the create tx's
 * events into later messages before they are broadcast, and refuse to
 * print a sequential script that would leave the placeholder in place.
 */

export const MSG_CREATE_COLLECTION = '/tokenization.MsgCreateCollection';
export const MSG_UNIVERSAL_UPDATE_COLLECTION = '/tokenization.MsgUniversalUpdateCollection';

/** Msgs that *reference* an existing collection (as opposed to creating one). */
export const COLLECTION_REFERENCE_TYPE_URLS: ReadonlySet<string> = new Set([
  '/tokenization.MsgUpdateCollection',
  '/tokenization.MsgTransferTokens',
  '/tokenization.MsgSetManager',
  '/tokenization.MsgSetCustomData',
  '/tokenization.MsgSetCollectionMetadata',
  '/tokenization.MsgSetStandards',
  '/tokenization.MsgSetCollectionApprovals',
  '/tokenization.MsgSetValidTokenIds',
  '/tokenization.MsgSetIsArchived',
  '/tokenization.MsgUpdateUserApprovals',
  '/tokenization.MsgSetTokenMetadata',
  '/tokenization.MsgDeleteCollection',
  '/tokenization.MsgCastVote',
  '/tokenization.MsgSetOutgoingApproval',
  '/tokenization.MsgSetIncomingApproval',
  '/tokenization.MsgDeleteOutgoingApproval',
  '/tokenization.MsgDeleteIncomingApproval'
]);

/**
 * True when `id` is the chain's "newest collection" placeholder.
 * Accepts the string/number/bigint shapes the SDK and proto-JSON use.
 * `null` / `undefined` / `''` are treated as placeholder only when
 * `treatMissing` is true (proto default for a missing uint is 0).
 */
export function isPlaceholderCollectionId(id: unknown, treatMissing = false): boolean {
  if (id == null || id === '') return treatMissing;
  if (typeof id === 'number') return id === 0;
  if (typeof id === 'bigint') return id === 0n;
  const s = String(id).trim();
  return s === '0';
}

export function topLevelCollectionId(value: unknown): unknown {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Record<string, unknown>;
  return v.collectionId ?? v.collection_id;
}

/** MsgCreateCollection always creates. MsgUniversalUpdateCollection creates iff collectionId is 0/missing. */
export function messageCreatesCollection(typeUrl: string, value: unknown): boolean {
  if (typeUrl === MSG_CREATE_COLLECTION) return true;
  if (typeUrl === MSG_UNIVERSAL_UPDATE_COLLECTION) {
    return isPlaceholderCollectionId(topLevelCollectionId(value), true);
  }
  return false;
}

export function messageReferencesPlaceholderCollection(typeUrl: string, value: unknown): boolean {
  if (!COLLECTION_REFERENCE_TYPE_URLS.has(typeUrl)) return false;
  // Missing collectionId is treated as the proto default of 0.
  return isPlaceholderCollectionId(topLevelCollectionId(value), true);
}

/**
 * True when a later message would use collectionId "0" after an earlier
 * message in the same bundle creates a collection. That combination is
 * deterministic in one atomic tx and ambiguous once the bundle is split.
 */
export function bundleNeedsCreatedCollectionBind(
  messages: Array<{ typeUrl: string; value: unknown }>
): boolean {
  let created = false;
  for (const m of messages) {
    if (created && messageReferencesPlaceholderCollection(m.typeUrl, m.value)) return true;
    if (messageCreatesCollection(m.typeUrl, m.value)) created = true;
  }
  return false;
}

/**
 * Replace a top-level placeholder `collectionId` / `collection_id` with
 * the real id. Returns whether a field was changed. Non-placeholder
 * (or absent, when the msg has no collection field) values are left
 * untouched so an explicit id on a later msg is never overwritten.
 */
export function bindPlaceholderCollectionIdInValue(
  value: Record<string, unknown>,
  collectionId: string
): boolean {
  let changed = false;
  if ('collectionId' in value && isPlaceholderCollectionId(value.collectionId, true)) {
    value.collectionId = collectionId;
    changed = true;
  }
  if ('collection_id' in value && isPlaceholderCollectionId(value.collection_id, true)) {
    value.collection_id = collectionId;
    changed = true;
  }
  return changed;
}

/**
 * Read a JSON-arg msg file, bind a placeholder collectionId, and write
 * it back in place. Returns whether the file changed.
 */
export function bindPlaceholderCollectionIdInJsonFile(filePath: string, collectionId: string): boolean {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;
  const changed = bindPlaceholderCollectionIdInValue(parsed as Record<string, unknown>, collectionId);
  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', { mode: 0o600 });
  }
  return changed;
}

/**
 * Pull the created collection id out of a create-collection tx's events.
 * Reuses the same attribute matching as `extractEntityFromEvents`
 * (skips empty and "0"), so it stays consistent with `--wait-for-indexer`.
 */
export function createdCollectionIdFromEvents(events: unknown[] | undefined): string | undefined {
  if (!Array.isArray(events)) return undefined;
  for (const ev of events) {
    const attrs: Array<{ key?: string; value?: string }> = (ev as any)?.attributes || [];
    for (const a of attrs) {
      if (!a?.key) continue;
      const k = String(a.key).replace(/"/g, '');
      const v = a.value != null ? String(a.value).replace(/"/g, '') : '';
      if (!v || v === '0') continue;
      if (k === 'collectionId' || k === 'collection_id') return v;
    }
  }
  return undefined;
}

export const PRINT_ONLY_PLACEHOLDER_ERROR =
  'Error: this transaction creates a collection and later messages use collectionId "0".\n' +
  'On-chain, "0" means the newest collection globally (next collection id minus one), which is\n' +
  'only the just-created collection when those messages share one transaction.\n' +
  '`bb deploy --with-keyring` without --exec cannot keep them in one tx (the chain binary\'s\n' +
  'tx subcommands take one message each), and a printed sequential script would leave\n' +
  'collectionId "0" on later messages.\n' +
  'Use --exec to substitute the new collection id from the create tx before later messages\n' +
  'are broadcast, or use --browser to send an atomic multi-msg transaction.\n';
