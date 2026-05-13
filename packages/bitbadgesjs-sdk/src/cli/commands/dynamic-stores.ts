/**
 * `bitbadges-cli dynamic-stores` — on-chain dynamic store (address →
 * boolean) CRUD. Thin aliases over the chain's tokenization msgs:
 *
 *   create        MsgCreateDynamicStore
 *   update        MsgUpdateDynamicStore (defaultValue / globalEnabled / uri / customData)
 *   delete        MsgDeleteDynamicStore
 *   set-value     MsgSetDynamicStoreValue (single address → bool)
 *   add           Bulk MsgSetDynamicStoreValue with value=true   (multi-msg tx)
 *   remove        Bulk MsgSetDynamicStoreValue with value=false  (multi-msg tx)
 *
 * Read subcommands hit the indexer:
 *
 *   show          /dynamicStore/<id>
 *   get-value     /dynamicStore/<id>/value?address=...
 *   list-values   /dynamicStore/<id>/values
 *   batch         POST /dynamicStores/fetch  (paginated multi-store fetch)
 *   activity      /dynamicStores/activity
 *
 * The model: each store maps `address → boolean`. `defaultValue` controls
 * the answer for addresses NOT explicitly set. So "add address to allowlist"
 * is `set-value <store> <addr> true` (or `add <store> <addr> ...` for
 * bulk); "remove" is `set-value ... false` (or `remove ...`).
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';

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
  return cmd.option('--output-file <path>', 'Write to file').option('--condensed', 'Single-line JSON', false);
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
function fail(code: number, msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(code);
}
async function callApi(method: 'GET' | 'POST', path: string, opts: NetworkFlags, body?: unknown): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}

function splitCsv(values: string[]): string[] {
  return values.flatMap((v) => v.split(',')).map((v) => v.trim()).filter(Boolean);
}

function parseBool(v: string, flagName: string): boolean {
  const lower = v.toLowerCase();
  if (['true', 't', '1', 'yes', 'y'].includes(lower)) return true;
  if (['false', 'f', '0', 'no', 'n'].includes(lower)) return false;
  fail(2, `${flagName} expects true|false (got "${v}")`);
}

// ── dynamic-stores (parent) ──────────────────────────────────────────────────

export const dynamicStoresCommand = new Command('dynamic-stores').description(
  'On-chain dynamic store CRUD (address → boolean maps). Build txs for create/update/delete/add/remove + read store contents via the indexer.'
);

// ── create ───────────────────────────────────────────────────────────────────

addOutputFlags(
  dynamicStoresCommand
    .command('create')
    .description('Emit MsgCreateDynamicStore. Pipe to `bb deploy` to broadcast.')
    .requiredOption('--creator <address>', 'Store creator (bb1.../0x — auto-normalized)')
    .option('--default-value <bool>', 'Default value for addresses not explicitly set. true|false (default false)', 'false')
    .option('--uri <uri>', 'Optional metadata URI')
    .option('--custom-data <text>', 'Optional custom data string')
).action((opts: OutputFlags & { creator: string; defaultValue: string; uri?: string; customData?: string }) => {
  const creator = requireBb1Address(opts.creator, '--creator');
  const defaultValue = parseBool(opts.defaultValue, '--default-value');
  emit(
    {
      typeUrl: '/tokenization.MsgCreateDynamicStore',
      value: {
        creator,
        defaultValue,
        ...(opts.uri !== undefined ? { uri: opts.uri } : {}),
        ...(opts.customData !== undefined ? { customData: opts.customData } : {})
      }
    },
    opts
  );
});

// ── update ───────────────────────────────────────────────────────────────────

addOutputFlags(
  dynamicStoresCommand
    .command('update')
    .description('Emit MsgUpdateDynamicStore. All fields beyond --creator/--store-id are optional partial updates.')
    .argument('<store-id>', 'Dynamic store ID')
    .requiredOption('--creator <address>', 'Tx creator')
    .option('--default-value <bool>', 'New default value (true|false)')
    .option('--global-enabled <bool>', 'Kill-switch state (true=enabled, false=halted)')
    .option('--uri <uri>', 'New metadata URI')
    .option('--custom-data <text>', 'New custom data')
).action(
  (
    storeId: string,
    opts: OutputFlags & { creator: string; defaultValue?: string; globalEnabled?: string; uri?: string; customData?: string }
  ) => {
    const creator = requireBb1Address(opts.creator, '--creator');
    const value: Record<string, unknown> = { creator, storeId: String(storeId) };
    if (opts.defaultValue !== undefined) value.defaultValue = parseBool(opts.defaultValue, '--default-value');
    if (opts.globalEnabled !== undefined) value.globalEnabled = parseBool(opts.globalEnabled, '--global-enabled');
    if (opts.uri !== undefined) value.uri = opts.uri;
    if (opts.customData !== undefined) value.customData = opts.customData;
    emit({ typeUrl: '/tokenization.MsgUpdateDynamicStore', value }, opts);
  }
);

// ── delete ───────────────────────────────────────────────────────────────────

addOutputFlags(
  dynamicStoresCommand
    .command('delete')
    .description('Emit MsgDeleteDynamicStore.')
    .argument('<store-id>', 'Dynamic store ID')
    .requiredOption('--creator <address>', 'Tx creator')
).action((storeId: string, opts: OutputFlags & { creator: string }) => {
  const creator = requireBb1Address(opts.creator, '--creator');
  emit(
    {
      typeUrl: '/tokenization.MsgDeleteDynamicStore',
      value: { creator, storeId: String(storeId) }
    },
    opts
  );
});

// ── set-value (single) ───────────────────────────────────────────────────────

addOutputFlags(
  dynamicStoresCommand
    .command('set-value')
    .description('Emit MsgSetDynamicStoreValue for a single address.')
    .argument('<store-id>', 'Dynamic store ID')
    .argument('<address>', 'Target address (bb1.../0x — auto-normalized)')
    .argument('<value>', 'Boolean value (true|false)')
    .requiredOption('--creator <address>', 'Tx creator')
).action(
  (storeId: string, address: string, valueStr: string, opts: OutputFlags & { creator: string }) => {
    const creator = requireBb1Address(opts.creator, '--creator');
    const target = requireBb1Address(address, 'address');
    const value = parseBool(valueStr, 'value');
    emit(
      {
        typeUrl: '/tokenization.MsgSetDynamicStoreValue',
        value: { creator, storeId: String(storeId), address: target, value }
      },
      opts
    );
  }
);

// ── add / remove (bulk, multi-msg) ───────────────────────────────────────────

function bulkSetValue(value: boolean) {
  return (storeId: string, rawAddresses: string[], opts: OutputFlags & { creator: string }) => {
    const creator = requireBb1Address(opts.creator, '--creator');
    const addresses = splitCsv(rawAddresses).map((a) => requireBb1Address(a, 'address'));
    if (addresses.length === 0) fail(2, 'at least one address required');
    const messages = addresses.map((address) => ({
      typeUrl: '/tokenization.MsgSetDynamicStoreValue',
      value: { creator, storeId: String(storeId), address, value }
    }));
    emit(messages.length === 1 ? messages[0] : { messages }, opts);
  };
}

addOutputFlags(
  dynamicStoresCommand
    .command('add')
    .description('Bulk-set value=true for one or more addresses (multi-msg tx). Equivalent to multiple MsgSetDynamicStoreValue calls.')
    .argument('<store-id>', 'Dynamic store ID')
    .argument('<addresses...>', 'Target addresses (repeated or comma-separated)')
    .requiredOption('--creator <address>', 'Tx creator')
).action(bulkSetValue(true));

addOutputFlags(
  dynamicStoresCommand
    .command('remove')
    .description('Bulk-set value=false for one or more addresses (multi-msg tx).')
    .argument('<store-id>', 'Dynamic store ID')
    .argument('<addresses...>', 'Target addresses')
    .requiredOption('--creator <address>', 'Tx creator')
).action(bulkSetValue(false));

// ── show (read single) ───────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('show')
      .description('Fetch a single dynamic store record from the indexer.')
      .argument('<store-id>', 'Dynamic store ID')
  )
).action(async (storeId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const res = await callApi('GET', `/dynamicStore/${encodeURIComponent(storeId)}`, opts);
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── get-value (single address lookup) ────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('get-value')
      .description('Look up the value for a single address in the dynamic store.')
      .argument('<store-id>', 'Dynamic store ID')
      .argument('<address>', 'Address to query')
  )
).action(async (storeId: string, address: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const target = requireBb1Address(address, 'address');
    const res = await callApi(
      'GET',
      `/dynamicStore/${encodeURIComponent(storeId)}/value?address=${encodeURIComponent(target)}`,
      opts
    );
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── list-values (paginated) ──────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('list-values')
      .description('Paginated list of (address → value) entries for a dynamic store.')
      .argument('<store-id>', 'Dynamic store ID')
      .option('--bookmark <b>', 'Pagination bookmark')
  )
).action(async (storeId: string, opts: NetworkFlags & OutputFlags & { bookmark?: string }) => {
  try {
    const qs = opts.bookmark ? `?bookmark=${encodeURIComponent(opts.bookmark)}` : '';
    const res = await callApi('GET', `/dynamicStore/${encodeURIComponent(storeId)}/values${qs}`, opts);
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── batch (multi-store fetch) ────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('batch')
      .description('Batch-fetch multiple dynamic stores in one request.')
      .argument('<store-ids...>', 'Store IDs (repeated or comma-separated)')
  )
).action(async (rawIds: string[], opts: NetworkFlags & OutputFlags) => {
  try {
    const ids = splitCsv(rawIds);
    if (ids.length === 0) fail(2, 'at least one store ID required');
    const res = await callApi('POST', '/dynamicStores/fetch', opts, { dynamicStoreIds: ids });
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── activity ─────────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('activity')
      .description('Recent dynamic-store activity feed.')
      .option('--bookmark <b>', 'Pagination bookmark')
  )
).action(async (opts: NetworkFlags & OutputFlags & { bookmark?: string }) => {
  try {
    const qs = opts.bookmark ? `?bookmark=${encodeURIComponent(opts.bookmark)}` : '';
    const res = await callApi('GET', `/dynamicStores/activity${qs}`, opts);
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── search ───────────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('search')
      .description('Free-text search for dynamic stores (URI / customData / creator).')
      .argument('<query>', 'Search text')
      .option('--bookmark <b>', 'Pagination bookmark')
  )
).action(async (query: string, opts: NetworkFlags & OutputFlags & { bookmark?: string }) => {
  try {
    const qs = `?query=${encodeURIComponent(query)}${opts.bookmark ? `&bookmark=${encodeURIComponent(opts.bookmark)}` : ''}`;
    const res = await callApi('GET', `/dynamicStores/search${qs}`, opts);
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});
