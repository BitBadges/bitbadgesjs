/**
 * `bitbadges-cli assets` — browse the BitBadges asset registry, optionally
 * enriched with CoinGecko spot prices and indexer asset-pair analytics.
 *
 * Mirrors the frontend's BrowseAssetsTab data shape so an agent can pull
 * the same view a human sees on bitbadges.io. Three subcommands:
 *
 *   list   — flat list of every asset in the SDK registry
 *   show   — single asset, full metadata + spot USD price
 *   browse — joined view: top performers (gainers/losers/volume) from
 *            the indexer's /assetPairs/* endpoints + registry metadata +
 *            spot USD prices
 *
 * `list` and `show` work without an indexer key — they only need
 * CoinGecko (which doesn't require auth on the free tier). `browse` calls
 * the indexer and needs `--api-key` or BITBADGES_API_KEY env var.
 */

import { Command } from 'commander';
import axios from 'axios';
import * as fs from 'node:fs';
import { getAllAssets, findAsset, resolveCoinGeckoId, type EnhancedAsset } from '../../registry/index.js';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

interface NetworkFlags { testnet?: boolean; local?: boolean; url?: string; apiKey?: string; }
interface OutputFlags { outputFile?: string; condensed?: boolean; }
interface PriceFlags { withPrices?: boolean; vsCurrency?: string; include24hChange?: boolean; }

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL')
    .option('--api-key <key>', 'BitBadges API key (for indexer-backed subcommands)');
}
function addOutputFlags(cmd: Command): Command {
  return cmd.option('--output-file <path>', 'Write to file').option('--condensed', 'Single-line JSON', false);
}
function addPriceFlags(cmd: Command): Command {
  return cmd
    .option('--with-prices', 'Fetch spot USD prices via CoinGecko (one batch call)', false)
    .option('--vs-currency <ccy>', 'Quote currency for --with-prices (lowercase)', 'usd')
    .option('--include-24h-change', '24h price change %', false);
}
function emit(result: unknown, opts: OutputFlags): void {
  const formatted = opts.condensed ? JSON.stringify(result) : JSON.stringify(result, null, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else {
    process.stdout.write(formatted + '\n');
  }
}
function fail(code: number, msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(code);
}
async function callApi(method: 'GET' | 'POST', path: string, opts: NetworkFlags, body?: unknown): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}

type PriceMap = Record<string, Record<string, number>>;

async function fetchCoinGeckoPrices(ids: string[], vsCurrency: string, include24hChange: boolean): Promise<PriceMap> {
  if (ids.length === 0) return {};
  const params = new URLSearchParams({ ids: ids.join(','), vs_currencies: vsCurrency });
  if (include24hChange) params.set('include_24hr_change', 'true');
  const url = `${COINGECKO_BASE}/simple/price?${params.toString()}`;
  try {
    const r = await axios.get<PriceMap>(url, { timeout: 10_000 });
    return r.data;
  } catch (err: any) {
    process.stderr.write(`Warning: CoinGecko request failed (${err?.response?.status ?? err?.code ?? 'unknown'}). Continuing without prices.\n`);
    return {};
  }
}

/** Attach `price.{usd, usd_24h_change}` to each asset when available. */
function attachPrices(assets: EnhancedAsset[], prices: PriceMap, vsCurrency: string, include24hChange: boolean): any[] {
  return assets.map((a) => {
    const cg = a.coingecko_id ? prices[a.coingecko_id] : undefined;
    if (!cg) return a;
    const price: Record<string, number> = {};
    if (cg[vsCurrency] !== undefined) price[vsCurrency] = cg[vsCurrency];
    if (include24hChange && cg[`${vsCurrency}_24h_change`] !== undefined) {
      price[`${vsCurrency}_24h_change`] = cg[`${vsCurrency}_24h_change`];
    }
    return { ...a, price };
  });
}

// ── assets (parent) ──────────────────────────────────────────────────────────

export const assetsCommand = new Command('assets').description(
  'Browse the canonical asset registry. List / show / browse — mirrors the bitbadges.io BrowseAssetsTab data shape.'
);

// ── assets list ──────────────────────────────────────────────────────────────

addOutputFlags(
  addPriceFlags(
    assetsCommand
      .command('list')
      .description('List every asset in the SDK registry. Pass --with-prices to attach spot CoinGecko prices.')
  )
).action(async (opts: OutputFlags & PriceFlags) => {
  const assets = getAllAssets();
  let payload: any[] = assets;
  if (opts.withPrices) {
    const ids = Array.from(new Set(assets.map((a) => a.coingecko_id).filter(Boolean)));
    const prices = await fetchCoinGeckoPrices(ids, (opts.vsCurrency || 'usd').toLowerCase(), !!opts.include24hChange);
    payload = attachPrices(assets, prices, (opts.vsCurrency || 'usd').toLowerCase(), !!opts.include24hChange);
  }
  emit({ count: assets.length, assets: payload }, opts);
});

// ── assets show ──────────────────────────────────────────────────────────────

addOutputFlags(
  addPriceFlags(
    assetsCommand
      .command('show')
      .description('Show full metadata for a single asset. Resolves by symbol (ATOM), denom (uatom), or CoinGecko ID (cosmos).')
      .argument('<symbol-or-denom>', 'Asset symbol, denom, or CoinGecko ID')
  )
).action(async (input: string, opts: OutputFlags & PriceFlags) => {
  const asset = findAsset(input);
  if (!asset) {
    fail(2, `no asset matched "${input}". Try a symbol (ATOM), denom (uatom), or CoinGecko ID (cosmos).`);
  }
  let payload: any = asset;
  if (opts.withPrices && asset!.coingecko_id) {
    const vs = (opts.vsCurrency || 'usd').toLowerCase();
    const prices = await fetchCoinGeckoPrices([asset!.coingecko_id], vs, !!opts.include24hChange);
    payload = attachPrices([asset!], prices, vs, !!opts.include24hChange)[0];
  }
  emit(payload, opts);
});

// ── assets browse ────────────────────────────────────────────────────────────

addOutputFlags(
  addPriceFlags(
    addNetworkFlags(
      assetsCommand
        .command('browse')
        .description('Top performers view — pulls top gainers/losers/highest-volume from the indexer, enriches with SDK registry metadata, optionally attaches spot USD prices. Mirrors the bitbadges.io BrowseAssetsTab.')
    )
  )
).action(async (opts: NetworkFlags & OutputFlags & PriceFlags & { limit?: string }) => {
  try {
    const [topGainers24h, topLosers24h, highestVolume, topGainers7d] = await Promise.all([
      callApi('GET', '/assetPairs/topGainers', opts).catch((e) => ({ _error: e?.message ?? String(e) })),
      callApi('GET', '/assetPairs/topLosers', opts).catch((e) => ({ _error: e?.message ?? String(e) })),
      callApi('GET', '/assetPairs/highestVolume', opts).catch((e) => ({ _error: e?.message ?? String(e) })),
      callApi('GET', '/assetPairs/weeklyTopGainers', opts).catch((e) => ({ _error: e?.message ?? String(e) }))
    ]);

    // Collect all denoms involved so we can resolve registry metadata + CG IDs in one pass.
    const denomsSeen = new Set<string>();
    const collect = (pairs: any) => {
      const arr = Array.isArray(pairs?.assetPairs) ? pairs.assetPairs : Array.isArray(pairs) ? pairs : [];
      for (const p of arr) {
        for (const d of [p?.baseDenom, p?.quoteDenom, p?.denom]) {
          if (typeof d === 'string') denomsSeen.add(d);
        }
      }
    };
    collect(topGainers24h);
    collect(topLosers24h);
    collect(highestVolume);
    collect(topGainers7d);

    // Resolve registry metadata for each known denom.
    const registry: Record<string, EnhancedAsset> = {};
    for (const d of denomsSeen) {
      const a = findAsset(d);
      if (a) registry[d] = a;
    }

    let prices: PriceMap = {};
    if (opts.withPrices) {
      const cgIds = Array.from(
        new Set(
          Object.values(registry)
            .map((a) => a.coingecko_id)
            .filter(Boolean)
        )
      );
      prices = await fetchCoinGeckoPrices(cgIds, (opts.vsCurrency || 'usd').toLowerCase(), !!opts.include24hChange);
    }

    emit(
      {
        topGainers24h,
        topLosers24h,
        highestVolume,
        topGainers7d,
        registry,
        ...(opts.withPrices ? { prices, vsCurrency: (opts.vsCurrency || 'usd').toLowerCase() } : {})
      },
      opts
    );
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── assets price ─────────────────────────────────────────────────────────────
//
// Convenience alias for `bb price` scoped to the registry: only accepts
// symbols/denoms/CoinGecko-IDs that resolve in the registry. Errors fast
// on unknown inputs (vs `bb price` which passes through verbatim).

addOutputFlags(
  addPriceFlags(
    assetsCommand
      .command('price')
      .description('Strict-registry price lookup. Errors on unknown symbols. For best-effort (passthrough) behavior use `bb price`.')
      .argument('<symbols-or-denoms...>', 'BitBadges symbols (ATOM), denoms (uatom), or CoinGecko IDs (cosmos). Repeated or comma-separated.')
  )
).action(async (rawInputs: string[], opts: OutputFlags & PriceFlags) => {
  const inputs = rawInputs.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
  const resolved: { input: string; coingeckoId: string; asset?: EnhancedAsset }[] = [];
  const unresolved: string[] = [];
  for (const input of inputs) {
    const cgId = resolveCoinGeckoId(input);
    if (cgId) {
      resolved.push({ input, coingeckoId: cgId, asset: findAsset(input) });
    } else {
      unresolved.push(input);
    }
  }
  if (unresolved.length > 0) {
    fail(2, `unknown inputs: ${unresolved.join(', ')}. Use 'bb assets list' to see known symbols, or 'bb price' for passthrough lookup.`);
  }
  const ids = Array.from(new Set(resolved.map((r) => r.coingeckoId)));
  const prices = await fetchCoinGeckoPrices(ids, (opts.vsCurrency || 'usd').toLowerCase(), !!opts.include24hChange);
  emit({
    resolved,
    prices
  }, opts);
});
