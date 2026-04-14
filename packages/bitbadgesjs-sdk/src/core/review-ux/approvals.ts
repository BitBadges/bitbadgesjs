/**
 * Approval structural checks — ported from frontend reviewItems.ts.
 * Covers mint-approval overrides, forceful transfers, max-transfer limits,
 * claim structure, reset epochs, and wrapper-path prerequisites.
 */

import type { Finding } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { MAX_UINT, getApprovals, getAllApprovals, isTransferabilityPermanentlyLocked } from './shared.js';

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
          title: {
            en: `"${name}" uses fromListId "All" which includes Mint`
          },
          detail: {
            en: 'The "All" address list includes the Mint address. This means this approval accidentally allows minting new tokens. Use "!Mint" instead for post-mint transfer approvals.'
          },
          recommendation: {
            en: 'Change fromListId from "All" to "!Mint" to exclude the Mint address'
          }
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
          title: {
            en: `Mint approval "${name}" will fail`
          },
          detail: {
            en: 'Mint approvals must have the outgoing override enabled. Without this, the Mint address cannot send tokens.'
          },
          recommendation: {
            en: `Enable the outgoing override on mint approval "${name}"`
          }
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

    // Is canUpdateCollectionApprovals permanently forbidden with a
    // true blanket scope? The helper below checks all 8 scope fields
    // (fromListId / toListId / initiatedByListId / transferTimes /
    // tokenIds / approvalId / amountTrackerId / challengeTrackerId)
    // plus permanentlyForbiddenTimes covering forever. If so, no
    // approvals can ever be added / removed / modified post-creation,
    // and the "future approvals could enable forceful" finding is
    // redundant — we append a note to that effect.
    const transferabilityPermanentlyLocked = isTransferabilityPermanentlyLocked(value);

    // Four outcome cases:
    //   hasOverrides + !invariantBlocksForceful  → warning (verify intent)
    //   hasOverrides + invariantBlocksForceful   → critical (on-chain failure)
    //   !hasOverrides + !invariantBlocksForceful → info (future could enable, unless locked)
    //   !hasOverrides + invariantBlocksForceful  → silent (locked as expected)
    if (hasOverrides && !invariantBlocksForceful) {
      const names = forcefulApprovals
        .map((a: any) => a.approvalId || 'unnamed')
        .slice(0, 5)
        .join(', ');
      const more = forcefulApprovals.length > 5 ? ` (+${forcefulApprovals.length - 5} more)` : '';
      out.push({
        code: 'review.ux.forceful_transfers_allowed',
        severity: 'warning',
        source: 'ux',
        category: 'approvals',
        title: { en: 'Forceful transfer overrides enabled' },
        detail: {
          en: `${forcefulApprovals.length} non-mint approval(s) override outgoing or incoming consent: ${names}${more}. Tokens under these approvals can be moved without the holder's permission. This is a legitimate design choice for some flows (subscription revoke, auction settlement, prediction market resolution) — verify each listed approval is intentional.`
        },
        recommendation: {
          en: 'Verify each listed approval is intentional. If any should not allow forceful transfers, remove its override flags.'
        }
      });
    }

    if (hasOverrides && invariantBlocksForceful) {
      const names = forcefulApprovals
        .map((a: any) => a.approvalId || 'unnamed')
        .slice(0, 5)
        .join(', ');
      const more = forcefulApprovals.length > 5 ? ` (+${forcefulApprovals.length - 5} more)` : '';
      out.push({
        code: 'review.ux.forceful_override_mismatch',
        severity: 'critical',
        source: 'ux',
        category: 'approvals',
        title: {
          en: 'Forceful transfer mismatch — overrides will fail on-chain'
        },
        detail: {
          en: `${forcefulApprovals.length} non-mint approval(s) set overridesFromOutgoingApprovals or overridesToIncomingApprovals: ${names}${more}. The noForcefulPostMintTransfers invariant is ALSO set to true, which the chain interprets as "no approval may ever override consent." These overrides will be rejected on-chain at broadcast time.`
        },
        recommendation: {
          en: 'If the listed approvals need forceful transfers (auction settlement, prediction market resolution, subscription revoke, etc.), set invariants.noForcefulPostMintTransfers = false (or leave unset). If forceful transfers should be permanently blocked, remove the override flags from the listed approvals.'
        }
      });
    }

    // Case B: no current forceful approvals but the invariant does
    // not block them (explicitly false OR unset — either way, the
    // collection permits forceful transfers post-mint). The invariant
    // is locked at creation time, so any approval the manager adds
    // later could introduce forceful transfers. This is a real trust
    // assumption worth surfacing as a `warning` — holders can't rely
    // on forceful transfers being permanently impossible.
    //
    // Special case: if transferability is already permanently locked
    // via a blanket canUpdateCollectionApprovals forbidden entry, the
    // warning is effectively neutralized (no future approvals can be
    // added), so we downgrade severity and append a note.
    if (!hasOverrides && !invariantBlocksForceful) {
      // Distinguish explicit-false from unset so the text is accurate.
      const invariantValue = invariants.noForcefulPostMintTransfers;
      const isExplicitFalse = invariantValue === false;
      const stateText = isExplicitFalse
        ? 'This collection has noForcefulPostMintTransfers set to false, which permits forceful post-mint transfers.'
        : 'The noForcefulPostMintTransfers invariant is not set, which by default permits forceful post-mint transfers.';
      const baseDetail = `${stateText} No approvals currently enable them, but since the invariant is locked at creation time, any approval the manager adds later could introduce forceful transfers.`;
      const suffix = transferabilityPermanentlyLocked
        ? ' This is likely redundant in your case — canUpdateCollectionApprovals is permanently locked, so no future approvals can be added anyway.'
        : '';
      out.push({
        code: 'review.ux.forceful_transfers_not_locked',
        severity: transferabilityPermanentlyLocked ? 'info' : 'warning',
        source: 'ux',
        category: 'approvals',
        title: { en: 'Forceful transfers permitted post-mint' },
        detail: { en: baseDetail + suffix },
        recommendation: {
          en: 'If forceful transfers should be permanently impossible, set invariants.noForcefulPostMintTransfers = true at creation — it cannot be toggled later. If forceful transfers are intentional for this collection (auction settlement, subscription revoke, prediction market resolution, etc.), you can safely ignore this.'
        }
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
        title: {
          en: 'Backing approval has unnecessary overrides'
        },
        detail: {
          en: 'Backing and unbacking approvals have transfer overrides enabled, but these are irrelevant for protocol-controlled backing addresses. It is recommended to remove them for clarity.'
        },
        recommendation: {
          en: 'Remove the transfer override flags from the backing and unbacking approvals'
        }
      });
    }
    return out;
  },

  // autoApproveAllIncomingTransfers not true on mintable collections.
  // Skipped on updates: defaultBalances is immutable post-creation,
  // so flagging it on an existing collection is noise the user can't fix.
  // Update detection is structural (collectionId !== '0'), not ctx-based —
  // matches diff.ts and works for all callers (frontend, CLI, indexer, MCP).
  (value) => {
    const out: Finding[] = [];
    // collectionId stays string because it's not a "number-typed field"
    // in the Msg class — it's an ID. BigIntify doesn't convert it.
    const isUpdate = value?.collectionId && value.collectionId !== '0';
    if (isUpdate) return out;
    const mint = getApprovals(value).filter((a: any) => a.fromListId === 'Mint');
    if (mint.length > 0) {
      const autoApprove = value?.defaultBalances?.autoApproveAllIncomingTransfers;
      if (autoApprove !== true && autoApprove !== 'true') {
        out.push({
          code: 'review.ux.auto_approve_disabled_on_mintable',
          severity: 'critical',
          source: 'ux',
          category: 'approvals',
          title: {
            en: 'Incoming transfers not auto-approved'
          },
          detail: {
            en: 'This collection has mint approvals but incoming transfers are not auto-approved. Recipients must opt-in before they can receive minted tokens, which means minting will silently fail for most users.'
          },
          recommendation: {
            en: 'Enable auto-approve for all incoming transfers in the default balance settings'
          }
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
      ].some((k) => mnt[k] !== undefined && mnt[k] !== 0n);
      if (!hasAnyLimit) {
        const name = approval.approvalId || 'unnamed';
        out.push({
          code: 'review.ux.infinite_drain_risk',
          severity: 'critical',
          source: 'ux',
          category: 'approvals',
          title: {
            en: `Unlimited fund drain risk on "${name}"`
          },
          detail: {
            en: 'This approval pays out from the escrow/approver on every transfer but has no transfer limit set. Anyone matching the approval can drain funds indefinitely.'
          },
          recommendation: {
            en: 'Set a maximum number of transfers to cap the total payout'
          }
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
          title: {
            en: `Amount scaling with approver-funded payments on "${name}"`
          },
          detail: {
            en: 'This approval uses amount scaling with overrideFromWithApproverAddress. Users can multiply payment amounts drawn from the approver/escrow up to the maxScalingMultiplier. Verify that the per-use amount under scaling makes sense for your use case.'
          },
          recommendation: {
            en: 'Verify maxScalingMultiplier is set to a reasonable cap and that the resulting per-use payout matches what the approval is meant to deliver.'
          }
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
      if (overall === undefined || overall === 0n) continue;
      for (const perKey of [
        'perToAddressMaxNumTransfers',
        'perFromAddressMaxNumTransfers',
        'perInitiatedByAddressMaxNumTransfers'
      ] as const) {
        const perVal = mnt[perKey];
        if (perVal !== undefined && perVal !== 0n && perVal > overall) {
          const name = approval.approvalId || 'unnamed';
          const perUser = String(perVal);
          const overallStr = String(overall);
          out.push({
            code: 'review.ux.per_user_exceeds_overall',
            severity: 'warning',
            source: 'ux',
            category: 'approvals',
            title: {
              en: `Per-user limit exceeds overall limit on "${name}"`
            },
            detail: {
              en: `A per-user limit (${perUser}) is higher than the overall limit (${overallStr}). The per-user limit can never be reached since the overall limit will be hit first.`
            },
            recommendation: {
              en: 'Set the per-user limit to be less than or equal to the overall limit'
            }
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
        title: {
          en: 'Collection uses claims'
        },
        detail: {
          en: 'This collection uses off-chain claims, which introduces trust assumptions on BitBadges for managing claims and verifying criteria, as well as any third-party dependencies you add (passwords, codes, webhooks). Design accordingly, especially for high-value use cases. Design with off-chain failures in mind. For a fully on-chain or fully self-hosted solution, gate by your own on-chain dynamic store or by another token that you control.',
          es: 'Esta colección utiliza reclamaciones fuera de cadena, lo que introduce suposiciones de confianza en BitBadges para gestionar reclamaciones y verificar criterios, así como cualquier dependencia de terceros que agregue (contraseñas, códigos, webhooks). Diseñe en consecuencia, especialmente para casos de alto valor. Diseñe teniendo en cuenta posibles fallos fuera de cadena. Para una solución completamente en cadena o auto-alojada, controle el acceso mediante su propio almacén dinámico en cadena o mediante otro token que usted controle.'
        },
        recommendation: {
          en: 'If trust assumptions are unacceptable, consider using on-chain-only criteria instead of off-chain claims'
        }
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
            title: {
              en: `Claim "${label}" has no sign-in requirement`
            },
            detail: {
              en: 'Claims default to no sign-in required. Without the sign-in plugin, anyone can claim without proving they own an address. For claims linked to on-chain transfers, sign-in is essential because users must sign the eventual transaction.'
            },
            recommendation: {
              en: `Add the sign-in requirement plugin to the "${label}" claim`
            }
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
        if (offChainMax == null || onChainMax == null || onChainMax === 0n) continue;
        if (Number(offChainMax) !== Number(onChainMax)) {
          const label = mc.claimConfig?.label || approval.approvalId || 'unnamed';
          const offChain = Number(offChainMax);
          const onChain = Number(onChainMax);
          out.push({
            code: 'review.ux.claim_numuses_mismatch',
            severity: 'critical',
            source: 'ux',
            category: 'claims',
            title: {
              en: `Claim "${label}" has mismatched limits`
            },
            detail: {
              en: `The claim allows ${offChain} uses but the on-chain transfer limit is ${onChain}. These must match — otherwise users can claim off-chain but fail on-chain, or on-chain slots go unused.`
            },
            recommendation: {
              en: `Set both the claim max uses and the on-chain transfer limit to the same value for "${label}"`
            }
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
          mc.maxUsesPerLeaf !== undefined &&
          mc.maxUsesPerLeaf !== 1n &&
          mc.maxUsesPerLeaf !== 0n
        ) {
          const label = mc.claimConfig?.label || approval.approvalId || 'unnamed';
          out.push({
            code: 'review.ux.claim_replay_risk',
            severity: 'warning',
            source: 'ux',
            category: 'claims',
            title: {
              en: `Claim "${label}" may be vulnerable to replay`
            },
            detail: {
              en: 'maxUsesPerLeaf is not set to 1. Without this, the same claim proof could be reused multiple times.'
            },
            recommendation: {
              en: 'Set maxUsesPerLeaf to 1 to ensure each claim code can only be used once'
            }
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
          title: {
            en: `Counterparty purge on "${name}" requires single-address initiator`
          },
          detail: {
            en: 'allowCounterpartyPurge is enabled but the initiatedByList is not a single address. The chain requires exactly one address to have purge rights.'
          },
          recommendation: {
            en: 'Set initiatedByListId to a single bb1 address for counterparty purge to work'
          }
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
          title: {
            en: 'Default balance approvals not auto-scan compatible'
          },
          detail: {
            en: 'Default balance approvals contain features that are not compatible with auto-scan mode (coin transfers, claims, predetermined balances, or signature challenges). These are creation-only and may cause issues.'
          },
          recommendation: {
            en: 'Simplify default balance approvals to only use basic transfer rules without complex criteria'
          }
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
      title: {
        en: 'Cosmos wrapper paths — transferability caveat'
      },
      detail: {
        en: "This collection has cosmos wrapper paths. Once tokens are wrapped to ICS20, they are freely transferable via IBC regardless of your collection's transfer rules. BitBadges transferability only applies in the siloed (unwrapped) environment."
      },
      recommendation: {
        en: 'Ensure transfer restrictions are enforced before wrapping, not after'
      }
    });
    const hasWrapApproval = getApprovals(value).some((a: any) => a.approvalCriteria?.allowSpecialWrapping === true);
    if (!hasWrapApproval) {
      out.push({
        code: 'review.ux.wrapper_path_missing_approval',
        severity: 'critical',
        source: 'ux',
        category: 'approvals',
        title: {
          en: 'Cosmos wrapper path but no wrapping approval'
        },
        detail: {
          en: 'Wrapper paths are configured but no approval has allowSpecialWrapping enabled. Wrapping and unwrapping will not function without this.'
        },
        recommendation: {
          en: 'Add approvals with allowSpecialWrapping: true and mustPrioritize: true targeting the wrapper address'
        }
      });
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
        const interval = rti.intervalLength ?? 0n;
        const start = rti.startTime ?? 0n;
        if (interval !== 0n && start === 0n) {
          const name = approval.approvalId || 'unnamed';
          const key = name;
          if (seen.has(key)) break;
          seen.add(key);
          out.push({
            code: 'review.ux.reset_epoch_zero',
            severity: 'warning',
            source: 'ux',
            category: 'approvals',
            title: {
              en: `Reset interval on "${name}" uses epoch start time`
            },
            detail: {
              en: 'This approval has a time-based reset interval but the start time is set to 0 (January 1, 1970). This means resets happen at fixed UTC midnight boundaries, and users could exploit the boundary by making two withdrawals minutes apart across a reset. Use a recent timestamp as the start time instead.'
            },
            recommendation: {
              en: 'Change the reset start time to a recent timestamp (use get_current_timestamp) instead of 0'
            }
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
      const hasPercentage = royalty.percentage !== undefined && royalty.percentage !== 0n;
      const hasAddress = royalty.payoutAddress && royalty.payoutAddress !== '';
      const name = approval.approvalId || 'unnamed';
      if (hasPercentage && !hasAddress) {
        out.push({
          code: 'review.ux.royalty_missing_address',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          title: {
            en: `Royalty on "${name}" has no payout address`
          },
          detail: {
            en: 'A royalty percentage is set but no payout address. Royalties will not be sent anywhere.'
          },
          recommendation: {
            en: 'Set a payout address for the royalty'
          }
        });
      }
      if (!hasPercentage && hasAddress) {
        out.push({
          code: 'review.ux.royalty_missing_percentage',
          severity: 'warning',
          source: 'ux',
          category: 'approvals',
          title: {
            en: `Royalty on "${name}" has no percentage`
          },
          detail: {
            en: 'A royalty payout address is set but the percentage is zero. No royalties will be collected.'
          },
          recommendation: {
            en: 'Set a royalty percentage or remove the payout address'
          }
        });
      }
    }
    return out;
  }
];

// Exported constant reference to keep MAX_UINT imported (used by diff/permissions modules).
export const _MAX_UINT = MAX_UINT;
