/**
 * Interactive walkthrough for `bb cli build transfer`.
 *
 * Prompts the user for collection / from / to, fetches the relevant
 * collection + sender outgoing approvals + recipient incoming
 * approvals, displays them as a numbered list, and walks through
 * picking `prioritizedApprovals`, enabling per-level only-check
 * scopes, opting into `precalculateBalancesFromApproval` when an
 * approval defines `predeterminedBalances`, and (when not
 * precalculated) specifying transfer amount + tokenIds.
 *
 * Output: a `/tokenization.MsgTransferTokens` payload, identical
 * shape to the existing `build_transfer` MCP tool, that flows
 * through the same `emit()` pipeline (auto-validate, --simulate,
 * --deploy-with-burner / --deploy-with-browser).
 */

import * as readline from 'readline';
import { getCollections, getBalance } from '../../builder/sdk/apiClient.js';
import { ensureBb1 } from '../../builder/sdk/addressUtils.js';

const MAX_UINT64 = '18446744073709551615';
const FOREVER = [{ start: '1', end: MAX_UINT64 }];

export interface TransferWalkthroughInput {
  collectionId?: string;
  from?: string;
  to?: string;
  amount?: string;
  tokenIds?: string;
  /**
   * Skip every prompt. Emits the transfer with no prioritizedApprovals
   * (chain picks the matching approval itself), no precalculation,
   * default amount=1, default tokenIds=all valid. Use for scripts and
   * CI; humans should leave this off.
   */
  yes?: boolean;
}

export function isYes(input: string): boolean {
  const v = input.trim().toLowerCase();
  return v === 'y' || v === 'yes';
}

interface ApprovalCandidate {
  level: 'collection' | 'outgoing' | 'incoming';
  approvalId: string;
  approverAddress: string;
  version: string;
  fromListId: string;
  toListId: string;
  initiatedByListId: string;
  hasPredeterminedBalances: boolean;
  raw: any;
}

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise<string>((resolve) => {
    rl.question(question, (a) => {
      rl.close();
      resolve(a.trim());
    });
  });
}

export function toCandidate(level: 'collection' | 'outgoing' | 'incoming', approverAddress: string, raw: any): ApprovalCandidate {
  const criteria = (raw.approvalCriteria as Record<string, any>) || {};
  return {
    level,
    approvalId: String(raw.approvalId ?? ''),
    approverAddress,
    version: String(raw.version ?? '0'),
    fromListId: String(raw.fromListId ?? ''),
    toListId: String(raw.toListId ?? ''),
    initiatedByListId: String(raw.initiatedByListId ?? ''),
    hasPredeterminedBalances: !!criteria.predeterminedBalances,
    raw
  };
}

export function summarize(c: ApprovalCandidate): string {
  const tags: string[] = [];
  if (c.hasPredeterminedBalances) tags.push('predetermined');
  const criteria = (c.raw.approvalCriteria as Record<string, any>) || {};
  if (criteria.allowBackedMinting) tags.push('backed');
  if (Array.isArray(criteria.coinTransfers) && criteria.coinTransfers.length > 0) tags.push('payment');
  if (Array.isArray(criteria.mustOwnTokens) && criteria.mustOwnTokens.length > 0) tags.push('must-own');
  const tagSuffix = tags.length ? ` [${tags.join(', ')}]` : '';
  return `"${c.approvalId}" v${c.version}: from=${c.fromListId} to=${c.toListId} init=${c.initiatedByListId}${tagSuffix}`;
}

export function parseTokenIdSpec(spec: string): Array<{ start: string; end: string }> {
  // Accept "all", "1-5", "3", "1-5,7-9,11"
  const trimmed = spec.trim().toLowerCase();
  if (!trimmed || trimmed === 'all') return FOREVER;
  return trimmed.split(',').map((part) => {
    const piece = part.trim();
    if (piece.includes('-')) {
      const [a, b] = piece.split('-').map((s) => s.trim());
      return { start: a, end: b };
    }
    return { start: piece, end: piece };
  });
}

export function parseIndexList(input: string, max: number): number[] {
  return input
    .split(',')
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((n) => !isNaN(n) && n >= 0 && n < max);
}

export interface TransferWalkthroughResult {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: {
    creator: string;
    collectionId: string;
    transfers: any[];
  };
}

export async function runTransferWalkthrough(input: TransferWalkthroughInput): Promise<TransferWalkthroughResult> {
  const collectionId = input.collectionId || (await prompt('Collection ID: '));
  if (!collectionId) throw new Error('Collection ID is required');

  const fromRaw = input.from || (await prompt('From address (bb1... / 0x... / "Mint"): '));
  if (!fromRaw) throw new Error('From address is required');
  const from = fromRaw === 'Mint' ? 'Mint' : ensureBb1(fromRaw);

  const toRaw = input.to || (await prompt('To address (bb1... / 0x...): '));
  if (!toRaw) throw new Error('To address is required');
  if (toRaw === 'Mint') throw new Error('To address cannot be "Mint" — that\'s only valid as the From address.');
  const to = ensureBb1(toRaw);

  // ── Fetch collection ─────────────────────────────────────────────
  process.stderr.write(`\nFetching collection ${collectionId}...\n`);
  const collResp = await getCollections({
    collectionsToFetch: [{ collectionId, metadataToFetch: { uris: [] } }]
  });
  if (!collResp.success || !collResp.data?.collections?.[0]) {
    throw new Error(collResp.error || `Collection ${collectionId} not found`);
  }
  const collection = collResp.data.collections[0] as any;
  const validBadgeIds = (collection.validBadgeIds as Array<{ start: string; end: string }>) || [{ start: '1', end: '1' }];
  const collectionApprovals = (collection.collectionApprovals as any[]) || [];

  // ── Fetch user-level approvals ───────────────────────────────────
  process.stderr.write(`Fetching sender outgoing + recipient incoming approvals...\n`);
  const outgoingApprovals: any[] = [];
  if (from !== 'Mint') {
    const sb = await getBalance(collectionId, from);
    if (sb.success) {
      const list = (sb.data?.balance as any)?.outgoingApprovals;
      if (Array.isArray(list)) outgoingApprovals.push(...list);
    }
  }
  const incomingApprovals: any[] = [];
  const rb = await getBalance(collectionId, to);
  if (rb.success) {
    const list = (rb.data?.balance as any)?.incomingApprovals;
    if (Array.isArray(list)) incomingApprovals.push(...list);
  }

  // ── Build numbered candidate list ────────────────────────────────
  const candidates: ApprovalCandidate[] = [
    ...collectionApprovals.map((a) => toCandidate('collection', '', a)),
    ...outgoingApprovals.map((a) => toCandidate('outgoing', from, a)),
    ...incomingApprovals.map((a) => toCandidate('incoming', to, a))
  ];

  process.stderr.write('\n── Approvals available ─────────────────────────────\n');
  if (candidates.length === 0) {
    process.stderr.write('  (none — transfer will fail unless an approval is added first)\n');
  } else {
    let lastLevel = '';
    candidates.forEach((c, i) => {
      if (c.level !== lastLevel) {
        process.stderr.write(`\n  ${c.level.toUpperCase()} approvals:\n`);
        lastLevel = c.level;
      }
      process.stderr.write(`    ${(i + 1).toString().padStart(2)}. ${summarize(c)}\n`);
    });
  }
  process.stderr.write('\n');

  // ── Pick prioritized approvals ───────────────────────────────────
  let prioritizedApprovals: Array<{ approvalId: string; approvalLevel: string; approverAddress: string; version: string }> = [];
  let onlyCheckPrioritizedCollectionApprovals = false;
  let onlyCheckPrioritizedOutgoingApprovals = false;
  let onlyCheckPrioritizedIncomingApprovals = false;

  if (!input.yes && candidates.length > 0) {
    const pickStr = await prompt('Pick prioritized approvals (comma-separated indices, blank to skip): ');
    if (pickStr) {
      const picks = parseIndexList(pickStr, candidates.length);
      prioritizedApprovals = picks.map((i) => ({
        approvalId: candidates[i].approvalId,
        approvalLevel: candidates[i].level,
        approverAddress: candidates[i].approverAddress,
        version: candidates[i].version
      }));

      // For each level that has at least one priority pick, ask whether
      // to restrict matching to ONLY the prioritized set on that level.
      // Default: no — chain still falls through to non-prioritized
      // approvals if the prioritized one doesn't apply.
      const pickedLevels = new Set(picks.map((i) => candidates[i].level));
      if (pickedLevels.has('collection')) {
        const ans = await prompt('Only check the prioritized COLLECTION approvals? [y/N] ');
        onlyCheckPrioritizedCollectionApprovals = isYes(ans);
      }
      if (pickedLevels.has('outgoing')) {
        const ans = await prompt('Only check the prioritized OUTGOING approvals? [y/N] ');
        onlyCheckPrioritizedOutgoingApprovals = isYes(ans);
      }
      if (pickedLevels.has('incoming')) {
        const ans = await prompt('Only check the prioritized INCOMING approvals? [y/N] ');
        onlyCheckPrioritizedIncomingApprovals = isYes(ans);
      }
    }
  }

  // ── Heads-up warnings for picked approvals ─────────────────────
  // Surface payment / must-own / backed flags BEFORE the precalc and
  // amount prompts, so the user knows what side conditions the
  // approval will impose on this transfer.
  if (!input.yes && prioritizedApprovals.length > 0) {
    const warnings: string[] = [];
    for (const p of prioritizedApprovals) {
      const c = candidates.find((c) => c.approvalId === p.approvalId && c.level === p.approvalLevel);
      if (!c) continue;
      const criteria = (c.raw.approvalCriteria as Record<string, any>) || {};
      const cts = Array.isArray(criteria.coinTransfers) ? criteria.coinTransfers : [];
      for (const ct of cts) {
        const coins = Array.isArray(ct.coins) ? ct.coins : [];
        const desc = coins.map((co: any) => `${co.amount} ${co.denom}`).join(' + ');
        if (desc) warnings.push(`"${c.approvalId}" requires payment of ${desc} to ${ct.to || '<initiator>'}`);
      }
      if (Array.isArray(criteria.mustOwnTokens) && criteria.mustOwnTokens.length > 0) {
        warnings.push(`"${c.approvalId}" requires the initiator to own tokens from ${criteria.mustOwnTokens.length} prerequisite collection(s)`);
      }
    }
    if (warnings.length > 0) {
      process.stderr.write('\nHeads up — picked approvals impose:\n');
      for (const w of warnings) process.stderr.write(`  • ${w}\n`);
      process.stderr.write('\n');
    }
  }

  // ── Precalculation ──────────────────────────────────────────────
  // If any prioritized approval has predeterminedBalances, offer to
  // delegate balance computation to the chain via
  // precalculateBalancesFromApproval. With it set, the transfer's
  // explicit `balances` field is omitted (chain computes from the
  // approval's predetermined rule).
  //
  // Display index is renumbered 1..N within the precalc list (NOT the
  // candidate-list index from the earlier display) — keeps the user's
  // typing-target visible right above the prompt.
  const precalcCandidates = prioritizedApprovals
    .map((p) => ({ p, c: candidates.find((c) => c.approvalId === p.approvalId && c.level === p.approvalLevel) }))
    .filter((x) => x.c?.hasPredeterminedBalances);

  let precalculateBalancesFromApproval: any = undefined;
  if (precalcCandidates.length > 0 && !input.yes) {
    process.stderr.write('\nThe following prioritized approvals have predetermined balances:\n');
    precalcCandidates.forEach((x, i) => {
      process.stderr.write(`  ${i + 1}. "${x.p.approvalId}" (${x.p.approvalLevel})\n`);
    });
    const which = await prompt('Use which one for precalculation? (index, blank=skip): ');
    const i = parseInt(which.trim(), 10) - 1;
    const target = precalcCandidates[i];
    if (target) {
      precalculateBalancesFromApproval = {
        approvalId: target.p.approvalId,
        approvalLevel: target.p.approvalLevel,
        approverAddress: target.p.approverAddress,
        version: target.p.version
      };
      // scalingMultiplier — when the predetermined approval defines a
      // per-step amount and the user wants to consume N steps at once.
      // The other PrecalculationOptions (overrideTimestamp,
      // tokenIdsOverride) are advanced and stay opt-in via raw JSON
      // edit for v1.
      const scaleStr = await prompt('Scaling multiplier (how many predetermined steps to consume in this tx) [1]: ');
      const scaleTrimmed = scaleStr.trim();
      if (scaleTrimmed && scaleTrimmed !== '1') {
        precalculateBalancesFromApproval.precalculationOptions = { scalingMultiplier: scaleTrimmed };
      }
    }
  }

  // ── Balances (only when not precalculated) ──────────────────────
  let balances: Array<{ amount: string; tokenIds: any[]; ownershipTimes: any[] }> | undefined;
  if (!precalculateBalancesFromApproval) {
    const amount = input.amount ?? (input.yes ? '1' : (await prompt('Amount per recipient [1]: ')) || '1');
    const tokenSpec = input.tokenIds ?? (input.yes ? 'all' : (await prompt('Token IDs (e.g. 1-5, 1,3,5, or "all" for collection valid range) [all]: ')) || 'all');
    const tokenIds = tokenSpec === 'all' ? validBadgeIds : parseTokenIdSpec(tokenSpec);
    balances = [{ amount, tokenIds, ownershipTimes: FOREVER }];
  }

  // ── Build the Transfer ──────────────────────────────────────────
  // Always emit prioritizedApprovals as an array (use [] when empty) —
  // the validator warns on omitted prioritizedApprovals because the
  // chain treats missing-vs-empty subtly differently in some paths.
  const transfer: Record<string, unknown> = {
    from,
    toAddresses: [to],
    prioritizedApprovals,
    ...(balances ? { balances } : {})
  };
  if (onlyCheckPrioritizedCollectionApprovals) transfer.onlyCheckPrioritizedCollectionApprovals = true;
  if (onlyCheckPrioritizedOutgoingApprovals) transfer.onlyCheckPrioritizedOutgoingApprovals = true;
  if (onlyCheckPrioritizedIncomingApprovals) transfer.onlyCheckPrioritizedIncomingApprovals = true;
  if (precalculateBalancesFromApproval) transfer.precalculateBalancesFromApproval = precalculateBalancesFromApproval;

  // Creator: minting txs are signed by the recipient (the new owner);
  // every other transfer is signed by the sender.
  const creator = from === 'Mint' ? to : from;

  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId,
      transfers: [transfer]
    }
  };
}
