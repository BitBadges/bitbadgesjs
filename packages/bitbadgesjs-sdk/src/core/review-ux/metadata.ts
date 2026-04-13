/**
 * Metadata / image placeholder checks — ported from frontend reviewItems.ts.
 */

import type { Finding } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { isPlaceholderImage, isMissingImage, PLACEHOLDER_PATTERNS, getApprovals } from './shared.js';

const KNOWN_SYSTEM_APPROVAL_IDS = [
  'transferable-approval',
  'burnable-approval',
  'smart-account-backing',
  'smart-account-unbacking',
  'quests-approval',
  'credit-scaled'
];

export const metadataChecks: UxCheck[] = [
  // Placeholder images in metadataPlaceholders (excluding approval metadata)
  (value) => {
    const out: Finding[] = [];
    // metadataPlaceholders lives on the wrapping transaction, not value — but some
    // callers flatten the value. Check both.
    const metadataPlaceholders: Record<string, { name?: string; description?: string; image?: string }> =
      value?.metadataPlaceholders || {};
    const placeholderImageEntries = Object.entries(metadataPlaceholders).filter(
      ([key, meta]) => !key.includes('METADATA_APPROVAL_') && isPlaceholderImage(meta?.image)
    );
    if (placeholderImageEntries.length > 0) {
      out.push({
        code: 'review.ux.placeholder_images',
        severity: 'info',
        source: 'ux',
        category: 'metadata',
        localeKey: 'review_placeholder_images',
        params: { count: placeholderImageEntries.length },
        messageEn: `${placeholderImageEntries.length} metadata entrie(s) use placeholder images.`,
        recommendationEn: 'Upload real images before publishing.'
      });
    }
    return out;
  },

  // Unnamed approvals
  (value) => {
    const out: Finding[] = [];
    const approvals = getApprovals(value);
    const metadataPlaceholders: Record<string, { name?: string }> = value?.metadataPlaceholders || {};
    const unnamed = approvals.filter((a: any) => {
      const id = a.approvalId || '';
      if (id.startsWith('default-') || id === '') return false;
      if (KNOWN_SYSTEM_APPROVAL_IDS.includes(id)) return false;
      if (a.details?.name) return false;
      const uri = a.uri || '';
      if (!uri) return true;
      const placeholder = metadataPlaceholders[uri];
      if (placeholder && placeholder.name) return false;
      return PLACEHOLDER_PATTERNS.some((p) => p.test(uri)) && !placeholder?.name;
    });
    if (unnamed.length > 0) {
      const names =
        unnamed.map((a: any) => a.approvalId || 'unnamed').slice(0, 3).join(', ') +
        (unnamed.length > 3 ? ` (+${unnamed.length - 3})` : '');
      out.push({
        code: 'review.ux.unnamed_approvals',
        severity: 'info',
        source: 'ux',
        category: 'metadata',
        localeKey: 'review_unnamed_approvals',
        params: { names, count: unnamed.length },
        messageEn: `${unnamed.length} approval(s) have no display name: ${names}.`,
        recommendationEn: 'Add a name via approval.details or the approval metadata URI.'
      });
    }
    return out;
  },

  // Alias paths without images
  (value) => {
    const out: Finding[] = [];
    const aliasPaths: any[] = value?.aliasPaths || value?.aliasPathsToAdd || [];
    const metadataPlaceholders: Record<string, { image?: string }> = value?.metadataPlaceholders || {};
    const missing = aliasPaths.filter((path: any) => {
      const denomUnits: any[] = path.denomUnits || [];
      const defaultUnit = denomUnits.find((u: any) => u.isDefaultDisplay);
      const unitMeta = defaultUnit?.metadata;
      const pathMeta = path.metadata;
      const pathUri = pathMeta?.uri || '';
      const unitUri = unitMeta?.uri || '';
      const pathImage =
        metadataPlaceholders[pathUri]?.image ||
        pathMeta?.image ||
        pathMeta?.metadata?.image ||
        pathMeta?._metadataForUpload?.image;
      const unitImage =
        metadataPlaceholders[unitUri]?.image ||
        unitMeta?.image ||
        unitMeta?.metadata?.image ||
        unitMeta?._metadataForUpload?.image;
      return isMissingImage(pathImage) && isMissingImage(unitImage);
    });
    if (missing.length > 0) {
      out.push({
        code: 'review.ux.alias_paths_missing_images',
        severity: 'info',
        source: 'ux',
        category: 'metadata',
        localeKey: 'review_alias_no_images',
        params: { count: missing.length },
        messageEn: `${missing.length} alias path(s) have no image on the default display unit.`,
        recommendationEn: 'Add an image to path.metadata or the default denomUnit.metadata.'
      });
    }
    return out;
  }
];
