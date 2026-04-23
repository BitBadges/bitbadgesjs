/**
 * In-memory session state for the builder v2.
 *
 * Uses a Map keyed by sessionId for per-request isolation.
 * Each session holds a blank MsgUniversalUpdateCollection template that per-field tools mutate.
 * Auto-creates on first mutation. State is ephemeral — scoped to the process lifetime.
 *
 * Design principles:
 * - Set tools replace the entire field
 * - Add/Remove tools manage arrays with order preservation
 * - Remove + re-add with same ID = replace in-place
 * - Metadata placeholders are managed alongside their fields
 */

import { ensureBb1 } from '../sdk/addressUtils.js';
import type { ReviewFlag } from '../agent/types.js';
import { sanitizeReviewFlags } from './reviewFlagSanitizer.js';

const MAX_UINT64 = '18446744073709551615';
const DEFAULT_IMAGE = 'ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E';

/**
 * Sanitize image value — if it's not a valid URL/IPFS/placeholder, use default logo.
 * IMAGE_N placeholders are valid (frontend replaces them), but only if they match the pattern.
 */
function sanitizeImage(image: string): string {
  if (!image) return DEFAULT_IMAGE;
  if (image.startsWith('http://') || image.startsWith('https://') || image.startsWith('ipfs://') || image.startsWith('data:')) return image;
  if (/^IMAGE_\d+$/.test(image)) return image; // Valid frontend placeholder
  return DEFAULT_IMAGE;
}

export interface SessionTransaction {
  messages: Array<{
    typeUrl: string;
    value: Record<string, any>;
  }>;
  /** Approval IDs that existed when the session was initialized (for update flows) */
  originalApprovalIds?: Set<string>;
}

/**
 * Get or create the per-msg metadataPlaceholders sidecar on the first
 * message's value. Canonical location: `session.messages[0].value._meta.metadataPlaceholders`.
 * There is no session-level top-level sidecar — the sidecar belongs to
 * the msg whose body references the placeholder URIs.
 */
export function getMsgPlaceholders(session: SessionTransaction): Record<string, { name: string; description: string; image: string }> {
  const value = session.messages[0].value;
  if (!value._meta || typeof value._meta !== 'object') {
    value._meta = {};
  }
  if (!value._meta.metadataPlaceholders || typeof value._meta.metadataPlaceholders !== 'object') {
    value._meta.metadataPlaceholders = {};
  }
  return value._meta.metadataPlaceholders;
}

// Per-session state keyed by sessionId
const sessions = new Map<string, SessionTransaction>();

// Review flags accumulated per session via the `flag_review_item` tool.
// Kept separate from SessionTransaction so they don't leak into
// getCollectionValue() / the wire transaction. Drained into
// BuildResult.reviewFlags by BitBadgesBuilderAgent at build end.
const sessionReviewFlags = new Map<string, ReviewFlag[]>();

// Default sessionId when none is provided (builder-direct / single-user mode)
const DEFAULT_SESSION_ID = '__default__';

function resolveSessionId(sessionId?: string): string {
  return sessionId || DEFAULT_SESSION_ID;
}

/**
 * Get or auto-create a session. First call initializes with a blank template.
 */
export function getOrCreateSession(sessionId?: string, creatorAddress?: string): SessionTransaction {
  const sid = resolveSessionId(sessionId);
  const resolvedCreator = creatorAddress ? ensureBb1(creatorAddress) : creatorAddress;
  let session = sessions.get(sid);
  if (!session) {
    session = {
      messages: [{
        typeUrl: '/tokenization.MsgUniversalUpdateCollection',
        value: {
          creator: resolvedCreator || '',
          collectionId: '0',
          updateCollectionApprovals: true,
          collectionApprovals: [],
          updateStandards: true,
          standards: [],
          updateValidTokenIds: true,
          validTokenIds: [],
          updateCollectionMetadata: true,
          collectionMetadata: { uri: '', customData: '' },
          updateTokenMetadata: true,
          tokenMetadata: [],
          updateCollectionPermissions: true,
          // All 11 permission fields default to neutral ([]). The chain
          // message type requires every field to be an array. An empty
          // object {} is invalid — and a build that skips
          // `set_permissions` entirely would produce an empty object,
          // fail validation, and burn the fix loop trying to recover.
          // Defaulting to all-neutral keeps "basic builds work" as a
          // guarantee. Calling `set_permissions` still overwrites this
          // whole object, so no conflict.
          collectionPermissions: {
            canDeleteCollection: [],
            canArchiveCollection: [],
            canUpdateStandards: [],
            canUpdateCustomData: [],
            canUpdateManager: [],
            canUpdateCollectionMetadata: [],
            canUpdateValidTokenIds: [],
            canUpdateTokenMetadata: [],
            canUpdateCollectionApprovals: [],
            canAddMoreAliasPaths: [],
            canAddMoreCosmosCoinWrapperPaths: []
          },
          updateInvariants: true,
          invariants: null,
          updateDefaultBalances: true,
          defaultBalances: {
            balances: [],
            outgoingApprovals: [],
            incomingApprovals: [],
            autoApproveAllIncomingTransfers: true,
            autoApproveSelfInitiatedOutgoingTransfers: true,
            autoApproveSelfInitiatedIncomingTransfers: true,
            userPermissions: {
              canUpdateOutgoingApprovals: [],
              canUpdateIncomingApprovals: [],
              canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
              canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
              canUpdateAutoApproveAllIncomingTransfers: []
            }
          },
          updateManager: true,
          manager: creatorAddress || '',
          updateCustomData: false,
          customData: '',
          mintEscrowCoinsToTransfer: [],
          aliasPathsToAdd: [],
          cosmosCoinWrapperPathsToAdd: []
        }
      }]
    };
    sessions.set(sid, session);
  }
  return session;
}

/**
 * Get the collection value (messages[0].value) from a session.
 */
export function getCollectionValue(sessionId?: string, creatorAddress?: string): Record<string, any> {
  return getOrCreateSession(sessionId, creatorAddress).messages[0].value;
}

/**
 * Reset a specific session (or the default session).
 */
export function resetSession(sessionId?: string): void {
  const sid = resolveSessionId(sessionId);
  sessions.delete(sid);
  sessionReviewFlags.delete(sid);
}

/**
 * Reset all sessions (for testing).
 */
export function resetAllSessions(): void {
  sessions.clear();
  sessionReviewFlags.clear();
}

/**
 * Append a review flag (from `flag_review_item` tool) to the session's
 * accumulator. Drained into BuildResult.reviewFlags at build end.
 *
 * Dedupes against existing flags with the same (message, chosen) pair.
 * The agent may re-emit an inherited flag during a refinement without
 * realizing it's already in the session (inherited flags load at
 * build start, don't appear in the model's context). Dedup makes the
 * emit idempotent so duplicates don't pile up across refinements.
 */
export function addReviewFlag(sessionId: string | undefined, flag: ReviewFlag): void {
  const sid = resolveSessionId(sessionId);
  const existing = sessionReviewFlags.get(sid) ?? [];
  const isDuplicate = existing.some(
    (f) => f.message === flag.message && f.chosen === flag.chosen
  );
  if (isDuplicate) return;
  existing.push(flag);
  sessionReviewFlags.set(sid, existing);
}

/**
 * Read + drain the session's review flags. Returns a copy; accumulator is cleared.
 * Called by BitBadgesBuilderAgent at build end.
 *
 * Passes every flag through a deterministic jargon scrubber before
 * returning. Belt-and-suspenders with the prompt: the prompt tells
 * the model NOT to leak JSON field names / raw addresses / proto
 * type URLs into user-facing strings, and this catches what slips
 * through. The model's `kind`/`severity`/`fieldPath` pass through
 * unchanged (fieldPath is UI-only and may legitimately carry the
 * technical path for highlight purposes).
 */
export function drainReviewFlags(sessionId?: string): ReviewFlag[] {
  const sid = resolveSessionId(sessionId);
  const flags = sessionReviewFlags.get(sid) ?? [];
  sessionReviewFlags.delete(sid);
  return sanitizeReviewFlags(flags);
}

/**
 * Non-destructive read of the session's current review flags. Useful for
 * in-process callers that want to peek without draining.
 */
export function getReviewFlags(sessionId?: string): ReviewFlag[] {
  return sessionReviewFlags.get(resolveSessionId(sessionId)) ?? [];
}

/**
 * Snapshot a session for persistence. Returns a JSON-serializable copy of
 * the session's state (or null if the session doesn't exist). The
 * `originalApprovalIds` Set is flattened to an array so the value can go
 * through JSON.stringify / JSON.parse cleanly.
 */
export function exportSession(sessionId?: string): any | null {
  const sid = resolveSessionId(sessionId);
  const session = sessions.get(sid);
  if (!session) return null;
  return {
    messages: session.messages,
    originalApprovalIds: session.originalApprovalIds ? Array.from(session.originalApprovalIds) : undefined
  };
}

/**
 * Load a previously exported session snapshot back into the in-memory map.
 * Used by CLI consumers that persist session state across process
 * invocations — they snapshot after each tool call and restore before the
 * next. Overwrites any existing session with the same id.
 */
export function importSession(sessionId: string | undefined, snapshot: any): void {
  const sid = resolveSessionId(sessionId);
  if (!snapshot || !Array.isArray(snapshot.messages)) {
    throw new Error('importSession: snapshot must have a messages array');
  }
  const restored: SessionTransaction = {
    messages: snapshot.messages,
    originalApprovalIds: Array.isArray(snapshot.originalApprovalIds)
      ? new Set<string>(snapshot.originalApprovalIds)
      : undefined
  };
  sessions.set(sid, restored);
}

/**
 * Check if a session exists.
 */
export function hasSession(sessionId?: string): boolean {
  return sessions.has(resolveSessionId(sessionId));
}

// ============================================================
// Set operations — replace the entire field
// ============================================================

export function setStandards(sessionId: string | undefined, standards: string[]): void {
  const value = getCollectionValue(sessionId);
  value.standards = standards;
  value.updateStandards = true;
}

export function setValidTokenIds(sessionId: string | undefined, tokenIds: Array<{ start: string; end: string }>): void {
  const value = getCollectionValue(sessionId);
  value.validTokenIds = tokenIds;
  value.updateValidTokenIds = true;
}

const DEFAULT_USER_PERMISSIONS = {
  canUpdateOutgoingApprovals: [],
  canUpdateIncomingApprovals: [],
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
  canUpdateAutoApproveAllIncomingTransfers: []
};

export function setDefaultBalances(sessionId: string | undefined, defaultBalances: Record<string, any>): void {
  const value = getCollectionValue(sessionId);
  // Auto-fill required userPermissions fields that the SDK needs
  const userPerms = defaultBalances.userPermissions || {};
  defaultBalances.userPermissions = { ...DEFAULT_USER_PERMISSIONS, ...userPerms };
  value.defaultBalances = defaultBalances;
  value.updateDefaultBalances = true;
}

export function setPermissions(sessionId: string | undefined, permissions: Record<string, any>): void {
  const value = getCollectionValue(sessionId);
  value.collectionPermissions = permissions;
  value.updateCollectionPermissions = true;
}

export function setInvariants(sessionId: string | undefined, invariants: Record<string, any> | null): void {
  const value = getCollectionValue(sessionId);
  value.invariants = invariants;
  value.updateInvariants = true;
}

export function setManager(sessionId: string | undefined, manager: string): void {
  const value = getCollectionValue(sessionId);
  value.manager = manager;
  value.updateManager = true;
}

export function setCustomData(sessionId: string | undefined, customData: string): void {
  const value = getCollectionValue(sessionId);
  value.customData = customData;
  value.updateCustomData = true;
}

export function setIsArchived(sessionId: string | undefined, isArchived: boolean): void {
  const value = getCollectionValue(sessionId);
  value.isArchived = isArchived;
  value.updateIsArchived = true;
}

export function setMintEscrowCoins(sessionId: string | undefined, coins: Array<{ denom: string; amount: string }>): void {
  const value = getCollectionValue(sessionId);
  value.mintEscrowCoinsToTransfer = coins;
}

export function setCollectionMetadata(sessionId: string | undefined, name: string, description: string, image: string): void {
  const s = getOrCreateSession(sessionId);
  const value = s.messages[0].value;
  const uri = 'ipfs://METADATA_COLLECTION';
  value.collectionMetadata = { uri, customData: '' };
  value.updateCollectionMetadata = true;
  getMsgPlaceholders(s)[uri] = { name, description, image: sanitizeImage(image) };
}

export function setTokenMetadata(
  sessionId: string | undefined,
  tokenIds: Array<{ start: string; end: string }>,
  name: string,
  description: string,
  image: string
): void {
  const s = getOrCreateSession(sessionId);
  const value = s.messages[0].value;
  const uriKey = tokenIds.length === 1 && tokenIds[0].start === tokenIds[0].end
    ? `ipfs://METADATA_TOKEN_${tokenIds[0].start}`
    : `ipfs://METADATA_TOKEN_${tokenIds[0].start}-${tokenIds[tokenIds.length - 1].end}`;

  const useIdPlaceholder = tokenIds.length === 1 && tokenIds[0].start !== tokenIds[0].end;
  const uri = useIdPlaceholder ? `${uriKey}/{id}` : uriKey;

  const existing = value.tokenMetadata?.findIndex((tm: any) =>
    JSON.stringify(tm.tokenIds) === JSON.stringify(tokenIds)
  );
  const entry = { uri, customData: '', tokenIds };
  if (existing >= 0) {
    value.tokenMetadata[existing] = entry;
  } else {
    value.tokenMetadata = [...(value.tokenMetadata || []), entry];
  }
  value.updateTokenMetadata = true;
  getMsgPlaceholders(s)[uriKey] = { name, description, image: sanitizeImage(image) };
}

// ============================================================
// Add/Remove operations — array items with order preservation
// ============================================================

export function addApproval(sessionId: string | undefined, approval: Record<string, any>): void {
  const s = getOrCreateSession(sessionId);
  const value = s.messages[0].value;
  const approvals: any[] = value.collectionApprovals || [];
  const approvalId = approval.approvalId;

  const existingIdx = approvals.findIndex((a: any) => a.approvalId === approvalId);
  if (existingIdx >= 0) {
    approvals[existingIdx] = approval;
  } else {
    approvals.push(approval);
  }

  value.collectionApprovals = approvals;
  value.updateCollectionApprovals = true;

  // Auto-create approval metadata placeholder
  const uri = `ipfs://METADATA_APPROVAL_${approvalId}`;
  const idx = existingIdx >= 0 ? existingIdx : approvals.length - 1;
  approvals[idx].uri = approvals[idx].uri || uri;
  approvals[idx].customData = approvals[idx].customData || '';
  approvals[idx].version = approvals[idx].version || '0';
  const placeholders = getMsgPlaceholders(s);
  if (!placeholders[uri]) {
    const approvalTitle = (approvalId as string).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    placeholders[uri] = { name: approvalTitle, description: '', image: '' };
  }
}

export function removeApproval(sessionId: string | undefined, approvalId: string): { removed: boolean; position: number } {
  const value = getCollectionValue(sessionId);
  const approvals: any[] = value.collectionApprovals || [];
  const idx = approvals.findIndex((a: any) => a.approvalId === approvalId);
  if (idx >= 0) {
    approvals.splice(idx, 1);
    value.collectionApprovals = approvals;
    return { removed: true, position: idx };
  }
  return { removed: false, position: -1 };
}

export function setApprovalMetadata(sessionId: string | undefined, approvalId: string, name: string, description: string, image: string = ''): void {
  const s = getOrCreateSession(sessionId);
  const uri = `ipfs://METADATA_APPROVAL_${approvalId}`;
  getMsgPlaceholders(s)[uri] = { name, description, image };

  const value = s.messages[0].value;
  const approvals: any[] = value.collectionApprovals || [];
  const approval = approvals.find((a: any) => a.approvalId === approvalId);
  if (approval) {
    approval.uri = uri;
  }
}

export function addAliasPath(sessionId: string | undefined, aliasPath: Record<string, any>): void {
  const value = getCollectionValue(sessionId);
  const paths: any[] = value.aliasPathsToAdd || [];
  const denom = aliasPath.denom;

  const existingIdx = paths.findIndex((p: any) => p.denom === denom);
  if (existingIdx >= 0) {
    paths[existingIdx] = aliasPath;
  } else {
    paths.push(aliasPath);
  }
  value.aliasPathsToAdd = paths;
}

export function removeAliasPath(sessionId: string | undefined, denom: string): { removed: boolean } {
  const value = getCollectionValue(sessionId);
  const paths: any[] = value.aliasPathsToAdd || [];
  const idx = paths.findIndex((p: any) => p.denom === denom);
  if (idx >= 0) {
    paths.splice(idx, 1);
    value.aliasPathsToAdd = paths;
    return { removed: true };
  }
  return { removed: false };
}

export function addCosmosWrapperPath(sessionId: string | undefined, wrapperPath: Record<string, any>): void {
  const value = getCollectionValue(sessionId);
  const paths: any[] = value.cosmosCoinWrapperPathsToAdd || [];
  const denom = wrapperPath.denom;

  const existingIdx = paths.findIndex((p: any) => p.denom === denom);
  if (existingIdx >= 0) {
    paths[existingIdx] = wrapperPath;
  } else {
    paths.push(wrapperPath);
  }
  value.cosmosCoinWrapperPathsToAdd = paths;
}

export function removeCosmosWrapperPath(sessionId: string | undefined, denom: string): { removed: boolean } {
  const value = getCollectionValue(sessionId);
  const paths: any[] = value.cosmosCoinWrapperPathsToAdd || [];
  const idx = paths.findIndex((p: any) => p.denom === denom);
  if (idx >= 0) {
    paths.splice(idx, 1);
    value.cosmosCoinWrapperPathsToAdd = paths;
    return { removed: true };
  }
  return { removed: false };
}

// ============================================================
// Transfer messages — append/remove MsgTransferTokens
// ============================================================

export function addTransfer(sessionId: string | undefined, transfer: Record<string, any>): { index: number } {
  const s = getOrCreateSession(sessionId);
  const creatorAddress = s.messages[0].value.creator || '';

  const msg = {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      ...transfer,
      creator: creatorAddress,
      collectionId: transfer.collectionId || '0'
    }
  };

  s.messages.push(msg);
  return { index: s.messages.length - 1 };
}

export function removeTransfer(sessionId: string | undefined, index: number): { removed: boolean } {
  const s = getOrCreateSession(sessionId);
  // Index 0 is always MsgUniversalUpdateCollection — can't remove it
  if (index < 1 || index >= s.messages.length) return { removed: false };
  if (s.messages[index].typeUrl !== '/tokenization.MsgTransferTokens') return { removed: false };
  s.messages.splice(index, 1);
  return { removed: true };
}

// ============================================================
// Read operations
// ============================================================

/**
 * Get the assembled transaction JSON with metadataPlaceholders.
 */
export function getTransaction(sessionId?: string, creatorAddress?: string): SessionTransaction {
  return getOrCreateSession(sessionId, creatorAddress);
}

/**
 * Ensure all string numbers are actually strings (common LLM mistake).
 */
export function ensureStringNumbers(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'number') return String(obj);
  if (Array.isArray(obj)) return obj.map(ensureStringNumbers);
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = ensureStringNumbers(val);
    }
    return result;
  }
  return obj;
}
