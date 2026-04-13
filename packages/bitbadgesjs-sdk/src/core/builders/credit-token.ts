/**
 * Credit Token builder — creates a MsgUniversalUpdateCollection for a purchasable credit/point token.
 * @module core/builders/credit-token
 */
import {
  MAX_UINT64,
  FOREVER,
  resolveCoin,
  buildMsg,
  buildAliasPath,
  sanitizeCosmosPathName,
  frozenPermissions,
  scalingBalances
} from './shared.js';

export interface CreditTokenParams {
  paymentDenom: string; // USDC, BADGE
  recipient: string; // bb1... payment recipient
  symbol?: string; // default "CREDIT"
  tokensPerUnit?: number; // tokens per 1 display unit of payment, default 100
  name?: string;
}

export function buildCreditToken(params: CreditTokenParams): any {
  const coin = resolveCoin(params.paymentDenom);
  const tokensPerUnit = params.tokensPerUnit ?? 100;
  // Same chain regex as smart-account / vault — strip non-allowed
  // characters before deriving the lowercase denom. See sanitizeCosmosPathName.
  const symbol = sanitizeCosmosPathName(params.symbol || 'CREDIT', 'symbol');

  const creditMint = {
    approvalId: 'credit-mint',
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    ownershipTimes: FOREVER,
    tokenIds: [{ start: '1', end: '1' }],
    version: '0',
    approvalCriteria: {
      predeterminedBalances: {
        ...scalingBalances(String(tokensPerUnit), MAX_UINT64),
        incrementedBalances: {
          ...scalingBalances(String(tokensPerUnit), MAX_UINT64).incrementedBalances,
          startBalances: [{ amount: String(tokensPerUnit), tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }]
        }
      },
      coinTransfers: [
        {
          to: params.recipient,
          coins: [{ amount: '1', denom: coin.denom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      overridesFromOutgoingApprovals: true,
      mustPrioritize: true
    }
  };

  return buildMsg({
    collectionApprovals: [creditMint],
    validTokenIds: [{ start: '1', end: '1' }],
    standards: ['Credit Token'],
    collectionPermissions: frozenPermissions(),
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: true
    },
    aliasPathsToAdd: [buildAliasPath('u' + symbol.toLowerCase(), symbol, coin.decimals)]
  });
}
