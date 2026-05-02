/**
 * Prediction Market Sell Intent — user outgoing approval to sell YES/NO tokens.
 *
 * The creator sells a specified amount of YES or NO tokens from a prediction
 * market collection and receives payment in return.
 *
 * @module core/builders/pm-sell-intent
 */
import {
  FOREVER,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  uniqueId,
  buildUserApprovalMsg,
  approvalMetadata
} from './shared.js';

export interface PmSellIntentParams {
  address: string; // seller bb1... address
  collectionId: string; // prediction market collection ID
  token: 'yes' | 'no'; // which outcome token to sell
  amount: number; // number of tokens to sell (display units)
  price: number; // total payment amount (display units)
  denom: string; // payment coin (USDC, BADGE)
  expiration?: string; // duration shorthand, default "7d"
}

export function buildPmSellIntent(params: PmSellIntentParams): any {
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw new Error(
      `buildPmSellIntent: amount must be a positive integer (got ${params.amount}). Prediction market tokens are unitless counts, not fractional.`
    );
  }
  const coin = resolveCoin(params.denom);
  const basePrice = toBaseUnits(params.price, coin.decimals);
  const expirationTs = durationToTimestamp(params.expiration || '7d');
  const id = uniqueId('pm-sell');
  const tokenId = params.token === 'yes' ? '1' : '2';

  const approval = {
    approvalId: id,
    ...approvalMetadata(
      'Sell prediction tokens',
      'Offer prediction market outcome tokens for sale at a fixed price.'
    ),
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: expirationTs }],
    tokenIds: [{ start: tokenId, end: tokenId }],
    ownershipTimes: FOREVER,
    version: '0',
    approvalCriteria: {
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [{ amount: String(params.amount), tokenIds: [{ start: tokenId, end: tokenId }], ownershipTimes: FOREVER }],
          incrementTokenIdsBy: '0',
          incrementOwnershipTimesBy: '0',
          durationFromTimestamp: '0',
          allowOverrideTimestamp: false,
          recurringOwnershipTimes: { startTime: '0', intervalLength: '0', chargePeriodLength: '0' },
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: '0'
        },
        orderCalculationMethod: {
          useOverallNumTransfers: true,
          usePerToAddressNumTransfers: false,
          usePerFromAddressNumTransfers: false,
          usePerInitiatedByAddressNumTransfers: false,
          useMerkleChallengeLeafIndex: false,
          challengeTrackerId: ''
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: '1',
        perToAddressMaxNumTransfers: '0',
        perFromAddressMaxNumTransfers: '0',
        perInitiatedByAddressMaxNumTransfers: '0',
        amountTrackerId: id,
        resetTimeIntervals: { startTime: '0', intervalLength: '0' }
      },
      coinTransfers: [
        // Buyer pays seller directly
        {
          to: params.address,
          coins: [{ amount: basePrice, denom: coin.denom }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      autoDeletionOptions: {
        afterOneUse: true,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      }
    }
  };

  return {
    ...buildUserApprovalMsg({ collectionId: params.collectionId, outgoingApprovals: [approval] }),
    _meta: {
      description: `PM Sell: ${params.amount} ${params.token.toUpperCase()} for ${params.price} ${coin.symbol}`,
      collectionId: params.collectionId,
      token: params.token
    }
  };
}
