/**
 * Prediction Market Sell Intent — user outgoing approval to sell YES/NO tokens.
 *
 * Thin display-unit wrapper over the canonical
 * `buildPredictionMarketSellIntent` (core/prediction-markets.ts) — the same
 * builder `bb prediction-markets sell-yes` uses. `bb build pm-sell-intent`
 * and `bb prediction-markets sell-*` now emit the identical
 * `MsgSetOutgoingApproval` shape; this file only resolves display→base
 * units + a deterministic approval id, then delegates.
 *
 * @module core/builders/pm-sell-intent
 */
import { resolveCoin, toBaseUnits, durationToTimestamp, stableHashId } from './shared.js';
import { buildPredictionMarketSellIntent, type PredictionMarketSideArgs } from '../prediction-markets.js';
import { UintRangeArray } from '../uintRanges.js';

export interface PmSellIntentParams {
  address: string; // seller bb1... address
  collectionId: string; // prediction market collection ID
  token: 'yes' | 'no'; // which outcome token to sell
  amount: number; // number of tokens to sell (unitless count)
  price: number; // total payment amount (display units)
  denom: string; // payment coin (USDC, BADGE)
  expiration?: string; // duration shorthand, default "7d"
}

export function buildPmSellIntent(params: PmSellIntentParams): { typeUrl: string; value: any } {
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw new Error(
      `buildPmSellIntent: amount must be a positive integer (got ${params.amount}). Prediction market tokens are unitless counts, not fractional.`
    );
  }
  const coin = resolveCoin(params.denom);
  const tokenId = params.token === 'yes' ? 1n : 2n;
  const end = BigInt(durationToTimestamp(params.expiration || '7d'));
  const approvalId = stableHashId('pm-sell', {
    address: params.address,
    collectionId: params.collectionId,
    token: params.token,
    amount: params.amount,
    price: params.price,
    denom: coin.denom
  });
  const args: PredictionMarketSideArgs = {
    address: params.address,
    collectionId: String(params.collectionId),
    tokenId,
    tokenAmount: BigInt(params.amount),
    paymentDenom: coin.denom,
    paymentAmount: BigInt(toBaseUnits(params.price, coin.decimals)),
    transferTimes: UintRangeArray.From([{ start: 1n, end }]),
    approvalId
  };
  const approval = buildPredictionMarketSellIntent(args);
  return {
    typeUrl: '/tokenization.MsgSetOutgoingApproval',
    value: {
      creator: params.address,
      collectionId: String(params.collectionId),
      approval
    }
  };
}
