/**
 * `bitbadges-cli products` — end-user surface for the Products standard.
 * Mirrors the FE's `ProductCatalogView` (storefront grid + per-product purchase).
 */

import { Command } from 'commander';
import * as fs from 'node:fs';
import { apiRequest, resolveApiKey, resolveBaseUrl } from '../utils/api-client.js';
import { requireBb1Address } from '../utils/address.js';
import {
  doesCollectionFollowProductCatalogProtocol,
  validateProductCatalogCollection,
  extractAllProducts,
  buildPurchaseProductMsg
} from '../../core/products.js';
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
  return cmd.option('--output-file <path>', 'Write to file').option('--condensed', 'Single-line JSON', false);
}
function emit(result: unknown, opts: OutputFlags): void {
  const formatted = opts.condensed ? JSON.stringify(result) : JSON.stringify(result, null, 2);
  if (opts.outputFile) {
    fs.writeFileSync(opts.outputFile, formatted + '\n', 'utf-8');
    process.stderr.write(`Written to ${opts.outputFile}\n`);
  } else process.stdout.write(formatted + '\n');
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
  const raw = res?.collection ?? res;
  if (!raw) return raw;
  try { return new BitBadgesCollection(raw).convert(BigIntify); } catch { return raw; }
}
function validateOrExit(collection: any, ctx: string): void {
  if (!collection) {
    process.stderr.write(`Error: collection not found while running ${ctx}.\n`);
    process.exit(2);
  }
  if (!doesCollectionFollowProductCatalogProtocol(collection)) {
    const r = validateProductCatalogCollection(collection);
    process.stderr.write(`Error: collection is not a valid Product catalog (failed in ${ctx}):\n`);
    for (const e of r.errors) process.stderr.write(`  - ${e}\n`);
    process.exit(2);
  }
}

export const productsCommand = new Command('products').description(
  'End-user surface for the Products standard — list / show / purchase / build.'
);

addOutputFlags(
  addNetworkFlags(
    productsCommand
      .command('list')
      .description('List every product in the catalog (token ID + price + supply + store).')
      .argument('<collection-id>', 'Product Catalog collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'products list');
    const products = extractAllProducts(collection.collectionApprovals).map((p) => ({
      ...p,
      tokenId: p.tokenId.toString(),
      maxSupply: p.maxSupply.toString(),
      priceCoins: p.priceCoins.map((c) => ({ denom: c.denom, amount: c.amount.toString() }))
    }));
    emit({ collectionId: String(collectionId), products }, opts);
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    productsCommand
      .command('show')
      .description('Render a product catalog (same as list, plus collection-level metadata).')
      .argument('<collection-id>', 'Product Catalog collection ID')
  )
).action(async (collectionId: string, opts: NetworkFlags & OutputFlags) => {
  try {
    const collection = await fetchCollection(collectionId, opts);
    validateOrExit(collection, 'products show');
    const products = extractAllProducts(collection.collectionApprovals).map((p) => ({
      ...p,
      tokenId: p.tokenId.toString(),
      maxSupply: p.maxSupply.toString(),
      priceCoins: p.priceCoins.map((c) => ({ denom: c.denom, amount: c.amount.toString() }))
    }));
    emit(
      {
        collectionId: String(collectionId),
        standards: collection.standards ?? [],
        productCount: products.length,
        products
      },
      opts
    );
  } catch (err) {
    emitError(err);
  }
});

addOutputFlags(
  addNetworkFlags(
    productsCommand
      .command('purchase')
      .description('Emit MsgTransferTokens that buys 1 unit of a product. Pipe to `bb deploy`.')
      .argument('<collection-id>', 'Product Catalog collection ID')
      .requiredOption('--creator <address>', 'Buyer address (bb1.../0x — auto-normalized)')
      .requiredOption('--token-id <n>', 'Product token ID to purchase')
  )
).action(
  async (
    collectionId: string,
    opts: NetworkFlags & OutputFlags & { creator: string; tokenId: string }
  ) => {
    try {
      const creator = requireBb1Address(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'products purchase');
      const products = extractAllProducts(collection.collectionApprovals);
      const tokenId = BigInt(opts.tokenId);
      const product = products.find((p) => p.tokenId === tokenId);
      if (!product) {
        process.stderr.write(
          `Error: no product with token ID ${tokenId}. Available: ${products.map((p) => p.tokenId.toString()).join(', ')}.\n`
        );
        process.exit(2);
      }
      emit(buildPurchaseProductMsg(creator, String(collectionId), product), opts);
    } catch (err) {
      emitError(err);
    }
  }
);

productsCommand
  .command('build')
  .description('Alias for `bb build product-catalog` — creator-side: construct a CREATE-COLLECTION tx for a new product catalog.')
  .helpOption(false)
  .allowUnknownOption()
  .allowExcessArguments()
  .action(async () => {
    const { buildCommand } = await import('./build.js');
    const argv = process.argv;
    const startIdx = argv.findIndex((a, i) => a === 'build' && argv[i - 1] === 'products');
    const forward = startIdx >= 0 ? argv.slice(startIdx + 1) : [];
    await buildCommand.parseAsync(['product-catalog', ...forward], { from: 'user' });
  });
