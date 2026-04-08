/**
 * Listing builder — creates a user outgoing approval for a marketplace listing.
 *
 * The seller lists tokens for sale at a fixed price. Buyers transfer tokens
 * and pay the seller via coinTransfers.
 *
 * @module core/builders/listing
 */
import {
  FOREVER,
  resolveCoin,
  toBaseUnits,
  durationToTimestamp,
  uniqueId
} from './shared.js';

export interface ListingParams {
  address: string; // seller bb1... address
  collectionId: string; // collection to list from
  tokenIds: string; // "1-5" or "1"
  price: number; // asking price (display units)
  denom: string; // price coin (USDC, BADGE)
  maxSales?: number; // max number of sales, default 1
  expiration?: string; // listing duration, default "30d"
}

function parseTokenIdRange(input: string): any[] {
  if (input.includes('-')) {
    const [start, end] = input.split('-').map((s) => s.trim());
    return [{ start, end }];
  }
  return [{ start: input, end: input }];
}

export function buildListing(params: ListingParams): any {
  const coin = resolveCoin(params.denom);
  const basePrice = toBaseUnits(params.price, coin.decimals);
  const expirationTs = durationToTimestamp(params.expiration || '30d');
  const maxSales = params.maxSales || 1;
  const id = uniqueId('listing');
  const tokenIds = parseTokenIdRange(params.tokenIds);

  return {
    type: 'outgoing',
    approvalId: id,
    toListId: 'All',
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
        overallMaxNumTransfers: String(maxSales),
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
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      autoDeletionOptions: {
        afterOneUse: false,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      }
    },
    _meta: {
      description: `Listing: ${params.tokenIds} from collection ${params.collectionId} for ${params.price} ${coin.symbol}`,
      collectionId: params.collectionId
    }
  };
}
