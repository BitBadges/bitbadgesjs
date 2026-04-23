/**
 * Deterministic scrubber applied to review-flag strings at drain time.
 *
 * The prompt tells the builder to avoid jargon in `message` / `chosen` /
 * `alternative`, but Haiku still leaks raw bb1 addresses, JSON field
 * names, and base-unit numbers. This sanitizer is belt-and-suspenders:
 * the prompt is primary, this catches the known slips.
 *
 * Scope: only user-visible string fields. `kind`, `severity`, and
 * `fieldPath` (UI-only technical path) pass through unchanged.
 */

import type { ReviewFlag } from '../agent/types.js';

/**
 * Known JSON field names / identifiers the model regularly leaks into
 * user-facing text. Each entry maps a matching pattern to a
 * non-technical rewrite. Case-insensitive, word-boundary-aware.
 *
 * ORDER MATTERS: longer / more-specific patterns should come first so
 * they match before shorter ones (e.g., `requiresTokenGating` before
 * `tokenGating`).
 */
const JARGON_REWRITES: Array<{ pattern: RegExp; replacement: string }> = [
  // Compound identifiers — match and strip wholesale (usually preceded by "via " or "using ")
  { pattern: /\bvia\s+requiresTokenGating\b/gi, replacement: 'with a token-gate' },
  { pattern: /\busing\s+requiresTokenGating\b/gi, replacement: 'with a token-gate' },
  { pattern: /\brequiresTokenGating\b/gi, replacement: 'token-gating' },
  // Exclude-syntax that leaks from smart-token skill examples
  { pattern: /\b!Mint(:\w+)?\b/g, replacement: 'everyone except Mint' },
  // "initiatedByListId: All" → "open to anyone"
  { pattern: /\binitiatedByListId:\s*All\b/g, replacement: 'open to anyone' },
  { pattern: /\binitiatedByListId:\s*Mint\b/g, replacement: 'mint-only' },
  // Standalone JSON identifiers → humanize
  { pattern: /\binitiatedByListId\b/g, replacement: 'who-can-do-it scope' },
  { pattern: /\bfromListId\b/g, replacement: 'sender' },
  { pattern: /\btoListId\b/g, replacement: 'recipient' },
  { pattern: /\bapprovalCriteria\b/g, replacement: 'transfer rule' },
  { pattern: /\bapprovalAmounts\b/g, replacement: 'transfer limits' },
  { pattern: /\bpermanentlyForbiddenTimes\b/g, replacement: 'locked-permanently setting' },
  { pattern: /\bpermanentlyPermittedTimes\b/g, replacement: 'allowed-forever setting' },
  { pattern: /\bnoCustomOwnershipTimes\b/g, replacement: 'custom-duration rule' },
  { pattern: /\bnoForcefulPostMintTransfers\b/g, replacement: 'post-mint-transfer rule' },
  { pattern: /\bcanUpdateCollectionApprovals\b/g, replacement: 'transfer-rule update permission' },
  { pattern: /\boverridesFromOutgoingApprovals\b/g, replacement: 'approval-override setting' },
  { pattern: /\bmustPrioritize\b/g, replacement: 'priority flag' },
  { pattern: /\ballowBackedMinting\b/g, replacement: 'backed-mint allowance' },
  { pattern: /\bcosmosCoinBackedPath\b/g, replacement: 'IBC backing path' },
  { pattern: /\bMsgCreateCollection\b/g, replacement: 'create-collection transaction' },
  { pattern: /\bMsgUniversalUpdateCollection\b/g, replacement: 'update-collection transaction' },
  // Proto type URLs
  { pattern: /\/tokenization\.Msg\w+/g, replacement: 'transaction type' }
];

/**
 * Address / hash patterns → human-facing replacement. Addresses are
 * env-specific identifiers; user sees "you (the creator)" when it's
 * their own, "the manager address" generically otherwise.
 */
const ADDRESS_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  // Full bb1 addresses (display or truncated)
  { pattern: /\bbb1[a-z0-9]{20,}\b/g, replacement: 'a BitBadges address' },
  { pattern: /\bbb1[a-z0-9]{4,8}\.{3}[a-z0-9]{3,8}\b/g, replacement: 'a BitBadges address' },
  // Cosmos
  { pattern: /\bcosmos1[a-z0-9]{20,}\b/g, replacement: 'a Cosmos address' },
  // ETH
  { pattern: /\b0x[a-fA-F0-9]{40}\b/g, replacement: 'an Ethereum address' },
  // IBC denoms
  { pattern: /\bibc\/[A-F0-9]{30,}\b/g, replacement: 'IBC coin' },
  // IPFS CIDs
  { pattern: /\bipfs:\/\/Qm[a-zA-Z0-9]{40,}\b/g, replacement: 'an IPFS image' },
  { pattern: /\bipfs:\/\/baf[a-z0-9]{40,}\b/g, replacement: 'an IPFS image' },
  // Placeholder URIs
  { pattern: /\bipfs:\/\/METADATA_\w+\b/g, replacement: 'a placeholder image' },
  // Base64 data URIs (often huge)
  { pattern: /data:image\/svg\+xml;base64,[A-Za-z0-9+/=]{40,}/g, replacement: 'an inline image' }
];

/**
 * Base-unit → display-unit conversions are prompt-guided but not
 * covered by the sanitizer. The model already has the denom context to
 * do this correctly; scrubbing numbers server-side would be wrong
 * (we'd have to assume a decimal count).
 */

function scrubString(s: unknown): string {
  if (typeof s !== 'string') return String(s ?? '');
  let out = s;
  // Jargon first — some patterns reference strings that might also
  // contain addresses, so we rewrite identifiers before addresses.
  for (const { pattern, replacement } of JARGON_REWRITES) {
    out = out.replace(pattern, replacement);
  }
  for (const { pattern, replacement } of ADDRESS_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  // Collapse double-spaces introduced by replacements.
  out = out.replace(/\s{2,}/g, ' ').trim();
  return out;
}

/**
 * Sanitize the user-facing strings on a review flag. Leaves `kind`,
 * `severity`, and `fieldPath` untouched (fieldPath is UI-only and may
 * legitimately carry JSON paths for highlighting).
 */
export function sanitizeReviewFlag(flag: ReviewFlag): ReviewFlag {
  return {
    ...flag,
    message: scrubString(flag.message),
    chosen: scrubString(flag.chosen),
    alternative: flag.alternative !== undefined ? scrubString(flag.alternative) : undefined
  };
}

export function sanitizeReviewFlags(flags: ReviewFlag[]): ReviewFlag[] {
  return flags.map(sanitizeReviewFlag);
}
