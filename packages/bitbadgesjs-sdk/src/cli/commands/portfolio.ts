/**
 * `bitbadges-cli portfolio` — single-address snapshot of the data the FE
 * shows on `/account/[addressOrUsername]`: account info, tokens
 * (collected/created/managing), lean balance docs, swap-merged assets,
 * and recent activity (transfers + claims + points).
 *
 * Thin wrapper over existing indexer routes — every section is a route
 * that already has a dedicated CLI command (`bb balances bitbadges`,
 * `bb balances assets`, etc.). The value-add is bundling them into one
 * call so an agent doing "tell me about this user" doesn't need 8 round
 * trips to figure out what `bb` verbs to chain.
 *
 *   bb portfolio --address bb1... | --address 0x...
 *
 * Sections fetched in parallel. A section that fails returns
 * `{ error: "..." }` instead of aborting the whole call — partial data
 * beats no data for read-only inspection.
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

const ALL_SECTIONS = ['account', 'tokens', 'balances', 'assets', 'activity'] as const;
type Section = (typeof ALL_SECTIONS)[number];

interface PortfolioFlags extends NetworkFlags, OutputFlags {
  address: string;
  include?: string;
  exclude?: string;
  chain?: string;
  allChains?: boolean;
}

// Same default broad set as `bb balances assets` — keep them in sync if
// either side changes. Switching to a shared constant would mean exporting
// from balances.ts; not worth the churn for 15 chain IDs.
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

export const portfolioCommand = new Command('portfolio')
  .description(
    [
      'Snapshot a user portfolio — bundles account info, tokens collected/created/managing,',
      'lean balance docs, swap-merged assets, and recent activity (transfers/claims/points)',
      'into one JSON response. Mirrors the data shown on bitbadges.io/account/<addressOrUsername>.',
      'Sections fetch in parallel; per-section failures degrade to {error} rather than aborting.'
    ].join('\n  ')
  );

addOutputFlags(
  addNetworkFlags(
    portfolioCommand
      .requiredOption('--address <addr>', 'Address to look up (bb1... or 0x... — auto-normalized to bb1)')
      .option(
        '--include <list>',
        `Comma-separated subset of sections to fetch (default: all). Valid: ${ALL_SECTIONS.join(', ')}.`
      )
      .option('--exclude <list>', 'Comma-separated sections to skip. Combine with --include or apply alone.')
      .option('--chain <id>', "Chain ID for the 'assets' section (default: bitbadges-1)")
      .option('--all-chains', "Query a broad Skip:Go chain set for 'assets' (overrides --chain)", false)
  )
).action(async (opts: PortfolioFlags) => {
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

    // Each section dispatches its own fetch independently so a failure in
    // one (e.g. a deprecated route, a 404) doesn't poison the rest.
    const work: { key: Section; promise: Promise<unknown> }[] = [];

    if (wants('account')) {
      work.push({
        key: 'account',
        promise: safeCall('account', () =>
          callApi('GET', `/user?address=${encodeURIComponent(address)}`, opts)
        )
      });
    }

    if (wants('tokens')) {
      const tokensPromise = Promise.all([
        safeCall('tokens.collected', () =>
          callApi('GET', `/account/${encodeURIComponent(address)}/tokens?viewType=collected`, opts)
        ),
        safeCall('tokens.created', () =>
          callApi('GET', `/account/${encodeURIComponent(address)}/tokens?viewType=created`, opts)
        ),
        safeCall('tokens.managing', () =>
          callApi('GET', `/account/${encodeURIComponent(address)}/tokens?viewType=managing`, opts)
        )
      ]).then(([collected, created, managing]) => ({ collected, created, managing }));
      work.push({ key: 'tokens', promise: tokensPromise });
    }

    if (wants('balances')) {
      work.push({
        key: 'balances',
        promise: safeCall('balances', () =>
          callApi('GET', `/account/${encodeURIComponent(address)}/balances`, opts)
        )
      });
    }

    if (wants('assets')) {
      let chains: Record<string, string[]>;
      if (opts.allChains) {
        chains = Object.fromEntries(DEFAULT_ALL_CHAIN_IDS.map((cid) => [cid, [address]]));
      } else {
        chains = { [opts.chain ?? 'bitbadges-1']: [address] };
      }
      work.push({
        key: 'assets',
        promise: safeCall('assets', () => callApi('POST', '/swap/balances', opts, { chains }))
      });
    }

    if (wants('activity')) {
      const activityPromise = Promise.all([
        safeCall('activity.transfers', () =>
          callApi('GET', `/account/${encodeURIComponent(address)}/activity/tokens`, opts)
        ),
        safeCall('activity.claims', () =>
          callApi('GET', `/account/${encodeURIComponent(address)}/activity/claims`, opts)
        ),
        safeCall('activity.points', () =>
          callApi('GET', `/account/${encodeURIComponent(address)}/activity/points`, opts)
        )
      ]).then(([transfers, claims, points]) => ({ transfers, claims, points }));
      work.push({ key: 'activity', promise: activityPromise });
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
