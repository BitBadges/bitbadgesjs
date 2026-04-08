/**
 * Bid builder — creates a user incoming approval for a marketplace bid.
 *
 * The bidder offers to buy tokens at a specified price. The seller
 * transfers tokens and the bidder pays via escrow coinTransfers.
 *
 * @module core/builders/bid
 */
import {
  FOREVER,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  uniqueId
} from './shared.js';

export interface BidParams {
  address: string; // bidder bb1... address
  collectionId: string; // collection to bid on
  tokenIds: string; // "1-5" or "1"
  price: number; // bid price (display units)
  denom: string; // price coin (USDC, BADGE)
  expiration?: string; // bid duration, default "7d"
}

function parseTokenIdRange(input: string): any[] {
  if (input.includes('-')) {
    const [start, end] = input.split('-').map((s) => s.trim());
    return [{ start, end }];
  }
  return [{ start: input, end: input }];
}

export function buildBid(params: BidParams): any {
  const coin = resolveCoin(params.denom);
  const basePrice = toBaseUnits(params.price, coin.decimals);
  const expirationTs = durationToTimestamp(params.expiration || '7d');
  const id = uniqueId('bid');
  const tokenIds = parseTokenIdRange(params.tokenIds);

  return {
    type: 'incoming',
    approvalId: id,
    fromListId: 'All',
    initiatedByListId: 'All',
    transferTimes: [{ start: '1', end: expirationTs }],
    tokenIds,
    ownershipTimes: FOREVER,
    version: '0',
    approvalCriteria: {
      predeterminedBalances: {
        manualBalances: [],
        incrementedBalances: {
          startBalances: [{ amount: '1', tokenIds, ownershipTimes: FOREVER }],
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
        {
          to: params.address,
          coins: [{ amount: basePrice, denom: coin.denom }],
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true
        }
      ],
      autoDeletionOptions: {
        afterOneUse: true,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      }
    },
    _meta: {
      description: `Bid: ${params.price} ${coin.symbol} for token ${params.tokenIds} in collection ${params.collectionId}`,
      collectionId: params.collectionId,
      escrowCoins: [{ amount: basePrice, denom: coin.denom }]
    }
  };
}
