/**
 * `bitbadges-cli balances` — three asset-scoped subcommands for reading
 * balances across BitBadges and the wider Cosmos ecosystem.
 *
 *   - `balances ics20 <addr>`        Cosmos LCD bank module (native / IBC).
 *   - `balances bitbadges <addr>`    BitBadges-standard tokens
 *                                    (multi-tokenId, time-ranged shape).
 *   - `balances assets <addr>`       Swap-merged view via /swap/balances
 *                                    (Skip:Go + verified BitBadges assets).
 *
 * Read-only. Output is JSON to stdout (or `--output-file`) and errors
 * write to stderr with exit code 1, matching the `bb swap` conventions.
 *
 * The three scopes do not overlap: ICS-20 fungibles do not appear in
 * the BitBadges-standard response, and BitBadges multi-tokenId balances
 * do not appear in the swap response. Each subcommand's `--help` makes
 * this explicit so agents pick the right one.
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';

// ── Shared flag / output helpers (mirrors swap.ts) ─────────────────────────

interface NetworkFlags {
  testnet?: boolean;
  local?: boolean;
  url?: string;
  apiKey?: string;
}

interface OutputFlags {
  outputFile?: string;
  condensed?: boolean;
}

function resolveNetwork(opts: NetworkFlags): NetworkMode {
  if (opts.testnet) return 'testnet';
  if (opts.local) return 'local';
  return 'mainnet';
}

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use BitBadges testnet (API + LCD)', false)
    .option('--local', 'Use local API (localhost:3001) and local LCD (localhost:1317)', false)
    .option('--url <url>', 'Custom API base URL (overrides --testnet/--local/config)')
    .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)');
}

function addOutputFlags(cmd: Command): Command {
  return cmd
    .option('--output-file <path>', 'Write JSON response to file instead of stdout')
    .option('--condensed', 'Emit single-line JSON instead of pretty-printed', false);
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

interface ApiErrorShape {
  message?: string;
  response?: unknown;
  hint?: string;
}

function emitError(err: unknown): never {
  const e = err as ApiErrorShape;
  if (e?.response !== undefined) {
    process.stderr.write(JSON.stringify(e.response, null, 2) + '\n');
  } else {
    process.stderr.write(`Error: ${e?.message ?? String(err)}\n`);
  }
  if (e?.hint) {
    process.stderr.write(`Hint: ${e.hint}\n`);
  }
  process.exit(1);
}

async function callApi(
  method: 'GET' | 'POST',
  path: string,
  opts: NetworkFlags,
  body?: unknown
): Promise<unknown> {
  const network = resolveNetwork(opts);
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}

function appendQuery(path: string, params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  if (!qs) return path;
  return path + (path.includes('?') ? '&' : '?') + qs;
}

// ── balances (parent) ──────────────────────────────────────────────────────

export const balancesCommand = new Command('balances').description(
  'Read balances for an address. Three asset-scoped subcommands: ics20 (Cosmos native/IBC fungibles), bitbadges (BitBadges-standard tokens), assets (swap-consolidated view).'
);

// ── balances ics20 ─────────────────────────────────────────────────────────
//
// LCD passthrough — no indexer, no API key required. Default LCD is the
// BitBadges mainnet (or testnet/local when --testnet/--local is set).
// Users can target any Cosmos chain via `--lcd <url>`.

interface Ics20Flags extends OutputFlags {
  testnet?: boolean;
  local?: boolean;
  lcd?: string;
  denom?: string;
  pageKey?: string;
}

addOutputFlags(
  balancesCommand
    .command('ics20')
    .description(
      [
        'Query Cosmos LCD bank module for ICS-20 / native fungible balances.',
        'Use this for IBC tokens, native chain coins (e.g., ATOM, USDC, BADGE).',
        "Does NOT include BitBadges token-standard balances — for those, use 'bb balances bitbadges'."
      ].join('\n  ')
    )
    .argument('<address>', 'Bech32 address (any Cosmos chain — defaults to BitBadges LCD)')
    .option('--testnet', 'Use BitBadges testnet LCD instead of mainnet', false)
    .option('--local', 'Use local LCD (http://localhost:1317)', false)
    .option('--lcd <url>', 'Override LCD base URL (default: BitBadges mainnet LCD)')
    .option('--denom <denom>', 'Restrict to a single denom (uses by_denom endpoint)')
    .option('--page-key <key>', 'Pagination cursor from a previous response (pagination.next_key)')
).action(async (address: string, opts: Ics20Flags) => {
  try {
    // LCD URL precedence: --lcd > NETWORK_CONFIGS[network].nodeUrl.
    let lcdUrl = opts.lcd;
    if (!lcdUrl) {
      const network: NetworkMode = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
      lcdUrl = NETWORK_CONFIGS[network].nodeUrl;
    }
    lcdUrl = lcdUrl.replace(/\/$/, '');

    // Choose endpoint based on whether a denom filter was given. We
    // mirror burner.ts's by_denom path for single-denom and the bank
    // module's list endpoint otherwise.
    const axios = (await import('axios')).default;
    let url: string;
    const params: Record<string, string> = {};

    if (opts.denom) {
      url = `${lcdUrl}/cosmos/bank/v1beta1/balances/${address}/by_denom`;
      params['denom'] = opts.denom;
    } else {
      url = `${lcdUrl}/cosmos/bank/v1beta1/balances/${address}`;
    }
    if (opts.pageKey) {
      params['pagination.key'] = opts.pageKey;
    }

    const res = await axios.get<unknown>(url, { params });
    emit(res.data, opts);
  } catch (err) {
    // axios errors carry .response.data — fold into the standard
    // emitError shape so output is identical to swap.ts.
    const e = err as { response?: { data?: unknown }; message?: string };
    if (e?.response?.data !== undefined) {
      emitError({ response: e.response.data });
    } else {
      emitError(err);
    }
  }
});

// ── balances bitbadges ─────────────────────────────────────────────────────
//
// Indexer-backed. Wraps three SDK routes:
//   GET /account/:address/balances              — lean default (docs only)
//   GET /collection/:id/balance/:address        — single collection
//   GET /collection/:id/:tokenId/balance/:addr  — single token in collection
//
// We invoke the underlying HTTP routes directly via `apiRequest` so the
// CLI doesn't have to instantiate a typed BitBadgesAPI client (same
// pattern as bb swap).

interface BitBadgesFlags extends NetworkFlags, OutputFlags {
  collection?: string;
  token?: string;
  bookmark?: string;
  limit?: string;
}

addOutputFlags(
  addNetworkFlags(
    balancesCommand
      .command('bitbadges')
      .description(
        [
          'Query BitBadges-standard token balances (the multi-tokenId, time-ranged shape).',
          'Default: returns ALL collection balances for the user (lean docs-only endpoint).',
          '--collection: filter to a single collection.',
          '--token: filter to a single token within --collection.',
          "Does NOT include fungibles — for those, use 'bb balances ics20' or 'bb balances assets'."
        ].join('\n  ')
      )
      .argument('<address>', 'BitBadges native address (bb1...) or any equivalent address form')
      .option('--collection <id>', 'Restrict to a single collection ID')
      .option('--token <n>', 'Restrict to a single token ID (requires --collection)')
      .option('--bookmark <b>', 'Pagination bookmark from a previous response (default mode only)')
      .option('--limit <n>', 'Page size for the default mode (indexer-enforced max applies)')
  )
).action(async (address: string, opts: BitBadgesFlags) => {
  try {
    // Flag-combination validation: --token requires --collection.
    if (opts.token && !opts.collection) {
      process.stderr.write(
        'Error: --token requires --collection. Pass both flags to scope to a single token within a collection.\n'
      );
      process.exit(1);
    }

    if (opts.collection && opts.token) {
      // Single token in a specific collection.
      const path = `/collection/${encodeURIComponent(opts.collection)}/${encodeURIComponent(
        opts.token
      )}/balance/${encodeURIComponent(address)}`;
      const res = await callApi('GET', path, opts);
      emit(res, opts);
      return;
    }

    if (opts.collection) {
      // Full balance doc for one collection.
      const path = `/collection/${encodeURIComponent(opts.collection)}/balance/${encodeURIComponent(address)}`;
      const res = await callApi('GET', path, opts);
      emit(res, opts);
      return;
    }

    // No --collection: hit the lean per-user balances endpoint. Returns
    // only the balance docs (no account wrapper, no view envelope) — cheaper
    // than POST /users with a tokensCollected view for read-only flows.
    const limitNum = opts.limit ? Number(opts.limit) : undefined;
    if (opts.limit && (limitNum === undefined || !Number.isFinite(limitNum) || limitNum <= 0)) {
      process.stderr.write(`Error: --limit must be a positive integer. Got: ${opts.limit}\n`);
      process.exit(1);
    }
    const path = appendQuery(`/account/${encodeURIComponent(address)}/balances`, {
      bookmark: opts.bookmark,
      limit: limitNum
    });
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── balances assets ────────────────────────────────────────────────────────
//
// Swap-consolidated view. Default = BitBadges chain only.
// --chain <id>     → fetch for that single chain.
// --all-chains     → fetch a broader Skip:Go-allowed chain set.
//
// We use a conservative default-allowed list when --all-chains is set;
// there is no ALLOWED_CHAIN_IDS export in the SDK yet. This list covers
// the most common Skip:Go-supported Cosmos + EVM chains the BitBadges
// indexer pre-allows.

const DEFAULT_ALL_CHAIN_IDS: readonly string[] = [
  'bitbadges-1',
  'cosmoshub-4',
  'osmosis-1',
  'noble-1',
  'injective-1',
  'neutron-1',
  'stride-1',
  'celestia',
  'agoric-3',
  'dydx-mainnet-1',
  '1', // Ethereum
  '8453', // Base
  '42161', // Arbitrum
  '10', // Optimism
  '137' // Polygon
];

interface AssetsFlags extends NetworkFlags, OutputFlags {
  chain?: string;
  allChains?: boolean;
}

addOutputFlags(
  addNetworkFlags(
    balancesCommand
      .command('assets')
      .description(
        [
          'Query swap-consolidated balances: Skip:Go + verified BitBadges assets, server-merged.',
          'Includes wrapped assets (badgeslp:, badges:) with pre-computed numeric amounts.',
          "Use this for swap UIs. For raw chain balances, use 'bb balances ics20'."
        ].join('\n  ')
      )
      .argument('<address>', 'Address to query — chain-appropriate format (bb1... for bitbadges-1, 0x... for EVM)')
      .option('--chain <id>', 'Chain ID to query (default: bitbadges-1)')
      .option('--all-chains', 'Query a default broad set of Skip:Go-allowed chains', false)
  )
).action(async (address: string, opts: AssetsFlags) => {
  try {
    if (opts.chain && opts.allChains) {
      process.stderr.write('Error: pass either --chain or --all-chains, not both.\n');
      process.exit(1);
    }

    let chains: Record<string, string[]>;
    if (opts.allChains) {
      chains = Object.fromEntries(DEFAULT_ALL_CHAIN_IDS.map((cid) => [cid, [address]]));
    } else {
      const chainId = opts.chain ?? 'bitbadges-1';
      chains = { [chainId]: [address] };
    }

    const res = await callApi('POST', '/swap/balances', opts, { chains });
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});
