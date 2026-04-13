/**
 * Permission-related UX checks — ported from frontend reviewItems.ts.
 */

import type { Finding } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { MAX_UINT } from './shared.js';

export const permissionsChecks: UxCheck[] = [
  // permanentlyPermittedTimes set to FOREVER on permissions
  (value) => {
    const out: Finding[] = [];
    const permissions = value?.collectionPermissions || {};
    for (const [permName, permEntries] of Object.entries(permissions)) {
      if (!Array.isArray(permEntries)) continue;
      let flagged = false;
      for (const entry of permEntries as any[]) {
        const pt = entry.permanentlyPermittedTimes;
        if (
          Array.isArray(pt) &&
          pt.some((t: any) => String(t.start) === '1' && String(t.end) === MAX_UINT)
        ) {
          flagged = true;
          break;
        }
      }
      if (flagged) {
        out.push({
          code: 'review.ux.permission_permanently_permitted_' + permName.toLowerCase(),
          severity: 'warning',
          source: 'ux',
          category: 'permissions',
          params: { permission: permName },
          messageEn: `Permission "${permName}" is permanently permitted forever — it can never be forbidden.`,
          recommendationEn: 'Only lock permissions you are certain about. Consider leaving them neutral instead.'
        });
      }
    }
    return out;
  },

  // Backed path requires Mint approval permissions locked
  (value) => {
    const out: Finding[] = [];
    const invariants = value?.invariants || {};
    if (!invariants.cosmosCoinBackedPath) return out;
    const permEntries: any[] = value?.collectionPermissions?.canUpdateCollectionApprovals || [];
    const hasMintLock = permEntries.some((e: any) => {
      const ft = e.permanentlyForbiddenTimes;
      const isForbidden = Array.isArray(ft) && ft.some((t: any) => String(t.start) === '1' && String(t.end) === MAX_UINT);
      return isForbidden && (e.fromListId === 'Mint' || e.fromListId === 'All');
    });
    if (!hasMintLock) {
      out.push({
        code: 'review.ux.backed_path_mint_not_locked',
        severity: 'warning',
        source: 'ux',
        category: 'permissions',
        messageEn:
          'Backed path is set but the canUpdateCollectionApprovals permission is not permanently forbidden for the Mint list.',
        recommendationEn:
          'Add a canUpdateCollectionApprovals entry with fromListId = Mint and permanentlyForbiddenTimes = [1, MAX_UINT].'
      });
    }
    return out;
  }
];
