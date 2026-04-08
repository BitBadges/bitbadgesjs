/**
 * Smart Account builder — creates a MsgUniversalUpdateCollection for a smart account token.
 * @module core/builders/smart-account
 */
import {
  FOREVER,
  resolveCoin,
  buildMsg,
  buildAliasPath,
  ibcBackedInvariants,
  generateAliasAddressForIBCBackedDenom,
  emptyPermissions,
  alwaysLockedPermission
} from './shared.js';

export interface SmartAccountParams {
  backingCoin: string;
  symbol?: string;
  image?: string;
  tradable?: boolean;
}

export function buildSmartAccount(params: SmartAccountParams): any {
  const coin = resolveCoin(params.backingCoin);
  const backingAddr = generateAliasAddressForIBCBackedDenom(coin.denom);
  const symbol = params.symbol || coin.symbol;

  const collectionApprovals: any[] = [
    // Backing
    {
      fromListId: backingAddr,
      toListId: `!${backingAddr}`,
      initiatedByListId: 'All',
      approvalId: 'smart-token-backing',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustPrioritize: true,
        allowBackedMinting: true
      }
    },
    // Unbacking
    {
      fromListId: '!Mint',
      toListId: backingAddr,
      initiatedByListId: 'All',
      approvalId: 'smart-token-unbacking',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustPrioritize: true,
        allowBackedMinting: true
      }
    }
  ];

  // Transferable approval (only if tradable)
  if (params.tradable) {
    collectionApprovals.push({
      fromListId: '!Mint',
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'free-transfer',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {}
    });
  }

  const standards = ['Smart Token', ...(params.tradable ? ['Liquidity Pools'] : [])];

  const invariants = {
    ...ibcBackedInvariants(coin.denom),
    disablePoolCreation: !params.tradable
  };

  const permissions = {
    ...emptyPermissions(),
    canUpdateCollectionApprovals: [alwaysLockedPermission()],
    canAddMoreAliasPaths: [alwaysLockedPermission()],
    canAddMoreCosmosCoinWrapperPaths: [alwaysLockedPermission()]
  };

  const denomStr = 'u' + symbol.toLowerCase();

  return buildMsg({
    collectionApprovals,
    standards,
    invariants,
    aliasPathsToAdd: [buildAliasPath(denomStr, symbol, coin.decimals, coin.image)],
    collectionPermissions: permissions
  });
}
