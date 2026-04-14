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
          title: {
            en: `Permission "${permName}" is permanently permitted`
          },
          detail: {
            en: 'This permission can never be locked or frozen in the future. Use neutral (empty) permissions instead to preserve the flexibility to lock it later.'
          },
          recommendation: {
            en: 'Change the permission to neutral (empty array) instead of permanently permitted'
          }
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
        title: {
          en: 'Backed path but Mint permissions not locked'
        },
        detail: {
          en: 'This collection uses IBC-backed minting but the permission to update Mint approvals is not permanently locked. The manager could add unauthorized mint approvals later.'
        },
        recommendation: {
          en: 'Lock the permission to update Mint address approvals'
        }
      });
    }
    return out;
  }
];
