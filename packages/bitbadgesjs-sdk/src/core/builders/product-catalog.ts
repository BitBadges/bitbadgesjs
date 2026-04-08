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

  const purchaseApprovals = products.map((product, i) => {
    const idx = i + 1;
    const coin = resolveCoin(product.denom);
    const basePrice = toBaseUnits(product.price, coin.decimals);
    const tokenIds = [{ start: String(idx), end: String(idx) }];

    const predeterminedBalances = {
      ...mintToBurnBalances(),
      incrementedBalances: {
        ...mintToBurnBalances().incrementedBalances,
        startBalances: [{ amount: '1', tokenIds, ownershipTimes: FOREVER }]
      }
    };

    return {
      approvalId: `purchase-${idx}`,
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
              amountTrackerId: `purchase-${idx}-tracker`,
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
    approvalId: 'burn',
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

  const tokenMetadata = products.map((product, i) => singleTokenMetadata(String(i + 1), product.name));

  return buildMsg({
    collectionApprovals,
    validTokenIds: [{ start: '1', end: String(products.length) }],
    standards: ['Products'],
    collectionPermissions: frozenPermissions(),
    tokenMetadata,
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    }
  });
}
