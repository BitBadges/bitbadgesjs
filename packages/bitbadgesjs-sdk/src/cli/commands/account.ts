/**
 * `bitbadges-cli account` — read-only user-snapshot surface that mirrors
 * the FE `/account/[addressOrUsername]` page, plus the address-utility
 * subcommands absorbed under v2 (`convert`, `validate`, `lookup`,
 * `alias`, `gen-list-id`).
 *
 *   bb account all         — bundle of every section (parallel fetch)
 *   bb account me          — `all` against the active auth-session address
 *   bb account profile     — /user
 *   bb account tokens      — /account/:addr/tokens (collected/created/managing)
 *   bb account balances    — /account/:addr/balances (lean balance docs)
 *   bb account assets      — POST /swap/balances (Skip:Go + verified BB)
 *   bb account activity    — /account/:addr/activity/{tokens,claims,points}
 *   bb account approvals   — POST /collection/:id/filterApprovals
 *                              (the "Approvals" tab — subscriptions,
 *                              listings, bids, payments, etc.)
 *   bb account convert     — address conversion (bb1 ↔ 0x)
 *   bb account validate    — address validation + chain detection
 *   bb account lookup      — token symbol lookup
 *   bb account alias       — protocol-derived alias addresses
 *   bb account gen-list-id — reserved address list id
 *
 * Every read-only subcommand is a thin wrapper over an indexer route
 * that already has a CLI surface elsewhere; the value-add is the
 * verb-shape: a single verb tree where you don't have to know which
 * API noun owns which view.
 *
 * The `all` aggregator parallels everything and folds per-section
 * failures to `{error: "..."}` rather than aborting — partial data
 * beats no data for read-only inspection.
 *
 * Renamed from `portfolio` for v2 (#0399). The old top-level
 * `bb portfolio ...` form is kept as a deprecated alias for one release.
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
import { requireBbDenom } from '../utils/denom.js';
import {
  addOutputOptions as addOutputOptionsEnv,
  emit as emitEnv,
  emitError as emitErrorEnv,
} from '../utils/envelope.js';

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

  const denom = flags.denom ? requireBbDenom(flags.denom, '--denom') : undefined;
  if (flags.priceMin !== undefined || flags.priceMax !== undefined) {
    const priceFilter: Record<string, unknown> = { $exists: true };
    if (flags.priceMin !== undefined) priceFilter.$gte = Number(flags.priceMin);
    if (flags.priceMax !== undefined) priceFilter.$lte = Number(flags.priceMax);
    query.price = priceFilter;
    if (denom) query.denom = denom;
  } else if (denom) {
    query.denom = denom;
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

export const accountCommand = new Command('account').description(
  [
    'Read-only user views (mirrors bitbadges.io/account/<addr>) + address utilities.',
    'Use `all` / `me` for a bundle, or pick a subcommand for one section.'
  ].join('\n  ')
);

// ── profile ─────────────────────────────────────────────────────────────────
//
// Renamed from `account` (v1: `bb portfolio account`) to disambiguate
// against the new parent. Wraps GET /user — returns the user profile
// document plus LCD bank balances.

interface ProfileFlags extends NetworkFlags, OutputFlags {
  address: string;
}

addOutputFlags(
  addNetworkFlags(
    accountCommand
      .command('profile')
      .aliases(['account'])
      .description('Fetch profile + on-chain LCD bank balances. Wraps GET /user.')
      .requiredOption('--address <addr>', 'Address to look up (bb1.../0x — auto-normalized to bb1)')
  )
).action(async (opts: ProfileFlags) => {
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
    accountCommand
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
    accountCommand
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
    accountCommand
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
    accountCommand
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
    accountCommand
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
      .option('--denom <symbol|denom>', 'Restrict price filter to this denom. BADGE, USDC, … or canonical denom (ubadge, ibc/...)')
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
    accountCommand
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

// ── me (active-session shortcut) ────────────────────────────────────────────
//
// Resolves the active auth session's address (from `bb auth login`) and
// runs the `all` aggregator against it. Saves copy-pasting one's own
// address into every read-only command. Errors crisply when there's no
// session — `bb auth login` is the obvious next step.

addOutputFlags(
  addNetworkFlags(
    accountCommand
      .command('me')
      .description('`all` against the active auth-session address. Run `bb auth login` first.')
      .option('--include <list>', 'Comma-separated subset of sections (default: all)')
      .option('--exclude <list>', 'Comma-separated sections to skip')
      .option('--chain <id>', "Chain ID for the 'assets' section (default: bitbadges-1)")
      .option('--all-chains', "Query a broad Skip:Go chain set for 'assets'", false)
  )
).action(async (opts: any) => {
  try {
    const { resolveNetwork } = await import('../utils/io.js');
    const { getActiveSession } = await import('../utils/auth-store.js');
    const network = resolveNetwork(opts);
    const session = getActiveSession(network);
    if (!session) {
      process.stderr.write(
        `Error: no active auth session on ${network}. Run \`bb auth login\` first, or pass --address explicitly to \`bb account all\`.\n`
      );
      process.exit(2);
    }
    // Delegate to the `all` subcommand with the resolved address injected.
    const all = accountCommand.commands.find((c) => c.name() === 'all');
    if (!all) {
      throw new Error('internal: account `all` subcommand missing');
    }
    // Build a fresh argv slice: --address <session.address> plus passthrough flags
    const argv: string[] = ['--address', session.address];
    if (opts.include) argv.push('--include', String(opts.include));
    if (opts.exclude) argv.push('--exclude', String(opts.exclude));
    if (opts.chain) argv.push('--chain', String(opts.chain));
    if (opts.allChains) argv.push('--all-chains');
    // Preserve indexer + output flags. Commander stores them on `opts` as
    // camelCase; the parser accepts the dasherized long-form, so this
    // just walks the explicit list of flags we want forwarded.
    if (opts.network) argv.push('--network', String(opts.network));
    if (opts.testnet) argv.push('--testnet');
    if (opts.local) argv.push('--local');
    if (opts.url) argv.push('--url', String(opts.url));
    if (opts.apiKey) argv.push('--api-key', String(opts.apiKey));
    if (opts.outputFile) argv.push('--output-file', String(opts.outputFile));
    if (opts.condensed) argv.push('--condensed');
    await all.parseAsync(argv, { from: 'user' });
  } catch (err) {
    emitError(err);
  }
});

// ── convert / validate (absorbed from `bb address`) ─────────────────────────

addOutputOptionsEnv(
  accountCommand
    .command('convert <address>')
    .description('Convert an address between bb1 and 0x formats. Auto-detects target from input if --to omitted.')
    .option('--to <format>', 'Target format: bb1 or 0x. Default: opposite of the input.')
).action(async (address: string, opts: { to?: string; condensed?: boolean; outputFile?: string }) => {
  const { convertToBitBadgesAddress, convertToEthAddress } = await import('../../address-converter/converter.js');

  const to = opts.to ?? (address.startsWith('0x') ? 'bb1' : address.startsWith('bb') ? '0x' : '');
  if (to !== 'bb1' && to !== '0x') {
    emitErrorEnv(new Error(`Could not infer target format from "${address}". Pass --to bb1 or --to 0x.`), {
      code: 'invalid_target',
      exitCode: 2
    });
  }

  const result = to === 'bb1' ? convertToBitBadgesAddress(address) : convertToEthAddress(address);
  if (!result) {
    emitErrorEnv(new Error(`Could not convert "${address}". Verify it is a well-formed bb1.../0x... address.`), {
      code: 'invalid_address',
      exitCode: 2
    });
  }
  emitEnv({ result, source: address, target: to }, opts);
});

addOutputOptionsEnv(
  accountCommand
    .command('validate <address>')
    .description('Validate an address and detect its chain. Exits 0 when valid, 2 when invalid.')
).action(async (address: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { isAddressValid, getChainForAddress } = await import('../../address-converter/converter.js');
  const valid = isAddressValid(address);
  const chain = getChainForAddress(address);
  const chainLabel = chain === 'Cosmos' ? 'BitBadges' : chain === 'ETH' ? 'Ethereum' : 'Unknown';
  emitEnv({ valid, chain: chainLabel, address }, opts);
  if (!valid) process.exit(2);
});

// ── lookup (absorbed from top-level) ────────────────────────────────────────

addOutputOptionsEnv(
  accountCommand
    .command('lookup')
    .description('Look up token info by symbol — IBC denom, decimals, backing address. Omit symbol to list all.')
    .argument('[symbol]', 'Token symbol (e.g. USDC, BADGE). Omit to list all known tokens.')
).action(async (symbol: string | undefined, opts: { outputFile?: string; condensed?: boolean }) => {
  const { MAINNET_COINS_REGISTRY, TESTNET_COINS_REGISTRY } = await import('../../common/constants.js');

  const allSymbols = new Map<string, { symbol: string; ibcDenom: string; decimals: number; networks: string[] }>();

  for (const [denom, coin] of Object.entries(MAINNET_COINS_REGISTRY)) {
    const key = coin.symbol.toUpperCase();
    const existing = allSymbols.get(key);
    if (existing) {
      if (!existing.networks.includes('mainnet')) existing.networks.push('mainnet');
    } else {
      allSymbols.set(key, { symbol: coin.symbol, ibcDenom: denom, decimals: Number(coin.decimals), networks: ['mainnet'] });
    }
  }

  for (const [denom, coin] of Object.entries(TESTNET_COINS_REGISTRY)) {
    const key = coin.symbol.toUpperCase();
    const existing = allSymbols.get(key);
    if (existing) {
      if (!existing.networks.includes('testnet')) existing.networks.push('testnet');
    } else {
      allSymbols.set(key, { symbol: coin.symbol, ibcDenom: denom, decimals: Number(coin.decimals), networks: ['testnet'] });
    }
  }

  if (!symbol) {
    const tokens = Array.from(allSymbols.values()).map((t) => ({
      symbol: t.symbol,
      ibcDenom: t.ibcDenom,
      decimals: t.decimals,
      networks: t.networks
    }));
    emitEnv({ tokens }, opts);
    return;
  }

  const entry = allSymbols.get(symbol.toUpperCase());
  if (!entry) {
    emitErrorEnv(
      new Error(`Unknown token "${symbol}". Known tokens: ${Array.from(allSymbols.keys()).join(', ')}`),
      { code: 'unknown_token', exitCode: 1 }
    );
  }

  let backingAddress = '';
  if (entry!.ibcDenom.startsWith('ibc/')) {
    const { generateAliasAddressForIBCBackedDenom } = await import('../../core/aliases.js');
    backingAddress = generateAliasAddressForIBCBackedDenom(entry!.ibcDenom);
  }

  emitEnv(
    {
      symbol: entry!.symbol,
      ibcDenom: entry!.ibcDenom,
      decimals: entry!.decimals,
      networks: entry!.networks,
      ...(backingAddress ? { backingAddress } : {})
    },
    opts
  );
});

// ── alias (absorbed from top-level) ─────────────────────────────────────────
//
// Three sub-subcommands mirror the standalone `alias` command exactly.

const aliasSubCommand = accountCommand.command('alias').description('Generate protocol-derived alias addresses.');

addOutputOptionsEnv(
  aliasSubCommand
    .command('for-ibc-backing <ibcDenom>')
    .description('Generate backing address for an IBC-backed smart token (uses BackedPathGenerationPrefix)')
).action(async (ibcDenom: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { generateAliasAddressForIBCBackedDenom } = await import('../../core/aliases.js');
  const address = generateAliasAddressForIBCBackedDenom(ibcDenom);
  emitEnv({ address, kind: 'ibc-backing', source: ibcDenom }, opts);
});

addOutputOptionsEnv(
  aliasSubCommand
    .command('for-wrapper <denom>')
    .description('Generate wrapper path address for a cosmos coin wrapper (uses DenomGenerationPrefix)')
).action(async (denom: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { generateAliasAddressForDenom } = await import('../../core/aliases.js');
  const address = generateAliasAddressForDenom(denom);
  emitEnv({ address, kind: 'wrapper', source: denom }, opts);
});

addOutputOptionsEnv(
  aliasSubCommand
    .command('for-mint-escrow <collectionId>')
    .description('Generate mint escrow address for a collection')
).action(async (collectionId: string, opts: { condensed?: boolean; outputFile?: string }) => {
  const { getAliasDerivationKeysForCollection, generateAlias } = await import('../../core/aliases.js');
  const derivationKeys = getAliasDerivationKeysForCollection(collectionId);
  const address = generateAlias('badges', derivationKeys);
  emitEnv({ address, kind: 'mint-escrow', source: collectionId }, opts);
});

// ── gen-list-id (absorbed from top-level) ───────────────────────────────────

addOutputOptionsEnv(
  accountCommand
    .command('gen-list-id')
    .description('Generate a reserved address list ID from a set of addresses.')
    .argument('<addresses...>', 'One or more addresses to include in the list')
    .option('--blacklist', 'Treat as blacklist (default is whitelist)')
).action(async (addresses: string[], opts: { blacklist?: boolean; condensed?: boolean; outputFile?: string }) => {
  const { generateReservedListId } = await import('../../core/addressLists.js');
  const { isAddressValid } = await import('../../address-converter/converter.js');

  const invalid = addresses.filter((a) => !isAddressValid(a));
  if (invalid.length > 0) {
    emitErrorEnv(
      new Error(`invalid address(es): ${invalid.join(', ')}. Expected bb1... or 0x... format.`),
      { code: 'invalid_address', exitCode: 2 }
    );
  }

  const whitelist = !opts.blacklist;
  const listId = generateReservedListId({
    listId: '',
    addresses,
    whitelist,
    uri: '',
    customData: ''
  });
  emitEnv({ listId, mode: whitelist ? 'whitelist' : 'blacklist', addresses }, opts);
});

