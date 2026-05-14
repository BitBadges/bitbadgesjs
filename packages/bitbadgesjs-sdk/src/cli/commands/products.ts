/**
 * `bitbadges-cli products` — end-user surface for the Products standard.
 * Mirrors the FE's `ProductCatalogView` (storefront grid + per-product purchase).
 */

import { Command } from 'commander';
import {
  addIndexerNetworkOptions as addNetworkFlags,
  addIndexerOutputOptions as addOutputFlags,
  callIndexer as callApi,
  emitIndexerResult as emit,
  emitIndexerError as emitError,
  type IndexerNetworkFlags as NetworkFlags,
  type IndexerOutputFlags as OutputFlags,
} from '../utils/indexer-options.js';
import { requireBb1AddressStrict } from '../utils/address.js';
import {
  doesCollectionFollowProductCatalogProtocol,
  validateProductCatalogCollection,
  extractAllProducts,
  buildPurchaseProductMsg
} from '../../core/products.js';
import { BitBadgesCollection } from '../../api-indexer/BitBadgesCollection.js';
import { BigIntify } from '../../common/string-numbers.js';
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
  const result = validateProductCatalogCollection(collection);
  if (!result.valid) {
    process.stderr.write(`Error: collection is not a valid Product catalog (failed in ${ctx}):\n`);
    for (const e of result.errors) process.stderr.write(`  - ${e}\n`);
    if (result.warnings.length > 0) {
      process.stderr.write('Warnings:\n');
      for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
    }
    process.exit(2);
  }
  if (result.warnings.length > 0 && process.env.BB_QUIET !== '1') {
    process.stderr.write(`Warnings for ${ctx}:\n`);
    for (const w of result.warnings) process.stderr.write(`  - ${w}\n`);
  }
}

export const productsCommand = new Command('products').description(
  'End-user surface for the Products standard — list / show / purchase. Build new via `bb build product-catalog`.'
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
      const creator = requireBb1AddressStrict(opts.creator, '--creator');
      const collection = await fetchCollection(collectionId, opts);
      validateOrExit(collection, 'products purchase');
      const products = extractAllProducts(collection.collectionApprovals);
      // Reject non-integer --token-id up-front so users get an actionable
      // error instead of the raw `BigInt(...)` SyntaxError.
      if (!/^-?\d+$/.test(opts.tokenId.trim())) {
        process.stderr.write(`Error: --token-id must be a positive integer, got "${opts.tokenId}".\n`);
        process.exit(2);
      }
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

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build product-catalog ...` (the canonical builder) instead.
