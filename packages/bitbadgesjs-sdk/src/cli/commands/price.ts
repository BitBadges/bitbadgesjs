/**
 * `bitbadges-cli price` — quick USD price lookup via the public CoinGecko
 * `/simple/price` endpoint.
 *
 * Wallet-agnostic, read-only. Accepts BitBadges symbols (ATOM, USDC, OSMO,
 * BADGE), raw chain denoms (uatom, ubadge), or canonical CoinGecko IDs
 * (cosmos, usd-coin, osmosis, bitbadges) — they're all resolved through
 * the SDK's asset registry. Unmapped inputs are passed through verbatim so
 * any CoinGecko ID still works.
 *
 * The frontend has a 5-min in-memory cache for hot reloads; the CLI is a
 * one-shot process so caching is pointless — every invocation makes one
 * HTTP call.
 */

import { Command } from 'commander';
import axios from 'axios';
import { addFormatOptions, resolveFormat, successEnvelope, errorEnvelope, writeJsonEnvelope } from '../utils/envelope.js';
import { resolveCoinGeckoId } from '../../registry/index.js';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

interface PriceFlags {
  vsCurrency?: string;
  include24hChange?: boolean;
  include24hVol?: boolean;
  format?: 'json' | 'text';
  json?: boolean;
  outputFile?: string;
}

type PriceMap = Record<string, Record<string, number>>;

function splitCsv(values: string[]): string[] {
  return values.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
}

/**
 * Resolve each input through the SDK asset registry. Unmapped inputs
 * pass through verbatim so unknown CoinGecko IDs still work.
 * Order preserved, duplicates dropped (first input wins for `original`).
 */
function resolveToCoinGeckoIds(inputs: string[]): { id: string; original: string }[] {
  const seen = new Set<string>();
  const out: { id: string; original: string }[] = [];
  for (const input of inputs) {
    const id = resolveCoinGeckoId(input) ?? input;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, original: input });
  }
  return out;
}

async function fetchPrices(coinIds: string[], opts: PriceFlags): Promise<PriceMap> {
  const vsCurrencies = (opts.vsCurrency || 'usd').toLowerCase();
  const params = new URLSearchParams({
    ids: coinIds.join(','),
    vs_currencies: vsCurrencies
  });
  if (opts.include24hChange) params.set('include_24hr_change', 'true');
  if (opts.include24hVol) params.set('include_24hr_vol', 'true');

  const url = `${COINGECKO_BASE}/simple/price?${params.toString()}`;
  const response = await axios.get<PriceMap>(url, { timeout: 10_000 });
  return response.data;
}

function renderText(prices: PriceMap, coinIds: string[], vsCurrency: string): string {
  const lines: string[] = [];
  for (const id of coinIds) {
    const entry = prices[id];
    if (!entry) {
      lines.push(`${id}\t(not found)`);
      continue;
    }
    const price = entry[vsCurrency];
    const change = entry[`${vsCurrency}_24h_change`];
    const vol = entry[`${vsCurrency}_24h_vol`];
    const pieces: string[] = [`${id}\t${price ?? '?'} ${vsCurrency}`];
    if (change !== undefined) pieces.push(`24h: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`);
    if (vol !== undefined) pieces.push(`vol: ${Math.round(vol).toLocaleString()}`);
    lines.push(pieces.join('\t'));
  }
  return lines.join('\n') + '\n';
}

export const priceCommand = addFormatOptions(
  new Command('price')
    .description('Quick USD (or other-currency) price lookup via CoinGecko. Accepts BitBadges symbols (ATOM/USDC/OSMO/BADGE), raw denoms (uatom/ubadge), or CoinGecko IDs (cosmos/osmosis/...) — symbols are resolved via the SDK asset registry.')
    .argument('<coin-ids...>', 'Symbols, denoms, or CoinGecko IDs. Repeated args or comma-separated.')
    .option('--vs-currency <ccy>', 'Quote currency (lowercase). Default: usd. Examples: eur, btc, eth.', 'usd')
    .option('--include-24h-change', '24h price change %.', false)
    .option('--include-24h-vol', '24h trading volume.', false)
    .option('--output-file <path>', 'Write output to file instead of stdout.')
)
  .addHelpText(
    'after',
    `
Examples:
  bb price ATOM                       # symbol → 'cosmos' on CoinGecko
  bb price ATOM USDC OSMO BADGE       # symbols batched
  bb price uatom,ubadge               # denoms (CSV)
  bb price cosmos osmosis --include-24h-change
  bb price BADGE --vs-currency eur

Symbol resolution uses the SDK asset registry. Unmapped inputs are passed
through verbatim — any CoinGecko ID at coingecko.com/coins/list still works.
`
  )
  .action(async (rawCoinIds: string[], opts: PriceFlags) => {
    const splitInputs = splitCsv(rawCoinIds);
    if (splitInputs.length === 0) {
      const env = errorEnvelope(
        'USAGE',
        'At least one coin ID required.',
        undefined,
        'Try `bb price ATOM USDC` (symbols) or `bb price cosmos osmosis` (CoinGecko IDs).'
      );
      writeJsonEnvelope(env);
      process.exit(2);
    }

    const resolved = resolveToCoinGeckoIds(splitInputs);
    const coinIds = resolved.map((r) => r.id);

    const vsCurrency = (opts.vsCurrency || 'usd').toLowerCase();
    let prices: PriceMap;
    try {
      prices = await fetchPrices(coinIds, opts);
    } catch (err: any) {
      const code = err?.response?.status === 429 ? 'RATE_LIMITED' : 'COINGECKO_ERROR';
      const message = err?.response?.status === 429
        ? 'CoinGecko rate-limited this request. Wait ~60s and retry.'
        : `CoinGecko request failed: ${err?.message || 'unknown error'}`;
      const env = errorEnvelope(code, message, { status: err?.response?.status });
      writeJsonEnvelope(env);
      process.exit(1);
    }

    // Map of resolved-ID → original-input, for inputs that were aliased.
    // Always emit the nested { prices, aliasedFrom } shape so downstream
    // consumers (agents, tests, scripts) can parse one consistent envelope
    // regardless of whether the caller passed a symbol or a raw CoinGecko ID.
    // `aliasedFrom` is always present; empty `{}` when no aliasing occurred.
    const aliasedFrom = resolved
      .filter((r) => r.id !== r.original)
      .reduce<Record<string, string>>((acc, r) => {
        acc[r.id] = r.original;
        return acc;
      }, {});

    const payload = { prices, aliasedFrom };
    const env = successEnvelope(payload, {
      hint: coinIds.some((id) => !prices[id])
        ? `Some IDs returned no data — try a BitBadges symbol (ATOM/USDC/OSMO/BADGE) or check coingecko.com/coins/list.`
        : undefined
    });

    if (opts.outputFile) {
      const fs = await import('node:fs');
      fs.writeFileSync(opts.outputFile, JSON.stringify(env, null, 2) + '\n', 'utf-8');
      process.stderr.write(`Written to ${opts.outputFile}\n`);
      return;
    }

    const format = resolveFormat(opts);
    if (format === 'text') {
      process.stdout.write(renderText(prices, coinIds, vsCurrency));
    } else {
      writeJsonEnvelope(env);
    }
  });
