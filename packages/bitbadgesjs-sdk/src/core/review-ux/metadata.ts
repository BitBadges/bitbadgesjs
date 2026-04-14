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
      const count = placeholderImageEntries.length;
      out.push({
        code: 'review.ux.placeholder_images',
        severity: 'info',
        source: 'ux',
        category: 'metadata',
        title: {
          en: 'Metadata uses placeholder or default images'
        },
        detail: {
          en: `${count} metadata entries use placeholder images or the default BitBadges logo. Consider uploading custom images for a more polished look.`
        },
        recommendation: {
          en: 'Upload custom images for your collection and token metadata'
        }
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
        title: {
          en: 'Some approval rules are missing names'
        },
        detail: {
          en: `The following approval rules don't have a display name or description: ${names}. Adding names helps users understand what each rule does.`
        },
        recommendation: {
          en: 'Add descriptive names and descriptions to all approval rules'
        }
      });
    }
    return out;
  },

  // Alias paths without images
  //
  // Images for alias paths live inside the off-chain JSON referenced by
  // metadata.uri — NOT on the proto. This check looks in the right place:
  // the metadataPlaceholders sidecar keyed by the path/unit uri, which is
  // what the auto-apply flow consumes. If the sidecar is missing for the
  // relevant placeholder, the path will deploy without an image.
  //
  // Legacy .metadata.image fields on the proto are a shape error, not a
  // "missing image" — verifyStandards already throws on that path.
  (value) => {
    const out: Finding[] = [];
    const aliasPaths: any[] = value?.aliasPaths || value?.aliasPathsToAdd || [];
    const metadataPlaceholders: Record<string, { image?: string }> = value?.metadataPlaceholders || {};
    const missing = aliasPaths.filter((path: any) => {
      const denomUnits: any[] = path.denomUnits || [];
      const defaultUnit = denomUnits.find((u: any) => u.isDefaultDisplay);
      const unitMeta = defaultUnit?.metadata;
      const pathMeta = path.metadata;
      // Three places a path image can live:
      //   1. metadataPlaceholders sidecar keyed by pathMeta.uri (agent shape)
      //   2. Same sidecar keyed by unitMeta.uri (denom unit variant)
      //   3. Inline nested metadata.metadata.image (frontend WithDetails
      //      shape, pre-upload state — the auto-apply flow will move this
      //      to an IPFS URI on submit)
      const pathUri: string = pathMeta?.uri || '';
      const unitUri: string = unitMeta?.uri || '';
      const pathSidecarImage = metadataPlaceholders[pathUri]?.image;
      const unitSidecarImage = metadataPlaceholders[unitUri]?.image;
      const pathInlineImage = pathMeta?.metadata?.image;
      const unitInlineImage = unitMeta?.metadata?.image;
      const pathOk = !isMissingImage(pathSidecarImage) || !isMissingImage(pathInlineImage);
      const unitOk = !isMissingImage(unitSidecarImage) || !isMissingImage(unitInlineImage);
      return !pathOk && !unitOk;
    });
    if (missing.length > 0) {
      const count = missing.length;
      out.push({
        code: 'review.ux.alias_paths_missing_images',
        severity: 'info',
        source: 'ux',
        category: 'metadata',
        title: {
          en: 'Alias paths missing display images'
        },
        detail: {
          en: `${count} alias paths are missing a metadata image for the display unit. This image is shown when users view the token in wallets and exchanges.`
        },
        recommendation: {
          en: 'Add metadata images to all alias path display units'
        }
      });
    }
    return out;
  }
];
