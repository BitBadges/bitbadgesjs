/**
 * Vault builder — creates a MsgUniversalUpdateCollection for a backed vault token.
 * @module core/builders/vault
 */
import {
  FOREVER,
  resolveCoin,
  buildMsg,
  buildAliasPath,
  ibcBackedInvariants,
  generateAliasAddressForIBCBackedDenom,
  emptyPermissions
} from './shared.js';

export interface VaultParams {
  backingCoin: string; // USDC, BADGE, ATOM, OSMO
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
}

export function buildVault(params: VaultParams): any {
  const coin = resolveCoin(params.backingCoin);
  const backingAddr = generateAliasAddressForIBCBackedDenom(coin.denom);
  const symbol = params.symbol || 'v' + coin.symbol;

  const collectionApprovals = [
    // Deposit (backing)
    {
      fromListId: backingAddr,
      toListId: 'All',
      initiatedByListId: 'All',
      approvalId: 'deposit',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustPrioritize: true,
        allowBackedMinting: true,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    },
    // Withdrawal (unbacking)
    {
      fromListId: '!Mint',
      toListId: backingAddr,
      initiatedByListId: 'All',
      approvalId: 'withdrawal',
      transferTimes: FOREVER,
      tokenIds: FOREVER,
      ownershipTimes: FOREVER,
      version: '0',
      approvalCriteria: {
        mustPrioritize: true,
        allowBackedMinting: true,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    }
  ];

  const invariants = {
    ...ibcBackedInvariants(coin.denom),
    disablePoolCreation: true
  };

  return buildMsg({
    collectionApprovals,
    standards: ['Smart Token', 'Vault'],
    invariants,
    aliasPathsToAdd: [buildAliasPath('uvault', symbol, coin.decimals, coin.image)],
    collectionPermissions: emptyPermissions()
  });
}
