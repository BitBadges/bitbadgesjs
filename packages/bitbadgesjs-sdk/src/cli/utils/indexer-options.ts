/**
 * Shared flag + helper surface for every CLI command that hits the BitBadges
 * indexer.
 *
 * Before this module existed, each command file duplicated the same
 * `addNetworkFlags` / `addOutputFlags` / `emit` / `emitError` / `callApi`
 * shapes inline — and the shapes drifted (different descriptions, different
 * error formats, occasional missing flags). Lifting them here keeps the
 * surface uniform across `assets`, `auctions`, `balances`, `bounties`,
 * `credit-tokens`, `dynamic-stores`, `intents`, `nfts`, `pay-requests`,
 * `prediction-markets`, `products`, `smart-tokens`, `subscriptions`,
 * `swap`, etc.
 *
 * Behavior is intentionally identical to the inline copies — this is a
 * lift, not a redesign. Output is still pretty-JSON by default with
 * `--condensed` for single-line and `--output-file` for redirected
 * writes. Network defaults still go through `resolveBaseUrl` /
 * `resolveApiKey` from `api-client.ts`.
 *
 * Two adjacent helpers live next to this one:
 *  - `addNetworkOptions` (in `./io.ts`) — adds `--network` /
 *    `--mainnet` / `--testnet` / `--local` / `--url`. Used by commands
 *    that DON'T need an API key (`tx`, `deploy`, etc).
 *  - `addFormatOptions` (in `./envelope.ts`) — adds `--format` and the
 *    legacy `--json` alias. Used by commands that emit the structured
 *    envelope (`{ ok, data, warnings, error }`).
 *
 * Most indexer commands today still emit plain JSON (not the envelope)
 * and accept `--api-key`, so they use `addIndexerOptions` + `emit` here.
 * New commands SHOULD prefer the envelope helpers — but migration is out
 * of scope for this sweep, which is purely about flag consistency.
 */
import * as fs from 'node:fs';
import type { Command } from 'commander';
import { apiRequest, resolveApiKey, resolveBaseUrl } from './api-client.js';

export interface IndexerNetworkFlags {
  testnet?: boolean;
  local?: boolean;
  url?: string;
  apiKey?: string;
}

export interface IndexerOutputFlags {
  outputFile?: string;
  condensed?: boolean;
}

export type IndexerFlags = IndexerNetworkFlags & IndexerOutputFlags;

/**
 * Add the four standard network-selection flags every indexer-hitting
 * command should accept: `--testnet`, `--local`, `--url`, `--api-key`.
 *
 * Note: this is the legacy 4-flag surface. The newer `addNetworkOptions`
 * helper in `./io.ts` adds `--network` / `--mainnet` shorthand on top,
 * but most indexer commands still use the legacy form — switching them
 * to the long-form would mean threading `--network` through
 * `resolveBaseUrl` (which only understands the booleans today). That
 * larger plumbing change is intentionally NOT in this sweep.
 */
export function addIndexerNetworkOptions(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL (overrides --testnet/--local/config)')
    .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)');
}

/**
 * Add the two output-selection flags every JSON-emitting command should
 * accept: `--output-file` and `--condensed`. `--condensed` matches the
 * legacy single-line behavior; new commands that opt into the envelope
 * should prefer `addFormatOptions` from `./envelope.ts` instead.
 */
export function addIndexerOutputOptions(cmd: Command): Command {
  return cmd
    .option('--output-file <path>', 'Write JSON response to file instead of stdout')
    .option('--condensed', 'Emit single-line JSON instead of pretty-printed', false);
}

/**
 * Bundle helper: both network + output options in one call. Returns the
 * command for chainable `.action(...)`.
 */
export function addIndexerOptions(cmd: Command): Command {
  return addIndexerOutputOptions(addIndexerNetworkOptions(cmd));
}

/** JSON replacer that stringifies BigInt values — every command emitting
 * SDK-converted docs (auctions, credit-tokens, intents, nfts,
 * prediction-markets, subscriptions) hits BigInt fields in the
 * convert(BigIntify) payload and would otherwise throw
 * "Do not know how to serialize a BigInt". */
function bigIntReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

/**
 * Emit a result as JSON. Honors `--condensed` and `--output-file`.
 * Mirrors the inline `emit()` every command file used to define. By
 * default uses the BigInt-safe replacer so SDK doc payloads never throw
 * on serialization — pass `bigInt: false` to opt out for the few
 * commands that pre-stringify their values.
 */
export function emitIndexerResult(
  result: unknown,
  opts: IndexerOutputFlags & { bigInt?: boolean } = {}
): void {
  const replacer = opts.bigInt === false ? undefined : bigIntReplacer;
  const formatted = opts.condensed
    ? JSON.stringify(result, replacer)
    : JSON.stringify(result, replacer, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else {
    process.stdout.write(formatted + '\n');
  }
}

interface ApiErrorShape {
  message?: string;
  response?: unknown;
  hint?: string;
}

/**
 * Error emitter for indexer-call failures. Surfaces `response` when the
 * indexer returned a structured error body, otherwise falls back to the
 * raw message. Any attached `hint` (network-error helper from
 * `api-client.ts`) gets written to stderr too. Exits non-zero.
 */
export function emitIndexerError(err: unknown, exitCode = 1): never {
  const e = err as ApiErrorShape;
  if (e?.response !== undefined) {
    process.stderr.write(JSON.stringify(e.response, null, 2) + '\n');
  } else {
    process.stderr.write(`Error: ${e?.message ?? String(err)}\n`);
  }
  if (e?.hint) {
    process.stderr.write(`Hint: ${e.hint}\n`);
  }
  process.exit(exitCode);
}

/**
 * Resolve the network name the user picked, using the legacy boolean
 * flags. Mirrors the pattern every command file inlined.
 */
export function resolveIndexerNetwork(opts: IndexerNetworkFlags): 'mainnet' | 'testnet' | 'local' {
  if (opts.testnet) return 'testnet';
  if (opts.local) return 'local';
  return 'mainnet';
}

/**
 * Call the indexer using the resolved base URL and API key. Returns the
 * parsed JSON body. Throws the same shape `apiRequest` does — pass to
 * `emitIndexerError` from a try/catch to surface the standard error
 * envelope + hint.
 */
export async function callIndexer(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  opts: IndexerNetworkFlags,
  body?: unknown
): Promise<any> {
  const network = resolveIndexerNetwork(opts);
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}
