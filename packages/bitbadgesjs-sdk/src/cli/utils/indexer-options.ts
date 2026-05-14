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
import type { Command } from 'commander';
import { apiRequest, resolveApiKey, resolveBaseUrl } from './api-client.js';
import { emit, emitError } from './envelope.js';
import { addUnifiedNetworkOptions } from './network-options.js';

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
 * Add the indexer-side network-selection flags.
 *
 * @deprecated Use {@link addUnifiedNetworkOptions} from
 *   `./network-options.js` directly — this is a thin compatibility
 *   shim that delegates to it. Historically this helper exposed only
 *   `--testnet` / `--local` / `--url` / `--api-key`; the unified
 *   surface adds `--network <name>` / `--mainnet` on top so users can
 *   pass the same flag style to every command.
 */
export function addIndexerNetworkOptions(cmd: Command): Command {
  return addUnifiedNetworkOptions(cmd);
}

/**
 * Add the two output-selection flags every JSON-emitting command should
 * accept: `--output-file` and `--condensed`. `--condensed` matches the
 * legacy single-line behavior; new commands that opt into the envelope
 * should prefer `addFormatOptions` from `./envelope.ts` instead.
 */
export function addIndexerOutputOptions(cmd: Command): Command {
  cmd
    .option('--output-file <path>', 'Write JSON response to file instead of stdout')
    .option('--condensed', 'Emit single-line JSON instead of pretty-printed', false);
  for (const flag of ['--output-file', '--condensed']) {
    (cmd as any)._findOption?.(flag)?.helpGroup('Output');
  }
  return cmd;
}

/**
 * Bundle helper: both network + output options in one call. Returns the
 * command for chainable `.action(...)`.
 */
export function addIndexerOptions(cmd: Command): Command {
  return addIndexerOutputOptions(addIndexerNetworkOptions(cmd));
}

/**
 * Emit a result as the envelope-wrapped JSON. Thin shim over `emit()` —
 * kept under the indexer-options name so every existing indexer-command
 * callsite (assets, balances, intents, nfts, portfolio, swap, …)
 * automatically gets the envelope shape without per-file edits.
 *
 * The legacy `bigInt: false` opt-out is gone: `emit()` always uses a
 * BigInt-safe replacer, and the handful of pre-stringified callers
 * (none today after the sweep) wouldn't gain anything from skipping it.
 */
export function emitIndexerResult(result: unknown, opts: IndexerOutputFlags = {}): void {
  emit(result, opts);
}

/**
 * Error emitter for indexer-call failures. Thin shim over `emitError()`
 * — the envelope contract is identical, and centralizing here means an
 * indexer 4xx/5xx surfaces the same JSON shape as any other CLI error.
 */
export function emitIndexerError(err: unknown, exitCode = 1): never {
  emitError(err, { exitCode });
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
