import * as fs from 'fs';
import type { Command } from 'commander';
import { getConfigBaseUrl, getConfigApiKey } from './config.js';
import { assertNetworkAvailable } from '../../signing/types.js';

/**
 * Read JSON input from multiple sources:
 * - File path: `tx.json` or `@tx.json`
 * - Inline JSON string: `'{"messages":[...]}'`
 * - Stdin: `-`
 */
export function readJsonInput(input: string): any {
  let raw: string;

  if (input === '-') {
    raw = fs.readFileSync(0, 'utf-8');
  } else if (input.startsWith('{') || input.startsWith('[') || input.startsWith('"')) {
    // Inline JSON
    raw = input;
  } else {
    // File path (strip leading @ if present)
    const filePath = input.startsWith('@') ? input.slice(1) : input;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    raw = fs.readFileSync(filePath, 'utf-8');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Failed to parse JSON input. Accepts: file path, @file.json, inline JSON string, or - for stdin.');
  }
}

/**
 * Output data as JSON (pretty-printed by default) or human-readable text.
 *
 * --condensed: no whitespace (for piping/scripts)
 * --human: human-readable tree format
 * --output-file: write to file instead of stdout
 * default: pretty-printed JSON (2-space indent)
 */
export function output(data: any, options: { human?: boolean; condensed?: boolean; outputFile?: string }): void {
  let text: string;

  if (options.human) {
    text = typeof data === 'string' ? data : formatHuman(data);
  } else if (options.condensed) {
    text = JSON.stringify(data);
  } else {
    text = JSON.stringify(data, null, 2);
  }

  if (options.outputFile) {
    fs.writeFileSync(options.outputFile, text + '\n', 'utf-8');
    process.stderr.write(`Written to ${options.outputFile}\n`);
  } else {
    console.log(text);
  }
}

function formatHuman(obj: any, indent = 0): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '(empty)';
    return obj.map((item, i) => `${' '.repeat(indent)}[${i}] ${formatHuman(item, indent + 2)}`).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    return entries
      .map(([key, val]) => {
        const valStr = typeof val === 'object' && val !== null ? '\n' + formatHuman(val, indent + 2) : ` ${formatHuman(val, indent + 2)}`;
        return `${' '.repeat(indent)}${key}:${valStr}`;
      })
      .join('\n');
  }

  return String(obj);
}

/**
 * Network shorthand for `--network mainnet|local|testnet`. Maps to the
 * equivalent legacy boolean flag so existing flow inside `getApiUrl()`
 * keeps working without branching.
 */
export type NetworkName = 'mainnet' | 'local' | 'testnet';

export interface NetworkOptions {
  /** Long-form network selector — `mainnet` | `local` | `testnet`. */
  network?: NetworkName;
  /** Legacy boolean shorthand. Equivalent to `--network testnet`. */
  testnet?: boolean;
  /** Legacy boolean shorthand. Equivalent to `--network local`. */
  local?: boolean;
  /** Boolean shorthand. Equivalent to `--network mainnet`. */
  mainnet?: boolean;
  /** Custom API base URL — overrides every other selector. */
  url?: string;
}

/**
 * Resolve a network name from a mix of long-form and legacy flags.
 * `--url` always wins; otherwise `--network` > `--local` > `--testnet`
 * > `--mainnet` > env > config > mainnet default.
 */
export function resolveNetwork(options: NetworkOptions): NetworkName {
  if (options.network) return options.network;
  if (options.local) return 'local';
  if (options.testnet) return 'testnet';
  if (options.mainnet) return 'mainnet';
  return 'mainnet';
}

/**
 * Resolve the API URL from CLI flags and environment variables.
 *
 * Priority order (top wins):
 *   1. `--url <url>` — explicit CLI override, applies regardless of network.
 *   2. `BITBADGES_API_URL` env var — applies regardless of network.
 *      Setting this lets you point the CLI at a private proxy / staging
 *      indexer without having to invent a new `--network` value.
 *   3. `--network local` → `http://localhost:3001`
 *   4. `--network testnet` → `https://api.testnet.bitbadges.io`
 *   5. Config file (`~/.bitbadges/config.json` `url` field).
 *   6. Default production URL `https://api.bitbadges.io`.
 *
 * Note: the env var was previously only consulted for the mainnet branch,
 * which silently ignored `BITBADGES_API_URL=http://my-proxy` when the
 * caller passed `--network local`. The env var is now honored at all
 * networks so a single shell-level export reaches every command.
 */
export function getApiUrl(options: NetworkOptions): string {
  if (options.url) {
    return options.url;
  }
  if (process.env.BITBADGES_API_URL) {
    return process.env.BITBADGES_API_URL;
  }
  const network = resolveNetwork(options);
  // Fail fast if the resolved network is currently disabled. Override via
  // BITBADGES_TESTNET_OFFLINE=false for local dev pointing at a private chain.
  assertNetworkAvailable(network);
  if (network === 'local') {
    return 'http://localhost:3001';
  }
  if (network === 'testnet') {
    return 'https://api.testnet.bitbadges.io';
  }
  const configUrl = getConfigBaseUrl();
  if (configUrl) {
    // Config base URL includes /api/v0 suffix; strip it for getApiUrl callers
    return configUrl.replace(/\/api\/v0$/, '');
  }
  return 'https://api.bitbadges.io';
}

/**
 * Resolve the API key for a given network. Priority: env var (BITBADGES_API_KEY)
 * > network-scoped config key (apiKeyTestnet / apiKeyLocal) > default
 * config apiKey. Mirrors `getApiUrl()`'s priority so a single
 * `--network local` flag picks up both the local URL AND any local apiKey
 * the user has stashed via `bitbadges-cli config set apiKeyLocal <key>`.
 */
export function getApiKeyForNetwork(options: NetworkOptions): string | undefined {
  const envKey = process.env.BITBADGES_API_KEY;
  if (envKey) return envKey;
  return getConfigApiKey(resolveNetwork(options));
}

/**
 * Add the four network-selection options to a Command in one call.
 * Use this on every CLI command that makes an external API call so the
 * flag surface stays consistent: `--network`, `--testnet`, `--local`,
 * and `--url` all do the same job, with `--url` as the manual override.
 */
export function addNetworkOptions(cmd: Command): Command {
  return cmd
    .option(
      '--network <name>',
      'Network: mainnet | testnet | local. Picks the matching API base URL and config apiKey.'
    )
    .option('--mainnet', 'Shortcut for --network mainnet')
    .option('--testnet', 'Shortcut for --network testnet')
    .option('--local', 'Shortcut for --network local (http://localhost:3001)')
    .option('--url <url>', 'Custom API base URL (overrides --network)');
}
