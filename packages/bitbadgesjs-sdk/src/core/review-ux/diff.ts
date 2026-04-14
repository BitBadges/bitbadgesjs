/**
 * On-chain diff checks — compare the proposed transaction against the existing
 * on-chain collection passed via ReviewContext.onChainCollection.
 *
 * Ported from the update-specific section of frontend reviewItems.ts.
 */

import type { Finding } from '../review-types.js';
import type { UxCheck } from './shared.js';

function normalizeOnChain(oc: any): any {
  if (!oc || typeof oc !== 'object') return oc;
  // Frontend hydrated shape already has collectionApprovals at the top level.
  // Indexer cache shape may wrap the actual collection under a `collection` key.
  if (Array.isArray(oc.collectionApprovals)) return oc;
  if (oc.collection && typeof oc.collection === 'object') return oc.collection;
  return oc;
}

export const diffChecks: UxCheck[] = [
  (value, ctx) => {
    const out: Finding[] = [];
    const onChain = normalizeOnChain(ctx.onChainCollection);
    // collectionId is an ID, stays string (BigIntify doesn't touch it)
    const isUpdate = value?.collectionId && value.collectionId !== '0' && value?.updateCollectionApprovals;
    if (!isUpdate || !onChain) return out;

    const onChainApprovals: any[] = onChain.collectionApprovals || [];
    const proposedApprovals: any[] = value.collectionApprovals || [];

    // Deleted approvals
    const proposedIds = new Set(proposedApprovals.map((a: any) => a.approvalId));
    const deleted = onChainApprovals.filter((a: any) => a.approvalId && !proposedIds.has(a.approvalId));
    if (deleted.length > 0) {
      const names = deleted.map((a: any) => a.approvalId).slice(0, 3).join(', ');
      const count = deleted.length;
      out.push({
        code: 'review.ux.diff_deleted_approvals',
        severity: 'critical',
        source: 'ux',
        category: 'diff',
        title: {
          en: 'Existing approval rules removed'
        },
        detail: {
          en: `${count} existing approval rule(s) will be removed: ${names}. All accumulated state (claim counts, transfer limits) for these rules will be lost.`
        },
        recommendation: {
          en: 'If this is unintentional, add the removed approval rules back with their original IDs'
        }
      });
    }

    // Tracker ID changes
    const onChainById = new Map(onChainApprovals.map((a: any) => [a.approvalId, a]));
    for (const proposed of proposedApprovals) {
      const existing: any = onChainById.get(proposed.approvalId);
      if (!existing) continue;
      const ec = existing.approvalCriteria || {};
      const pc = proposed.approvalCriteria || {};
      const changes: string[] = [];

      const et = ec.maxNumTransfers?.amountTrackerId;
      const pt = pc.maxNumTransfers?.amountTrackerId;
      if (et && et !== pt) changes.push('transfer tracker');

      const ea = ec.approvalAmounts?.amountTrackerId;
      const pa = pc.approvalAmounts?.amountTrackerId;
      if (ea && ea !== pa) changes.push('amount tracker');

      const ech = ec.predeterminedBalances?.orderCalculationMethod?.challengeTrackerId;
      const pch = pc.predeterminedBalances?.orderCalculationMethod?.challengeTrackerId;
      if (ech && ech !== pch) changes.push('challenge tracker');

      if (changes.length > 0) {
        const name = proposed.approvalId;
        const trackers = changes.join(', ');
        out.push({
          code: 'review.ux.diff_tracker_id_changed',
          severity: 'critical',
          source: 'ux',
          category: 'diff',
          title: {
            en: `Tracker ID changed on "${name}"`
          },
          detail: {
            en: `The ${trackers} ID was changed on an existing approval. This loses all accumulated state (used claims, transfer counts, amount tracking). If you want a fresh state, create a new approval instead.`
          },
          recommendation: {
            en: `Restore the original tracker IDs on "${name}" to preserve on-chain state`
          }
        });
      }
    }

    // Claim plugin diffs
    for (const proposed of proposedApprovals) {
      const existing: any = onChainById.get(proposed.approvalId);
      if (!existing) continue;
      const existingChallenges: any[] = existing.approvalCriteria?.merkleChallenges || [];
      const proposedChallenges: any[] = proposed.approvalCriteria?.merkleChallenges || [];
      for (let ci = 0; ci < Math.max(existingChallenges.length, proposedChallenges.length); ci++) {
        const eMc = existingChallenges[ci];
        const pMc = proposedChallenges[ci];
        const ePlugins: any[] = eMc?.claimConfig?.plugins || [];
        const pPlugins: any[] = pMc?.claimConfig?.plugins || [];
        const claimLabel = pMc?.claimConfig?.label || eMc?.claimConfig?.label || proposed.approvalId || 'unnamed';
        if (ePlugins.length === 0 && pPlugins.length === 0) continue;

        const pByInstance = new Map(pPlugins.filter((p: any) => p.instanceId).map((p: any) => [p.instanceId, p]));

        const deletedPlugins = ePlugins.filter((p: any) => p.instanceId && !pByInstance.has(p.instanceId));
        if (deletedPlugins.length > 0) {
          const names = deletedPlugins.map((p: any) => p.pluginId).join(', ');
          out.push({
            code: 'review.ux.diff_claim_plugins_deleted',
            severity: 'warning',
            source: 'ux',
            category: 'diff',
            title: {
              en: `Claim plugins removed on "${claimLabel}"`
            },
            detail: {
              en: `The following claim plugins were removed: ${names}. This may invalidate existing claim flows and affect users who have already started claiming.`
            },
            recommendation: {
              en: 'Verify that removing these plugins is intentional and won\'t break existing claim flows'
            }
          });
        }

        const eByInstance = new Map(ePlugins.filter((p: any) => p.instanceId).map((p: any) => [p.instanceId, p]));
        for (const pp of pPlugins) {
          if (!pp.instanceId) continue;
          const ep: any = eByInstance.get(pp.instanceId);
          if (!ep) continue;
          const paramsChanged =
            JSON.stringify(ep.publicParams) !== JSON.stringify(pp.publicParams) ||
            JSON.stringify(ep.privateParams) !== JSON.stringify(pp.privateParams);
          if (paramsChanged) {
            out.push({
              code: 'review.ux.diff_claim_plugin_params_changed',
              severity: 'warning',
              source: 'ux',
              category: 'diff',
              title: {
                en: `Claim plugin "${pp.pluginId}" params changed on "${claimLabel}"`
              },
              detail: {
                en: 'The parameters for this claim plugin were modified. This may affect existing claim state and could cause mismatches between off-chain claims and on-chain limits.'
              },
              recommendation: {
                en: 'Verify the parameter changes are intentional and won\'t cause state mismatches with on-chain counters'
              }
            });
          }
        }
      }
    }

    return out;
  }
];
