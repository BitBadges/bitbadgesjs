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
import { addDeployOptions, runEmitOrDeploy } from '../utils/deploy-options.js';
import { normalizeCollection, validateCollectionOrExit } from '../utils/collection-options.js';
import {
  doesCollectionFollowProductCatalogProtocol,
  validateProductCatalogCollection,
  extractAllProducts,
  buildPurchaseProductMsg
} from '../../core/products.js';
async function fetchCollection(collectionId: string, opts: NetworkFlags): Promise<any> {
  return normalizeCollection(await callApi('GET', `/collection/${encodeURIComponent(collectionId)}`, opts));
}
function validateOrExit(collection: any, ctx: string): void {
  validateCollectionOrExit(collection, ctx, validateProductCatalogCollection, 'Product catalog');
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

addDeployOptions(
  addOutputFlags(
    addNetworkFlags(
      productsCommand
        .command('purchase')
        .description('Buy 1 unit of a product. Emits MsgTransferTokens (pipe to `bb deploy`) or broadcast inline with --browser/--burner.')
        .argument('<collection-id>', 'Product Catalog collection ID')
        .requiredOption('--creator <address>', 'Buyer address (bb1.../0x — auto-normalized)')
        .requiredOption('--token-id <n>', 'Product token ID to purchase')
    )
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
      await runEmitOrDeploy(buildPurchaseProductMsg(creator, String(collectionId), product), opts, {
        emit: (m) => emit(m, opts),
        expectedAddress: creator
      });
    } catch (err) {
      emitError(err);
    }
  }
).addHelpText('after', `
Examples:
  $ bb products purchase 12 --creator bb1buyer...xyz --token-id 3 | bb deploy
`);

// Per-standard `build` subcommand removed in CLI v2 (#0399).
// Use `bb build product-catalog ...` (the canonical builder) instead.
