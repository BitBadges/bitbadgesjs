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
  baselinePermissions,
  alwaysLockedPermission,
  alwaysLockedCollectionApprovalPermission,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata
} from './shared.js';

export interface SmartAccountParams {
  backingCoin: string;
  symbol?: string;
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  description?: string;
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
      approvalId: 'smart-account-backing',
      ...approvalMetadata(
        'Deposit Approval',
        'Allows deposits by sending tokens to the backing address.'
      ),
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustPrioritize: true,
        allowBackedMinting: true
      }
    },
    // Unbacking. `fromListId` excludes both Mint AND the backing alias
    // itself so the backing address can't initiate circular unbacks.
    // The colon-separated exclude syntax is how the chain allows
    // specifying multiple excluded lists.
    {
      fromListId: `!Mint:${backingAddr}`,
      toListId: backingAddr,
      initiatedByListId: 'All',
      approvalId: 'smart-account-unbacking',
      ...approvalMetadata(
        'Withdraw Approval',
        'Allows withdrawals by receiving tokens from the backing address.'
      ),
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
      approvalId: 'transferable-approval',
      ...approvalMetadata(
        'Transferable',
        'Allow holders to transfer smart account tokens between addresses.'
      ),
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
    ...baselinePermissions(),
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
  const collectionSource = metadataFromFlat({
    uri: params.uri,
    name: params.name,
    description: params.description,
    image: params.image
  });
  if (!collectionSource) {
    throw new MetadataMissingError('smart-account collectionMetadata', ['name', 'image', 'description']);
  }
  const aliasPath = buildAliasPath({
    denom: denomStr,
    symbol: cleanSymbol,
    decimals: coin.decimals,
    pathMetadata: collectionSource,
    unitMetadata: collectionSource
  });

  return buildMsg({
    collectionApprovals,
    standards,
    invariants,
    aliasPathsToAdd: [aliasPath],
    collectionMetadata: collectionSource,
    tokenMetadata: [tokenMetadataEntry(FOREVER, collectionSource, 'smart account token')],
    collectionPermissions: permissions
  });
}
