/**
 * Product Catalog builder — creates a MsgUniversalUpdateCollection for a purchasable product catalog.
 * @module core/builders/product-catalog
 */
import {
  BURN_ADDRESS,
  FOREVER,
  resolveCoin,
  toBaseUnits,
  buildMsg,
  frozenPermissions,
  mintToBurnBalances,
  zeroMaxTransfers,
  zeroAmounts,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata
} from './shared.js';

export interface ProductItem {
  name: string;
  price: number; // display units
  denom: string; // USDC, BADGE
  maxSupply?: number; // 0 = unlimited
  burn?: boolean; // burn on purchase
  /** Optional pre-hosted per-product metadata URI. */
  uri?: string;
  description?: string;
  image?: string;
}

export interface ProductCatalogParams {
  products: ProductItem[];
  storeAddress: string; // bb1... payment recipient
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  description?: string;
  image?: string;
}

export function buildProductCatalog(params: ProductCatalogParams): any {
  const { products, storeAddress } = params;
  const randomId = () => Math.random().toString(16).slice(2, 18);

  const purchaseApprovals = products.map((product, i) => {
    const idx = i + 1;
    const coin = resolveCoin(product.denom);
    const basePrice = toBaseUnits(product.price, coin.decimals);
    const tokenIds = [{ start: String(idx), end: String(idx) }];
    const approvalId = `product-purchase-${randomId()}`;

    const predeterminedBalances = {
      ...mintToBurnBalances(),
      incrementedBalances: {
        ...mintToBurnBalances().incrementedBalances,
        startBalances: [{ amount: '1', tokenIds, ownershipTimes: FOREVER }]
      }
    };

    return {
      approvalId,
      ...approvalMetadata(
        'Purchase',
        'Buy this product at the listed price.'
      ),
      fromListId: 'Mint',
      toListId: product.burn ? BURN_ADDRESS : 'All',
      initiatedByListId: 'All',
      transferTimes: FOREVER,
      ownershipTimes: FOREVER,
      tokenIds,
      version: '0',
      approvalCriteria: {
        predeterminedBalances,
        coinTransfers: [
          {
            to: storeAddress,
            coins: [{ amount: basePrice, denom: coin.denom }],
            overrideFromWithApproverAddress: false,
            overrideToWithInitiator: false
          }
        ],
        maxNumTransfers: product.maxSupply
          ? {
              overallMaxNumTransfers: String(product.maxSupply),
              perToAddressMaxNumTransfers: '0',
              perFromAddressMaxNumTransfers: '0',
              perInitiatedByAddressMaxNumTransfers: '0',
              amountTrackerId: approvalId,
              resetTimeIntervals: { startTime: '0', intervalLength: '0' }
            }
          : zeroMaxTransfers(),
        approvalAmounts: zeroAmounts(),
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    };
  });

  // Burn approval: anyone can burn their tokens
  const burnApproval = {
    approvalId: `product-burn-${randomId()}`,
    ...approvalMetadata('Burn', 'Burn product token'),
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    ownershipTimes: FOREVER,
    tokenIds: [{ start: '1', end: String(products.length) }],
    version: '0',
    approvalCriteria: {}
  };

  const collectionApprovals = [...purchaseApprovals, burnApproval];

  // Per-product metadata: each product becomes one tokenMetadata entry
  // keyed by the token id. The product itself supplies name (required);
  // optional `--uri`/`--image`/`--description` flow per product, with
  // the catalog-level image/description as fallback.
  const collectionSource = metadataFromFlat({
    uri: params.uri,
    name: params.name,
    description: params.description,
    image: params.image
  });
  if (!collectionSource) {
    throw new MetadataMissingError('product-catalog collectionMetadata', ['name', 'image', 'description']);
  }

  const tokenMetadata = products.map((product, i) => {
    const idStr = String(i + 1);
    const productSource: any = product.uri
      ? { uri: product.uri }
      : {
          inlineMetadata: {
            name: product.name,
            description: product.description || product.name,
            image: (product.image || params.image) as string
          }
        };
    return tokenMetadataEntry([{ start: idStr, end: idStr }], productSource, `product "${product.name}"`);
  });

  // Empty-products case still needs at least one tokenMetadata entry —
  // emit a single full-range placeholder mirroring the collection.
  if (tokenMetadata.length === 0) {
    tokenMetadata.push(tokenMetadataEntry(FOREVER, collectionSource, 'product placeholder'));
  }

  return buildMsg({
    collectionApprovals,
    validTokenIds: [{ start: '1', end: String(products.length || 1) }],
    standards: ['Products'],
    collectionPermissions: frozenPermissions(),
    collectionMetadata: collectionSource,
    tokenMetadata,
    invariants: {
      noCustomOwnershipTimes: true,
      disablePoolCreation: true
    }
  });
}
