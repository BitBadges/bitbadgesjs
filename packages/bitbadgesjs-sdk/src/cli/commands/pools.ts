/**
 * `bitbadges-cli pools` — liquidity pool browser, promoted from
 * `bb cli swap pools` for v2 (#0399). The indexer serves these under
 * /pools/* — this is a thin typed CLI view.
 *
 * Subcommands:
 *   bb pools list                       — paginated list, default sort lastLiquidityUpdate
 *   bb pools show <pool-id>             — single pool by ID
 *   bb pools by-denom <denom>           — pools containing a denom
 *   bb pools by-assets <a> <b>          — pools containing a specific asset pair
 *   bb pools batch <pool-ids...>        — batch fetch
 *
 * User-side pool shares (chain query, not indexer) is tracked in backlog
 * 0394 (typed SDK chain-query client).
 *
 * The legacy `bb swap pools ...` form is still reachable for one
 * release via a deprecation-banner alias wired in commands/swap.ts.
 * Both surfaces share this `registerPools(parent)` registrar so they
 * stay in lock-step.
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
} from '../utils/indexer-options.js';

function appendQuery(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  if (!qs) return path;
  return path + (path.includes('?') ? '&' : '?') + qs;
}

/**
 * Mount the pool browser subcommand tree under `parent`. Used by both:
 *   - the top-level `bb pools` parent (exported below)
 *   - the deprecated `bb swap pools` alias in commands/swap.ts
 *
 * Keeping the registration in one place avoids surface drift between
 * the canonical home and the alias.
 */
export function registerPools(parent: Command): void {
  addOutputFlags(
    addNetworkFlags(parent.command('list'))
      .description('Paginated list of all liquidity pools. Default sort: most recent liquidity update.')
      .option('--bookmark <b>', 'Pagination bookmark from a previous response')
      .option('--sort-by <field>', 'liquidity | volume | dailyVolume | weeklyVolume | monthlyVolume | allTimeVolume | lastLiquidityUpdate | lastVolumeUpdate', 'liquidity')
      .option('--sort-order <dir>', 'asc | desc', 'desc')
  ).action(async (opts: any) => {
    try {
      const path = appendQuery('/pools', { bookmark: opts.bookmark, sortBy: opts.sortBy, sortOrder: opts.sortOrder });
      const res = await callApi('GET', path, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });

  addOutputFlags(
    addNetworkFlags(parent.command('show'))
      .description('Fetch a single pool by ID — assets, total liquidity, total shares, volume buckets.')
      .argument('<pool-id>', 'Pool ID')
  ).action(async (poolId: string, opts: any) => {
    try {
      const res = await callApi('GET', `/pools/${encodeURIComponent(poolId)}`, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });

  addOutputFlags(
    addNetworkFlags(parent.command('by-denom'))
      .description('Pools containing a given denom (e.g. ubadge or ibc/...).')
      .argument('<denom>', 'Denom string')
      .option('--bookmark <b>', 'Pagination bookmark')
  ).action(async (denom: string, opts: any) => {
    try {
      const path = appendQuery('/pools/byDenom', { denom, bookmark: opts.bookmark });
      const res = await callApi('GET', path, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });

  addOutputFlags(
    addNetworkFlags(parent.command('by-assets'))
      .description('Pools containing a specific asset pair (order-insensitive).')
      .argument('<denom-a>', 'First denom')
      .argument('<denom-b>', 'Second denom')
      .option('--bookmark <b>', 'Pagination bookmark')
  ).action(async (denomA: string, denomB: string, opts: any) => {
    try {
      const path = appendQuery('/pools/byAssets', { asset1: denomA, asset2: denomB, bookmark: opts.bookmark });
      const res = await callApi('GET', path, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });

  addOutputFlags(
    addNetworkFlags(parent.command('batch'))
      .description('Batch fetch multiple pools by ID. Pass IDs as repeated args or comma-separated.')
      .argument('<pool-ids...>', 'Pool IDs')
  ).action(async (poolIds: string[], opts: any) => {
    try {
      const ids = poolIds.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
      if (ids.length === 0) {
        process.stderr.write('Error: at least one pool ID required.\n');
        process.exit(2);
      }
      const res = await callApi('POST', '/pools/batch', opts, { poolIds: ids });
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });
}

export const poolsCommand = new Command('pools').description(
  'Liquidity pool browser — list, show, by-denom, by-assets, batch.'
);
registerPools(poolsCommand);
