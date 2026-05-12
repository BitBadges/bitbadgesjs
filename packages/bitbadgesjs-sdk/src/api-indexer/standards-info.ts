/**
 * Per-standard "core details" types attached to a collection response under
 * `standardsInfo`. Companion to `standardsConformance` — for each declared
 * standard, the indexer attaches a small object here.
 *
 * Scope is intentionally lean: only data that requires an extra fetch (e.g. an
 * escrow balance) or is a derived status enum lives here. Anything already on
 * the collection doc (approvals, metadata, amounts, recipients) is NOT
 * duplicated and should be derived client-side.
 *
 * Numeric fields use `bigint` directly because these objects are produced by
 * the indexer and consumed as-is; they are not part of the generic
 * `NumberType` conversion pipeline (see notes in `BitBadgesCollection.ts`).
 *
 * @category Standards Info
 */

/**
 * Core details for the Bounty standard.
 *
 * @category Standards Info
 */
export interface iBountyInfo {
  status: 'pending' | 'accepted' | 'denied' | 'expired';
  /** Pre-fetched balance on the mint module escrow account (extra fetch). */
  escrowBalance?: { denom: string; amount: bigint };
}

/**
 * Core details for the PaymentRequest standard.
 *
 * @category Standards Info
 */
export interface iPaymentRequestInfo {
  status: 'pending' | 'paid' | 'denied' | 'expired';
}

/**
 * Core details for the Crowdfund standard.
 *
 * @category Standards Info
 */
export interface iCrowdfundInfo {
  status: 'active' | 'goal_met' | 'expired_no_fund' | 'funded';
  /** Pre-fetched raised amount on the mint module escrow account (extra fetch). */
  raised: { denom: string; amount: bigint };
  /** Integer 0-100 (or higher if oversubscribed). */
  progressPercent: number;
}

/**
 * Core details for the Auction standard.
 *
 * @category Standards Info
 */
export interface iAuctionInfo {
  status: 'bidding' | 'accepting' | 'sold' | 'expired';
}

/**
 * Core details for the Prediction Market standard.
 *
 * @category Standards Info
 */
export interface iPredictionMarketInfo {
  status: 'active' | 'resolved-yes' | 'resolved-no' | 'resolved-push';
  /** YES outcome implied probability, 0..1. */
  yesPrice: number;
  /** NO outcome implied probability, 0..1. */
  noPrice: number;
  /** Pre-fetched aggregate deposits across both outcomes (extra fetch). */
  totalDeposited?: bigint;
}

/**
 * Aggregate shape attached to `iBitBadgesCollection.standardsInfo`. Keyed by
 * standard name. New standards are added over time as the indexer learns to
 * attach core details for them.
 *
 * @category Standards Info
 */
export interface iStandardsInfo {
  Bounty?: iBountyInfo;
  PaymentRequest?: iPaymentRequestInfo;
  Crowdfund?: iCrowdfundInfo;
  Auction?: iAuctionInfo;
  'Prediction Market'?: iPredictionMarketInfo;
}
