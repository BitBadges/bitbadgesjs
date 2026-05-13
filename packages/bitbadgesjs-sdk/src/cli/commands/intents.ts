/**
 * `bitbadges-cli intents` — top-level surface for the Intent Exchange.
 *
 *   intents list [--mine] [--pay-denom] [--receive-denom] [--collection-id]
 *   intents show <approval-id> [--collection-id]
 *   intents create --pay-denom --pay-amount --receive-denom --receive-amount
 *                  --creator [--valid-until <ms>] [--collection-id]
 *   intents fill <approval-id> --creator [--approver] [--collection-id]
 *   intents cancel <approval-id> --creator [--collection-id]
 *
 * Intents aren't a token *standard* (they're a thin overlay on user
 * outgoing approvals) but they live on a known "intent exchange"
 * collection per-network. The collection ID resolves automatically from
 * `--testnet` / `--local` / mainnet; override with `--collection-id`.
 *
 * Lifted from the FE's `BrowseIntentsTab`, `CreateIntentForm`, and
 * `intentTypes.buildFillTxsInfo` — see `core/intents.ts` for the lifted
 * SDK helpers.
 */

import { Command } from 'commander';
import * as crypto from 'node:crypto';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  resolveIndexerNetwork as resolveNetwork,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1Address } from '../utils/address.js';
import {
  buildIntentApproval,
  buildIntentFillTx,
  intentExchangeCollectionId
} from '../../core/intents.js';
import { UintRangeArray } from '../../core/uintRanges.js';

interface CollectionFlag {
  collectionId?: string;
}

function resolveCollectionId(opts: NetworkFlags & CollectionFlag): string {
  if (opts.collectionId) return opts.collectionId;
  return intentExchangeCollectionId(resolveNetwork(opts));
}

function addCollectionFlag(cmd: Command): Command {
  return cmd.option(
    '--collection-id <id>',
    'Override the auto-resolved intent exchange collection ID (mainnet=81, testnet/local=24)'
  );
}

function appendQuery(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? path + (path.includes('?') ? '&' : '?') + qs : path;
}

// ── intents (parent) ──────────────────────────────────────────────────────

export const intentsCommand = new Command('intents').description(
  'Intent Exchange — list / show / create / fill / cancel intents (off-chain OTC swap offers via user outgoing approvals).'
);

// ── intents list ──────────────────────────────────────────────────────────
// Moved from `bb swap intents`. Same indexer route, same filters.

addOutputFlags(
  addCollectionFlag(
    addNetworkFlags(
      intentsCommand
        .command('list')
        .description(
          'List intent-type exchange approvals. Default = global browse (active/funded only). Pass --mine <address> to scope to a single approver and include used/inactive rows.'
        )
        .option(
          '--mine <address>',
          'Restrict to intents created by this address (bb1.../0x — auto-normalized). Also includes used/inactive.'
        )
        .option('--pay-denom <denom>', 'Filter by the denom the intent pays out')
        .option('--receive-denom <denom>', 'Filter by the denom the intent expects to receive')
    )
  )
).action(
  async (
    opts: NetworkFlags &
      OutputFlags &
      CollectionFlag & {
        mine?: string;
        payDenom?: string;
        receiveDenom?: string;
      }
  ) => {
    try {
      const mine = opts.mine ? requireBb1Address(opts.mine, '--mine') : undefined;
      const collectionId = opts.collectionId; // explicit override; otherwise indexer scopes globally
      const base = mine ? `/intents/${encodeURIComponent(mine)}` : '/intents';
      const path = appendQuery(base, {
        includeAll: mine ? 'true' : undefined,
        payDenom: opts.payDenom,
        receiveDenom: opts.receiveDenom,
        collectionId
      });
      const res = await callApi('GET', path, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── intents show ──────────────────────────────────────────────────────────

addOutputFlags(
  addCollectionFlag(
    addNetworkFlags(
      intentsCommand
        .command('show')
        .description('Render details for a single intent (queries the global intent feed and filters by approval-id).')
        .argument('<approval-id>', 'Intent approval ID')
    )
  )
).action(
  async (
    approvalId: string,
    opts: NetworkFlags & OutputFlags & CollectionFlag
  ) => {
    try {
      const collectionId = opts.collectionId;
      const path = appendQuery('/intents', { collectionId });
      const res = await callApi('GET', path, opts);
      const intents: any[] = res?.intents ?? res?.approvals ?? (Array.isArray(res) ? res : []);
      const match = intents.find((x: any) => x.approvalId === approvalId);
      if (!match) {
        process.stderr.write(`Error: no intent with approvalId "${approvalId}".\n`);
        process.exit(2);
      }
      emit(match, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── intents create ────────────────────────────────────────────────────────

addOutputFlags(
  addCollectionFlag(
    addNetworkFlags(
      intentsCommand
        .command('create')
        .description(
          'Emit MsgSetOutgoingApproval for a new intent ("I pay X if you send me Y"). Pipe to `bb deploy`.'
        )
        .requiredOption('--creator <address>', 'Intent creator address (bb1.../0x — auto-normalized)')
        .requiredOption('--pay-denom <denom>', 'Denom you OFFER (chain-side denom; ibc/... or ubadge)')
        .requiredOption('--pay-amount <amount>', 'Amount of pay denom in base units')
        .requiredOption('--receive-denom <denom>', 'Denom you EXPECT in return')
        .requiredOption('--receive-amount <amount>', 'Amount of receive denom in base units')
        .option(
          '--valid-until <ms>',
          'Optional expiration as ms-since-epoch (default: ~30 days from now)'
        )
        .option('--approval-id <id>', 'Override the auto-generated approval id (random hex by default)')
    )
  )
).action(
  async (
    opts: NetworkFlags &
      OutputFlags &
      CollectionFlag & {
        creator: string;
        payDenom: string;
        payAmount: string;
        receiveDenom: string;
        receiveAmount: string;
        validUntil?: string;
        approvalId?: string;
      }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      if (opts.payDenom === opts.receiveDenom) {
        process.stderr.write('Error: --pay-denom and --receive-denom must differ.\n');
        process.exit(2);
      }
      const validUntil = opts.validUntil
        ? BigInt(opts.validUntil)
        : BigInt(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const collectionId = resolveCollectionId(opts);
      const approvalId = opts.approvalId ?? crypto.randomBytes(16).toString('hex');

      const approval = buildIntentApproval({
        address: creator,
        payDenom: opts.payDenom,
        payAmount: BigInt(opts.payAmount),
        receiveDenom: opts.receiveDenom,
        receiveAmount: BigInt(opts.receiveAmount),
        transferTimes: UintRangeArray.From([{ start: 1n, end: validUntil }]),
        approvalId
      });

      emit(
        {
          typeUrl: '/tokenization.MsgSetOutgoingApproval',
          value: {
            creator,
            collectionId: String(collectionId),
            approval
          }
        },
        opts
      );
    } catch (err) {
      emitError(err);
    }
  }
);

// ── intents fill ──────────────────────────────────────────────────────────

addOutputFlags(
  addCollectionFlag(
    addNetworkFlags(
      intentsCommand
        .command('fill')
        .description(
          'Emit the 3-msg tx that fills an intent (mint vehicle → fire creator outgoing approval → burn vehicle). Pipe to `bb deploy`.'
        )
        .argument('<approval-id>', 'Intent approval ID to fill')
        .requiredOption('--creator <address>', 'Filler address (bb1.../0x — auto-normalized)')
        .option(
          '--approver <address>',
          'Intent creator address (bb1...) — required if not auto-fetchable; we attempt to look up via /intents'
        )
    )
  )
).action(
  async (
    approvalId: string,
    opts: NetworkFlags & OutputFlags & CollectionFlag & { creator: string; approver?: string }
  ) => {
    try {
      const fillerAddress = requireBb1Address(opts.creator, '--creator');
      const collectionId = resolveCollectionId(opts);

      // Resolve approverAddress. The /intents feed returns approverAddress
      // on each row; if --approver was provided, use that instead.
      let approverAddress = opts.approver ? requireBb1Address(opts.approver, '--approver') : '';
      if (!approverAddress) {
        const path = appendQuery('/intents', { collectionId: opts.collectionId });
        const res = await callApi('GET', path, opts);
        const intents: any[] = res?.intents ?? res?.approvals ?? (Array.isArray(res) ? res : []);
        const match = intents.find((x: any) => x.approvalId === approvalId);
        if (!match) {
          process.stderr.write(
            `Error: could not find intent "${approvalId}" in the global feed. Pass --approver <bb1...> to skip the lookup.\n`
          );
          process.exit(2);
        }
        approverAddress = match.approverAddress ?? match.fromListId ?? '';
        if (!approverAddress) {
          process.stderr.write(`Error: intent "${approvalId}" has no approverAddress field — pass --approver explicitly.\n`);
          process.exit(2);
        }
      }

      const tx = buildIntentFillTx(fillerAddress, { approvalId, approverAddress }, String(collectionId));
      emit(tx, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── intents cancel ────────────────────────────────────────────────────────

addOutputFlags(
  addCollectionFlag(
    addNetworkFlags(
      intentsCommand
        .command('cancel')
        .description(
          'Emit MsgDeleteOutgoingApproval to cancel an intent you created. Pipe to `bb deploy`.'
        )
        .argument('<approval-id>', 'Intent approval ID to cancel')
        .requiredOption('--creator <address>', 'Address that owns the intent (bb1.../0x — auto-normalized)')
    )
  )
).action(
  async (
    approvalId: string,
    opts: NetworkFlags & OutputFlags & CollectionFlag & { creator: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collectionId = resolveCollectionId(opts);
      emit(
        {
          typeUrl: '/tokenization.MsgDeleteOutgoingApproval',
          value: {
            creator,
            collectionId: String(collectionId),
            approvalId
          }
        },
        opts
      );
    } catch (err) {
      emitError(err);
    }
  }
);
