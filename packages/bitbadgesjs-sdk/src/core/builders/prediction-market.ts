/**
 * Prediction Market builder — creates a MsgUniversalUpdateCollection for a binary prediction market.
 * @module core/builders/prediction-market
 */
import {
  MAX_UINT64,
  BURN_ADDRESS,
  FOREVER,
  resolveCoin,
  buildMsg,
  buildAliasPath,
  frozenPermissions,
  scalingBalances,
  singleTokenMetadata
} from './shared.js';

export interface PredictionMarketParams {
  verifier: string; // bb1... resolver address
  denom?: string; // payment coin, defaults to USDC (use BADGE for testnet)
  name?: string;
  description?: string;
  image?: string;
}

export function buildPredictionMarket(params: PredictionMarketParams): any {
  const coin = resolveCoin(params.denom || 'USDC');
  const bothTokenIds = [{ start: '1', end: '2' }];
  const yesTokenIds = [{ start: '1', end: '1' }];
  const noTokenIds = [{ start: '2', end: '2' }];

  const randomId = () => Math.random().toString(16).slice(2, 18);
  const mintId = randomId();
  const transferId = randomId();
  const redeemId = randomId();
  const settleYesId = randomId();
  const settleNoId = randomId();
  const settlePushYesId = randomId();
  const settlePushNoId = randomId();

  // 1. Paired Mint — mint both YES and NO by depositing USDC
  const pairedMint = {
    approvalId: `pm-mint-${mintId}`,
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    ownershipTimes: FOREVER,
    tokenIds: bothTokenIds,
    version: '0',
    approvalCriteria: {
      predeterminedBalances: {
        ...scalingBalances('1', MAX_UINT64),
        incrementedBalances: {
          ...scalingBalances('1', MAX_UINT64).incrementedBalances,
          startBalances: [{ amount: '1', tokenIds: bothTokenIds, ownershipTimes: FOREVER }]
        }
      },
      coinTransfers: [
        {
          to: 'Mint',
          coins: [{ amount: '1', denom: coin.denom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true,
      requireToEqualsInitiatedBy: true
    }
  };

  // 2. Free transfer — tokens are freely transferable
  const freeTransfer = {
    approvalId: `pm-transfer-${transferId}`,
    fromListId: '!Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    ownershipTimes: FOREVER,
    tokenIds: bothTokenIds,
    version: '0',
    approvalCriteria: {}
  };

  // 3. Pre-Settlement Redeem — burn both YES+NO to get USDC back
  const preRedeem = {
    approvalId: `pm-redeem-${redeemId}`,
    fromListId: '!Mint',
    toListId: BURN_ADDRESS,
    initiatedByListId: 'All',
    transferTimes: FOREVER,
    ownershipTimes: FOREVER,
    tokenIds: bothTokenIds,
    version: '0',
    approvalCriteria: {
      predeterminedBalances: {
        ...scalingBalances('1', MAX_UINT64),
        incrementedBalances: {
          ...scalingBalances('1', MAX_UINT64).incrementedBalances,
          startBalances: [{ amount: '1', tokenIds: bothTokenIds, ownershipTimes: FOREVER }]
        }
      },
      coinTransfers: [
        {
          to: '',
          coins: [{ amount: '1', denom: coin.denom }],
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true
        }
      ],
      // Chain rule: overrideFromWithApproverAddress requires
      // maxNumTransfers to set at least one non-zero limit. Pre-redeem
      // is unbounded (any holder can redeem any number of pairs) so we
      // set overall to MAX_UINT64 rather than capping per initiator.
      // Frontend PredictionMarketRegistry uses the same shape.
      maxNumTransfers: {
        overallMaxNumTransfers: MAX_UINT64,
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: `pm-redeem-${redeemId}`,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      requireFromEqualsInitiatedBy: true,
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true
    }
  };

  // 4-7. Settlement outcomes. `burnAmount` is the number of tokens
  // consumed per 1 coin of payout — 1 for a winning side (burn 1,
  // get 1 back) and 2 for a push (burn 2, get 1 back). `allowAmountScaling: true`
  // lets holders scale to whatever balance they actually hold, so
  // the numbers here encode the ratio, not a hard minimum.
  // Matches PredictionMarketRegistry.settlementApproval() in the
  // frontend: `burnAmount = isPush ? depositAmount * 2n : depositAmount`.
  function settlementApproval(
    approvalId: string,
    tokenIds: any[],
    proposalId: string,
    burnAmount: string,
    payoutAmount: string
  ) {
    return {
      approvalId,
      fromListId: '!Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: 'All',
      transferTimes: FOREVER,
      ownershipTimes: FOREVER,
      tokenIds,
      version: '0',
      approvalCriteria: {
        predeterminedBalances: scalingBalances(burnAmount),
        coinTransfers: [
          {
            to: '',
            coins: [{ amount: payoutAmount, denom: coin.denom }],
            overrideFromWithApproverAddress: true,
            overrideToWithInitiator: true
          }
        ],
        // Chain rule: overrideFromWithApproverAddress requires
        // maxNumTransfers to set at least one non-zero limit. Each
        // settlement claim per holder.
        maxNumTransfers: {
          overallMaxNumTransfers: '0',
          perToAddressMaxNumTransfers: '0',
          perFromAddressMaxNumTransfers: '0',
          perInitiatedByAddressMaxNumTransfers: '1',
          amountTrackerId: approvalId,
          resetTimeIntervals: { startTime: '0', intervalLength: '0' }
        },
        votingChallenges: [
          {
            proposalId,
            quorumThreshold: '100',
            voters: [{ address: params.verifier, weight: '1' }]
          }
        ],
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    };
  }

  // Win: burn 1 token → 1 coin. Push: burn 2 tokens → 1 coin.
  const settleYes = settlementApproval(`pm-settle-yes-${settleYesId}`, yesTokenIds, `pm-settle-yes-${settleYesId}`, '1', '1');
  const settleNo = settlementApproval(`pm-settle-no-${settleNoId}`, noTokenIds, `pm-settle-no-${settleNoId}`, '1', '1');
  const settlePushYes = settlementApproval(`pm-settle-push-yes-${settlePushYesId}`, yesTokenIds, `pm-settle-push-yes-${settlePushYesId}`, '2', '1');
  const settlePushNo = settlementApproval(`pm-settle-push-no-${settlePushNoId}`, noTokenIds, `pm-settle-push-no-${settlePushNoId}`, '2', '1');

  const collectionApprovals = [pairedMint, freeTransfer, preRedeem, settleYes, settleNo, settlePushYes, settlePushNo];

  const yesToken = singleTokenMetadata('1', 'YES', params.description, params.image);
  const noToken = singleTokenMetadata('2', 'NO', params.description, params.image);
  const tokenMetadata = [yesToken.entry, noToken.entry];

  return buildMsg({
    collectionApprovals,
    validTokenIds: [{ start: '1', end: '2' }],
    standards: ['Prediction Market'],
    collectionPermissions: frozenPermissions(),
    tokenMetadata,
    metadataPlaceholders: {
      [yesToken.placeholder.uri]: yesToken.placeholder.content,
      [noToken.placeholder.uri]: noToken.placeholder.content
    },
    invariants: {
      noCustomOwnershipTimes: true,
      maxSupplyPerId: '0',
      noForcefulPostMintTransfers: false,
      disablePoolCreation: false
    },
    aliasPathsToAdd: [
      buildAliasPath('uyes', 'YES', coin.decimals),
      buildAliasPath('uno', 'NO', coin.decimals)
    ]
  });
}
