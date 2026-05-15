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
 * Read subcommands hit the indexer's on-chain endpoints (NOT the
 * /dynamicStore/* family — those are off-chain claim-state stores
 * gated behind Blockin auth, different concept):
 *
 *   show          GET  /onChainDynamicStore/<id>
 *   get-value     GET  /onChainDynamicStore/<id>/value/<address>
 *   list-values   GET  /onChainDynamicStore/<id>/values
 *   by-creator    GET  /onChainDynamicStores/by-creator/<address>
 *   search        GET  /onChainDynamicStores/search?name=<q>
 *
 * There is no batch fetch or activity feed on-chain. `batch` is
 * implemented client-side as N parallel `show` calls.
 *
 * The model: each store maps `address → boolean`. `defaultValue` controls
 * the answer for addresses NOT explicitly set. So "add address to allowlist"
 * is `set-value <store> <addr> true` (or `add <store> <addr> ...` for
 * bulk); "remove" is `set-value ... false` (or `remove ...`).
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1Address, requireBb1AddressStrict } from '../utils/address.js';
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';

function fail(code: number, msg: string): never {
  process.stderr.write(`Error: ${msg}\n`);
  process.exit(code);
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

addDeployOptions(
addNetworkFlags(
addOutputFlags(
  dynamicStoresCommand
    .command('create')
    .description('Emit MsgCreateDynamicStore. Pipe to `bb deploy` to broadcast.')
    .requiredOption('--creator <address>', 'Store creator (bb1.../0x — auto-normalized)')
    .option('--default-value <bool>', 'Default value for addresses not explicitly set. true|false (default false)', 'false')
    .option('--uri <uri>', 'Optional metadata URI')
    .option('--custom-data <text>', 'Optional custom data string')
))).action(async (opts: NetworkFlags & OutputFlags & { creator: string; defaultValue: string; uri?: string; customData?: string }) => {
  const creator = requireBb1AddressStrict(opts.creator, '--creator');
  const defaultValue = parseBool(opts.defaultValue, '--default-value');
  await runEmitOrDeploy(
    {
      typeUrl: '/tokenization.MsgCreateDynamicStore',
      value: {
        creator,
        defaultValue,
        ...(opts.uri !== undefined ? { uri: opts.uri } : {}),
        ...(opts.customData !== undefined ? { customData: opts.customData } : {})
      }
    },
    opts as any,
    { emit: (m) => emit(m, opts), expectedAddress: creator }
  );
}).addHelpText('after', `
Examples:
  $ bb dynamic-stores create --creator bb1owner...xyz --default-value false | bb deploy
  $ bb dynamic-stores create --creator bb1owner...xyz --uri https://example.com/store.json --custom-data "kyc-allowlist" | bb deploy
`);

// ── update ───────────────────────────────────────────────────────────────────

addDeployOptions(
addNetworkFlags(
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
))).action(
  async (
    storeId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; defaultValue?: string; globalEnabled?: string; uri?: string; customData?: string }
  ) => {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const value: Record<string, unknown> = { creator, storeId: String(storeId) };
    if (opts.defaultValue !== undefined) value.defaultValue = parseBool(opts.defaultValue, '--default-value');
    if (opts.globalEnabled !== undefined) value.globalEnabled = parseBool(opts.globalEnabled, '--global-enabled');
    if (opts.uri !== undefined) value.uri = opts.uri;
    if (opts.customData !== undefined) value.customData = opts.customData;
    await runEmitOrDeploy({ typeUrl: '/tokenization.MsgUpdateDynamicStore', value }, opts as any, { emit: (m) => emit(m, opts), expectedAddress: creator });
  }
).addHelpText('after', `
Examples:
  $ bb dynamic-stores update 9 --creator bb1owner...xyz --global-enabled false | bb deploy
  $ bb dynamic-stores update 9 --creator bb1owner...xyz --uri https://example.com/v2.json | bb deploy
`);

// ── delete ───────────────────────────────────────────────────────────────────

addDeployOptions(
addNetworkFlags(
addOutputFlags(
  dynamicStoresCommand
    .command('delete')
    .description('Emit MsgDeleteDynamicStore.')
    .argument('<store-id>', 'Dynamic store ID')
    .requiredOption('--creator <address>', 'Tx creator')
))).action(async (storeId: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
  const creator = requireBb1AddressStrict(opts.creator, '--creator');
  await runEmitOrDeploy(
    {
      typeUrl: '/tokenization.MsgDeleteDynamicStore',
      value: { creator, storeId: String(storeId) }
    },
    opts as any,
    { emit: (m) => emit(m, opts), expectedAddress: creator }
  );
}).addHelpText('after', `
Examples:
  $ bb dynamic-stores delete 9 --creator bb1owner...xyz | bb deploy
`);

// ── set-value (single) ───────────────────────────────────────────────────────

addDeployOptions(
addNetworkFlags(
addOutputFlags(
  dynamicStoresCommand
    .command('set-value')
    .description('Emit MsgSetDynamicStoreValue for a single address.')
    .argument('<store-id>', 'Dynamic store ID')
    .argument('<address>', 'Target address (bb1.../0x — auto-normalized)')
    .argument('<value>', 'Boolean value (true|false)')
    .requiredOption('--creator <address>', 'Tx creator')
))).action(
  async (storeId: string, address: string, valueStr: string, opts: NetworkFlags & OutputFlags & { creator: string }) => {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const target = requireBb1AddressStrict(address, '<address> argument');
    const value = parseBool(valueStr, 'value');
    await runEmitOrDeploy(
      {
        typeUrl: '/tokenization.MsgSetDynamicStoreValue',
        value: { creator, storeId: String(storeId), address: target, value }
      },
      opts as any,
      { emit: (m) => emit(m, opts), expectedAddress: creator }
    );
  }
).addHelpText('after', `
Examples:
  $ bb dynamic-stores set-value 9 bb1user...xyz true --creator bb1owner...xyz | bb deploy
`);

// ── add / remove (bulk, multi-msg) ───────────────────────────────────────────

function bulkSetValue(value: boolean) {
  return (storeId: string, rawAddresses: string[], opts: OutputFlags & { creator: string }) => {
    const creator = requireBb1AddressStrict(opts.creator, '--creator');
    const addresses = splitCsv(rawAddresses).map((a) => requireBb1AddressStrict(a, '<addresses> argument'));
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
).action(bulkSetValue(true)).addHelpText('after', `
Examples:
  $ bb dynamic-stores add 9 bb1user1...xyz bb1user2...xyz --creator bb1owner...xyz | bb deploy
  $ bb dynamic-stores add 9 bb1user1...xyz,bb1user2...xyz --creator bb1owner...xyz | bb deploy
`);

addOutputFlags(
  dynamicStoresCommand
    .command('remove')
    .description('Bulk-set value=false for one or more addresses (multi-msg tx).')
    .argument('<store-id>', 'Dynamic store ID')
    .argument('<addresses...>', 'Target addresses')
    .requiredOption('--creator <address>', 'Tx creator')
).action(bulkSetValue(false)).addHelpText('after', `
Examples:
  $ bb dynamic-stores remove 9 bb1user1...xyz bb1user2...xyz --creator bb1owner...xyz | bb deploy
`);

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
    const res = await callApi('GET', `/onChainDynamicStore/${encodeURIComponent(storeId)}`, opts);
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
      `/onChainDynamicStore/${encodeURIComponent(storeId)}/value/${encodeURIComponent(target)}`,
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
    const res = await callApi('GET', `/onChainDynamicStore/${encodeURIComponent(storeId)}/values${qs}`, opts);
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── batch (no on-chain batch endpoint — fan out client-side) ────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('batch')
      .description('Fetch multiple on-chain dynamic stores. Implemented as parallel show calls (no native batch endpoint).')
      .argument('<store-ids...>', 'Store IDs (repeated or comma-separated)')
  )
).action(async (rawIds: string[], opts: NetworkFlags & OutputFlags) => {
  try {
    const ids = splitCsv(rawIds);
    if (ids.length === 0) fail(2, 'at least one store ID required');
    const stores = await Promise.all(ids.map(async (id) => {
      try {
        const res = await callApi('GET', `/onChainDynamicStore/${encodeURIComponent(id)}`, opts);
        return { storeId: id, ...res };
      } catch (err: any) {
        return { storeId: id, error: err?.message ?? String(err) };
      }
    }));
    emit({ stores }, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});

// ── by-creator ───────────────────────────────────────────────────────────────

addOutputFlags(
  addNetworkFlags(
    dynamicStoresCommand
      .command('by-creator')
      .description('List on-chain dynamic stores created by a specific address.')
      .argument('<address>', 'Creator address (bb1.../0x — auto-normalized)')
  )
).action(async (address: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const target = requireBb1Address(address, 'address');
    const res = await callApi('GET', `/onChainDynamicStores/by-creator/${encodeURIComponent(target)}`, opts);
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
      .description('Search on-chain dynamic stores by name (URI metadata). Min 2 chars.')
      .argument('<name>', 'Search text (matched against store name)')
  )
).action(async (name: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const qs = `?name=${encodeURIComponent(name)}`;
    const res = await callApi('GET', `/onChainDynamicStores/search${qs}`, opts);
    emit(res, opts);
  } catch (err: any) {
    fail(1, err?.message ?? String(err));
  }
});
