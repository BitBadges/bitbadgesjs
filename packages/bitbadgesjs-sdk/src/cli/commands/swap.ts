/**
 * `bitbadges-cli swap` — cross-chain swap helpers built on the consolidated
 * `/swap/*` indexer endpoints (assets, chains, balances, estimate, track,
 * status) plus BitBadges' own activity/intent routes.
 *
 * Wallet-agnostic. This command never signs or broadcasts — it only
 * inspects swap state (assets, chains, balances, route estimates, tx
 * tracking, recent activity, listed intents). Signing happens through
 * `deploy` / external wallets, and the broadcast tx-hash is what gets
 * fed into `swap track`.
 *
 * All subcommands fall through `apiRequest` (the same client `bb api`
 * uses), so `--network` / `--testnet` / `--local` / `--url` / `--api-key`
 * flags behave identically.
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';

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

function resolveNetwork(opts: NetworkFlags): 'mainnet' | 'testnet' | 'local' | undefined {
  if (opts.testnet) return 'testnet';
  if (opts.local) return 'local';
  return undefined;
}

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
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

function emitError(err: any): never {
  if (err?.response) {
    process.stderr.write(JSON.stringify(err.response, null, 2) + '\n');
  } else {
    process.stderr.write(`Error: ${err?.message ?? String(err)}\n`);
  }
  if (err?.hint) {
    process.stderr.write(`Hint: ${err.hint}\n`);
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

// ── swap (parent) ──────────────────────────────────────────────────────

export const swapCommand = new Command('swap').description(
  'Cross-chain swap helpers — assets, chains, balances, route estimates, tracking, activity, intents.'
);

// ── swap assets ─────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('assets'))
    .description('List cross-chain assets (Skip:Go + BitBadges CoinsRegistry + verified asset metadata).')
    .option('--include-svm', 'Include Solana / SVM chain assets', false)
    .option('--include-cw20', 'Include CW20 token assets', false)
).action(async (opts: NetworkFlags & OutputFlags & { includeSvm?: boolean; includeCw20?: boolean }) => {
  try {
    const path = appendQuery('/swap/assets', {
      includeSvm: opts.includeSvm ? 'true' : undefined,
      includeCw20: opts.includeCw20 ? 'true' : undefined
    });
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── swap chains ─────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('chains'))
    .description('List cross-chain chain registry entries for BitBadges-allowed chains.')
    .option('--include-svm', 'Include Solana / SVM chains', false)
    .option('--only-testnets', 'Return testnets only', false)
).action(async (opts: NetworkFlags & OutputFlags & { includeSvm?: boolean; onlyTestnets?: boolean }) => {
  try {
    const path = appendQuery('/swap/chains', {
      includeSvm: opts.includeSvm ? 'true' : undefined,
      onlyTestnets: opts.onlyTestnets ? 'true' : undefined
    });
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── swap balances ───────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('balances'))
    .description(
      'Fetch consolidated balances. Pass a JSON object mapping chain_id → addresses array (or { address, denoms? }). Use "-" or @file.json to read from stdin/file. For BitBadges chains, response includes server-side wrappable amounts for verified badge denoms.'
    )
    .argument(
      '<chains-to-addresses-json>',
      'JSON like \'{"bitbadges-1": ["bb1..."], "1": [{"address": "0x...", "denoms": ["ethereum-native"]}]}\''
    )
).action(async (chainsArg: string, opts: NetworkFlags & OutputFlags) => {
  try {
    let raw = chainsArg;
    if (chainsArg === '-') raw = fs.readFileSync(0, 'utf-8');
    else if (chainsArg.startsWith('@')) raw = fs.readFileSync(chainsArg.slice(1), 'utf-8');
    const chains = JSON.parse(raw);
    const res = await callApi('POST', '/swap/balances', opts, { chains });
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── swap estimate ───────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('estimate'))
    .description('Estimate a swap from <from-denom> to <to-denom> for <amount>. Honors source/dest chain overrides.')
    .argument('<from>', 'Token in denom (e.g. "ubadge")')
    .argument('<to>', 'Token out denom (e.g. "uusdc")')
    .argument('<amount>', 'Integer amount of token in (e.g. "1000000" for 1 BADGE at 6 decimals)')
    .option('--source-chain <id>', 'Source chain ID (defaults to "bitbadges-1")')
    .option('--dest-chain <id>', 'Destination chain ID (defaults to "bitbadges-1")')
    .option(
      '--addresses <json>',
      'JSON object mapping chain ID → address (e.g. \'{"bitbadges-1":"bb1...","1":"0x..."}\'). Required for cross-chain routes.'
    )
    .option('--slippage <pct>', 'Slippage tolerance percent (0-100)', '1')
    .option('--local-only', 'Restrict to BitBadges native pools (no Skip:Go rerouting). Both chains must be bitbadges-*.', false)
).action(
  async (
    from: string,
    to: string,
    amount: string,
    opts: NetworkFlags &
      OutputFlags & {
        sourceChain?: string;
        destChain?: string;
        addresses?: string;
        slippage?: string;
        localOnly?: boolean;
      }
  ) => {
    try {
      const addresses = opts.addresses ? JSON.parse(opts.addresses) : {};
      const body = {
        tokenIn: `${amount}${from}`,
        tokenInChainId: opts.sourceChain ?? 'bitbadges-1',
        tokenOutDenom: to,
        tokenOutChainId: opts.destChain ?? 'bitbadges-1',
        chainIdsToAddresses: addresses,
        slippageTolerancePercent: opts.slippage ?? '1',
        isLocalOnly: !!opts.localOnly
      };
      const res = await callApi('POST', '/swap/estimate', opts, body);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── swap track ──────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('track'))
    .description(
      'Initiate cross-chain tracking on a broadcast tx. Pairs with `bb swap status` to fetch the current state afterward.'
    )
    .argument('<tx-hash>', 'Broadcast tx hash (Cosmos sha256 or EVM keccak256)')
    .option('--chain-id <id>', 'Source chain ID (e.g. "bitbadges-1", "1")')
    .option('--token-in <amount-denom>', 'Optional token-in seed (e.g. "1000000ubadge") — surfaces in the swap activity row')
).action(
  async (
    txHash: string,
    opts: NetworkFlags & OutputFlags & { chainId?: string; tokenIn?: string }
  ) => {
    try {
      const body: Record<string, string> = { txHash };
      if (opts.chainId) body.chainId = opts.chainId;
      if (opts.tokenIn) body.tokenIn = opts.tokenIn;
      const res = await callApi('POST', '/swap/track', opts, body);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── swap status ─────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('status'))
    .description(
      'Fetch the current status of a tracked cross-chain tx. Use after `bb swap track`.'
    )
    .argument('<tx-hash>', 'Broadcast tx hash (Cosmos sha256 or EVM keccak256)')
    .option('--chain-id <id>', 'Source chain ID (e.g. "bitbadges-1", "1")')
).action(
  async (
    txHash: string,
    opts: NetworkFlags & OutputFlags & { chainId?: string }
  ) => {
    try {
      const path = appendQuery('/swap/status', {
        txHash,
        chainId: opts.chainId
      });
      const res = await callApi('GET', path, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  }
);

// ── swap activities ─────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('activities'))
    .description('List recent swap activities indexed by BitBadges.')
    .option('--bookmark <b>', 'Pagination bookmark from a previous response')
).action(async (opts: NetworkFlags & OutputFlags & { bookmark?: string }) => {
  try {
    const path = appendQuery('/swapActivities', { bookmark: opts.bookmark });
    const res = await callApi('GET', path, opts);
    emit(res, opts);
  } catch (err) {
    emitError(err);
  }
});

// ── swap intents ────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(swapCommand.command('intents'))
    .description(
      'List intent-type exchange approvals. Default = global browse (active/funded only). Pass --mine <address> to scope to a single approver and include used/inactive rows.'
    )
    .option(
      '--mine <address>',
      'Restrict to intents created by this address (also includes used/inactive). Accepts bb1... or 0x... — auto-normalized to bb1.'
    )
    .option('--pay-denom <denom>', 'Filter by the denom the intent pays out')
    .option('--receive-denom <denom>', 'Filter by the denom the intent expects to receive')
    .option('--collection-id <id>', 'Filter to a specific collection ID')
).action(
  async (
    opts: NetworkFlags &
      OutputFlags & {
        mine?: string;
        payDenom?: string;
        receiveDenom?: string;
        collectionId?: string;
      }
  ) => {
    try {
      const mine = opts.mine ? requireBb1Address(opts.mine, '--mine') : undefined;
      const base = mine ? `/intents/${encodeURIComponent(mine)}` : '/intents';
      const path = appendQuery(base, {
        includeAll: mine ? 'true' : undefined,
        payDenom: opts.payDenom,
        receiveDenom: opts.receiveDenom,
        collectionId: opts.collectionId
      });
      const res = await callApi('GET', path, opts);
      emit(res, opts);
    } catch (err) {
      emitError(err);
    }
  }
);
