/**
 * Listing builder — thin display-unit wrapper over the canonical
 * `buildOrderbookListingApproval` (core/bids.ts), the same builder
 * `bb nfts list` uses. `bb build listing` and `bb nfts list` now emit the
 * identical `MsgSetOutgoingApproval` shape (incl. the FE-canonical
 * seller-scoped `fromListId` the old slim builder omitted).
 *
 * @module core/builders/listing
 */
import { resolveCoin, toBaseUnits, durationToTimestamp, stableHashId } from './shared.js';
import { buildOrderbookListingApproval, type OrderbookOrderArgs } from '../bids.js';
import { UintRangeArray } from '../uintRanges.js';

export interface ListingParams {
  address: string; // seller bb1... address
  collectionId: string; // collection to list from
  tokenIds: string; // single token id (orderbook listings are single-token)
  price: number; // asking price (display units)
  denom: string; // price coin (USDC, BADGE)
  maxSales?: number; // max number of sales, default 1
  expiration?: string; // listing duration, default "30d"
}

/** Orderbook listings are single-token. Accept "5" or "5-5"; reject a true range. */
function singleTokenId(input: string, ctx: string): bigint {
  const parts = String(input).split('-').map((s) => s.trim());
  if (parts.length === 2 && parts[0] !== parts[1]) {
    throw new Error(
      `${ctx} supports a single token id (got range "${input}"). List/bid per token id.`
    );
  }
  return BigInt(parts[0]);
}

export function buildListing(params: ListingParams): { typeUrl: string; value: any } {
  const coin = resolveCoin(params.denom);
  const tokenId = singleTokenId(params.tokenIds, 'listing');
  const end = BigInt(durationToTimestamp(params.expiration || '30d'));
  const maxNumTransfers = BigInt(params.maxSales || 1);
  const approvalId = stableHashId('listing', {
    address: params.address,
    collectionId: params.collectionId,
    tokenIds: params.tokenIds,
    price: params.price,
    denom: coin.denom,
    maxSales: params.maxSales || 1,
    expiration: params.expiration || '30d'
  });
  const args: OrderbookOrderArgs = {
    address: params.address,
    tokenId,
    paymentAmount: BigInt(toBaseUnits(params.price, coin.decimals)),
    paymentDenom: coin.denom,
    tokenAmount: 1n,
    transferTimes: UintRangeArray.From([{ start: 1n, end }]),
    approvalId,
    maxNumTransfers
  };
  const approval = buildOrderbookListingApproval(args);
  return {
    typeUrl: '/tokenization.MsgSetOutgoingApproval',
    value: {
      creator: params.address,
      collectionId: String(params.collectionId),
      approval
    }
  };
}
