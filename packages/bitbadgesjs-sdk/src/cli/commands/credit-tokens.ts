/**
 * `bitbadges-cli credit-tokens` — end-user surface for the Credit Token
 * standard. Mirrors the FE's `CreditTokenLayout`.
 *
 *   credit-tokens list <collection>          List all credit-* tiers
 *   credit-tokens show <collection>          Render details + status
 *   credit-tokens purchase <collection>      Buy N units via the scaled tier
 *   credit-tokens build                      Alias for `bb build credit-token`
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';
import {
  doesCollectionFollowCreditTokenProtocol,
  extractCreditTokenTiers,
  buildPurchaseCreditTokenMsg
} from '../../core/credit-tokens.js';

interface NetworkFlags { testnet?: boolean; local?: boolean; url?: string; apiKey?: string; }
interface OutputFlags { outputFile?: string; condensed?: boolean; }

function addNetworkFlags(cmd: Command): Command {
  return cmd
    .option('--testnet', 'Use testnet API', false)
    .option('--local', 'Use local API (localhost:3001)', false)
    .option('--url <url>', 'Custom API base URL (overrides --testnet/--local/config)')
    .option('--api-key <key>', 'BitBadges API key (overrides BITBADGES_API_KEY env)');
}

function addOutputFlags(cmd: Command): Command {
  return cmd
    .option('--output-file <path>', 'Write output to file instead of stdout')
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

function emitError(err: unknown): never {
  const e = err as { message?: string; response?: unknown; hint?: string };
  if (e?.response !== undefined) process.stderr.write(JSON.stringify(e.response, null, 2) + '\n');
  else process.stderr.write(`Error: ${e?.message ?? String(err)}\n`);
  if (e?.hint) process.stderr.write(`Hint: ${e.hint}\n`);
  process.exit(1);
}

async function callApi(method: 'GET' | 'POST', path: string, opts: NetworkFlags, body?: unknown): Promise<any> {
  const network = opts.testnet ? 'testnet' : opts.local ? 'local' : 'mainnet';
  const apiKey = resolveApiKey(opts.apiKey, network);
  const baseUrl = resolveBaseUrl({ testnet: opts.testnet, local: opts.local, baseUrl: opts.url });
  return apiRequest({ method, path, body, apiKey, baseUrl });
}

async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  const res = await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts);
  return res?.collection ?? res;
}

function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  if (!doesCollectionFollowCreditTokenProtocol(collection)) {
    process.stderr.write(
      `Error: collection is not a valid Credit Token collection (failed in ${ctx}). Pass a collection whose standards include "Credit Token" or has credit-* approvals.\n`
    );
    process.exit(2);
  }
}

// ── credit-tokens (parent) ────────────────────────────────────────────────

export const creditTokensCommand = new Command('credit-tokens').description(
  'End-user surface for the Credit Token standard — list tiers / show / purchase / build.'
);

addOutputFlags(
  addNetworkFlags(
    creditTokensCommand
      .command('list')
      .description('List all credit-* mint tiers in a collection.')
      .argument('<collection-id>', 'Credit Token collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'credit-tokens list');
    const tiers = extractCreditTokenTiers(collection.collectionApprovals);
    emit({ collectionId: String(collectionId), tiers }, opts);
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    creditTokensCommand
      .command('show')
      .description('Render Credit Token collection details (symbol, decimals, alias path, tiers).')
      .argument('<collection-id>', 'Credit Token collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'credit-tokens show');
    const tiers = extractCreditTokenTiers(collection.collectionApprovals);
    const aliasPath = (collection.aliasPaths ?? collection.aliasPathsToAdd ?? [])[0];
    emit(
      {
        collectionId: String(collectionId),
        standards: collection.standards ?? [],
        denom: aliasPath?.denom ?? null,
        symbol: aliasPath?.symbol ?? null,
        decimals: aliasPath?.decimals ?? null,
        tiers
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    creditTokensCommand
      .command('purchase')
      .description('Emit MsgTransferTokens that buys N units of credit tokens. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Credit Token collection ID')
      .requiredOption('--creator <address>', 'Buyer address (bb1.../0x — auto-normalized)')
      .requiredOption('--units <n>', 'Number of units to purchase (integer)')
      .option(
        '--tier <approvalId>',
        'Tier approval id (default: the credit-scaled tier; required if only legacy per-tier approvals exist)'
      )
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; units: string; tier?: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'credit-tokens purchase');
      const tiers = extractCreditTokenTiers(collection.collectionApprovals);
      if (tiers.length === 0) {
        process.stderr.write('Error: collection has no credit-* approvals.\n');
        process.exit(2);
      }
      let tier = opts.tier ? tiers.find((t) => t.approvalId === opts.tier) : tiers.find((t) => t.isScaled) ?? tiers[0];
      if (!tier) {
        process.stderr.write(
          `Error: no matching tier. Available: ${tiers.map((t) => t.approvalId).join(', ')}.\n`
        );
        process.exit(2);
      }
      const units = BigInt(opts.units);
      emit(buildPurchaseCreditTokenMsg(creator, String(collectionId), tier, units), opts);
    } catch (err) {
      emitError(err);
    }
  }
);

creditTokensCommand
  .command('build')
  .description('Alias for `bb build credit-token` — creator-side: construct a CREATE-COLLECTION tx for a new Credit Token.')
  .helpOption(false)
  .allowUnknownOption()
  .allowExcessArguments()
  .action(async () => {
    const { buildCommand } = await import('./build.js');
    const argv = process.argv;
    const startIdx = argv.findIndex((a, i) => a === 'build' && argv[i - 1] === 'credit-tokens');
    const forward = startIdx >= 0 ? argv.slice(startIdx + 1) : [];
    await buildCommand.parseAsync(['credit-token', ...forward], { from: 'user' });
  });
