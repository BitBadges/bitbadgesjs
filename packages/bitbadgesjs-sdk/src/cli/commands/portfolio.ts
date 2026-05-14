/**
 * `bitbadges-cli portfolio` — read-only user-snapshot surface that mirrors
 * the FE `/account/[addressOrUsername]` page.
 *
 *   bb portfolio all        — bundle of every section (parallel fetch)
 *   bb portfolio account    — /user
 *   bb portfolio tokens     — /account/:addr/tokens (collected/created/managing)
 *   bb portfolio balances   — /account/:addr/balances (lean balance docs)
 *   bb portfolio assets     — POST /swap/balances (Skip:Go + verified BB)
 *   bb portfolio activity   — /account/:addr/activity/{tokens,claims,points}
 *   bb portfolio approvals  — POST /collection/:id/filterApprovals
 *                              (the "Approvals" tab — subscriptions,
 *                              listings, bids, payments, etc.)
 *
 * Every subcommand is a thin wrapper over an indexer route that already
 * has a CLI surface elsewhere; the value-add is the verb-shape: a single
 * verb tree where you don't have to know which API noun owns which view.
 *
 * The `all` aggregator parallels everything and folds per-section failures
 * to `{error: "..."}` rather than aborting — partial data beats no data
 * for read-only inspection.
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1Address } from '../utils/address.js';

// ── shared section fetchers ─────────────────────────────────────────────────
//
// Each fetcher is a tiny wrapper over `callApi`. They're separate
// functions so both individual subcommands and the `all` aggregator can
// share the exact same request shape — no chance of drift.

function fetchAccount(address: string, opts: NetworkFlags): Promise<unknown> {
  return callApi('GET', `/user?address=${encodeURIComponent(address)}`, opts);
}

function fetchTokens(
  address: string,
  view: 'collected' | 'created' | 'managing',
  opts: NetworkFlags,
  extra: { bookmark?: string; oldestFirst?: boolean } = {}
): Promise<unknown> {
  const qs = new URLSearchParams({ viewType: view });
  if (extra.bookmark) qs.set('bookmark', extra.bookmark);
  if (extra.oldestFirst) qs.set('oldestFirst', 'true');
  return callApi('GET', `/account/${encodeURIComponent(address)}/tokens?${qs.toString()}`, opts);
}

function fetchBalances(
  address: string,
  opts: NetworkFlags,
  extra: { bookmark?: string; oldestFirst?: boolean } = {}
): Promise<unknown> {
  const qs = new URLSearchParams();
  if (extra.bookmark) qs.set('bookmark', extra.bookmark);
  if (extra.oldestFirst) qs.set('oldestFirst', 'true');
  const tail = qs.toString() ? `?${qs.toString()}` : '';
  return callApi('GET', `/account/${encodeURIComponent(address)}/balances${tail}`, opts);
}

function fetchAssets(
  address: string,
  opts: NetworkFlags,
  chainOpts: { chain?: string; allChains?: boolean }
): Promise<unknown> {
  let chains: Record<string, string[]>;
  if (chainOpts.allChains) {
    chains = Object.fromEntries(DEFAULT_ALL_CHAIN_IDS.map((cid) => [cid, [address]]));
  } else {
    chains = { [chainOpts.chain ?? 'bitbadges-1']: [address] };
  }
  return callApi('POST', '/swap/balances', opts, { chains });
}

function fetchActivity(
  address: string,
  type: 'tokens' | 'claims' | 'points',
  opts: NetworkFlags,
  extra: { bookmark?: string; oldestFirst?: boolean } = {}
): Promise<unknown> {
  const qs = new URLSearchParams();
  if (extra.bookmark) qs.set('bookmark', extra.bookmark);
  if (extra.oldestFirst) qs.set('oldestFirst', 'true');
  const tail = qs.toString() ? `?${qs.toString()}` : '';
  return callApi('GET', `/account/${encodeURIComponent(address)}/activity/${type}${tail}`, opts);
}

interface ApprovalsFilterFlags {
  collection?: string;
  tokenId?: string;
  time?: string;
  hasCoinTransfers?: boolean;
  priceMin?: string;
  priceMax?: string;
  denom?: string;
  sort?: string;
}

function buildApprovalsQuery(address: string, flags: ApprovalsFilterFlags): { query: Record<string, unknown>; sortBy?: Record<string, 1 | -1> } {
  // Mirrors the body shape the FE's BrowseApprovalsTab posts: a Mongo-style
  // filter over the ApprovalItemModel. We only expose the common-case
  // knobs here — anyone needing raw Mongo can hit
  // `bb api filter-approvals --collection-id any` directly.
  const query: Record<string, unknown> = {
    // `any` collection mode is set by the indexer when the path param is
    // "any" — but the server also needs `approverAddress` to scope it to
    // this user (otherwise it returns every approval on the chain).
    approverAddress: { $eq: address }
  };

  if (flags.tokenId) {
    query['approval.tokenIds'] = {
      $elemMatch: {
        start: { $lte: Number(flags.tokenId), $type: 'number' },
        $or: [{ end: { $gte: Number(flags.tokenId), $type: 'number' } }, { end: { $type: 'string' } }]
      }
    };
  }

  if (flags.time) {
    query['approval.transferTimes'] = {
      $elemMatch: {
        start: { $lte: Number(flags.time), $type: 'number' },
        $or: [{ end: { $gte: Number(flags.time), $type: 'number' } }, { end: { $type: 'string' } }]
      }
    };
  }

  if (flags.hasCoinTransfers) {
    query['approval.approvalCriteria.coinTransfers'] = { $elemMatch: { $exists: true } };
  }

  if (flags.priceMin !== undefined || flags.priceMax !== undefined) {
    const priceFilter: Record<string, unknown> = { $exists: true };
    if (flags.priceMin !== undefined) priceFilter.$gte = Number(flags.priceMin);
    if (flags.priceMax !== undefined) priceFilter.$lte = Number(flags.priceMax);
    query.price = priceFilter;
    if (flags.denom) query.denom = flags.denom;
  } else if (flags.denom) {
    query.denom = flags.denom;
  }

  let sortBy: Record<string, 1 | -1> | undefined;
  if (flags.sort === 'price-asc') sortBy = { price: 1 };
  else if (flags.sort === 'price-desc') sortBy = { price: -1 };

  return { query, sortBy };
}

function fetchApprovals(
  address: string,
  opts: NetworkFlags,
  flags: ApprovalsFilterFlags
): Promise<unknown> {
  const { query, sortBy } = buildApprovalsQuery(address, flags);
  const collectionId = flags.collection ?? 'any';
  // sortBy is REQUIRED by the indexer's typia.assert<iGetFilterApprovalsPayload>
  // — omitting it returns a 500 with an empty errorMessage. Always send an
  // object, even when the caller didn't pass --sort.
  return callApi(
    'POST',
    `/collection/${encodeURIComponent(collectionId)}/filterApprovals`,
    opts,
    { query, sortBy: sortBy ?? {} }
  );
}

// Same broad default as `bb balances assets`. Keep them in sync if either
// side changes; not worth exporting a constant for 15 chain IDs.
const DEFAULT_ALL_CHAIN_IDS: readonly string[] = [
  'bitbadges-1',
  'cosmoshub-4',
  'osmosis-1',
  'noble-1',
  'injective-1',
  'neutron-1',
  'stride-1',
  'celestia',
  'agoric-3',
  'dydx-mainnet-1',
  '1',
  '8453',
  '42161',
  '10',
  '137'
];

async function safeCall<T>(label: string, fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (err) {
    const e = err as { response?: unknown; message?: string };
    const msg =
      e?.response !== undefined
        ? typeof e.response === 'string'
          ? e.response
          : JSON.stringify(e.response)
        : (e?.message ?? String(err));
    return { error: `${label}: ${msg}` };
  }
}

// ── parent ──────────────────────────────────────────────────────────────────

export const portfolioCommand = new Command('portfolio').description(
  [
    'Read-only user-snapshot views — mirrors what bitbadges.io/account/<addressOrUsername> shows.',
    'Use `all` for a single-call bundle, or pick a subcommand for one section.'
  ].join('\n  ')
);

// ── account ─────────────────────────────────────────────────────────────────

interface AccountFlags extends NetworkFlags, OutputFlags {
  address: string;
}

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .command('account')
      .description('Fetch profile + on-chain LCD bank balances. Wraps GET /user.')
      .requiredOption('--address <addr>', 'Address to look up (bb1.../0x — auto-normalized to bb1)')
  )
).action(async (opts: AccountFlags) => {
  try {
    const address = requireBb1Address(opts.address, '--address');
    const res = await fetchAccount(address, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── tokens ──────────────────────────────────────────────────────────────────

interface TokensFlags extends NetworkFlags, OutputFlags {
  address: string;
  view?: 'collected' | 'created' | 'managing' | 'all';
  bookmark?: string;
  oldestFirst?: boolean;
}

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .command('tokens')
      .description(
        [
          'List BitBadges-standard token holdings. Wraps GET /account/:addr/tokens.',
          '--view collected (default): tokens the user has a balance of.',
          '--view created:   tokens the user created.',
          '--view managing:  tokens the user manages.',
          '--view all:       fan out to all three views in one response.'
        ].join('\n  ')
      )
      .requiredOption('--address <addr>', 'Address to look up (bb1.../0x — auto-normalized to bb1)')
      .option('--view <type>', 'collected | created | managing | all', 'collected')
      .option('--bookmark <b>', 'Pagination cursor from a previous response')
      .option('--oldest-first', 'Reverse default sort (newest-first)', false)
  )
).action(async (opts: TokensFlags) => {
  try {
    const address = requireBb1Address(opts.address, '--address');
    const view = opts.view ?? 'collected';
    if (!['collected', 'created', 'managing', 'all'].includes(view)) {
      process.stderr.write(`Error: --view must be one of collected | created | managing | all. Got: ${view}\n`);
      process.exit(2);
    }
    if (view === 'all') {
      const [collected, created, managing] = await Promise.all([
        safeCall('collected', () => fetchTokens(address, 'collected', opts, opts)),
        safeCall('created', () => fetchTokens(address, 'created', opts, opts)),
        safeCall('managing', () => fetchTokens(address, 'managing', opts, opts))
      ]);
      emit({ collected, created, managing }, opts);
      return;
    }
    const res = await fetchTokens(address, view, opts, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── balances ────────────────────────────────────────────────────────────────

interface BalancesFlags extends NetworkFlags, OutputFlags {
  address: string;
  bookmark?: string;
  oldestFirst?: boolean;
}

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .command('balances')
      .description(
        [
          'Lean BitBadges-standard balance docs. Wraps GET /account/:addr/balances.',
          "Use 'bb portfolio assets' for fungible / swap-merged balances."
        ].join('\n  ')
      )
      .requiredOption('--address <addr>', 'Address to look up (bb1.../0x — auto-normalized to bb1)')
      .option('--bookmark <b>', 'Pagination cursor from a previous response')
      .option('--oldest-first', 'Reverse default sort (newest-first)', false)
  )
).action(async (opts: BalancesFlags) => {
  try {
    const address = requireBb1Address(opts.address, '--address');
    const res = await fetchBalances(address, opts, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── assets ──────────────────────────────────────────────────────────────────

interface AssetsFlags extends NetworkFlags, OutputFlags {
  address: string;
  chain?: string;
  allChains?: boolean;
}

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .command('assets')
      .description(
        [
          'Swap-merged numeric balances (Skip:Go + verified BB assets).',
          'Default: bitbadges-1 only. --all-chains queries a broad Skip:Go-allowed set.'
        ].join('\n  ')
      )
      .requiredOption('--address <addr>', 'Address to look up (bb1.../0x — auto-normalized to bb1)')
      .option('--chain <id>', 'Chain ID to query (default: bitbadges-1)')
      .option('--all-chains', 'Query a broad Skip:Go-allowed chain set', false)
  )
).action(async (opts: AssetsFlags) => {
  try {
    if (opts.chain && opts.allChains) {
      process.stderr.write('Error: pass either --chain or --all-chains, not both.\n');
      process.exit(2);
    }
    const address = requireBb1Address(opts.address, '--address');
    const res = await fetchAssets(address, opts, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── activity ────────────────────────────────────────────────────────────────

interface ActivityFlags extends NetworkFlags, OutputFlags {
  address: string;
  type?: 'tokens' | 'claims' | 'points' | 'all';
  bookmark?: string;
  oldestFirst?: boolean;
}

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .command('activity')
      .description(
        [
          'Recent activity feeds for an address.',
          '--type tokens (default): transfer activity.',
          '--type claims:           claim activity.',
          '--type points:           points activity.',
          '--type all:              fan out to all three in one response.'
        ].join('\n  ')
      )
      .requiredOption('--address <addr>', 'Address to look up (bb1.../0x — auto-normalized to bb1)')
      .option('--type <kind>', 'tokens | claims | points | all', 'tokens')
      .option('--bookmark <b>', 'Pagination cursor (single-type mode)')
      .option('--oldest-first', 'Reverse default sort (newest-first)', false)
  )
).action(async (opts: ActivityFlags) => {
  try {
    const address = requireBb1Address(opts.address, '--address');
    const type = opts.type ?? 'tokens';
    if (!['tokens', 'claims', 'points', 'all'].includes(type)) {
      process.stderr.write(`Error: --type must be one of tokens | claims | points | all. Got: ${type}\n`);
      process.exit(2);
    }
    if (type === 'all') {
      const [transfers, claims, points] = await Promise.all([
        safeCall('transfers', () => fetchActivity(address, 'tokens', opts, opts)),
        safeCall('claims', () => fetchActivity(address, 'claims', opts, opts)),
        safeCall('points', () => fetchActivity(address, 'points', opts, opts))
      ]);
      emit({ transfers, claims, points }, opts);
      return;
    }
    const res = await fetchActivity(address, type, opts, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── approvals ───────────────────────────────────────────────────────────────

interface ApprovalsFlags extends NetworkFlags, OutputFlags, ApprovalsFilterFlags {
  address: string;
}

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .command('approvals')
      .description(
        [
          "Browse approvals owned by this user — the FE's 'Approvals' tab.",
          'Surfaces subscriptions, listings, bids, payments — anything keyed on an approval.',
          'Wraps POST /collection/:id/filterApprovals; defaults --collection to "any" (cross-collection).'
        ].join('\n  ')
      )
      .requiredOption('--address <addr>', 'Approver address (bb1.../0x — auto-normalized to bb1)')
      .option('--collection <id>', 'Collection ID (or "any" for cross-collection)', 'any')
      .option('--token-id <n>', 'Filter to approvals that cover this token id')
      .option('--time <ms>', 'Filter to approvals valid at this ms-since-epoch')
      .option('--has-coin-transfers', 'Only approvals with a coin-transfer leg (subscriptions, listings, paid claims)', false)
      .option('--price-min <n>', 'Lower bound on approval.price (use with --denom)')
      .option('--price-max <n>', 'Upper bound on approval.price (use with --denom)')
      .option('--denom <denom>', 'Restrict price filter to this denom')
      .option('--sort <order>', 'price-asc | price-desc (default: server order)')
  )
).action(async (opts: ApprovalsFlags) => {
  try {
    const address = requireBb1Address(opts.address, '--address');
    if (opts.sort && !['price-asc', 'price-desc'].includes(opts.sort)) {
      process.stderr.write(`Error: --sort must be price-asc or price-desc. Got: ${opts.sort}\n`);
      process.exit(2);
    }
    if ((opts.priceMin !== undefined || opts.priceMax !== undefined) && !opts.denom) {
      process.stderr.write('Error: --price-min / --price-max require --denom (price filters are denom-scoped).\n');
      process.exit(2);
    }
    const res = await fetchApprovals(address, opts, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── all (aggregator) ────────────────────────────────────────────────────────

const ALL_SECTIONS = ['account', 'tokens', 'balances', 'assets', 'activity', 'approvals'] as const;
type Section = (typeof ALL_SECTIONS)[number];

interface AllFlags extends NetworkFlags, OutputFlags {
  address: string;
  include?: string;
  exclude?: string;
  chain?: string;
  allChains?: boolean;
}

function parseSectionList(value: string | undefined, flag: string): Set<Section> | undefined {
  if (!value) return undefined;
  const parts = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out = new Set<Section>();
  for (const p of parts) {
    if (!(ALL_SECTIONS as readonly string[]).includes(p)) {
      process.stderr.write(
        `Error: ${flag} got "${p}". Valid sections: ${ALL_SECTIONS.join(', ')}.\n`
      );
      process.exit(2);
    }
    out.add(p as Section);
  }
  return out;
}

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .command('all')
      .description(
        [
          'Snapshot every section in one parallel-fetched JSON response:',
          'account, tokens (collected+created+managing), balances, assets,',
          'activity (transfers+claims+points), approvals.',
          'Per-section failures degrade to {error} rather than aborting.'
        ].join('\n  ')
      )
      .requiredOption('--address <addr>', 'Address to look up (bb1.../0x — auto-normalized to bb1)')
      .option('--include <list>', `Comma-separated subset of sections (default: all). Valid: ${ALL_SECTIONS.join(', ')}.`)
      .option('--exclude <list>', 'Comma-separated sections to skip.')
      .option('--chain <id>', "Chain ID for the 'assets' section (default: bitbadges-1)")
      .option('--all-chains', "Query a broad Skip:Go chain set for 'assets' (overrides --chain)", false)
  )
).action(async (opts: AllFlags) => {
  try {
    const address = requireBb1Address(opts.address, '--address');
    if (opts.chain && opts.allChains) {
      process.stderr.write('Error: pass either --chain or --all-chains, not both.\n');
      process.exit(2);
    }
    const include = parseSectionList(opts.include, '--include');
    const exclude = parseSectionList(opts.exclude, '--exclude');
    const wants = (s: Section): boolean => {
      if (include && !include.has(s)) return false;
      if (exclude && exclude.has(s)) return false;
      return true;
    };

    const work: { key: Section; promise: Promise<unknown> }[] = [];

    if (wants('account')) {
      work.push({ key: 'account', promise: safeCall('account', () => fetchAccount(address, opts)) });
    }

    if (wants('tokens')) {
      work.push({
        key: 'tokens',
        promise: Promise.all([
          safeCall('tokens.collected', () => fetchTokens(address, 'collected', opts)),
          safeCall('tokens.created', () => fetchTokens(address, 'created', opts)),
          safeCall('tokens.managing', () => fetchTokens(address, 'managing', opts))
        ]).then(([collected, created, managing]) => ({ collected, created, managing }))
      });
    }

    if (wants('balances')) {
      work.push({ key: 'balances', promise: safeCall('balances', () => fetchBalances(address, opts)) });
    }

    if (wants('assets')) {
      work.push({
        key: 'assets',
        promise: safeCall('assets', () => fetchAssets(address, opts, opts))
      });
    }

    if (wants('activity')) {
      work.push({
        key: 'activity',
        promise: Promise.all([
          safeCall('activity.transfers', () => fetchActivity(address, 'tokens', opts)),
          safeCall('activity.claims', () => fetchActivity(address, 'claims', opts)),
          safeCall('activity.points', () => fetchActivity(address, 'points', opts))
        ]).then(([transfers, claims, points]) => ({ transfers, claims, points }))
      });
    }

    if (wants('approvals')) {
      work.push({
        key: 'approvals',
        promise: safeCall('approvals', () => fetchApprovals(address, opts, {}))
      });
    }

    const results = await Promise.all(work.map((w) => w.promise));
    const out: Record<string, unknown> = { address };
    for (let i = 0; i < work.length; i++) {
      out[work[i].key] = results[i];
    }
    emit(out, opts);
  } catch (err) {
    emitError(err);
  }
});

