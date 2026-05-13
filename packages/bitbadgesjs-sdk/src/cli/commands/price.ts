/**
 * `bitbadges-cli price` — indexer-served USD price lookup.
 *
 * Thin wrapper around `bb assets price`. Prices come from the BitBadges
 * indexer's `AssetInfoDoc.price` field on `/assetPairs/byDenoms`. The
 * indexer is the single source of truth — no CoinGecko, no external
 * price oracle.
 *
 * Input accepts:
 *   - Raw chain denoms (ubadge, ibc/..., badgeslp:N:utoken, factory/...)
 *   - Symbols (BADGE, USDC, etc) — resolved client-side via /assetPairs/search
 *
 * Cross-chain assets that aren't on the BitBadges chain (ETH on Ethereum,
 * ATOM on Hub) are not surfaced here. Use `bb swap` for those — the
 * Skip:Go-backed swap routes serve assets across chains.
 */

import { Command } from 'commander';
import { addFormatOptions, resolveFormat, successEnvelope, errorEnvelope, writeJsonEnvelope } from '../utils/envelope.js';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';

interface PriceFlags {
  testnet?: boolean;
  local?: boolean;
  url?: string;
  apiKey?: string;
  format?: 'json' | 'text';
  json?: boolean;
  outputFile?: string;
}

interface AssetPairRow {
  asset: string;
  symbol: string;
  price: number;
  percentageChange24h?: number;
  volume24h?: number;
  lastUpdated?: string;
}

function splitCsv(values: string[]): string[] {
  return values.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
}

async function callApi(method: 'GET' | 'POST', path: string, opts: PriceFlags, body?: unknown): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}

/**
 * Resolve each input to a denom. Inputs that already look like a denom
 * (ubadge, ibc/..., badgeslp:..., factory/...) pass through. Symbols hit
 * /assetPairs/search.
 */
async function resolveDenoms(inputs: string[], opts: PriceFlags): Promise<{ input: string; denom?: string }[]> {
  const out: { input: string; denom?: string }[] = [];
  for (const input of inputs) {
    // Chain denoms are lowercase by convention; uppercase strings are symbols.
    if (/^(u[a-z]|ibc\/|badges|factory\/)/.test(input)) {
      out.push({ input, denom: input });
      continue;
    }
    try {
      const res = await callApi('GET', `/assetPairs/search?query=${encodeURIComponent(input)}`, opts);
      const arr: AssetPairRow[] = Array.isArray(res?.assetPairs) ? res.assetPairs : [];
      const exact = arr.find((p) => p.symbol?.toUpperCase() === input.toUpperCase());
      out.push({ input, denom: (exact ?? arr[0])?.asset });
    } catch {
      out.push({ input, denom: undefined });
    }
  }
  return out;
}

function renderText(rows: { input: string; denom?: string; symbol?: string; price?: number; percentageChange24h?: number; volume24h?: number; error?: string }[]): string {
  const lines: string[] = [];
  for (const r of rows) {
    if (r.error) {
      lines.push(`${r.input}\t(${r.error})`);
      continue;
    }
    const pieces = [`${r.symbol ?? r.denom ?? r.input}\t${r.price ?? '?'} usd`];
    if (r.percentageChange24h !== undefined) {
      const change = r.percentageChange24h;
      pieces.push(`24h: ${change >= 0 ? '+' : ''}${change.toFixed(2)}%`);
    }
    if (r.volume24h !== undefined) pieces.push(`vol: ${Math.round(r.volume24h).toLocaleString()}`);
    lines.push(pieces.join('\t'));
  }
  return lines.join('\n') + '\n';
}

export const priceCommand = addFormatOptions(
  new Command('price')
    .description('Indexer-served USD price lookup for BitBadges-chain assets. Accepts denoms (ubadge, ibc/...) or symbols (BADGE) — symbols resolve via /assetPairs/search. Cross-chain prices live in `bb swap` (Skip:Go).')
    .argument('<denoms-or-symbols...>', 'Repeated args or comma-separated. e.g. ubadge, BADGE, ibc/F082B65C...')
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL')
    .option('--api-key <key>', 'BitBadges API key')
    .option('--output-file <path>', 'Write output to file instead of stdout.')
)
  .addHelpText(
    'after',
    `
Examples:
  bb price ubadge                     # native BADGE
  bb price BADGE                      # same — symbol resolved via /assetPairs/search
  bb price ubadge,ibc/F082B65C...     # batch via CSV
  bb price BADGE USDC --local

All prices come from the BitBadges indexer's AssetInfoDoc records. For
cross-chain assets not on BitBadges chain, use \`bb swap\` (Skip:Go-backed).
`
  )
  .action(async (rawInputs: string[], opts: PriceFlags) => {
    const inputs = splitCsv(rawInputs);
    if (inputs.length === 0) {
      const env = errorEnvelope(
        'USAGE',
        'At least one denom or symbol required.',
        undefined,
        'Try `bb price ubadge` or `bb price BADGE USDC`.'
      );
      writeJsonEnvelope(env);
      process.exit(2);
    }

    let resolved: { input: string; denom?: string }[];
    try {
      resolved = await resolveDenoms(inputs, opts);
    } catch (err: any) {
      const env = errorEnvelope('INDEXER_ERROR', `indexer search failed: ${err?.message ?? 'unknown error'}`);
      writeJsonEnvelope(env);
      process.exit(1);
    }

    const denomsToFetch = Array.from(new Set(resolved.filter((r) => r.denom).map((r) => r.denom as string)));

    let pairs: AssetPairRow[] = [];
    if (denomsToFetch.length > 0) {
      try {
        const res = await callApi('POST', '/assetPairs/byDenoms', opts, { denoms: denomsToFetch });
        pairs = Array.isArray(res?.assetPairs) ? res.assetPairs : [];
      } catch (err: any) {
        const env = errorEnvelope('INDEXER_ERROR', `byDenoms failed: ${err?.message ?? 'unknown error'}`);
        writeJsonEnvelope(env);
        process.exit(1);
      }
    }

    const byDenom = new Map<string, AssetPairRow>();
    for (const p of pairs) byDenom.set(p.asset, p);

    const rows = resolved.map(({ input, denom }) => {
      if (!denom) return { input, error: 'unresolved — pass a denom or a symbol the indexer knows' };
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

    const unresolved = rows.filter((r) => r.error).map((r) => r.input);
    const env = successEnvelope(
      { prices: rows, ...(unresolved.length > 0 ? { unresolved } : {}) },
      {
        hint: unresolved.length > 0
          ? `Some inputs returned no data. Cross-chain assets aren't on the BitBadges indexer — use \`bb swap\` for those.`
          : undefined
      }
    );

    if (opts.outputFile) {
      const fs = await import('node:fs');
      fs.writeFileSync(opts.outputFile, JSON.stringify(env, null, 2) + '\n', 'utf-8');
      process.stderr.write(`Written to ${opts.outputFile}\n`);
      return;
    }

    const format = resolveFormat(opts);
    if (format === 'text') {
      process.stdout.write(renderText(rows));
    } else {
      writeJsonEnvelope(env);
    }
  });
