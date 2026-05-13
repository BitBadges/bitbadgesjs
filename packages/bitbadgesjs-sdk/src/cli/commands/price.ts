/**
 * `bitbadges-cli price` — quick USD price lookup via the public CoinGecko
 * `/simple/price` endpoint.
 *
 * Wallet-agnostic, read-only. Accepts one or more CoinGecko coin IDs
 * (e.g. `cosmos`, `osmosis`, `bitcoin`) — symbols-only lookup is
 * intentionally NOT supported because CoinGecko's symbol space collides
 * (multiple coins share each symbol). If you don't know the ID, look it
 * up at coingecko.com/coins/list once and reuse.
 *
 * The frontend has a 5-min in-memory cache for hot reloads; the CLI is a
 * one-shot process so caching is pointless — every invocation makes one
 * HTTP call.
 */

import { Command } from 'commander';
import axios from 'axios';
import { addFormatOptions, resolveFormat, successEnvelope, errorEnvelope, writeJsonEnvelope } from '../utils/envelope.js';

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
    .description('Quick USD (or other-currency) price lookup via CoinGecko. Accepts CoinGecko coin IDs (e.g. `cosmos`, `osmosis`) — not token symbols.')
    .argument('<coin-ids...>', 'CoinGecko coin IDs. Accepts repeated args ("cosmos osmosis") or comma-separated ("cosmos,osmosis").')
    .option('--vs-currency <ccy>', 'Quote currency (lowercase). Default: usd. Examples: eur, btc, eth.', 'usd')
    .option('--include-24h-change', '24h price change %.', false)
    .option('--include-24h-vol', '24h trading volume.', false)
    .option('--output-file <path>', 'Write output to file instead of stdout.')
)
  .addHelpText(
    'after',
    `
Examples:
  bb price cosmos
  bb price cosmos osmosis ethereum --include-24h-change
  bb price cosmos,bitcoin --vs-currency eur

Lookup CoinGecko IDs at https://api.coingecko.com/api/v3/coins/list.
`
  )
  .action(async (rawCoinIds: string[], opts: PriceFlags) => {
    const coinIds = splitCsv(rawCoinIds);
    if (coinIds.length === 0) {
      const env = errorEnvelope('USAGE', 'At least one coin ID required.', undefined, 'Try `bb price cosmos osmosis`.');
      writeJsonEnvelope(env);
      process.exit(2);
    }

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

    const env = successEnvelope(prices, {
      hint: coinIds.some((id) => !prices[id])
        ? `Some IDs returned no data — check coingecko.com/coins/list for canonical IDs.`
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
