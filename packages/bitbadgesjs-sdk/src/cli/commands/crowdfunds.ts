/**
 * `bitbadges-cli crowdfunds` — end-user surface for the Crowdfund standard.
 * Mirrors the FE's `CrowdfundView`.
 *
 * `crowdfund` (singular) is retained as a hidden alias for backwards compat
 * with scripts that pre-date the rename. New code / docs should use the
 * plural form, which matches every other standards command (`bb auctions`,
 * `bb credit-tokens`, `bb prediction-markets`, etc).
 */

import { Command } from 'commander';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';
import { emit, emitError } from '../utils/envelope.js';
import {
  doesCollectionFollowCrowdfundProtocol,
  validateCrowdfundCollection,
  extractCrowdfundDetails,
  deriveCrowdfundStatus,
  buildContributeCrowdfundTx,
  buildWithdrawCrowdfundTx,
  buildRefundCrowdfundMsg
} from '../../core/crowdfunds.js';
import { BitBadgesCollection } from '../../api-indexer/BitBadgesCollection.js';
import { BigIntify } from '../../common/string-numbers.js';

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

interface NetworkFlags { testnet?: boolean; local?: boolean; url?: string; apiKey?: string; }
interface OutputFlags { outputFile?: string; condensed?: boolean; }

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL')
    .option('--api-key <key>', 'BitBadges API key');
}
function addOutputFlags(cmd: Command): Command {
  return cmd.option('--output-file <path>', 'Write to file').option('--condensed', 'Single-line JSON', false);
}
async function callApi(method: 'GET' | 'POST', path: string, opts: NetworkFlags, body?: unknown): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  const raw = res?.collection ?? res;
  if (!raw) return raw;
  try { return new BitBadgesCollection(raw).convert(BigIntify); } catch { return raw; }
}
function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  const result = validateCrowdfundCollection(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid Crowdfund (failed in ${ctx}):\n`);
    for (const e of result.errors) process.stderr.write(`  - ${e}\n`);
    if (result.warnings.length > 0) {
      process.stderr.write('Warnings:\n');
      for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
    }
    process.exit(2);
  }
  if (result.warnings.length > 0 && process.env.BB_QUIET !== '1') {
    process.stderr.write(`Warnings for ${ctx}:\n`);
    for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
  }
}

async function readRaised(collection: any, opts: NetworkFlags, details: any): Promise<bigint> {
  // Raised = how many token-2 the crowdfunder owns
  try {
    const balances = await callApi(
      'POST',
      `/collection/${encodeURIComponent(collection.collectionId ?? collection._docId)}/balance/${encodeURIComponent(details.crowdfunderAddress)}`,
      opts,
      {}
    );
    const userBalances = balances?.balance?.balances ?? balances?.balances ?? [];
    let total = 0n;
    for (const b of userBalances) {
      for (const r of b.tokenIds ?? []) {
        if (BigInt(r.start) <= 2n && BigInt(r.end) >= 2n) total += BigInt(b.amount);
      }
    }
    return total;
  } catch {
    return 0n;
  }
}

export const crowdfundsCommand = new Command('crowdfunds')
  .alias('crowdfund')
  .description(
    'End-user surface for the Crowdfund standard — list / show / status / contribute / withdraw / refund. Build new via `bb build crowdfund`.'
  );

addOutputFlags(
  addNetworkFlags(
    crowdfundsCommand
      .command('list')
      .description('Browse Crowdfund collections.')
      .option('--mine <address>', 'Restrict to crowdfunds initiated by this crowdfunder address')
      .option('--open', 'Only return active (not funded/expired) crowdfunds', false)
  )
).action(async (opts: NetworkFlags & OutputFlags & { mine?: string; open?: boolean }) => {
  try {
    const res = await callApi('POST', '/browse', opts, { type: 'collections', category: 'crowdfund' });
    const all: any[] = res?.collections?.crowdfund ?? res?.collections ?? [];
    // BigIntify each row before validation — `validateCrowdfundCollection`
    // checks tokenId===1n / start===2n etc., which silently fails when
    // the indexer returns string token ids. Without this conversion the
    // list filter would drop every row.
    const normalized = all.map((c: any) => {
      try { return new BitBadgesCollection(c).convert(BigIntify); } catch { return c; }
    });
    let collections = normalized.filter((c: any) => doesCollectionFollowCrowdfundProtocol(c));
    if (opts.mine) {
      const bb1 = requireBb1Address(opts.mine, '--mine');
      collections = collections.filter((c: any) => extractCrowdfundDetails(c.collectionApprovals)?.crowdfunderAddress === bb1);
    }
    if (opts.open) {
      // Deadline-only filter — we don't read per-collection balances at
      // list scope. 'active' = deadline-in-future; everything past
      // deadline is either funded or expired-refunding (need raised).
      const now = BigInt(Date.now());
      collections = collections.filter((c: any) => {
        const d = extractCrowdfundDetails(c.collectionApprovals);
        return d && d.deadlineTime > now;
      });
    }
    const summary = collections.map((c: any) => {
      const d = extractCrowdfundDetails(c.collectionApprovals)!;
      return {
        collectionId: String(c.collectionId ?? c._docId ?? ''),
        crowdfunderAddress: d.crowdfunderAddress,
        depositDenom: d.depositDenom,
        goalAmount: d.goalAmount.toString(),
        deadlineTime: d.deadlineTime.toString(),
        // Deadline-only fallback status — `crowdfund show <id>` returns the
        // full status with raised balance.
        status: d.deadlineTime > BigInt(Date.now()) ? 'active' : 'expired-or-funded'
      };
    });
    emit(summary, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    crowdfundsCommand
      .command('show')
      .description('Render a Crowdfund collection — goal / raised / deadline / status.')
      .argument('<collection-id>', 'Crowdfund collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'crowdfund show');
    const details = extractCrowdfundDetails(collection.collectionApprovals)!;
    const raised = await readRaised(collection, opts, details);
    const status = deriveCrowdfundStatus(details.deadlineTime, raised, details.goalAmount);
    emit({
      collectionId: String(collectionId),
      crowdfunderAddress: details.crowdfunderAddress,
      depositDenom: details.depositDenom,
      goalAmount: details.goalAmount.toString(),
      raised: raised.toString(),
      deadlineTime: details.deadlineTime.toString(),
      mintEscrowAddress: collection.mintEscrowAddress ?? null,
      status
    }, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    crowdfundsCommand
      .command('status')
      .description('Resolve current status: active / funded / goal-met-pending-settle / expired-refunding.')
      .argument('<collection-id>', 'Crowdfund collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'crowdfund status');
    const details = extractCrowdfundDetails(collection.collectionApprovals)!;
    const raised = await readRaised(collection, opts, details);
    emit({
      collectionId: String(collectionId),
      raised: raised.toString(),
      goal: details.goalAmount.toString(),
      status: deriveCrowdfundStatus(details.deadlineTime, raised, details.goalAmount)
    }, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    crowdfundsCommand
      .command('contribute')
      .description('Emit a 2-msg tx that contributes <amount> to the crowdfund. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Crowdfund collection ID')
      .requiredOption('--creator <address>', 'Contributor address (bb1.../0x — auto-normalized)')
      .requiredOption('--amount <n>', 'Amount to contribute in base units (denom is the crowdfund\'s configured deposit denom)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; amount: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'crowdfund contribute');
    const details = extractCrowdfundDetails(collection.collectionApprovals)!;
    const tx = buildContributeCrowdfundTx(creator, String(collectionId), details, BigInt(opts.amount));
    // Single-msg per the helper output; bb deploy will accept either shape.
    emit(tx.messages[0], opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    crowdfundsCommand
      .command('withdraw')
      .description('Crowdfunder-only: emit the 2-msg withdraw tx (drain escrow + burn progress tokens) when goal is met. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Crowdfund collection ID')
      .requiredOption('--creator <address>', 'Crowdfunder address (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'crowdfund withdraw');
    const details = extractCrowdfundDetails(collection.collectionApprovals)!;
    if (creator !== details.crowdfunderAddress) {
      process.stderr.write(`Warning: --creator ${creator} does not match crowdfunder ${details.crowdfunderAddress}. The on-chain approval will reject this tx.\n`);
    }
    const raised = await readRaised(collection, opts, details);
    if (raised < details.goalAmount) {
      process.stderr.write(`Warning: raised (${raised}) < goal (${details.goalAmount}). Withdraw will be rejected — wait for goal to be met.\n`);
    }
    // Find the optional burn approval used for token-2 burn (FE: `fromListId === '!Mint' && toListId === burn && no coinTransfers`)
    const burnApprovalId = (collection.collectionApprovals ?? []).find(
      (a: any) =>
        a.fromListId === '!Mint' &&
        a.toListId === BURN_ADDRESS &&
        (a.approvalCriteria?.coinTransfers?.length ?? 0) === 0
    )?.approvalId;
    const tx = buildWithdrawCrowdfundTx(creator, String(collectionId), details, raised, burnApprovalId);
    emit(tx, opts);
  } catch (err) { emitError(err); }
});

addOutputFlags(
  addNetworkFlags(
    crowdfundsCommand
      .command('refund')
      .description('Contributor refund (after deadline if goal not met): emit single MsgTransferTokens. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Crowdfund collection ID')
      .requiredOption('--creator <address>', 'Contributor address (bb1.../0x — auto-normalized)')
      .requiredOption('--amount <n>', 'Amount to refund in base units')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; amount: string }) => {
  try {
    const creator = requireBb1Address(opts.creator, '--creator');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'crowdfund refund');
    const details = extractCrowdfundDetails(collection.collectionApprovals)!;
    const now = BigInt(Date.now());
    if (now <= details.deadlineTime) {
      process.stderr.write(`Warning: deadline not yet passed (deadline=${details.deadlineTime}, now=${now}). Refund will be rejected.\n`);
    }
    emit(buildRefundCrowdfundMsg(creator, String(collectionId), details, BigInt(opts.amount)), opts);
  } catch (err) { emitError(err); }
});

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build crowdfund ...` (the canonical builder) instead.
