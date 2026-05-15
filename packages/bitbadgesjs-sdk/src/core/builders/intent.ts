/**
 * Intent (OTC swap) builder — thin display-unit wrapper over the canonical
 * `buildIntentApproval` (core/intents.ts), the same builder
 * `bb intents create` uses. `bb build intent` and `bb intents create` now
 * emit the identical `MsgSetOutgoingApproval` shape; this file only
 * resolves display→base units + a deterministic approval id, enforces the
 * same-denom guard, then delegates.
 *
 * @module core/builders/intent
 */
import { resolveCoin, toBaseUnits, resolveExpiration, stableHashId } from './shared.js';
import { buildIntentApproval, type IntentApprovalArgs } from '../intents.js';
import { UintRangeArray } from '../uintRanges.js';

const INTENT_DEFAULT_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export interface IntentParams {
  address: string; // creator bb1... address
  collectionId: string; // Intent Exchange collection ID
  payDenom: string; // what creator sends (USDC, BADGE)
  payAmount: number; // display units
  receiveDenom: string; // what creator receives
  receiveAmount: number; // display units
  expiration?: string; // ms-since-epoch or duration shorthand, default "30d"
}

export function buildIntent(params: IntentParams): { typeUrl: string; value: any } {
  const payCoin = resolveCoin(params.payDenom);
  const receiveCoin = resolveCoin(params.receiveDenom);
  // A same-denom intent is a no-op approval the chain accepts but with no
  // economic effect. Compare resolved denoms so 'USDC' vs 'usdc' is caught.
  if (payCoin.denom === receiveCoin.denom) {
    throw new Error('Intent pay and receive denoms must differ.');
  }
  const end = resolveExpiration(params.expiration, INTENT_DEFAULT_EXPIRY_MS);
  const approvalId = stableHashId('intent', {
    address: params.address,
    collectionId: params.collectionId,
    payDenom: payCoin.denom,
    payAmount: params.payAmount,
    receiveDenom: receiveCoin.denom,
    receiveAmount: params.receiveAmount,
    expiration: params.expiration || '30d'
  });
  const args: IntentApprovalArgs = {
    address: params.address,
    payDenom: payCoin.denom,
    payAmount: BigInt(toBaseUnits(params.payAmount, payCoin.decimals)),
    receiveDenom: receiveCoin.denom,
    receiveAmount: BigInt(toBaseUnits(params.receiveAmount, receiveCoin.decimals)),
    transferTimes: UintRangeArray.From([{ start: 1n, end }]),
    approvalId
  };
  const approval = buildIntentApproval(args);
  return {
    typeUrl: '/tokenization.MsgSetOutgoingApproval',
    value: {
      creator: params.address,
      collectionId: String(params.collectionId),
      approval
    }
  };
}
