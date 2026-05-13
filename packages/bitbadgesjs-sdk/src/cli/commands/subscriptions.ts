/**
 * `bitbadges-cli subscriptions` — end-user surface for the Subscriptions
 * standard, mirroring the frontend's `SubscriptionLayout`.
 *
 *   subscriptions list             — list all tiers in a collection
 *   subscriptions status           — per-tier subscription state for an address
 *   subscriptions claim            — single MsgTransferTokens via the faucet (first-period mint)
 *   subscriptions enable-renewal   — single MsgUpdateUserApprovals (add recurring consent)
 *   subscriptions cancel           — single MsgUpdateUserApprovals (remove recurring consent)
 *   subscriptions subscribe        — multi-msg: claim + enable-renewal in one wrapper
 *   subscriptions build            — alias for `bb build subscription`
 *
 * Every subcommand validates conformance via the SDK validators before
 * emitting anything. enable-renewal / cancel additionally fetch the user's
 * existing incoming approvals so we can preserve unrelated recurring
 * approvals (multi-tier subscribers + cross-collection consent).
 */

import { Command } from 'commander';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';
import {
  doesCollectionFollowSubscriptionProtocol,
  isSubscriptionFaucetApproval,
  isUserRecurringApproval,
  getNextChargeTime,
  userRecurringApproval
} from '../../core/subscriptions.js';
import { UintRangeArray } from '../../core/uintRanges.js';
import { BitBadgesCollection } from '../../api-indexer/BitBadgesCollection.js';
import { BigIntify } from '../../common/string-numbers.js';

interface NetworkFlags {
  testnet?: boolean;
  local?: boolean;
  url?: string;
  apiKey?: string;
}

interface OutputFlags {
  outputFile?: string;
  condensed?: boolean;
}

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL (overrides --testnet/--local/config)')
    .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)');
}

function addOutputFlags(cmd: Command): Command {
  return cmd
    .option('--output-file <path>', 'Write output to file instead of stdout')
    .option('--condensed', 'Emit single-line JSON instead of pretty-printed', false);
}

function emit(result: unknown, opts: OutputFlags): void {
  const formatted = opts.condensed
    ? JSON.stringify(result, jsonBigIntReplacer)
    : JSON.stringify(result, jsonBigIntReplacer, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else {
    process.stdout.write(formatted + '\n');
  }
}

/**
 * Bigint → string replacer. `userRecurringApproval` returns a class-instance-flavored
 * object that contains bigints, so we serialize through this so the output is
 * JSON-stringify-safe. Chain expects strings for uint64 anyway.
 */
function jsonBigIntReplacer(_key: string, value: unknown): unknown {
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function emitError(err: unknown): never {
  const e = err as { message?: string; response?: unknown; hint?: string };
  if (e?.response !== undefined) process.stderr.write(JSON.stringify(e.response, null, 2) + '\n');
  else process.stderr.write(`Error: ${e?.message ?? String(err)}\n`);
  if (e?.hint) process.stderr.write(`Hint: ${e.hint}\n`);
  process.exit(1);
}

async function callApi(
  method: 'GET' | 'POST',
  path: string,
  opts: NetworkFlags,
  body?: unknown
): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  const raw = res?.collection ?? res;
  if (!raw) return raw;
  // Indexer ships uint64s as strings; validators below expect bigints.
  // Convert at the boundary so downstream protocol checks compare like-for-like.
  try {
    return new BitBadgesCollection(raw).convert(BigIntify);
  } catch {
    return raw;
  }
}

async function fetchUserBalances(collectionId: string, address: string, opts: NetworkFlags): Promise<any> {
  // Indexer route: GET /api/v0/collection/:collectionId/:tokenId/balance/:address.
  // For the per-collection doc (includes incomingApprovals), POST .../balance/:address.
  const path = `/collection/${encodeURIComponent(collectionId)}/balance/${encodeURIComponent(address)}`;
  return callApi('POST', path, opts, {});
}

function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  if (!doesCollectionFollowSubscriptionProtocol(collection)) {
    process.stderr.write(
      `Error: collection is not a valid Subscriptions collection (failed in ${ctx}). Pass a collection whose standards include "Subscriptions".\n`
    );
    process.exit(2);
  }
}

function listFaucets(collection: any): any[] {
  return (collection.collectionApprovals ?? []).filter((a: any) => isSubscriptionFaucetApproval(a));
}

function pickFaucet(faucets: any[], tier: string | undefined, ctx: string): any {
  if (faucets.length === 0) {
    process.stderr.write(`Error: collection has no subscription faucet approvals (${ctx}).\n`);
    process.exit(2);
  }
  if (!tier) {
    if (faucets.length > 1) {
      process.stderr.write(
        `Error: collection has ${faucets.length} tiers; pass --tier <approvalId> to pick one. Tiers:\n`
      );
      for (const f of faucets) process.stderr.write(`  - ${f.approvalId}\n`);
      process.exit(2);
    }
    return faucets[0];
  }
  const match = faucets.find((f: any) => f.approvalId === tier);
  if (!match) {
    process.stderr.write(`Error: no faucet approval with id "${tier}". Available:\n`);
    for (const f of faucets) process.stderr.write(`  - ${f.approvalId}\n`);
    process.exit(2);
  }
  return match;
}

const MAX_UINT64 = '18446744073709551615';

interface MsgTransferTokensEnvelope {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

function buildClaimMsg(creator: string, collectionId: string, faucetApproval: any): MsgTransferTokensEnvelope {
  // The faucet's predetermined balances determine what gets minted; we use
  // precalculateBalancesFromApproval so the chain reads off the approval's
  // own incrementedBalances + recurringOwnershipTimes.
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: 'Mint',
          toAddresses: [creator],
          balances: [],
          precalculateBalancesFromApproval: {
            approvalId: faucetApproval.approvalId,
            approvalLevel: 'collection',
            approverAddress: '',
            version: '0'
          },
          prioritizedApprovals: [
            {
              approvalId: faucetApproval.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: '0'
            }
          ],
          onlyCheckPrioritizedCollectionApprovals: true,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  };
}

interface MsgUpdateUserApprovalsEnvelope {
  typeUrl: '/tokenization.MsgUpdateUserApprovals';
  value: Record<string, unknown>;
}

function buildUpdateApprovalsMsg(
  creator: string,
  collectionId: string,
  incomingApprovals: unknown[]
): MsgUpdateUserApprovalsEnvelope {
  return {
    typeUrl: '/tokenization.MsgUpdateUserApprovals',
    value: {
      creator,
      collectionId: String(collectionId),
      updateIncomingApprovals: true,
      incomingApprovals
    }
  };
}

// ── subscriptions (parent) ────────────────────────────────────────────────

export const subscriptionsCommand = new Command('subscriptions').description(
  'End-user surface for the Subscriptions standard — list tiers, check status, claim, enable / cancel renewal, build.'
);

// ── subscriptions list ───────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    subscriptionsCommand
      .command('list')
      .description('List all subscription tiers in a collection (one per faucet approval).')
      .argument('<collection-id>', 'Subscription collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'subscriptions list');
    const faucets = listFaucets(collection);
    const tiers = faucets.map((f: any) => {
      const coinTransfer = f.approvalCriteria?.coinTransfers?.[0];
      const incremented = f.approvalCriteria?.predeterminedBalances?.incrementedBalances;
      return {
        approvalId: f.approvalId,
        recipient: coinTransfer?.to ?? '',
        coins: (coinTransfer?.coins ?? []).map((c: any) => ({
          denom: c.denom,
          amount: BigInt(c.amount).toString()
        })),
        intervalMs: BigInt(incremented?.durationFromTimestamp ?? 0).toString(),
        tokenIds: (f.tokenIds ?? []).map((r: any) => ({
          start: BigInt(r.start).toString(),
          end: BigInt(r.end).toString()
        }))
      };
    });
    emit({ collectionId: String(collectionId), tiers }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── subscriptions status ─────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    subscriptionsCommand
      .command('status')
      .description('Per-tier subscription state for an address: is-subscribed, has-future-approval, next charge time.')
      .argument('<collection-id>', 'Subscription collection ID')
      .requiredOption('--address <a>', 'Address to query (bb1.../0x — auto-normalized)')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags & { address: string }) => {
  try {
    const address = requireBb1Address(opts.address, '--address');
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'subscriptions status');
    const faucets = listFaucets(collection);

    let balances: any = null;
    try {
      balances = await fetchUserBalances(String(collectionId), address, opts);
    } catch {
      // Address may not have a balance doc yet — treat as zero state.
    }
    const userBalances = balances?.balance?.balances ?? balances?.balances ?? [];
    const userIncomingApprovals = balances?.balance?.incomingApprovals ?? balances?.incomingApprovals ?? [];
    const now = BigInt(Date.now());

    const tiers = faucets.map((faucet: any) => {
      const tokenId = BigInt(faucet.tokenIds?.[0]?.start ?? 1);
      const balanceForToken = userBalances.find((b: any) =>
        (b.tokenIds ?? []).some((r: any) => BigInt(r.start) <= tokenId && tokenId <= BigInt(r.end))
      );
      const subscribedTimes: { start: bigint; end: bigint }[] =
        balanceForToken?.ownershipTimes?.map((r: any) => ({ start: BigInt(r.start), end: BigInt(r.end) })) ?? [];
      const isSubscribed = subscribedTimes.some((r) => r.start <= now && now <= r.end);

      const futureApproval = userIncomingApprovals.find((a: any) => isUserRecurringApproval(a, faucet));
      const hasFutureApproval = !!futureApproval;

      const incremented =
        futureApproval?.approvalCriteria?.predeterminedBalances?.incrementedBalances;
      const nextCharge = incremented
        ? getNextChargeTime(futureApproval.approvalCriteria.predeterminedBalances)
        : null;

      return {
        approvalId: faucet.approvalId,
        isSubscribed,
        subscribedTimes: subscribedTimes.map((r) => ({ start: r.start.toString(), end: r.end.toString() })),
        hasFutureApproval,
        nextChargeTime: nextCharge ? nextCharge.toString() : null
      };
    });

    emit({ collectionId: String(collectionId), address, tiers }, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── subscriptions claim ──────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    subscriptionsCommand
      .command('claim')
      .description(
        'Emit MsgTransferTokens for a single subscription claim via the faucet. Pipe to `bb deploy`.'
      )
      .argument('<collection-id>', 'Subscription collection ID')
      .requiredOption('--creator <address>', 'Subscriber address (bb1.../0x — auto-normalized)')
      .option('--tier <approvalId>', 'Which faucet to claim from (required for multi-tier collections)')
  )
).action(
  async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; tier?: string }) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'subscriptions claim');
      const faucet = pickFaucet(listFaucets(collection), opts.tier, 'subscriptions claim');
      emit(buildClaimMsg(creator, String(collectionId), faucet), opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── subscriptions enable-renewal ─────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    subscriptionsCommand
      .command('enable-renewal')
      .description(
        'Emit MsgUpdateUserApprovals adding the user recurring approval so the faucet can auto-mint each interval. Pipe to `bb deploy`. Preserves other recurring approvals on the same user/collection.'
      )
      .argument('<collection-id>', 'Subscription collection ID')
      .requiredOption('--creator <address>', 'Subscriber address (bb1.../0x — auto-normalized)')
      .option('--tier <approvalId>', 'Which faucet to renew (required for multi-tier collections)')
      .option('--tip <ubadge>', 'Optional tip per interval on top of the base subscription amount (in base denom units)', '0')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; tier?: string; tip?: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'subscriptions enable-renewal');
      const faucet = pickFaucet(listFaucets(collection), opts.tier, 'subscriptions enable-renewal');

      const tip = BigInt(opts.tip ?? '0');
      const denom = faucet.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom ?? 'ubadge';
      const newApproval = userRecurringApproval({
        subscriptionApproval: faucet,
        firstIntervalStartTime: BigInt(Date.now()),
        ubadgeTipAmount: tip,
        transferTimes: UintRangeArray.FullRanges(),
        approvalId: crypto.randomUUID(),
        tokenIds: faucet.tokenIds,
        denom
      });

      // Fetch + preserve existing recurring approvals from other tiers.
      let existing: any[] = [];
      try {
        const balances = await fetchUserBalances(String(collectionId), creator, opts);
        existing = balances?.balance?.incomingApprovals ?? balances?.incomingApprovals ?? [];
      } catch {
        // No balance doc yet → no existing approvals. The new one is the
        // user's first.
      }
      const otherApprovals = existing.filter((a: any) => !isUserRecurringApproval(a, faucet));

      emit(
        buildUpdateApprovalsMsg(creator, String(collectionId), [...otherApprovals, newApproval]),
        opts
      );
    } catch (err) {
      emitError(err);
    }
  }
);

// ── subscriptions cancel ─────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    subscriptionsCommand
      .command('cancel')
      .description(
        'Emit MsgUpdateUserApprovals removing the user recurring approval for a tier. Pipe to `bb deploy`. Other recurring approvals on the same user/collection are preserved.'
      )
      .argument('<collection-id>', 'Subscription collection ID')
      .requiredOption('--creator <address>', 'Subscriber address (bb1.../0x — auto-normalized)')
      .option('--tier <approvalId>', 'Which faucet to cancel (required for multi-tier collections)')
  )
).action(
  async (collectionId: string, opts: NetworkFlags & OutputFlags & { creator: string; tier?: string }) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'subscriptions cancel');
      const faucet = pickFaucet(listFaucets(collection), opts.tier, 'subscriptions cancel');

      const balances = await fetchUserBalances(String(collectionId), creator, opts);
      const existing: any[] = balances?.balance?.incomingApprovals ?? balances?.incomingApprovals ?? [];
      const remaining = existing.filter((a: any) => !isUserRecurringApproval(a, faucet));
      if (remaining.length === existing.length) {
        process.stderr.write(
          'Warning: no matching user recurring approval found for this tier — cancel is a no-op.\n'
        );
      }
      emit(buildUpdateApprovalsMsg(creator, String(collectionId), remaining), opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── subscriptions subscribe (multi-msg) ──────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    subscriptionsCommand
      .command('subscribe')
      .description(
        'Multi-msg: claim (MsgTransferTokens) + enable-renewal (MsgUpdateUserApprovals) in one wrapper. Mirrors the FE\'s Subscribe button. Pipe to `bb deploy`.'
      )
      .argument('<collection-id>', 'Subscription collection ID')
      .requiredOption('--creator <address>', 'Subscriber address (bb1.../0x — auto-normalized)')
      .option('--tier <approvalId>', 'Which faucet to subscribe to (required for multi-tier collections)')
      .option('--tip <ubadge>', 'Optional tip per interval on top of the base subscription amount', '0')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; tier?: string; tip?: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'subscriptions subscribe');
      const faucet = pickFaucet(listFaucets(collection), opts.tier, 'subscriptions subscribe');

      const claim = buildClaimMsg(creator, String(collectionId), faucet);

      const tip = BigInt(opts.tip ?? '0');
      const denom = faucet.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom ?? 'ubadge';
      const newApproval = userRecurringApproval({
        subscriptionApproval: faucet,
        firstIntervalStartTime: BigInt(Date.now()),
        ubadgeTipAmount: tip,
        transferTimes: UintRangeArray.FullRanges(),
        approvalId: crypto.randomUUID(),
        tokenIds: faucet.tokenIds,
        denom
      });
      let existing: any[] = [];
      try {
        const balances = await fetchUserBalances(String(collectionId), creator, opts);
        existing = balances?.balance?.incomingApprovals ?? balances?.incomingApprovals ?? [];
      } catch {
        existing = [];
      }
      const otherApprovals = existing.filter((a: any) => !isUserRecurringApproval(a, faucet));
      const enableRenewal = buildUpdateApprovalsMsg(
        creator,
        String(collectionId),
        [...otherApprovals, newApproval]
      );

      emit({ messages: [claim, enableRenewal] }, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── subscriptions build (alias) ──────────────────────────────────────────

subscriptionsCommand
  .command('build')
  .description(
    'Alias for `bb build subscription` — creator-side: construct a CREATE-COLLECTION tx for a new subscription. All flags pass through (including --help).'
  )
  .helpOption(false)
  .allowUnknownOption()
  .allowExcessArguments()
  .action(async () => {
    const { buildCommand } = await import('./build.js');
    const argv = process.argv;
    const startIdx = argv.findIndex((a, i) => a === 'build' && argv[i - 1] === 'subscriptions');
    const forward = startIdx >= 0 ? argv.slice(startIdx + 1) : [];
    await buildCommand.parseAsync(['subscription', ...forward], { from: 'user' });
  });
