/**
 * Approval structural checks — ported from frontend reviewItems.ts.
 * Covers mint-approval overrides, forceful transfers, max-transfer limits,
 * claim structure, reset epochs, and wrapper-path prerequisites.
 */

import type { Finding } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { MAX_UINT, getApprovals, getAllApprovals } from './shared.js';

export const approvalsChecks: UxCheck[] = [
  // P5-1: fromListId "All" on non-mint approvals accidentally allows minting
  (value) => {
    const out: Finding[] = [];
    const nonMint = getApprovals(value).filter((a: any) => a.fromListId !== 'Mint');
    for (const approval of nonMint) {
      if (approval.fromListId === 'All') {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.all_list_includes_mint',
          severity: 'critical',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_all_includes_mint',
          params: { name },
          messageEn: `Approval "${name}" uses fromListId "All", which accidentally includes "Mint".`,
          recommendationEn: 'Use a specific non-mint list or explicitly exclude the Mint address.'
        });
      }
    }
    return out;
  },

  // Mint approval missing overridesFromOutgoingApprovals (minting will fail)
  (value) => {
    const out: Finding[] = [];
    const mint = getApprovals(value).filter((a: any) => a.fromListId === 'Mint');
    for (const approval of mint) {
      if (!approval.approvalCriteria?.overridesFromOutgoingApprovals) {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.mint_approval_missing_override',
          severity: 'critical',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_mint_approval_will_fail',
          params: { name },
          messageEn: `Mint approval "${name}" is missing overridesFromOutgoingApprovals — minting will fail on-chain.`,
          recommendationEn: `Set approvalCriteria.overridesFromOutgoingApprovals = true on "${name}".`
        });
      }
    }
    return out;
  },

  // Forceful override checks
  (value) => {
    const out: Finding[] = [];
    const invariants = value?.invariants || {};
    const nonMint = getApprovals(value).filter((a: any) => a.fromListId !== 'Mint');
    const invariantBlocksForceful = !!invariants.noForcefulPostMintTransfers;
    const forcefulApprovals = nonMint.filter((a: any) => {
      if (a.approvalCriteria?.allowBackedMinting && a.approvalCriteria?.mustPrioritize) return false;
      return (
        a.approvalCriteria?.overridesFromOutgoingApprovals === true ||
        a.approvalCriteria?.overridesToIncomingApprovals === true
      );
    });
    const hasOverrides = forcefulApprovals.length > 0;

    // Branch the detail locale key to match the old frontend's 3-way logic:
    //   - hasOverrides && invariantBlocksForceful  -> review_forceful_both_set
    //   - hasOverrides && !invariantBlocksForceful -> Forceful_Override_Warning_With_Count
    //   - !hasOverrides && invariantBlocksForceful -> review_forceful_invariant_only
    if (hasOverrides || invariantBlocksForceful) {
      const detailKey =
        hasOverrides && invariantBlocksForceful
          ? 'review_forceful_both_set'
          : hasOverrides
            ? 'Forceful_Override_Warning_With_Count'
            : 'review_forceful_invariant_only';
      out.push({
        code: 'review.ux.forceful_transfers_allowed',
        severity: 'critical',
        source: 'ux',
        category: 'approvals',
        // Legacy frontend used three disjoint locale keys for this finding.
        localeKeyTitle: 'Forceful_Override_Title',
        localeKeyDetail: detailKey,
        localeKeyFix: 'review_forceful_override_fix',
        params: { count: forcefulApprovals.length },
        messageEn: `Forceful transfers are allowed (${forcefulApprovals.length} override approval(s) present or invariant unset).`,
        recommendationEn: 'Set invariants.noForcefulPostMintTransfers and remove approval overrides unless intentional.'
      });
    }

    // Legacy critical finding: forceful overrides exist but the immutable
    // noForcefulPostMintTransfers invariant is not set. The frontend flagged
    // this separately because the invariant is locked at creation time.
    if (hasOverrides && !invariantBlocksForceful) {
      out.push({
        code: 'review.ux.forceful_invariant_not_set',
        severity: 'critical',
        source: 'ux',
        category: 'approvals',
        localeKey: 'review_forceful_invariant',
        params: { count: forcefulApprovals.length },
        messageEn:
          'Forceful transfer overrides exist but the noForcefulPostMintTransfers invariant is not set — the invariant cannot be added after creation.',
        recommendationEn:
          'Enable invariants.noForcefulPostMintTransfers at creation to permanently block forceful transfers.'
      });
    }
    if (hasOverrides && invariantBlocksForceful) {
      out.push({
        code: 'review.ux.forceful_override_mismatch',
        severity: 'critical',
        source: 'ux',
        category: 'approvals',
        localeKey: 'review_forceful_mismatch',
        messageEn:
          'Invariant blocks forceful transfers but approvals still set overridesFromOutgoingApprovals/overridesToIncomingApprovals — the transaction will fail on-chain.',
        recommendationEn: 'Either unset the invariant or remove the override flags from the listed approvals.'
      });
    }

    const backing = nonMint.filter(
      (a: any) =>
        a.approvalCriteria?.allowBackedMinting &&
        a.approvalCriteria?.mustPrioritize &&
        (a.approvalCriteria?.overridesFromOutgoingApprovals === true ||
          a.approvalCriteria?.overridesToIncomingApprovals === true)
    );
    if (backing.length > 0) {
      out.push({
        code: 'review.ux.backing_approval_override_info',
        severity: 'info',
        source: 'ux',
        category: 'approvals',
        localeKey: 'review_backing_override',
        messageEn: 'Backed-minting approvals set overrides — this is expected for smart-token flows.',
        recommendationEn: 'No action needed unless the backing flow is unintentional.'
      });
    }
    return out;
  },

  // autoApproveAllIncomingTransfers not true on mintable collections
  (value) => {
    const out: Finding[] = [];
    const mint = getApprovals(value).filter((a: any) => a.fromListId === 'Mint');
    if (mint.length > 0) {
      const autoApprove = value?.defaultBalances?.autoApproveAllIncomingTransfers;
      if (autoApprove !== true && autoApprove !== 'true') {
        out.push({
          code: 'review.ux.auto_approve_disabled_on_mintable',
          severity: 'critical',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_no_auto_approve',
          messageEn:
            'Mint approvals exist but defaultBalances.autoApproveAllIncomingTransfers is not true — recipients will not receive minted tokens.',
          recommendationEn: 'Set defaultBalances.autoApproveAllIncomingTransfers = true.'
        });
      }
    }
    return out;
  },

  // P4-7: Infinite drain risk
  (value) => {
    const out: Finding[] = [];
    for (const approval of getApprovals(value)) {
      const criteria = approval.approvalCriteria || {};
      const hasCoinOverride = (criteria.coinTransfers || []).some((ct: any) => ct.overrideFromWithApproverAddress);
      if (!hasCoinOverride) continue;
      const mnt = criteria.maxNumTransfers || {};
      const hasAnyLimit = [
        'overallMaxNumTransfers',
        'perToAddressMaxNumTransfers',
        'perFromAddressMaxNumTransfers',
        'perInitiatedByAddressMaxNumTransfers'
      ].some((k) => mnt[k] && String(mnt[k]) !== '0');
      if (!hasAnyLimit) {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.infinite_drain_risk',
          severity: 'critical',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_infinite_drain',
          params: { name },
          messageEn: `Approval "${name}" pulls funds from the approver via overrideFromWithApproverAddress with no transfer limits — infinite drain risk.`,
          recommendationEn: 'Set an overallMaxNumTransfers or per-address cap on this approval.'
        });
      }
    }
    return out;
  },

  // P4-9: Amount scaling with approver-funded coin transfers
  (value) => {
    const out: Finding[] = [];
    for (const approval of getApprovals(value)) {
      const criteria = approval.approvalCriteria || {};
      const incrementedBal = criteria.predeterminedBalances?.incrementedBalances;
      if (!incrementedBal?.allowAmountScaling) continue;
      const hasCoinOverride = (criteria.coinTransfers || []).some((ct: any) => ct.overrideFromWithApproverAddress);
      if (hasCoinOverride) {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.amount_scaling_with_approver_funds',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_scaling_approver',
          params: { name },
          messageEn: `Approval "${name}" combines amount scaling with approver-funded coin transfers — payouts may multiply unexpectedly.`,
          recommendationEn: 'Disable allowAmountScaling or use a non-approver funding address.'
        });
      }
    }
    return out;
  },

  // P4-8: Per-user max exceeds overall max
  (value) => {
    const out: Finding[] = [];
    for (const approval of getApprovals(value)) {
      const mnt = approval.approvalCriteria?.maxNumTransfers || {};
      const overall = mnt.overallMaxNumTransfers;
      if (!overall || String(overall) === '0') continue;
      const overallNum = Number(overall);
      for (const perKey of [
        'perToAddressMaxNumTransfers',
        'perFromAddressMaxNumTransfers',
        'perInitiatedByAddressMaxNumTransfers'
      ] as const) {
        const perVal = mnt[perKey];
        if (perVal && String(perVal) !== '0' && Number(perVal) > overallNum) {
          const name = approval.approvalId || 'unnamed';
          out.push({
            code: 'review.ux.per_user_exceeds_overall',
            severity: 'warning',
            source: 'ux',
            category: 'approvals',
            localeKey: 'review_per_user_exceeds_overall',
            params: { name, perUser: String(perVal), overall: String(overall) },
            messageEn: `Approval "${name}" per-user max (${perVal}) exceeds overall max (${overall}).`,
            recommendationEn: 'Raise overallMaxNumTransfers or lower the per-user limit.'
          });
          break;
        }
      }
    }
    return out;
  },

  // Claims used — critical trust assumption
  (value) => {
    const out: Finding[] = [];
    const hasClaims = getAllApprovals(value).some(
      (a: any) =>
        Array.isArray(a?.approvalCriteria?.merkleChallenges) &&
        a.approvalCriteria.merkleChallenges.some((mc: any) => mc?.claimConfig || mc?.challengeInfoDetails?.claim)
    );
    if (hasClaims) {
      out.push({
        code: 'review.ux.collection_uses_claims',
        severity: 'critical',
        source: 'ux',
        category: 'claims',
        // Legacy frontend used three disjoint locale keys for this finding.
        localeKeyTitle: 'Collection_uses_claims',
        localeKeyDetail: 'Claim_Trust_Warning',
        localeKeyFix: 'review_claims_trust_fix',
        messageEn:
          'Collection uses claims — users trust the claim backend (plugins, numUses, signatures) in addition to the on-chain logic.',
        recommendationEn: 'Review each claim plugin and confirm the off-chain backend is trustworthy.'
      });
    }
    return out;
  },

  // Claim without initiatedBy plugin — no sign-in verification
  (value) => {
    const out: Finding[] = [];
    for (const approval of getAllApprovals(value)) {
      const challenges: any[] = approval.approvalCriteria?.merkleChallenges || [];
      for (const mc of challenges) {
        const plugins: any[] = mc?.claimConfig?.plugins || [];
        if (plugins.length === 0) continue;
        const hasInitiatedBy = plugins.some((p: any) => p.pluginId === 'initiatedBy');
        if (!hasInitiatedBy) {
          const label = mc.claimConfig?.label || approval.approvalId || 'unnamed';
          out.push({
            code: 'review.ux.claim_missing_signin',
            severity: 'critical',
            source: 'ux',
            category: 'claims',
            localeKey: 'review_claim_no_signin',
            params: { name: label },
            messageEn: `Claim "${label}" has no initiatedBy plugin — anyone can call it anonymously.`,
            recommendationEn: `Add an initiatedBy plugin (wallet sign-in / social auth) to "${label}".`
          });
        }
      }
    }
    return out;
  },

  // Claim numUses vs on-chain overallMaxNumTransfers mismatch
  (value) => {
    const out: Finding[] = [];
    for (const approval of getApprovals(value)) {
      const challenges: any[] = approval.approvalCriteria?.merkleChallenges || [];
      const onChainMax = approval.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers;
      for (const mc of challenges) {
        const plugins: any[] = mc?.claimConfig?.plugins || [];
        const numUsesPlugin = plugins.find((p: any) => p.pluginId === 'numUses');
        if (!numUsesPlugin) continue;
        const offChainMax = numUsesPlugin.publicParams?.maxUses;
        if (offChainMax == null || onChainMax == null || onChainMax === '0') continue;
        if (Number(offChainMax) !== Number(onChainMax)) {
          const label = mc.claimConfig?.label || approval.approvalId || 'unnamed';
          out.push({
            code: 'review.ux.claim_numuses_mismatch',
            severity: 'critical',
            source: 'ux',
            category: 'claims',
            localeKey: 'review_claim_mismatch',
            params: { name: label, offChain: Number(offChainMax), onChain: Number(onChainMax) },
            messageEn: `Claim "${label}" offChain numUses (${offChainMax}) does not match on-chain overallMaxNumTransfers (${onChainMax}).`,
            recommendationEn: `Align the numUses plugin maxUses and the approval's overallMaxNumTransfers for "${label}".`
          });
        }
      }
    }
    return out;
  },

  // P5-6: Claim maxUsesPerLeaf should be "1"
  (value) => {
    const out: Finding[] = [];
    for (const approval of getAllApprovals(value)) {
      const challenges: any[] = approval.approvalCriteria?.merkleChallenges || [];
      for (const mc of challenges) {
        if (
          mc.claimConfig?.plugins?.length > 0 &&
          mc.maxUsesPerLeaf &&
          String(mc.maxUsesPerLeaf) !== '1' &&
          String(mc.maxUsesPerLeaf) !== '0'
        ) {
          const label = mc.claimConfig?.label || approval.approvalId || 'unnamed';
          out.push({
            code: 'review.ux.claim_replay_risk',
            severity: 'warning',
            source: 'ux',
            category: 'claims',
            localeKey: 'review_claim_replay_risk',
            params: { name: label },
            messageEn: `Claim "${label}" has maxUsesPerLeaf != 1 — the same claim code can be replayed.`,
            recommendationEn: 'Set maxUsesPerLeaf to "1" unless replay is intentional.'
          });
        }
      }
    }
    return out;
  },

  // P5-7: allowCounterpartyPurge requires single-address initiatedByList
  (value) => {
    const out: Finding[] = [];
    for (const approval of getApprovals(value)) {
      if (!approval.approvalCriteria?.autoDeletionOptions?.allowCounterpartyPurge) continue;
      const listId = approval.initiatedByListId || '';
      const isSingleAddress = /^bb1[a-z0-9]+$/.test(listId);
      if (!isSingleAddress) {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.counterparty_purge_multi_address',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_counterparty_purge',
          params: { name },
          messageEn: `Approval "${name}" allows counterparty purge but initiatedByListId is not a single address.`,
          recommendationEn: 'Restrict initiatedByListId to a single address, or disable allowCounterpartyPurge.'
        });
      }
    }
    return out;
  },

  // P5-8: Default balances must be auto-scan compatible
  (value) => {
    const out: Finding[] = [];
    const defaultIncoming: any[] = value?.defaultBalances?.incomingApprovals || [];
    const defaultOutgoing: any[] = value?.defaultBalances?.outgoingApprovals || [];
    for (const da of [...defaultIncoming, ...defaultOutgoing]) {
      const c = da.approvalCriteria || {};
      const hasNonScannable =
        (c.coinTransfers?.length > 0) ||
        (c.merkleChallenges?.length > 0) ||
        (c.ethSignatureChallenges?.length > 0) ||
        (c.predeterminedBalances?.incrementedBalances?.startBalances?.length > 0) ||
        (c.predeterminedBalances?.manualBalances?.length > 0);
      if (hasNonScannable) {
        out.push({
          code: 'review.ux.default_balance_not_scannable',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_default_balance_not_scannable',
          messageEn:
            'Default-balance approvals contain non-scannable features (coinTransfers, merkle challenges, or predetermined balances).',
          recommendationEn: 'Move these to regular collectionApprovals, or remove from default balances.'
        });
        return out;
      }
    }
    return out;
  },

  // Wrapper path transferability + approval prerequisite
  (value) => {
    const out: Finding[] = [];
    const wrapperPaths: any[] = value?.cosmosCoinWrapperPathsToAdd || value?.cosmosCoinWrapperPaths || [];
    if (wrapperPaths.length === 0) return out;
    out.push({
      code: 'review.ux.wrapper_path_transferability',
      severity: 'warning',
      source: 'ux',
      category: 'approvals',
      localeKey: 'review_wrapper_path_transferability',
      messageEn: 'Wrapper paths make the underlying token freely transferable via IBC, bypassing on-chain approvals.',
      recommendationEn: 'Confirm the wrapped token is intended to be a free-floating IBC asset.'
    });
    const hasWrapApproval = getApprovals(value).some((a: any) => a.approvalCriteria?.allowSpecialWrapping === true);
    if (!hasWrapApproval) {
      out.push({
        code: 'review.ux.wrapper_path_missing_approval',
        severity: 'critical',
        source: 'ux',
        category: 'approvals',
        localeKey: 'review_wrapper_path_no_approval',
        messageEn: 'Wrapper paths exist but no approval has allowSpecialWrapping = true — wrapping will fail.',
        recommendationEn: 'Add an approval with approvalCriteria.allowSpecialWrapping = true.'
      });
    }
    return out;
  },

  // Predetermined balances missing order calculation method or incrementedBalances shape.
  // Opinionated semantic guess — instead of auto-filling `useOverallNumTransfers = true`, which
  // silently picks an ordering that may not match the author's intent, we surface this as a
  // warning so the reviewer confirms the intended calculation method.
  (value) => {
    const out: Finding[] = [];
    for (const approval of getAllApprovals(value)) {
      const pb = approval.approvalCriteria?.predeterminedBalances;
      if (!pb) continue;
      const ocm = pb.orderCalculationMethod;
      const flags = ocm
        ? [
            'useOverallNumTransfers',
            'usePerToAddressNumTransfers',
            'usePerFromAddressNumTransfers',
            'usePerInitiatedByAddressNumTransfers',
            'useMerkleChallengeLeafIndex'
          ].filter((k: string) => ocm[k] === true)
        : [];
      if (!ocm || flags.length === 0) {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.predetermined_order_unset',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_predetermined_order_unset',
          params: { name },
          messageEn: `Approval "${name}" uses predeterminedBalances but no orderCalculationMethod flag is set. Pick exactly one (e.g. useOverallNumTransfers) to make the ordering explicit.`,
          recommendationEn: 'Set one of useOverallNumTransfers / usePerToAddressNumTransfers / usePerFromAddressNumTransfers / usePerInitiatedByAddressNumTransfers / useMerkleChallengeLeafIndex on orderCalculationMethod.'
        });
      } else if (flags.length > 1) {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.predetermined_order_conflict',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_predetermined_order_conflict',
          params: { name, flags: flags.join(', ') },
          messageEn: `Approval "${name}" predeterminedBalances.orderCalculationMethod sets multiple flags (${flags.join(', ')}). Only one should be set.`,
          recommendationEn: 'Keep exactly one of the use* flags true and set the others to false.'
        });
      }
    }
    return out;
  },

  // Reset interval with startTime = 0
  (value) => {
    const out: Finding[] = [];
    const seen = new Set<string>();
    for (const approval of getAllApprovals(value)) {
      const criteria = approval.approvalCriteria || {};
      for (const field of ['approvalAmounts', 'maxNumTransfers'] as const) {
        const rti = criteria[field]?.resetTimeIntervals;
        if (!rti) continue;
        const interval = String(rti.intervalLength || '0');
        const start = String(rti.startTime || '0');
        if (interval !== '0' && start === '0') {
          const name = approval.approvalId || 'unnamed';
          const key = name;
          if (seen.has(key)) break;
          seen.add(key);
          out.push({
            code: 'review.ux.reset_epoch_zero',
            severity: 'warning',
            source: 'ux',
            category: 'approvals',
            localeKey: 'review_reset_epoch_zero',
            params: { name },
            messageEn: `Approval "${name}" uses a reset interval with startTime 0 — epochs anchor to unix 0, not now.`,
            recommendationEn: 'Set resetTimeIntervals.startTime to a real timestamp (current time or launch).'
          });
          break;
        }
      }
    }
    return out;
  },

  // Royalty missing percentage or address
  (value) => {
    const out: Finding[] = [];
    for (const approval of getApprovals(value)) {
      const royalty = approval.approvalCriteria?.userRoyalties;
      if (!royalty) continue;
      const hasPercentage = royalty.percentage && String(royalty.percentage) !== '0';
      const hasAddress = royalty.payoutAddress && royalty.payoutAddress !== '';
      const name = approval.approvalId || 'unnamed';
      if (hasPercentage && !hasAddress) {
        out.push({
          code: 'review.ux.royalty_missing_address',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_royalty_missing_address',
          params: { name },
          messageEn: `Royalty on approval "${name}" has a percentage but no payout address.`,
          recommendationEn: 'Set royalty.payoutAddress or remove the percentage.'
        });
      }
      if (!hasPercentage && hasAddress) {
        out.push({
          code: 'review.ux.royalty_missing_percentage',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          localeKey: 'review_royalty_missing_percentage',
          params: { name },
          messageEn: `Royalty on approval "${name}" has a payout address but no percentage.`,
          recommendationEn: 'Set royalty.percentage or remove the payout address.'
        });
      }
    }
    return out;
  }
];

// Exported constant reference to keep MAX_UINT imported (used by diff/permissions modules).
export const _MAX_UINT = MAX_UINT;
