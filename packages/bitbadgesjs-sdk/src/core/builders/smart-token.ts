/**
 * Smart Token builder — creates a MsgUniversalUpdateCollection for a Smart Token.
 *
 * A Smart Token is a 1:1 IBC-backed token: users deposit some backing coin
 * (USDC, BADGE, ATOM, ...) and receive an equivalent amount of the
 * collection's token; withdraw burns the token and releases the backing
 * coin back. Variants:
 *   - tradable: adds 'Liquidity Pools' standard tag and a free-transfer
 *     approval for use with on-chain DEX pools.
 *   - aiAgentVault: adds 'AI Agent Vault' standard tag.
 *
 * Vaults are NOT a separate standard — they're Smart Tokens with the
 * cosmosCoinBackedPath invariant. The FE's `SmartAccountLayout` (legacy
 * folder name; the standard tag and display name are "Smart Token") is
 * what users see when they visit a Smart Token collection.
 *
 * @module core/builders/smart-token
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

export interface SmartTokenParams {
  backingCoin: string;
  symbol?: string;
  /** Pre-hosted collection metadata URI. If provided, name/image/description are ignored. */
  uri?: string;
  name?: string;
  description?: string;
  image?: string;
  tradable?: boolean;
  /** Adds the 'AI Agent Vault' standard tag — purely a discovery hint. */
  aiAgentVault?: boolean;
  /**
   * Override the chain-level invariant. Smart Tokens default to LOCKED forceful
   * post-mint transfers (the safer default for vault-like wallets) — set this
   * to `true` only if you need a delegated approval flow that uses
   * `force=true` in MsgTransferTokens.
   */
  allowForcefulPostMintTransfers?: boolean;
}

/** Stable IDs for the deposit/withdraw approvals — matched by `extractSmartTokenDetails`. */
export const SMART_TOKEN_DEPOSIT_APPROVAL_ID = 'smart-token-deposit';
export const SMART_TOKEN_WITHDRAW_APPROVAL_ID = 'smart-token-withdraw';
export const SMART_TOKEN_TRANSFERABLE_APPROVAL_ID = 'smart-token-transferable';

export function buildSmartToken(params: SmartTokenParams): any {
  const coin = resolveCoin(params.backingCoin);
  const backingAddr = generateAliasAddressForIBCBackedDenom(coin.denom);
  const symbol = params.symbol || ('v' + coin.symbol);

  const collectionApprovals: any[] = [
    // Deposit: backing address → user. User sends IBC coin to backing
    // alias; chain auto-mints equivalent Smart Token to the user.
    {
      fromListId: backingAddr,
      toListId: `!${backingAddr}`,
      initiatedByListId: 'All',
      approvalId: SMART_TOKEN_DEPOSIT_APPROVAL_ID,
      ...approvalMetadata(
        'Deposit',
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
    // Withdraw: user → backing address. `fromListId` excludes both Mint
    // AND the backing alias itself so the backing address can't initiate
    // circular unbacks. The colon-separated exclude syntax lets us
    // specify multiple excluded lists in one toListId.
    {
      fromListId: `!Mint:${backingAddr}`,
      toListId: backingAddr,
      initiatedByListId: 'All',
      approvalId: SMART_TOKEN_WITHDRAW_APPROVAL_ID,
      ...approvalMetadata(
        'Withdraw',
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
      approvalId: SMART_TOKEN_TRANSFERABLE_APPROVAL_ID,
      ...approvalMetadata(
        'Transferable',
        'Allow holders to transfer Smart Token units between addresses.'
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
    disablePoolCreation: !params.tradable,
    // Smart Tokens default to LOCKED forceful post-mint transfers. The
    // shared `ibcBackedInvariants()` helper leaves this at false, which
    // bb check flags as CRITICAL — and for wallet-like Smart Tokens
    // that's the right default. Vault/credit-token still use the shared
    // helper directly and are unaffected by this override.
    noForcefulPostMintTransfers: !params.allowForcefulPostMintTransfers
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
    throw new MetadataMissingError('smart-token collectionMetadata', ['name', 'image', 'description']);
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
    tokenMetadata: [tokenMetadataEntry(FOREVER, collectionSource, 'Smart Token unit')],
    collectionPermissions: permissions
  });
}
