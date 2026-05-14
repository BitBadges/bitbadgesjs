/**
 * `bitbadges-cli assets` — browse the BitBadges chain's asset pairs as
 * served by the indexer.
 *
 * Single source of truth: the indexer's `/assetPairs` endpoint family.
 * NO static asset registry, NO CoinGecko — every field (price, decimals,
 * symbol, logo) comes from `AssetInfoDoc` records the indexer maintains.
 * Same data flow the frontend's BrowseAssetsTab uses.
 *
 * Subcommands:
 *   list   GET  /assetPairs                    paginated list
 *   show   POST /assetPairs/byDenoms           single asset by denom
 *          GET  /assetPairs/search?text=...    fallback if input looks like a symbol
 *   browse GET  /assetPairs/{topGainers,topLosers,highestVolume,weeklyTopGainers}
 *   price  POST /assetPairs/byDenoms           prices for one or more denoms
 *
 * Cross-chain assets (ETH, etc) are out of scope for this command — they
 * live in `bb swap` (Skip:Go-backed) since BitBadges doesn't index them
 * natively.
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';

function fail(code: number, msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(code);
}

/** Resolve a user-supplied symbol-or-denom to the canonical denom via the indexer search. */
async function resolveDenom(input: string, opts: NetworkFlags): Promise<string | undefined> {
  // Inputs that look like chain denoms (ubadge, ibc/..., badgeslp:..., factory/...) pass through.
  // Lowercase-only on purpose — uppercase strings are symbols (USDC, BADGE) and need indexer search.
  if (/^(u[a-z]|ibc\/|badges|factory\/)/.test(input)) return input;
  // Otherwise treat as a symbol — search the indexer.
  try {
    const res = await callApi('GET', `/assetPairs/search?query=${encodeURIComponent(input)}`, opts);
    const arr = Array.isArray(res?.assetPairs) ? res.assetPairs : [];
    const exact = arr.find((p: any) => p?.symbol?.toUpperCase() === input.toUpperCase());
    return (exact ?? arr[0])?.asset;
  } catch {
    return undefined;
  }
}

// ── assets (parent) ──────────────────────────────────────────────────────────

export const assetsCommand = new Command('assets').description(
  'Browse the BitBadges chain assets via the indexer. Source-of-truth: /assetPairs (same as BrowseAssetsTab).'
);

// ── assets list ──────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    assetsCommand
      .command('list')
      .description('Paginated list of every asset pair on the chain. Returns AssetInfoDoc records from the indexer.')
      .option('--bookmark <b>', 'Pagination bookmark')
      .option('--sort-by <field>', 'Sort field (price | volume24h | volume7d | percentageChange24h | percentageChange7d). Default: volume24h.')
      .option('--sort-direction <dir>', 'Sort direction (asc | desc). Default: desc.')
      .option('--limit <n>', 'Page size (1–100)')
      .option('--tags <list>', 'Comma-separated tag filter')
  )
).action(async (opts: NetworkFlags & OutputFlags & { bookmark?: string; sortBy?: string; sortDirection?: string; limit?: string; tags?: string }) => {
  try {
    const qs = new URLSearchParams();
    if (opts.bookmark) qs.set('bookmark', opts.bookmark);
    if (opts.sortBy) qs.set('sortBy', opts.sortBy);
    if (opts.sortDirection) qs.set('sortDirection', opts.sortDirection);
    if (opts.limit) qs.set('limit', opts.limit);
    if (opts.tags) qs.set('tags', opts.tags);
    const path = qs.toString() ? `/assetPairs?${qs.toString()}` : '/assetPairs';
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── assets show ──────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    assetsCommand
      .command('show')
      .description('Show a single asset pair. Pass a denom (ubadge, ibc/...) or a symbol (BADGE) — symbols resolve via /assetPairs/search.')
      .argument('<denom-or-symbol>', 'Asset denom or symbol')
  )
).action(async (input: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const denom = await resolveDenom(input, opts);
    if (!denom) {
      fail(2, `no asset matched "${input}". Try a denom (ubadge, ibc/...), or check 'bb assets list' for known symbols.`);
    }
    const res = await callApi('POST', '/assetPairs/byDenoms', opts, { denoms: [denom] });
    const pair = res?.assetPairs?.[0];
    if (!pair) {
      fail(2, `no asset pair found for denom "${denom}".`);
    }
    emit(pair, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── assets browse ────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    assetsCommand
      .command('browse')
      .description('Top performers view — top gainers (24h + weekly), top losers, and highest-volume asset pairs. Mirrors the bitbadges.io BrowseAssetsTab.')
  )
).action(async (opts: NetworkFlags & OutputFlags) => {
  try {
    const [topGainers24h, topLosers24h, highestVolume, topGainers7d] = await Promise.all([
      callApi('GET', '/assetPairs/topGainers', opts).catch((e) => ({ _error: e?.message ?? String(e) })),
      callApi('GET', '/assetPairs/topLosers', opts).catch((e) => ({ _error: e?.message ?? String(e) })),
      callApi('GET', '/assetPairs/highestVolume', opts).catch((e) => ({ _error: e?.message ?? String(e) })),
      callApi('GET', '/assetPairs/weeklyTopGainers', opts).catch((e) => ({ _error: e?.message ?? String(e) }))
    ]);
    emit({ topGainers24h, topLosers24h, highestVolume, topGainers7d }, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── assets price ─────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    assetsCommand
      .command('price')
      .description('Indexer-served USD prices for one or more assets. Accepts denoms (ubadge) or symbols (BADGE — auto-resolved via /assetPairs/search).')
      .argument('<denoms-or-symbols...>', 'Repeated args or comma-separated. e.g. ubadge, BADGE, ibc/F082B65C...')
  )
).action(async (rawInputs: string[], opts: NetworkFlags & OutputFlags) => {
  try {
    const inputs = rawInputs.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
    if (inputs.length === 0) fail(2, 'at least one denom or symbol required');

    const denoms: { input: string; denom?: string }[] = [];
    for (const input of inputs) {
      const denom = await resolveDenom(input, opts);
      denoms.push({ input, denom });
    }
    const unresolved = denoms.filter((d) => !d.denom).map((d) => d.input);
    const resolvedDenoms = denoms.filter((d) => d.denom).map((d) => d.denom as string);

    const res = resolvedDenoms.length > 0
      ? await callApi('POST', '/assetPairs/byDenoms', opts, { denoms: resolvedDenoms })
      : { assetPairs: [] };

    const byDenom = new Map<string, any>();
    for (const pair of res.assetPairs ?? []) byDenom.set(pair.asset, pair);

    const prices = denoms.map(({ input, denom }) => {
      if (!denom) return { input, error: 'unresolved — pass a denom (ubadge, ibc/...) or a known symbol' };
      const pair = byDenom.get(denom);
      if (!pair) return { input, denom, error: 'not indexed' };
      return {
        input,
        denom,
        symbol: pair.symbol,
        price: pair.price,
        percentageChange24h: pair.percentageChange24h,
        volume24h: pair.volume24h,
        lastUpdated: pair.lastUpdated
      };
    });

    emit({ prices, ...(unresolved.length > 0 ? { unresolved } : {}) }, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});
