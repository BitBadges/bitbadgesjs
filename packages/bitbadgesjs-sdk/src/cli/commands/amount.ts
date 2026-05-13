/**
 * `bitbadges-cli amount` — coin amount math.
 *
 * Subcommands:
 *   - to-raw <display>        display → raw bigint string
 *   - to-display <raw>        raw bigint → display string
 *   - slippage                slippage % between expected / actual
 *   - min-amount              minimum acceptable amount after slippage
 *   - max-wrappable           how many wrapped tokens a user could mint
 *                             from their backing-coin balance (wraps the
 *                             SDK's `getMaxWrappableAmount`)
 *   - wrap-preview            forward conversion through a wrapper path's
 *                             conversion ratio (coin → wrapped tokens)
 *   - unwrap-preview          inverse — wrapped tokens → coin amount
 *
 * Pure math subcommands (to-raw / to-display / slippage / min-amount) run
 * offline. The wrappable trio needs to fetch a collection from the indexer
 * to resolve the wrapper path's conversion sides.
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import { CosmosCoinUtils, RoundingMode, createCosmosCoin } from '../../core/coin-utils.js';
import { getMaxWrappableAmount } from '../../core/balances.js';
import { resolveCoin } from '../../core/builders/shared.js';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { BitBadgesCollection } from '../../api-indexer/BitBadgesCollection.js';
import { BigIntify } from '../../common/string-numbers.js';

interface NetworkFlags { testnet?: boolean; local?: boolean; url?: string; apiKey?: string; }
interface OutputFlags { outputFile?: string; condensed?: boolean; }

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL')
    .option('--api-key <key>', 'BitBadges API key');
}
function addOutputFlags(cmd: Command): Command {
  return cmd.option('--output-file <path>', 'Write output to file').option('--condensed', 'Single-line JSON', false);
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
function fail(code: number, message: string): never {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(code);
}
async function callApi(method: 'GET' | 'POST', path: string, opts: NetworkFlags, body?: unknown): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  const raw = res?.collection ?? res;
  if (!raw) return raw;
  try { return new BitBadgesCollection(raw).convert(BigIntify); } catch { return raw; }
}

/** Resolve a symbol-or-denom string to { denom, decimals, symbol }, or accept --decimals as override. */
function resolveDecimals(denomOrSymbol: string | undefined, decimalsOverride: string | undefined): { denom: string; decimals: number; symbol?: string } {
  if (decimalsOverride !== undefined) {
    const d = Number(decimalsOverride);
    if (!Number.isInteger(d) || d < 0) fail(2, `--decimals must be a non-negative integer (got "${decimalsOverride}")`);
    return { denom: denomOrSymbol ?? '', decimals: d };
  }
  if (!denomOrSymbol) fail(2, 'either --denom <symbol-or-denom> or --decimals <n> is required');
  try {
    const resolved = resolveCoin(denomOrSymbol);
    return { denom: resolved.denom, decimals: resolved.decimals, symbol: resolved.symbol };
  } catch (err: any) {
    fail(2, err?.message || `cannot resolve --denom "${denomOrSymbol}"`);
  }
}

function parseRoundingMode(s: string | undefined, defaultMode: RoundingMode = RoundingMode.ROUND_DOWN): RoundingMode {
  if (!s) return defaultMode;
  const upper = s.toUpperCase().replace(/-/g, '_') as RoundingMode;
  if (!(upper in RoundingMode)) {
    fail(2, `unknown --round mode "${s}". Valid: ${Object.values(RoundingMode).join(', ')}`);
  }
  return upper as RoundingMode;
}

// ── amount (parent) ──────────────────────────────────────────────────────────

export const amountCommand = new Command('amount').description(
  'Coin amount math — display ↔ raw conversion, slippage, and wrapper-path conversion previews.'
);

// ── amount to-raw ────────────────────────────────────────────────────────────

addOutputFlags(
  amountCommand
    .command('to-raw')
    .description('Convert a display amount (e.g. 1.5) to raw base units. Decimals come from the BitBadges coins registry via --denom, or pass --decimals explicitly.')
    .argument('<display>', 'Display amount (e.g. "1.5", "1234.567")')
    .option('--denom <symbol-or-denom>', 'Coin symbol (USDC, ATOM, BADGE) or raw denom (ibc/..., ubadge)')
    .option('--decimals <n>', 'Explicit decimals (overrides --denom lookup)')
    .option('--round <mode>', 'Rounding mode for over-precision input: ROUND_DOWN | ROUND_UP. Default: ROUND_DOWN')
).action((display: string, opts: any) => {
  const { denom, decimals, symbol } = resolveDecimals(opts.denom, opts.decimals);
  const mode = parseRoundingMode(opts.round);
  const c = CosmosCoinUtils.fromDisplayAmount(display, denom, decimals, undefined, mode);
  emit({ denom, decimals, ...(symbol ? { symbol } : {}), display, raw: c.getRawAmountString() }, opts);
});

// ── amount to-display ────────────────────────────────────────────────────────

addOutputFlags(
  amountCommand
    .command('to-display')
    .description('Convert a raw base-units amount (e.g. 1500000) to a display string. Decimals come from the BitBadges coins registry via --denom, or pass --decimals explicitly.')
    .argument('<raw>', 'Raw amount (e.g. "1500000")')
    .option('--denom <symbol-or-denom>', 'Coin symbol or raw denom')
    .option('--decimals <n>', 'Explicit decimals (overrides --denom lookup)')
    .option('--precision <n>', 'Max decimal places shown. Default: full precision.')
    .option('--round <mode>', 'Rounding mode if precision < decimals. Default: ROUND_DOWN')
).action((raw: string, opts: any) => {
  const { denom, decimals, symbol } = resolveDecimals(opts.denom, opts.decimals);
  const mode = parseRoundingMode(opts.round);
  const precision = opts.precision !== undefined ? Number(opts.precision) : undefined;
  const c = CosmosCoinUtils.fromRawAmount(raw, denom, { decimals, symbol: symbol ?? denom } as any);
  emit({ denom, decimals, ...(symbol ? { symbol } : {}), raw, display: c.getDisplayAmountString(precision, mode) }, opts);
});

// ── amount slippage ──────────────────────────────────────────────────────────

addOutputFlags(
  amountCommand
    .command('slippage')
    .description('Compute slippage % between an expected and actual amount (positive = received less than expected).')
    .requiredOption('--expected <raw>', 'Expected raw amount')
    .requiredOption('--actual <raw>', 'Actual raw amount')
    .option('--precision <n>', 'Decimal precision for the percentage result. Default: 6.', '6')
).action((opts: any) => {
  const expected = BigInt(opts.expected);
  const actual = BigInt(opts.actual);
  const precision = Number(opts.precision);
  const slippagePercent = CosmosCoinUtils.calculateSlippage(expected, actual, precision);
  emit({ expected: expected.toString(), actual: actual.toString(), slippagePercent }, opts);
});

// ── amount min-amount ────────────────────────────────────────────────────────

addOutputFlags(
  amountCommand
    .command('min-amount')
    .description('Compute the minimum acceptable amount given an expected amount and a slippage tolerance.')
    .requiredOption('--expected <raw>', 'Expected raw amount')
    .option('--slippage-pct <pct>', 'Slippage tolerance as percent (e.g. 0.5 = 0.5%)')
    .option('--slippage-bps <bps>', 'Slippage tolerance as basis points (e.g. 50 = 0.5%)')
    .option('--round <mode>', 'Rounding mode. Default: ROUND_DOWN', 'ROUND_DOWN')
).action((opts: any) => {
  const expected = BigInt(opts.expected);
  let tolerance: number | undefined;
  if (opts.slippagePct !== undefined) tolerance = Number(opts.slippagePct) / 100;
  if (opts.slippageBps !== undefined) tolerance = Number(opts.slippageBps) / 10000;
  if (tolerance === undefined) fail(2, 'either --slippage-pct or --slippage-bps is required');
  if (!(tolerance! >= 0 && tolerance! < 1)) fail(2, `slippage tolerance must be in [0, 1) (got ${tolerance})`);
  const mode = parseRoundingMode(opts.round);
  const minAmount = CosmosCoinUtils.calculateMinAmount(expected, tolerance!, mode);
  emit({ expected: expected.toString(), slippageTolerance: tolerance, minAmount: minAmount.toString() }, opts);
});

// ── amount max-wrappable ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    amountCommand
      .command('max-wrappable')
      .description('How many wrapped tokens a user could mint from their backing-coin balance for a given collection. Wraps the SDK `getMaxWrappableAmount`.')
      .argument('<collection-id>', 'Collection ID with a wrapper path (Smart Token / IBC-backed / alias)')
      .requiredOption('--address <addr>', 'BitBadges address whose balances to check')
      .option('--path-index <n>', 'Index into the collection wrapper-paths arrays (default 0 = first path)', '0')
      .option('--path-kind <kind>', 'cosmos-coin | alias. Default: cosmos-coin.', 'cosmos-coin')
  )
).action(async (collectionId: string, opts: any) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    if (!collection) fail(2, `collection ${collectionId} not found`);
    const path = pickWrapperPath(collection, opts.pathKind, Number(opts.pathIndex));
    // The indexer returns 404 when an address has never received tokens
    // in this collection — for max-wrappable that's equivalent to "user
    // has 0 of every token id", so we swallow the 404 and pass an empty
    // balance array. Any other error propagates.
    let userBalances: unknown[] = [];
    try {
      const balancesRes = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}/${encodeURIComponent(opts.address)}/balance`, opts);
      userBalances = balancesRes?.balance?.balances ?? balancesRes?.balances ?? [];
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      if (!/not found/i.test(msg) && !/404/.test(msg)) throw err;
    }
    const maxWrappable = getMaxWrappableAmount(path as any, userBalances as any);
    emit({
      collectionId,
      address: opts.address,
      pathKind: opts.pathKind,
      pathIndex: Number(opts.pathIndex),
      maxWrappable: maxWrappable.toString()
    }, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── amount wrap-preview / unwrap-preview ─────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    amountCommand
      .command('wrap-preview')
      .description('Preview: given an amount of backing coin, how many wrapped tokens does that produce? Forward conversion through the wrapper path.')
      .argument('<collection-id>', 'Collection ID')
      .requiredOption('--coin-amount <raw>', 'Raw backing-coin amount (base units)')
      .option('--path-index <n>', 'Wrapper path index', '0')
      .option('--path-kind <kind>', 'cosmos-coin | alias. Default: cosmos-coin.', 'cosmos-coin')
  )
).action(async (collectionId: string, opts: any) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    if (!collection) fail(2, `collection ${collectionId} not found`);
    const path = pickWrapperPath(collection, opts.pathKind, Number(opts.pathIndex));
    const coinAmount = BigInt(opts.coinAmount);
    const sideB = path.conversion?.sideB?.[0];
    const sideA = path.conversion?.sideA;
    if (!sideA || !sideB) fail(2, 'wrapper path has no conversion sides');
    const conversions = coinAmount / BigInt(sideB.amount);
    const wrappedTokens = conversions * BigInt(sideA.amount);
    emit({
      collectionId,
      pathKind: opts.pathKind,
      pathIndex: Number(opts.pathIndex),
      coinAmount: coinAmount.toString(),
      wrappedTokens: wrappedTokens.toString(),
      conversions: conversions.toString()
    }, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

addOutputFlags(
  addNetworkFlags(
    amountCommand
      .command('unwrap-preview')
      .description('Preview: given a count of wrapped tokens, how much backing coin does that unwrap to? Inverse conversion through the wrapper path.')
      .argument('<collection-id>', 'Collection ID')
      .requiredOption('--token-amount <n>', 'Number of wrapped tokens')
      .option('--path-index <n>', 'Wrapper path index', '0')
      .option('--path-kind <kind>', 'cosmos-coin | alias. Default: cosmos-coin.', 'cosmos-coin')
  )
).action(async (collectionId: string, opts: any) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    if (!collection) fail(2, `collection ${collectionId} not found`);
    const path = pickWrapperPath(collection, opts.pathKind, Number(opts.pathIndex));
    const tokens = BigInt(opts.tokenAmount);
    const sideB = path.conversion?.sideB?.[0];
    const sideA = path.conversion?.sideA;
    if (!sideA || !sideB) fail(2, 'wrapper path has no conversion sides');
    const conversions = tokens / BigInt(sideA.amount);
    const coinAmount = conversions * BigInt(sideB.amount);
    emit({
      collectionId,
      pathKind: opts.pathKind,
      pathIndex: Number(opts.pathIndex),
      tokenAmount: tokens.toString(),
      coinAmount: coinAmount.toString(),
      conversions: conversions.toString()
    }, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── helpers ──────────────────────────────────────────────────────────────────

function pickWrapperPath(collection: any, kind: string, index: number): any {
  const paths = kind === 'alias' ? collection.aliasPaths : collection.cosmosCoinWrapperPaths;
  if (!Array.isArray(paths) || paths.length === 0) {
    // Smart Tokens populate aliasPaths (not cosmosCoinWrapperPaths) — most
    // users hit this trying the default --path-kind cosmos-coin against a
    // Smart Token. Surface that hint inline rather than making them dig.
    const otherKind = kind === 'alias' ? 'cosmos-coin' : 'alias';
    const otherPaths = kind === 'alias' ? collection.cosmosCoinWrapperPaths : collection.aliasPaths;
    const hasOther = Array.isArray(otherPaths) && otherPaths.length > 0;
    const hint = hasOther ? ` — try --path-kind ${otherKind} (this collection populates the ${otherKind} side instead).` : '';
    fail(2, `collection has no ${kind === 'alias' ? 'alias' : 'cosmos-coin-wrapper'} paths${hint}`);
  }
  if (index < 0 || index >= paths.length) {
    fail(2, `--path-index ${index} out of range (collection has ${paths.length} ${kind === 'alias' ? 'alias' : 'cosmos-coin-wrapper'} paths)`);
  }
  return paths[index];
}

// Silence unused-import warning for createCosmosCoin (kept exported for SDK consumers).
void createCosmosCoin;
