/**
 * `bitbadges-cli pairs` — asset-pair analytics, promoted from
 * `bb cli swap asset-pairs` for v2 (#0399). Asset-pair analytics live
 * under /assetPairs/* on the indexer.
 *
 * Subcommands:
 *   bb pairs list
 *   bb pairs search <query>
 *   bb pairs by-denoms <denoms...>
 *   bb pairs top-gainers          — last 24h
 *   bb pairs top-losers           — last 24h
 *   bb pairs highest-volume       — 24h volume
 *   bb pairs weekly-top-gainers   — last 7d
 *   bb pairs weekly-top-losers    — last 7d
 *   bb pairs price-sorted         — sorted by current price
 *
 * The legacy `bb swap asset-pairs ...` form is still reachable for one
 * release via a deprecation-banner alias wired in commands/swap.ts.
 * Both surfaces share this `registerPairs(parent)` registrar so they
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
import { appendQuery } from '../utils/list-options.js';

const ANALYTICS_VERBS: ReadonlyArray<readonly [string, string, string]> = [
  ['top-gainers', '/assetPairs/topGainers', 'Top-gaining asset pairs in the last 24h.'],
  ['top-losers', '/assetPairs/topLosers', 'Top-losing asset pairs in the last 24h.'],
  ['highest-volume', '/assetPairs/highestVolume', 'Asset pairs sorted by 24h volume.'],
  ['weekly-top-gainers', '/assetPairs/weeklyTopGainers', 'Top-gaining asset pairs in the last 7d.'],
  ['weekly-top-losers', '/assetPairs/weeklyTopLosers', 'Top-losing asset pairs in the last 7d.'],
  ['price-sorted', '/assetPairs/priceSorted', 'Asset pairs sorted by current price.'],
];

/**
 * Mount the asset-pair analytics subcommand tree under `parent`. Used
 * by both the top-level `bb pairs` parent and the deprecated
 * `bb swap asset-pairs` alias in commands/swap.ts.
 */
export function registerPairs(parent: Command): void {
  for (const [verb, endpoint, desc] of ANALYTICS_VERBS) {
    addOutputFlags(
      addNetworkFlags(parent.command(verb))
        .description(desc)
        .option('--bookmark <b>', 'Pagination bookmark')
        .option('--limit <n>', 'Limit results (server-side cap may apply)')
    ).action(async (opts: any) => {
      try {
        const path = appendQuery(endpoint, { bookmark: opts.bookmark, limit: opts.limit });
        const res = await callApi('GET', path, opts);
        emit(res, opts);
      } catch (err) {
        emitError(err);
      }
    });
  }

  addOutputFlags(
    addNetworkFlags(parent.command('list'))
      .description('Paginated list of asset pairs.')
      .option('--bookmark <b>', 'Pagination bookmark')
  ).action(async (opts: any) => {
    try {
      const res = await callApi('GET', appendQuery('/assetPairs', { bookmark: opts.bookmark }), opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });

  addOutputFlags(
    addNetworkFlags(parent.command('search'))
      .description('Free-text search across asset pairs (denom + symbol).')
      .argument('<query>', 'Search text')
      .option('--bookmark <b>', 'Pagination bookmark')
  ).action(async (query: string, opts: any) => {
    try {
      const res = await callApi('GET', appendQuery('/assetPairs/search', { query, bookmark: opts.bookmark }), opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });

  addOutputFlags(
    addNetworkFlags(parent.command('by-denoms'))
      .description('Fetch asset pairs that include any of the given denoms.')
      .argument('<denoms...>', 'Denoms (repeated or comma-separated)')
  ).action(async (denoms: string[], opts: any) => {
    try {
      const list = denoms.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
      const res = await callApi('POST', '/assetPairs/byDenoms', opts, { denoms: list });
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  });
}

export const pairsCommand = new Command('pairs').description(
  'Asset-pair analytics — top gainers/losers, highest volume, price-sorted, text search.'
);
registerPairs(pairsCommand);
