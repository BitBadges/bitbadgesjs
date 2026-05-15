/**
 * Prediction Market Buy Intent — user incoming approval to buy YES/NO tokens.
 *
 * Thin display-unit wrapper over the canonical
 * `buildPredictionMarketBuyIntent` (core/prediction-markets.ts) — the same
 * builder `bb prediction-markets buy-yes` uses. `bb build pm-buy-intent`
 * and `bb prediction-markets buy-*` now emit the identical
 * `MsgSetIncomingApproval` shape; this file only resolves display→base
 * units + a deterministic approval id, then delegates.
 *
 * @module core/builders/pm-buy-intent
 */
import { resolveCoin, toBaseUnits, resolveExpiration, stableHashId } from './shared.js';
import { buildPredictionMarketBuyIntent, type PredictionMarketSideArgs } from '../prediction-markets.js';
import { UintRangeArray } from '../uintRanges.js';

// Matches the end-user `bb prediction-markets buy-*` default (24h).
const PM_INTENT_DEFAULT_EXPIRY_MS = 24 * 60 * 60 * 1000;

export interface PmBuyIntentParams {
  address: string; // buyer bb1... address
  collectionId: string; // prediction market collection ID
  token: 'yes' | 'no'; // which outcome token to buy
  amount: number; // number of tokens to buy (unitless count)
  price: number; // total payment amount (display units)
  denom: string; // payment coin (USDC, BADGE)
  expiration?: string; // ms-since-epoch or duration shorthand, default "24h"
}

export function buildPmBuyIntent(params: PmBuyIntentParams): { typeUrl: string; value: any } {
  if (!Number.isInteger(params.amount) || params.amount <= 0) {
    throw new Error(
      `buildPmBuyIntent: amount must be a positive integer (got ${params.amount}). Prediction market tokens are unitless counts, not fractional.`
    );
  }
  const coin = resolveCoin(params.denom);
  const tokenId = params.token === 'yes' ? 1n : 2n;
  const end = resolveExpiration(params.expiration, PM_INTENT_DEFAULT_EXPIRY_MS);
  const approvalId = stableHashId('pm-buy', {
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
  const approval = buildPredictionMarketBuyIntent(args);
  return {
    typeUrl: '/tokenization.MsgSetIncomingApproval',
    value: {
      creator: params.address,
      collectionId: String(params.collectionId),
      approval
    }
  };
}
