/**
 * Smart Account builder — creates a MsgUniversalUpdateCollection for a smart account token.
 * @module core/builders/smart-account
 */
import {
  FOREVER,
  resolveCoin,
  buildMsg,
  buildAliasPath,
  sanitizeCosmosPathName,
  ibcBackedInvariants,
  generateAliasAddressForIBCBackedDenom,
  emptyPermissions,
  alwaysLockedPermission,
  alwaysLockedCollectionApprovalPermission
} from './shared.js';

export interface SmartAccountParams {
  backingCoin: string;
  symbol?: string;
  image?: string;
  tradable?: boolean;
  aiAgentVault?: boolean; // adds 'AI Agent Vault' standard tag
}

export function buildSmartAccount(params: SmartAccountParams): any {
  const coin = resolveCoin(params.backingCoin);
  const backingAddr = generateAliasAddressForIBCBackedDenom(coin.denom);
  const symbol = params.symbol || ('v' + coin.symbol);

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

  const standards = [
    'Smart Token',
    ...(params.tradable ? ['Liquidity Pools'] : []),
    ...(params.aiAgentVault ? ['AI Agent Vault'] : [])
  ];

  const invariants = {
    ...ibcBackedInvariants(coin.denom),
    disablePoolCreation: !params.tradable
  };

  const permissions = {
    ...emptyPermissions(),
    canUpdateCollectionApprovals: [alwaysLockedCollectionApprovalPermission()],
    canAddMoreAliasPaths: [alwaysLockedPermission()],
    canAddMoreCosmosCoinWrapperPaths: [alwaysLockedPermission()]
  };

  // Chain rule: cosmos wrapper path denom AND symbol must match
  // `[a-zA-Z_{}-]+`. Sanitize the user-provided symbol once and
  // derive the denom from the cleaned form so they round-trip through
  // the chain validator without "invalid characters" rejections.
  const cleanSymbol = sanitizeCosmosPathName(symbol, 'symbol');
  const denomStr = 'u' + cleanSymbol.toLowerCase();

  return buildMsg({
    collectionApprovals,
    standards,
    invariants,
    aliasPathsToAdd: [buildAliasPath(denomStr, cleanSymbol, coin.decimals, coin.image)],
    collectionPermissions: permissions
  });
}
