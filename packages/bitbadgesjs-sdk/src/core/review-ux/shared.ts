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
