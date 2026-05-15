/**
 * Bid builder — thin display-unit wrapper over the canonical
 * `buildOrderbookBidApproval` (core/bids.ts), the same builder
 * `bb nfts bid` uses. `bb build bid` and `bb nfts bid` now emit the
 * identical `MsgSetIncomingApproval` shape.
 *
 * @module core/builders/bid
 */
import { resolveCoin, toBaseUnits, resolveExpiration, stableHashId } from './shared.js';
import { buildOrderbookBidApproval, type OrderbookOrderArgs } from '../bids.js';
import { UintRangeArray } from '../uintRanges.js';

const BID_DEFAULT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface BidParams {
  address: string; // bidder bb1... address
  collectionId: string; // collection to bid on
  tokenIds?: string; // single token id; omit for a collection-wide bid (parity with `bb nfts bid`)
  tokenAmount?: number; // token quantity, default 1
  price: number; // bid price (display units)
  denom: string; // price coin (USDC, BADGE)
  expiration?: string; // ms-since-epoch or duration shorthand, default "7d"
}

/** A single-token bid accepts "5" or "5-5"; a true range is rejected (omit token-ids for collection-wide). */
function singleTokenId(input: string, ctx: string): bigint {
  const parts = String(input).split('-').map((s) => s.trim());
  if (parts.length === 2 && parts[0] !== parts[1]) {
    throw new Error(
      `${ctx} supports a single token id (got range "${input}"). Bid per token id, or omit --token-ids for a collection-wide bid.`
    );
  }
  return BigInt(parts[0]);
}

export function buildBid(params: BidParams): { typeUrl: string; value: any } {
  const coin = resolveCoin(params.denom);
  const hasTokenId = typeof params.tokenIds === 'string' && params.tokenIds.trim().length > 0;
  const tokenId = hasTokenId ? singleTokenId(params.tokenIds as string, 'bid') : undefined;
  const tokenAmount = BigInt(params.tokenAmount ?? 1);
  const end = resolveExpiration(params.expiration, BID_DEFAULT_EXPIRY_MS);
  const approvalId = stableHashId('bid', {
    address: params.address,
    collectionId: params.collectionId,
    tokenIds: hasTokenId ? (params.tokenIds as string).trim() : 'all',
    tokenAmount: String(tokenAmount),
    price: params.price,
    denom: coin.denom,
    expiration: params.expiration || `${BID_DEFAULT_EXPIRY_MS}ms`
  });
  const args: OrderbookOrderArgs = {
    address: params.address,
    tokenId,
    paymentAmount: BigInt(toBaseUnits(params.price, coin.decimals)),
    paymentDenom: coin.denom,
    tokenAmount,
    transferTimes: UintRangeArray.From([{ start: 1n, end }]),
    approvalId,
    maxNumTransfers: 1n
  };
  const approval = buildOrderbookBidApproval(args);
  return {
    typeUrl: '/tokenization.MsgSetIncomingApproval',
    value: {
      creator: params.address,
      collectionId: String(params.collectionId),
      approval
    }
  };
}
