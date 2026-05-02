/**
 * Collection audit logic.
 *
 * Audits a MsgUniversalUpdateCollection (or raw on-chain collection object) for
 * security risks, design flaws, and common gotchas.  Returns structured findings
 * with severity levels so callers can programmatically inspect results.
 */

import { normalizeForReview } from './review-normalize.js';
import { parseInlineCustomData } from '../api-indexer/metadata/inlineCustomData.js';

const MAX_UINT64 = 18446744073709551615n;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Severity of an audit finding. */
export type AuditSeverity = 'critical' | 'warning' | 'info';

/** A single audit finding. */
export interface AuditFinding {
  severity: AuditSeverity;
  category: string;
  title: string;
  detail: string;
  recommendation: string;
  /**
   * Hidden from human consumers (frontend sidebar) when true. Used for
   * findings that just restate permission state ("canUpdateX is NEUTRAL")
   * — redundant for humans who can already see the permissions tab, but
   * useful for CLI / indexer / MCP agents who need a flat summary.
   */
  agentOnly?: boolean;
}

/** The complete result returned by {@link auditCollection}. */
export interface AuditResult {
  success: boolean;
  findings: AuditFinding[];
  summary: { critical: number; warning: number; info: number; verdict: string };
  permissionSummary: Record<string, string>;
  approvalSummary: string[];
  error?: string;
}

// ---------------------------------------------------------------------------
// Internal structural types (plain objects, not SDK classes)
// ---------------------------------------------------------------------------

interface UintRange {
  start: bigint;
  end: bigint;
}

interface PermissionEntry {
  permanentlyPermittedTimes?: UintRange[];
  permanentlyForbiddenTimes?: UintRange[];
  tokenIds?: UintRange[];
  fromListId?: string;
  toListId?: string;
  initiatedByListId?: string;
  approvalId?: string;
  transferTimes?: UintRange[];
  ownershipTimes?: UintRange[];
}

interface ApprovalEntry {
  fromListId?: string;
  toListId?: string;
  initiatedByListId?: string;
  transferTimes?: UintRange[];
  tokenIds?: UintRange[];
  ownershipTimes?: UintRange[];
  approvalId?: string;
  approvalCriteria?: Record<string, unknown>;
  version?: string;
  uri?: string;
  customData?: string;
}

interface CollectionValue {
  creator?: string;
  collectionId?: string;
  manager?: string;
  validTokenIds?: UintRange[];
  collectionPermissions?: Record<string, PermissionEntry[]>;
  collectionApprovals?: ApprovalEntry[];
  invariants?: Record<string, unknown>;
  standards?: string[];
  customData?: string;
  collectionMetadata?: { uri?: string; customData?: string };
  tokenMetadata?: { uri?: string; customData?: string; tokenIds?: UintRange[] }[];
  aliasPathsToAdd?: Record<string, unknown>[];
  cosmosCoinWrapperPathsToAdd?: unknown[];
  isArchived?: boolean;
  defaultBalances?: Record<string, unknown>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Permission helpers
// ---------------------------------------------------------------------------

function isForever(ranges: UintRange[] | undefined): boolean {
  if (!ranges || ranges.length === 0) return false;
  // Tolerate both string and bigint shapes. The SDK builders emit
  // strings; the frontend collection store uses bigints. Normalizing
  // via String() catches both uniformly.
  return ranges.some((r) => r.start === 1n && r.end === MAX_UINT64);
}

function isForbidden(entries: PermissionEntry[] | undefined): boolean {
  if (!entries || entries.length === 0) return false;
  return entries.some((e) => isForever(e.permanentlyForbiddenTimes));
}

function isPermitted(entries: PermissionEntry[] | undefined): boolean {
  if (!entries || entries.length === 0) return false;
  return entries.some((e) => isForever(e.permanentlyPermittedTimes));
}

function isNeutral(entries: PermissionEntry[] | undefined): boolean {
  if (!entries || entries.length === 0) return true;
  return !isForbidden(entries) && !isPermitted(entries);
}

function permissionState(entries: PermissionEntry[] | undefined): string {
  if (isForbidden(entries)) return 'FORBIDDEN';
  if (isPermitted(entries)) return 'PERMITTED';
  return 'NEUTRAL';
}

// ---------------------------------------------------------------------------
// Special-address helpers
// ---------------------------------------------------------------------------

/** Classify a list-ID / address string. */
export function isSpecialAddress(addr: string): { special: boolean; type: string } {
  if (addr === 'Mint') return { special: true, type: 'Mint (token creation source)' };
  if (addr === 'All') return { special: true, type: 'All (everyone)' };
  if (addr === '!Mint') return { special: true, type: '!Mint (everyone except Mint)' };
  if (addr === 'Total') return { special: true, type: 'Total (aggregate tracker)' };
  if (addr.startsWith('!')) return { special: true, type: `Negated list (${addr})` };
  if (addr.includes(':')) return { special: true, type: `Compound list (${addr})` };
  return { special: false, type: 'regular address' };
}

// ---------------------------------------------------------------------------
// Collection extraction
// ---------------------------------------------------------------------------

function extractCollection(input: Record<string, unknown>): CollectionValue {
  // Handle MsgUniversalUpdateCollection wrapper
  if (input.typeUrl || input.messages) {
    const messages = input.messages as Record<string, unknown>[] | undefined;
    if (messages && messages.length > 0) {
      const msg = messages[0] as Record<string, unknown>;
      return (msg.value || msg) as CollectionValue;
    }
    return (input.value || input) as CollectionValue;
  }
  // Handle transaction wrapper { transaction: { ... } }
  if (input.transaction) {
    return extractCollection(input.transaction as Record<string, unknown>);
  }
  return input as CollectionValue;
}

// ---------------------------------------------------------------------------
// Main audit function
// ---------------------------------------------------------------------------

/**
 * Audit a collection transaction or on-chain collection object for security
 * risks, design flaws, and common gotchas.
 *
 * @param input.collection - The collection to audit.  Accepts:
 *   - A `MsgUniversalUpdateCollection` message (with `typeUrl` and `value`)
 *   - The `value` field directly
 *   - A raw collection object from `query_collection`
 *   - A transaction wrapper `{ messages: [...] }`
 * @param input.context - Optional free-text context such as "NFT art collection"
 *   or "stablecoin vault".  Helps tailor findings.
 * @returns Structured {@link AuditResult}.
 */
export function auditCollection(input: { collection: Record<string, unknown>; context?: string }): AuditResult {
  try {
    // normalizeForReview unwraps tx/msg wrappers, mirrors aliasPaths
    // field names, and converts all numeric fields to bigints via the
    // Msg class's registered .convert(BigIntify). Idempotent.
    const col = normalizeForReview(input.collection) as CollectionValue;
    const findings: AuditFinding[] = [];
    const context = (input.context || '').toLowerCase();

    const perms = col.collectionPermissions || {};
    const approvals = col.collectionApprovals || [];
    const invariants = (col.invariants || {}) as Record<string, unknown>;

    // ========================================
    // 1. MANAGER & CENTRALIZATION ANALYSIS
    // ========================================

    // 1a. Manager exists. Tagged agentOnly because the frontend permissions
    // tab already shows the manager state — this finding just restates it.
    if (col.manager) {
      const managerState = permissionState(perms.canUpdateManager);
      if (managerState === 'NEUTRAL') {
        findings.push({
          severity: 'warning',
          category: 'centralization',
          title: 'Manager change permission is NEUTRAL',
          detail: `Manager is ${col.manager}. The canUpdateManager permission is neutral, meaning the manager could lock or transfer manager control at any time.`,
          recommendation: 'Set canUpdateManager to FORBIDDEN to prevent manager address changes, or to PERMITTED if intentional.',
          agentOnly: true
        });
      } else if (managerState === 'PERMITTED') {
        findings.push({
          severity: 'warning',
          category: 'centralization',
          title: 'Manager can be changed permanently',
          detail: 'canUpdateManager is PERMITTED. The current manager can transfer control to any address at any time.',
          recommendation: 'This is valid for multi-sig rotation or planned ownership transfer. Otherwise, set to FORBIDDEN.',
          agentOnly: true
        });
      }
    }

    // 1b. What can the manager actually do? Audit each permission
    const permNames = [
      'canDeleteCollection',
      'canArchiveCollection',
      'canUpdateStandards',
      'canUpdateCustomData',
      'canUpdateManager',
      'canUpdateCollectionMetadata',
      'canUpdateValidTokenIds',
      'canUpdateTokenMetadata',
      'canUpdateCollectionApprovals',
      'canAddMoreAliasPaths',
      'canAddMoreCosmosCoinWrapperPaths'
    ];

    const neutralPerms = permNames.filter((p) => isNeutral(perms[p]));
    const permittedPerms = permNames.filter((p) => isPermitted(perms[p]));

    if (neutralPerms.length > 0) {
      findings.push({
        severity: 'info',
        category: 'centralization',
        title: `${neutralPerms.length} permission(s) are NEUTRAL (undecided)`,
        detail: `Neutral permissions: ${neutralPerms.join(', ')}. These can be changed to forbidden or permitted at any time by the manager.`,
        recommendation: 'Consider locking permissions you are confident about. Neutral permissions signal uncertainty to users.',
        // Redundant for humans who see the permissions tab. Agent-only.
        agentOnly: true
      });
    }

    // ========================================
    // 2. SUPPLY CONTROL & INFLATION
    // ========================================

    // 2a. canUpdateValidTokenIds — agentOnly, see permissions tab note above.
    const validTokenIdState = permissionState(perms.canUpdateValidTokenIds);
    if (validTokenIdState !== 'FORBIDDEN') {
      findings.push({
        severity: 'warning',
        category: 'supply',
        title: 'Token ID creation is not locked',
        detail: `canUpdateValidTokenIds is ${validTokenIdState}. The manager can add new token IDs, which creates new supply.`,
        recommendation: 'Set canUpdateValidTokenIds to FORBIDDEN if supply should be fixed. Even with locked token-creation approvals, new token IDs create new supply ranges.',
        agentOnly: true
      });
    }

    // 2b. maxSupplyPerId invariant — only meaningful for NFT collections.
    // Fungible / credit / address-list / vault collections legitimately
    // have maxSupplyPerId == 0, so gating on the NFTs standard prevents
    // false positives for every non-NFT collection.
    const colStandards: string[] = (col.standards as string[]) || [];
    const maxSupply = invariants.maxSupplyPerId as bigint | undefined;
    if (colStandards.includes('NFTs') && (maxSupply === undefined || maxSupply === 0n)) {
      findings.push({
        severity: 'info',
        category: 'supply',
        title: 'No per-token-ID supply cap (maxSupplyPerId = 0)',
        detail: 'maxSupplyPerId is 0 or unset, meaning unlimited tokens can exist per token ID. For NFTs, this should be "1".',
        recommendation: 'Set maxSupplyPerId to "1" for NFTs.'
      });
    }

    // ========================================
    // 3. APPROVAL ANALYSIS
    // ========================================

    // 3a. canUpdateCollectionApprovals — analyzed across three flows:
    //     - mint approvals          (fromListId === 'Mint')       → supply risk if mutable
    //     - backing mint approvals  (allowBackedMinting === true) → supply risk if mutable
    //       (smart tokens don't use fromListId 'Mint'; the backing
    //       address acts as the functional mint source, so mutable
    //       backing approvals are the same class of unlimited-supply
    //       risk as a mutable Mint approval)
    //     - post-mint transfer approvals (everything else)        → transferability risk
    //
    // For each flow we ask: is the relevant subset of approvals
    // mutable? An approval is "mutable" when canUpdateCollectionApprovals
    // is PERMITTED, or it's NEUTRAL without a scoped forbidden lock
    // covering that subset.
    const approvalPermState = permissionState(perms.canUpdateCollectionApprovals);
    const approvalPerms = perms.canUpdateCollectionApprovals || [];
    const hasScopedMintLock = approvalPerms.some(
      (p) => (p.fromListId === 'Mint' || p.fromListId === 'All') && isForever(p.permanentlyForbiddenTimes)
    );
    // Blanket lock: every one of the 8 CollectionApprovalPermission
    // scope fields is set to its wildcard value AND
    // permanentlyForbiddenTimes covers forever. Partial locks (e.g.
    // "Mint scope forbidden forever") don't count — they only freeze
    // a subset of the approval space. A blanket lock means no approval
    // can ever be added / removed / modified post-creation, so
    // transferability is permanently fixed.
    const hasBlanketLock = approvalPerms.some((p: any) => {
      if (p.fromListId !== 'All') return false;
      if (p.toListId !== 'All') return false;
      if (p.initiatedByListId !== 'All') return false;
      if (!isForever(p.transferTimes)) return false;
      if (!isForever(p.tokenIds)) return false;
      if (p.approvalId !== 'All') return false;
      if (p.amountTrackerId !== 'All') return false;
      if (p.challengeTrackerId !== 'All') return false;
      return isForever(p.permanentlyForbiddenTimes);
    });

    const mintMutable =
      approvalPermState === 'PERMITTED' || (approvalPermState === 'NEUTRAL' && !hasScopedMintLock);
    const transferMutable =
      approvalPermState === 'PERMITTED' || (approvalPermState === 'NEUTRAL' && !hasBlanketLock);

    const hasMintApproval = approvals.some((a) => a.fromListId === 'Mint');
    const hasBackingApproval2 = approvals.some((a) => {
      const crit = a.approvalCriteria as Record<string, unknown> | undefined;
      return !!crit?.allowBackedMinting;
    });
    const hasNonMintApproval = approvals.some(
      (a) => a.fromListId !== 'Mint' && !(a.approvalCriteria as Record<string, unknown>)?.allowBackedMinting
    );

    if (mintMutable && hasMintApproval) {
      findings.push({
        severity: 'critical',
        category: 'supply',
        title: 'Mint approvals can be modified — UNLIMITED SUPPLY RISK',
        detail: `canUpdateCollectionApprovals is ${approvalPermState} and the collection has token-creation (Mint) approvals. The manager can add new creation approvals, change creation limits, or remove restrictions at any time. This effectively means unlimited supply.`,
        recommendation:
          'Lock canUpdateCollectionApprovals for mint-related approvals (fromListId: "Mint"). Use scoped approval permissions to lock mint while allowing transfer approval updates if needed.'
      });
    }

    if (mintMutable && hasBackingApproval2) {
      findings.push({
        severity: 'critical',
        category: 'supply',
        title: 'Backing approvals can be modified — UNLIMITED SUPPLY RISK',
        detail: `canUpdateCollectionApprovals is ${approvalPermState} and the collection uses IBC backing to create tokens (allowBackedMinting = true). The manager can modify the 1:1 backing conversion, add new backing paths, or change limits at any time, which effectively means unlimited supply risk even though this is not a traditional "Mint" approval.`,
        recommendation:
          'Lock canUpdateCollectionApprovals for the backing address scope. Use scoped approval permissions to fix the backing configuration at creation and block future modifications.'
      });
    }

    if (transferMutable && hasNonMintApproval) {
      findings.push({
        severity: 'critical',
        category: 'transferability',
        title: 'Post-mint transfer approvals can be modified',
        detail: `canUpdateCollectionApprovals is ${approvalPermState} and the collection has post-mint transfer approvals. The manager can add, remove, or modify transfer rules at any time. Holders cannot rely on the current transfer rules being stable.`,
        recommendation:
          'Permanently lock canUpdateCollectionApprovals if transfer rules should be fixed. For compliance tokens that need ongoing manager control, this may need to stay neutral or permitted — in that case, document the trust assumption.'
      });
    }

    // 3b. Analyze each approval
    for (const approval of approvals) {
      const fromId = approval.fromListId || '';
      const toId = approval.toListId || '';
      const initiatedBy = approval.initiatedByListId || '';
      const criteria = (approval.approvalCriteria || {}) as Record<string, unknown>;
      const approvalId = approval.approvalId || 'unnamed';

      // --- Mint approval checks ---
      if (fromId === 'Mint') {
        // "Mint approval missing overridesFromOutgoingApprovals" moved to
        // review-ux/approvals.ts (review.ux.mint_approval_missing_override).

        // Check for unlimited mint (no amount limits and no transfer limits)
        const amounts = criteria.approvalAmounts as Record<string, unknown> | undefined;
        const transfers = criteria.maxNumTransfers as Record<string, unknown> | undefined;
        const predetermined = criteria.predeterminedBalances as Record<string, unknown> | undefined;

        const hasAmountLimit =
          amounts &&
          ((amounts.overallApprovalAmount && amounts.overallApprovalAmount !== 0n) ||
            (amounts.perInitiatedByAddressApprovalAmount && amounts.perInitiatedByAddressApprovalAmount !== 0n));
        const hasTransferLimit =
          transfers &&
          ((transfers.overallMaxNumTransfers && transfers.overallMaxNumTransfers !== 0n) ||
            (transfers.perInitiatedByAddressMaxNumTransfers && transfers.perInitiatedByAddressMaxNumTransfers !== 0n));
        const hasPredetermined =
          predetermined &&
          ((predetermined.incrementedBalances && Object.keys(predetermined.incrementedBalances as object).length > 0) ||
            (predetermined.manualBalances && (predetermined.manualBalances as unknown[]).length > 0));

        if (!hasAmountLimit && !hasTransferLimit && !hasPredetermined) {
          findings.push({
            severity: 'critical',
            category: 'supply',
            title: `Mint approval "${approvalId}" has no supply limits`,
            detail: 'This token-creation approval has no overallApprovalAmount, no maxNumTransfers, and no predeterminedBalances. Anyone matching the approval can create unlimited new tokens.',
            recommendation:
              'Add approvalAmounts.overallApprovalAmount to cap total supply, or maxNumTransfers.overallMaxNumTransfers to cap the creation count, or use predeterminedBalances for sequential allocation.'
          });
        }

        // "Public mint" info finding removed — approvals are commonly
        // gated via claim plugins, merkle challenges, dynamic stores, or
        // out-of-band allowlists, and flagging All+All as noteworthy
        // produced noise on every template that uses public mints.
      }

      // --- Backing address checks ---
      if (criteria.allowBackedMinting) {
        if (criteria.overridesFromOutgoingApprovals) {
          findings.push({
            severity: 'warning',
            category: 'approval-bug',
            title: `Backing approval "${approvalId}" has overridesFromOutgoingApprovals`,
            detail: 'Smart token backing/unbacking approvals should NOT set overridesFromOutgoingApprovals: true. The backing address is a special system address.',
            recommendation: 'Remove overridesFromOutgoingApprovals from backing/unbacking approval criteria.'
          });
        }
        if (!criteria.mustPrioritize) {
          findings.push({
            severity: 'critical',
            category: 'approval-bug',
            title: `Backing approval "${approvalId}" missing mustPrioritize`,
            detail: 'Smart token backing/unbacking approvals MUST have mustPrioritize: true. Without this, the approval cannot be matched by transfers.',
            recommendation: 'Add mustPrioritize: true to approvalCriteria.'
          });
        }

        // Exact backing address guardrail
        const backingPath = invariants.cosmosCoinBackedPath as Record<string, unknown> | undefined;
        const backingAddr: string | undefined =
          (backingPath?.address as string | undefined) ||
          (col.cosmosCoinWrapperPathsToAdd as { address?: string }[] | undefined)?.[0]?.address;

        if (backingAddr) {
          const fromIsExact = fromId === backingAddr;
          const toIsExact = toId === backingAddr;

          if (fromIsExact && toIsExact) {
            findings.push({
              severity: 'critical',
              category: 'approval-bug',
              title: `Backing approval "${approvalId}" has BOTH sides set to the backing address`,
              detail: `Both fromListId ("${fromId}") and toListId ("${toId}") are the backing address. The chain requires exactly one side to be the backing address (isExactlyAddress). Broad lists ("All", multi-address, inverted) do NOT satisfy this rule — and having both sides set is also rejected.`,
              recommendation:
                'For a deposit (backing) approval set fromListId to the backing address and toListId to the recipient list (e.g. "!Mint:backingAddress"). For a withdrawal (unbacking) approval set toListId to the backing address and fromListId to the sender list.'
            });
          } else if (!fromIsExact && !toIsExact) {
            findings.push({
              severity: 'critical',
              category: 'approval-bug',
              title: `Backing approval "${approvalId}" has NEITHER side set to the backing address exactly`,
              detail: `fromListId is "${fromId}" and toListId is "${toId}". Neither is the bare backing address string ("${backingAddr}"). The chain enforces that exactly one of fromListId or toListId must equal the backing address exactly — broad lists such as "All", inverted lists, or compound lists do NOT satisfy this rule and the chain will reject the approval.`,
              recommendation:
                'Set exactly one side to the bare backing address string. For a deposit approval use fromListId: "<backingAddr>". For a withdrawal approval use toListId: "<backingAddr>".'
            });
          }
        }
      }

      // --- Wrapper address checks (allowSpecialWrapping) ---
      if (criteria.allowSpecialWrapping) {
        if (criteria.overridesFromOutgoingApprovals) {
          findings.push({
            severity: 'warning',
            category: 'approval-bug',
            title: `Wrapping approval "${approvalId}" has overridesFromOutgoingApprovals`,
            detail: 'Smart token wrapping/unwrapping approvals should NOT set overridesFromOutgoingApprovals: true. The wrapper address is a special system address.',
            recommendation: 'Remove overridesFromOutgoingApprovals from wrapping/unwrapping approval criteria.'
          });
        }
        if (!criteria.mustPrioritize) {
          findings.push({
            severity: 'critical',
            category: 'approval-bug',
            title: `Wrapping approval "${approvalId}" missing mustPrioritize`,
            detail: 'Smart token wrapping/unwrapping approvals MUST have mustPrioritize: true. Without this, the approval cannot be matched by transfers.',
            recommendation: 'Add mustPrioritize: true to approvalCriteria.'
          });
        }

        // Check that the collection actually has cosmosCoinWrapperPaths
        const wrapperPaths = col.cosmosCoinWrapperPathsToAdd as { address?: string }[] | undefined;
        if (!wrapperPaths || wrapperPaths.length === 0) {
          findings.push({
            severity: 'warning',
            category: 'approval-bug',
            title: `Wrapping approval "${approvalId}" but collection has no cosmosCoinWrapperPaths`,
            detail: 'allowSpecialWrapping: true is set but the collection has no cosmosCoinWrapperPathsToAdd. The wrapping approval has no wrapper path to target.',
            recommendation: 'Add a cosmosCoinWrapperPathsToAdd entry, or remove allowSpecialWrapping if wrapping is not intended.'
          });
        }
      }

      // --- Dangerous sender/recipient combos ---
      if (fromId === 'Mint' && toId === 'Mint') {
        findings.push({
          severity: 'critical',
          category: 'approval-bug',
          title: `Approval "${approvalId}" sends from Mint TO Mint`,
          detail: 'Mint -> Mint is a no-op. Tokens minted to the Mint address are effectively burned immediately.',
          recommendation: 'Change toListId to "All" or a specific recipient address.'
        });
      }

      // Transfers TO Mint (non-backing context)
      if (toId === 'Mint' && !criteria.allowBackedMinting) {
        findings.push({
          severity: 'warning',
          category: 'approval-design',
          title: `Approval "${approvalId}" allows transfers TO Mint address`,
          detail: 'Sending tokens to the Mint address effectively burns them. This may be intentional (burn mechanism) or a mistake.',
          recommendation: 'If this is a burn approval, document it. Otherwise, change toListId.'
        });
      }

      // "Approval allows FORCEFUL transfers" moved to review-ux/approvals.ts
      // (review.ux.forceful_transfers_allowed + review.ux.forceful_override_mismatch).

      // "Directed transfer channel" info finding removed — self-explanatory
      // from the approval definition itself and produced noise on every
      // smart-token backing/unbacking pair.
    }

    // 3c. Check for backing approval completeness (smart tokens need BOTH)
    const standards = col.standards || [];
    const isSmartToken = standards.some((s) => s.toLowerCase().includes('smart token'));

    // Use the canonical backing address from cosmosCoinBackedPath to
    // identify backing / unbacking approvals structurally. An approval is:
    //   - backing   (deposit)    when allowBackedMinting && fromListId == backingAddr
    //   - unbacking (withdrawal) when allowBackedMinting && toListId   == backingAddr
    // This is more reliable than guessing based on '!' prefixes on the
    // opposite list, which misses valid shapes like `fromListId: 'AllWithoutMint'`.
    const backingAddr = (invariants.cosmosCoinBackedPath as any)?.address as string | undefined;
    const addrMatches = (listId: string | undefined, addr: string | undefined): boolean => {
      if (!listId || !addr) return false;
      if (listId === addr) return true;
      // compound/negated lists containing the backing address also count
      return listId.includes(addr);
    };

    const hasBackingApproval = approvals.some((a) => {
      const crit = a.approvalCriteria as Record<string, unknown> | undefined;
      if (crit?.allowBackedMinting && addrMatches(a.fromListId, backingAddr)) return true;
      if (a.approvalId && /backing/i.test(a.approvalId) && !/unbacking/i.test(a.approvalId)) return true;
      if (a.approvalId && /vault-deposit/i.test(a.approvalId)) return true;
      return false;
    });
    const hasUnbackingApproval = approvals.some((a) => {
      const crit = a.approvalCriteria as Record<string, unknown> | undefined;
      if (crit?.allowBackedMinting && addrMatches(a.toListId, backingAddr)) return true;
      if (a.approvalId && /unbacking/i.test(a.approvalId)) return true;
      if (a.approvalId && /vault-withdraw/i.test(a.approvalId)) return true;
      return false;
    });

    if (isSmartToken || invariants.cosmosCoinBackedPath) {
      if (!hasBackingApproval) {
        findings.push({
          severity: 'critical',
          category: 'smart-token',
          title: 'Missing backing approval (deposit)',
          detail: 'Smart token has cosmosCoinBackedPath but no backing approval (from backingAddress to users with allowBackedMinting: true).',
          recommendation: 'Add a backing approval with fromListId: backingAddress, toListId: !backingAddress, allowBackedMinting: true, mustPrioritize: true.'
        });
      }
      if (!hasUnbackingApproval) {
        findings.push({
          severity: 'critical',
          category: 'smart-token',
          title: 'Missing unbacking approval (withdrawal)',
          detail: 'Smart token has cosmosCoinBackedPath but no unbacking approval (from users to backingAddress with allowBackedMinting: true).',
          recommendation:
            'Add an unbacking approval with fromListId: !Mint:backingAddress, toListId: backingAddress, allowBackedMinting: true, mustPrioritize: true.'
        });
      }
    }

    // ========================================
    // 4. TRANSFERABILITY ANALYSIS
    // ========================================

    // "Soulbound" = no way for tokens to leave their initial minter. Any of
    // the following counts as a transfer path:
    //   - A classic !Mint post-mint transfer approval
    //   - Any non-mint approval that isn't backed minting (free P2P)
    //   - Backed minting approvals (backing/unbacking) — these let users
    //     deposit/withdraw from the backing address, which is a real
    //     transfer path out of the soulbound interpretation
    const hasTransferApproval =
      approvals.some(
        (a) => a.fromListId === '!Mint' || (a.fromListId !== 'Mint' && !(a.approvalCriteria as Record<string, unknown>)?.allowBackedMinting)
      ) || hasBackingApproval || hasUnbackingApproval;

    if (!hasTransferApproval && approvals.length > 0) {
      findings.push({
        severity: 'info',
        category: 'transferability',
        title: 'Tokens are non-transferable / soulbound',
        detail: 'The collection has no approval allowing tokens to move between non-Mint addresses. Tokens cannot leave their initial holder once they are in circulation.',
        recommendation: 'If non-transferable tokens are intentional, this is correct. Otherwise add a free-transfer approval (fromListId: "!Mint") so holders can move tokens to other addresses.'
      });
    }

    // "noForcefulPostMintTransfers not set" and "amount scaling with
    // approver-funded payments" moved to review-ux/approvals.ts
    // (review.ux.forceful_transfers_allowed + review.ux.amount_scaling_with_approver_funds).

    // ========================================
    // 5. INVARIANTS ANALYSIS
    // ========================================

    if (invariants.cosmosCoinBackedPath) {
      // Tolerate both shapes: create Msgs use aliasPathsToAdd, frontend
      // collection store uses aliasPaths. Either one counts.
      const aliasPaths = (col as any).aliasPaths || col.aliasPathsToAdd || [];
      if (aliasPaths.length === 0) {
        findings.push({
          severity: 'info',
          category: 'smart-token',
          title: 'Smart token has no alias paths',
          detail: 'The token has IBC backing but no alias paths for liquidity pool trading.',
          recommendation: 'Add an alias path if you want the token to be swappable on liquidity pools.'
        });
      }
    }

    // ========================================
    // 6. METADATA & STANDARDS CHECKS
    // ========================================

    // Collection metadata URI presence — three valid configurations:
    //   1. `uri` is a real (or `ipfs://METADATA_*` placeholder) URI.
    //   2. The frontend WithDetails shape is present (nested
    //      metadata.metadata with inline name/image/description) and
    //      the auto-apply flow will hoist it to a real URI on submit.
    //   3. `customData` carries inline JSON metadata (the indexer
    //      resolves it stateless via parseInlineCustomData).
    // Only emit the info finding when none of these apply.
    const collectionMeta: any = col.collectionMetadata;
    const collectionUri: string = collectionMeta?.uri || '';
    const collectionCustomData: string = typeof collectionMeta?.customData === 'string' ? collectionMeta.customData : '';
    const collectionInline = collectionMeta?.metadata;
    const hasInlineContent = !!(collectionInline && (collectionInline.name || collectionInline.image || collectionInline.description));
    const isInternalPlaceholder = /^ipfs:\/\/METADATA_[A-Z]/.test(collectionUri);
    const hasInlineCustomData = !!parseInlineCustomData(collectionCustomData);
    if (!hasInlineContent && !isInternalPlaceholder && collectionUri === '' && !hasInlineCustomData) {
      findings.push({
        severity: 'info',
        category: 'metadata',
        title: 'Collection metadata URI is not set',
        detail:
          'collectionMetadata.uri is empty and collectionMetadata.customData does not carry inline JSON metadata. Set the URI to an uploaded IPFS URI, populate inline metadata for the auto-apply flow, or stash inline JSON metadata directly in customData (zero-config alternative to IPFS hosting).',
        recommendation:
          'Pick one: (a) set collectionMetadata.uri to an uploaded IPFS URI, (b) populate collectionMetadata.metadata with name/image/description for the auto-apply flow, or (c) write {"name":"...","image":"...","description":"..."} JSON into collectionMetadata.customData.'
      });
    }

    // Token metadata
    if (col.tokenMetadata) {
      for (const tm of col.tokenMetadata) {
        if (!tm.tokenIds || tm.tokenIds.length === 0) {
          findings.push({
            severity: 'critical',
            category: 'metadata',
            title: 'Token metadata entry missing tokenIds',
            detail: 'Each tokenMetadata entry MUST include a tokenIds array specifying which tokens it applies to.',
            recommendation: 'Add tokenIds: [{ start: "1", end: "N" }] to each tokenMetadata entry.'
          });
        }
      }
    }

    // Approval metadata is typically text-only (name + description).
    // Images on approvals are supported but uncommon — most approval
    // surfaces in the UI render text only. When inline customData
    // carries an image we can detect it; flag as a low-priority
    // suggestion, not a violation.
    for (const appr of approvals) {
      const apprUri: string = appr.uri || '';
      const apprCustomData: string = typeof appr.customData === 'string' ? appr.customData : '';
      if (apprUri === '' && apprCustomData !== '') {
        const inline = parseInlineCustomData(apprCustomData);
        if (inline && inline.image && inline.image !== '') {
          findings.push({
            severity: 'info',
            category: 'metadata',
            title: `Approval "${appr.approvalId}" inline customData carries an image`,
            detail: 'Approval metadata is typically text-only (name + description). Images on approvals are supported but most surfaces render text only.',
            recommendation: 'Consider omitting the image field unless you have a UI surface that renders it.'
          });
        }
      }
    }

    // Standards consistency ("NFT standard but maxSupplyPerId is not 1",
    // "Fungible token with multiple token IDs") moved to review-ux/skills.ts
    // (review.ux.nft_no_supply_cap, review.ux.fungible_multiple_token_ids).

    // ========================================
    // 7. SERIALIZATION CHECKS
    // ========================================

    const numericStringKeys = new Set([
      'start',
      'end',
      'amount',
      'collectionId',
      'totalSupply',
      'decimals',
      'overallApprovalAmount',
      'perInitiatedByAddressApprovalAmount',
      'perToAddressApprovalAmount',
      'perFromAddressApprovalAmount',
      'overallMaxNumTransfers',
      'perInitiatedByAddressMaxNumTransfers',
      'perToAddressMaxNumTransfers',
      'perFromAddressMaxNumTransfers',
      'intervalLength',
      'startTime',
      'maxSupplyPerId',
      'incrementTokenIdsBy',
      'incrementOwnershipTimesBy',
      'durationFromTimestamp',
      'chargePeriodLength'
    ]);

    function checkNumericStrings(obj: unknown, path: string): void {
      if (obj === null || obj === undefined) return;
      if (typeof obj === 'number') {
        findings.push({
          severity: 'critical',
          category: 'serialization',
          title: `Numeric value found at ${path}`,
          detail: `Value ${obj} at ${path} is a JavaScript number. BitBadges requires ALL numeric values as strings.`,
          recommendation: `Change to "${obj}" (string) instead of ${obj} (number).`
        });
        return;
      }
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => checkNumericStrings(item, `${path}[${i}]`));
        return;
      }
      if (typeof obj === 'object') {
        for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
          // Skip off-chain plugin config -- numbers are valid there
          if (key === 'claimConfig' || key === 'plugins' || key === 'publicParams' || key === 'privateParams') continue;
          if (numericStringKeys.has(key)) {
            if (typeof val === 'number') {
              findings.push({
                severity: 'critical',
                category: 'serialization',
                title: `Numeric value for "${key}" at ${path}.${key}`,
                detail: `Value ${val} must be a string "${val}". BitBadges uses string-encoded uint64 everywhere.`,
                recommendation: `Change ${key}: ${val} to ${key}: "${val}".`
              });
            }
          }
          checkNumericStrings(val, `${path}.${key}`);
        }
      }
    }
    checkNumericStrings(col, 'collection');

    // ========================================
    // 8. CONTEXT-SPECIFIC CHECKS
    // ========================================

    if (context.includes('nft') || context.includes('art') || context.includes('pfp') || standards.includes('NFTs')) {
      if (isPermitted(perms.canUpdateTokenMetadata)) {
        findings.push({
          severity: 'warning',
          category: 'context',
          title: 'NFT token metadata is updatable',
          detail: 'For art/PFP NFTs, token metadata should typically be frozen so artwork cannot be changed after mint.',
          recommendation: 'Set canUpdateTokenMetadata to FORBIDDEN for art/PFP collections.'
        });
      }
    }

    if (context.includes('stablecoin') || context.includes('vault') || context.includes('wrapped') || isSmartToken) {
      if (!invariants.cosmosCoinBackedPath) {
        findings.push({
          severity: 'warning',
          category: 'context',
          title: 'Stablecoin/vault without IBC backing path',
          detail: 'This appears to be a stablecoin or vault but has no cosmosCoinBackedPath invariant.',
          recommendation: 'Set invariants.cosmosCoinBackedPath with the correct IBC denom and conversion.'
        });
      }
    }

    if (context.includes('subscription') || standards.includes('Subscriptions')) {
      if (approvalPermState === 'FORBIDDEN') {
        findings.push({
          severity: 'warning',
          category: 'context',
          title: 'Subscription with frozen approvals',
          detail: 'Subscriptions may need approval updates for price/duration changes. Approval permission is FORBIDDEN.',
          recommendation: 'Consider using PERMITTED for canUpdateCollectionApprovals if pricing may change.'
        });
      }
    }

    // ========================================
    // 9. DEFAULT BALANCES CHECKS
    // ========================================
    const defaultBalances = col.defaultBalances as Record<string, unknown> | undefined;
    if (defaultBalances) {
      if (!defaultBalances.autoApproveAllIncomingTransfers) {
        const hasMint = approvals.some((a) => a.fromListId === 'Mint');
        if (hasMint) {
          findings.push({
            severity: 'critical',
            category: 'approval-bug',
            title: 'Recipients cannot receive newly created tokens',
            detail: 'defaultBalances.autoApproveAllIncomingTransfers is not true, but the collection has token creation approvals (fromListId: "Mint"). Recipients will not be able to receive the tokens unless they first configure incoming approvals themselves.',
            recommendation: 'Set defaultBalances.autoApproveAllIncomingTransfers: true.'
          });
        }
      }
    }
    // "autoApproveAllIncomingTransfers missing on mint collections
    // without defaultBalances set" moved to review-ux/approvals.ts
    // (review.ux.auto_approve_disabled_on_mintable).

    // ========================================
    // BUILD SUMMARY
    // ========================================

    const critical = findings.filter((f) => f.severity === 'critical').length;
    const warning = findings.filter((f) => f.severity === 'warning').length;
    const info = findings.filter((f) => f.severity === 'info').length;

    let verdict: string;
    if (critical > 0) {
      verdict = `CRITICAL: ${critical} critical issue(s) found. DO NOT deploy without fixing these.`;
    } else if (warning > 0) {
      verdict = `WARNING: ${warning} warning(s) found. Review before deploying.`;
    } else {
      verdict = 'PASS: No critical or warning issues found.';
    }

    // Permission summary
    const permissionSummary: Record<string, string> = {};
    for (const p of permNames) {
      permissionSummary[p] = permissionState(perms[p]);
    }

    // Approval summary
    const approvalSummary = approvals.map((a) => {
      const crit = (a.approvalCriteria || {}) as Record<string, unknown>;
      const flags: string[] = [];
      if (crit.allowBackedMinting) flags.push('IBC-backed');
      if (crit.mustPrioritize) flags.push('must-prioritize');
      if (crit.overridesFromOutgoingApprovals) flags.push('overrides-outgoing');
      if (crit.coinTransfers) flags.push('payment-required');
      if (crit.mustOwnTokens) flags.push('ownership-gated');
      if (crit.merkleChallenges) flags.push('merkle-gated');
      if (crit.predeterminedBalances) flags.push('predetermined');
      const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
      return `${a.approvalId}: ${a.fromListId} -> ${a.toListId} (by ${a.initiatedByListId})${flagStr}`;
    });

    return {
      success: true,
      findings: findings.sort((a, b) => {
        const order: Record<AuditSeverity, number> = { critical: 0, warning: 1, info: 2 };
        return order[a.severity] - order[b.severity];
      }),
      summary: { critical, warning, info, verdict },
      permissionSummary,
      approvalSummary
    };
  } catch (error) {
    return {
      success: false,
      findings: [],
      summary: { critical: 0, warning: 0, info: 0, verdict: 'ERROR' },
      permissionSummary: {},
      approvalSummary: [],
      error: `Audit failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
