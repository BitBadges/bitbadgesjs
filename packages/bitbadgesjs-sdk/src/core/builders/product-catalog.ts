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
  singleTokenMetadata,
  mintToBurnBalances,
  zeroMaxTransfers,
  zeroAmounts
} from './shared.js';

export interface ProductItem {
  name: string;
  price: number; // display units
  denom: string; // USDC, BADGE
  maxSupply?: number; // 0 = unlimited
  burn?: boolean; // burn on purchase
}

export interface ProductCatalogParams {
  products: ProductItem[];
  storeAddress: string; // bb1... payment recipient
  name?: string;
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

  // Per-product metadata: each product gets its own placeholder URI keyed
  // by token id. Accumulate the sidecar entries so the auto-apply flow has
  // full coverage.
  const tokenMetadataAndPlaceholders = products.map((product, i) =>
    singleTokenMetadata(String(i + 1), product.name)
  );
  const tokenMetadata = tokenMetadataAndPlaceholders.map((t) => t.entry);
  const productPlaceholders: Record<string, { name: string; description: string; image: string }> = {};
  for (const t of tokenMetadataAndPlaceholders) {
    productPlaceholders[t.placeholder.uri] = t.placeholder.content;
  }

  return buildMsg({
    collectionApprovals,
    validTokenIds: [{ start: '1', end: String(products.length) }],
    standards: ['Products'],
    collectionPermissions: frozenPermissions(),
    tokenMetadata,
    invariants: {
      noCustomOwnershipTimes: true,
      disablePoolCreation: true
    },
    metadataPlaceholders: productPlaceholders
  });
}
