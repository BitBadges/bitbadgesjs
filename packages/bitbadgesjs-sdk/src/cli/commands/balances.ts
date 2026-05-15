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
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  resolveIndexerNetwork as resolveNetwork,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1Address } from '../utils/address.js';
import { NETWORK_CONFIGS, type NetworkMode } from '../../signing/types.js';
import { appendQuery } from '../utils/list-options.js';

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
          'Auto-normalizes 0x → bb1 client-side; a stderr notice prints the canonical form.',
          "Does NOT include fungibles — for those, use 'bb balances ics20' or 'bb balances assets'."
        ].join('\n  ')
      )
      .argument('<address>', 'BitBadges native address (bb1...) or 0x form — auto-converted to bb1')
      .option('--collection <id>', 'Restrict to a single collection ID')
      .option('--token <n>', 'Restrict to a single token ID (requires --collection)')
      .option('--bookmark <b>', 'Pagination bookmark from a previous response (default mode only)')
      .option('--limit <n>', 'Page size for the default mode (indexer-enforced max applies)')
  )
).action(async (rawAddress: string, opts: BitBadgesFlags) => {
  try {
    // Normalize 0x → bb1 client-side so the user sees the canonical form
    // and we fail fast on truly malformed input.
    const address = requireBb1Address(rawAddress, '<address> argument to bb balances bitbadges');

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
