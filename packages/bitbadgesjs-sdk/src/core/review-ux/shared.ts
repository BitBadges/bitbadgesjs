/**
 * Shared helpers for review-ux check modules.
 */

import type { Finding, ReviewContext } from '../review-types.js';

export type UxCheck = (value: any, context: ReviewContext) => Finding[];

export const MAX_UINT = 18446744073709551615n;

export const BITBADGES_DEFAULT_LOGO = 'QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E';

export const PLACEHOLDER_PATTERNS: RegExp[] = [
  /^ipfs:\/\/METADATA_/i,
  /^ipfs:\/\/IMAGE_\d+$/i,
  /^placeholder/i,
  /^https?:\/\/example\.com/i,
  /^$/
];

export function isPlaceholderImage(image: string | undefined): boolean {
  if (!image) return true;
  if (image.includes(BITBADGES_DEFAULT_LOGO)) return true;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(image));
}

export function isMissingImage(image: string | undefined): boolean {
  if (!image) return true;
  if (image.includes(BITBADGES_DEFAULT_LOGO)) return false;
  return PLACEHOLDER_PATTERNS.some((p) => p.test(image));
}

export function getApprovals(value: any): any[] {
  return Array.isArray(value?.collectionApprovals) ? value.collectionApprovals : [];
}

export function getAllApprovals(value: any): any[] {
  const approvals = getApprovals(value);
  const inc = Array.isArray(value?.defaultBalances?.incomingApprovals)
    ? value.defaultBalances.incomingApprovals
    : [];
  const out = Array.isArray(value?.defaultBalances?.outgoingApprovals)
    ? value.defaultBalances.outgoingApprovals
    : [];
  return [...approvals, ...inc, ...out];
}

/**
 * True if a UintRange array covers the full uint64 range (start=1 → end=MAX).
 * Treats an empty/undefined array as NOT covering full (the chain's default
 * for a forbidden-times list; the check below uses that as "not locked").
 */
function isForeverRange(ranges: any): boolean {
  if (!Array.isArray(ranges) || ranges.length === 0) return false;
  return ranges.some((r: any) => r?.start === 1n && r?.end === MAX_UINT);
}

/**
 * True if a `canUpdateCollectionApprovals` permission entry represents
 * a BLANKET permanent lock — that is, every scope field is set to its
 * "match anything" wildcard AND `permanentlyForbiddenTimes` covers
 * forever. The full set of scope fields on a CollectionApprovalPermission:
 *
 *   fromListId           === 'All'
 *   toListId             === 'All'
 *   initiatedByListId    === 'All'
 *   transferTimes        covers [1 → MAX_UINT]
 *   tokenIds             covers [1 → MAX_UINT]
 *   approvalId           === 'All'
 *   amountTrackerId      === 'All'
 *   challengeTrackerId   === 'All'
 *
 * If every one of those matches AND the forbidden-times range is
 * forever, no approval can ever be added / removed / modified via
 * MsgUniversalUpdateCollection, and transferability is permanently
 * fixed at creation. Partial locks (e.g. "Mint scope forbidden forever")
 * don't qualify — they only freeze a subset of approvals.
 */
export function isCollectionApprovalBlanketLocked(entry: any): boolean {
  if (!entry) return false;
  if (entry.fromListId !== 'All') return false;
  if (entry.toListId !== 'All') return false;
  if (entry.initiatedByListId !== 'All') return false;
  if (!isForeverRange(entry.transferTimes)) return false;
  if (!isForeverRange(entry.tokenIds)) return false;
  if (entry.approvalId !== 'All') return false;
  if (entry.amountTrackerId !== 'All') return false;
  if (entry.challengeTrackerId !== 'All') return false;
  return isForeverRange(entry.permanentlyForbiddenTimes);
}

/**
 * True if the collection's `canUpdateCollectionApprovals` permission
 * contains any entry that is a blanket permanent lock. Convenience
 * wrapper over {@link isCollectionApprovalBlanketLocked}.
 */
export function isTransferabilityPermanentlyLocked(value: any): boolean {
  const entries: any[] = value?.collectionPermissions?.canUpdateCollectionApprovals || [];
  return entries.some(isCollectionApprovalBlanketLocked);
}
