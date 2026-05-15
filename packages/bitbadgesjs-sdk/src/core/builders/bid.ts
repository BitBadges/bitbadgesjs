/**
 * Bid builder — thin display-unit wrapper over the canonical
 * `buildOrderbookBidApproval` (core/bids.ts), the same builder
 * `bb nfts bid` uses. `bb build bid` and `bb nfts bid` now emit the
 * identical `MsgSetIncomingApproval` shape.
 *
 * @module core/builders/bid
 */
import { resolveCoin, toBaseUnits, durationToTimestamp, stableHashId } from './shared.js';
import { buildOrderbookBidApproval, type OrderbookOrderArgs } from '../bids.js';
import { UintRangeArray } from '../uintRanges.js';

export interface BidParams {
  address: string; // bidder bb1... address
  collectionId: string; // collection to bid on
  tokenIds: string; // single token id (orderbook bids are single-token here)
  price: number; // bid price (display units)
  denom: string; // price coin (USDC, BADGE)
  expiration?: string; // bid duration, default "7d"
}

/** Orderbook bids via the build verb are single-token. Accept "5" or "5-5"; reject a true range. */
function singleTokenId(input: string, ctx: string): bigint {
  const parts = String(input).split('-').map((s) => s.trim());
  if (parts.length === 2 && parts[0] !== parts[1]) {
    throw new Error(
      `${ctx} supports a single token id (got range "${input}"). Bid per token id, or use \`bb nfts bid\` (omit --token-id) for a collection-wide bid.`
    );
  }
  return BigInt(parts[0]);
}

export function buildBid(params: BidParams): { typeUrl: string; value: any } {
  const coin = resolveCoin(params.denom);
  const tokenId = singleTokenId(params.tokenIds, 'bid');
  const end = BigInt(durationToTimestamp(params.expiration || '7d'));
  const approvalId = stableHashId('bid', {
    address: params.address,
    collectionId: params.collectionId,
    tokenIds: params.tokenIds,
    price: params.price,
    denom: coin.denom,
    expiration: params.expiration || '7d'
  });
  const args: OrderbookOrderArgs = {
    address: params.address,
    tokenId,
    paymentAmount: BigInt(toBaseUnits(params.price, coin.decimals)),
    paymentDenom: coin.denom,
    tokenAmount: 1n,
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
