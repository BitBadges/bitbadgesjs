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

  // 1. Paired Mint — mint both YES and NO by depositing USDC
  const pairedMint = {
    approvalId: 'paired-mint',
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
    approvalId: 'free-transfer',
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
    approvalId: 'pre-redeem',
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
      // maxNumTransfers to set at least one non-zero limit.
      maxNumTransfers: {
        overallMaxNumTransfers: '0',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '1',
        amountTrackerId: 'pm-buy',
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      requireFromEqualsInitiatedBy: true,
      overridesFromOutgoingApprovals: true,
      overridesToIncomingApprovals: true
    }
  };

  // 4-7. Settlement outcomes
  function settlementApproval(
    approvalId: string,
    tokenIds: any[],
    proposalId: string,
    coinAmount: string
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
        predeterminedBalances: scalingBalances('1'),
        coinTransfers: [
          {
            to: '',
            coins: [{ amount: coinAmount, denom: coin.denom }],
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
            voters: [{ address: params.verifier, weight: '100' }]
          }
        ],
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }
    };
  }

  const settleYes = settlementApproval('settle-yes', yesTokenIds, 'settlement-yes', '1');
  const settleNo = settlementApproval('settle-no', noTokenIds, 'settlement-no', '1');
  const settlePushYes = settlementApproval('settle-push-yes', yesTokenIds, 'settlement-push-yes', '1');
  const settlePushNo = settlementApproval('settle-push-no', noTokenIds, 'settlement-push-no', '1');

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
