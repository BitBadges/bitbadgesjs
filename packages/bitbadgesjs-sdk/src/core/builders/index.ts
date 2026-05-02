/**
 * CLI template builders — one-command collection + approval creation.
 *
 * Collection builders output MsgUniversalUpdateCollection JSON with collectionId "0".
 * Approval builders output user-level approval objects for MsgUpdateUserApprovals.
 *
 * @module core/builders
 */

// ── Collection builders ──────────────────────────────────────────────────────

export { buildVault, type VaultParams } from './vault.js';
export { buildSubscription, type SubscriptionParams, type SubscriptionPayout } from './subscription.js';
export { buildBounty, type BountyParams } from './bounty.js';
export { buildPaymentRequest, type PaymentRequestParams } from './payment-request.js';
export { buildCrowdfund, type CrowdfundParams } from './crowdfund.js';
export { buildAuction, type AuctionParams } from './auction.js';
export { buildProductCatalog, type ProductCatalogParams, type ProductItem } from './product-catalog.js';
export { buildPredictionMarket, type PredictionMarketParams } from './prediction-market.js';
export { buildSmartAccount, type SmartAccountParams } from './smart-account.js';
export { buildCreditToken, type CreditTokenParams } from './credit-token.js';
export { buildCustom2FA, type Custom2FAParams } from './custom-2fa.js';
export { buildQuests, type QuestsParams } from './quests.js';
export { buildAddressList, type AddressListParams } from './address-list.js';

// ── Approval builders (user-level) ──────────────────────────────────────────

export { buildIntent, type IntentParams } from './intent.js';
export { buildRecurringPayment, type RecurringPaymentParams } from './recurring-payment.js';
export { buildListing, type ListingParams } from './listing.js';
export { buildBid, type BidParams } from './bid.js';
export { buildPmSellIntent, type PmSellIntentParams } from './pm-sell-intent.js';
export { buildPmBuyIntent, type PmBuyIntentParams } from './pm-buy-intent.js';

// ── Shared utilities ─────────────────────────────────────────────────────────

export { resolveCoin, toBaseUnits, parseDuration, type ResolvedCoin } from './shared.js';
