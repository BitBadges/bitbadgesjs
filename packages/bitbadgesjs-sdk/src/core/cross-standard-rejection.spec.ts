/**
 * Cross-standard rejection: every standards validator must reject a
 * collection tagged with a *different* standard.
 *
 * This proves the user-visible guarantee: `bb bounties show <id>` on a
 * Subscription collection (or vice versa) does NOT silently produce a
 * malformed msg — the per-command `validateOrExit` gate trips because
 * the validator rejects on rule 1 ("Missing X standard").
 *
 * We feed a minimal stub (right enough to reach rule 1) tagged with the
 * WRONG standard and assert each validator rejects. The exact error
 * message isn't load-bearing; what matters is `valid === false` so the
 * CLI's `validateOrExit` exits 2 instead of falling through.
 */

import { validateBountyCollection } from './bounties.js';
import { validateProductCatalogCollection } from './products.js';
import { validateAuctionCollection } from './auctions.js';
import { validateCrowdfundCollection } from './crowdfunds.js';
import { validatePaymentRequestCollection } from './payment-requests.js';
import { validatePredictionMarketCollection, isPredictionMarketValid } from './prediction-markets.js';
import { doesCollectionFollowSubscriptionProtocol } from './subscriptions.js';
import { doesCollectionFollowCreditTokenProtocol } from './credit-tokens.js';
import { validateSmartTokenCollection, doesCollectionFollowSmartTokenProtocol } from './smart-tokens.js';

// Minimal stub: validTokenIds + empty approvals + the WRONG standard.
// Every validator's rule 1 is `standards.includes(X)` so this must trip
// the gate regardless of what's downstream.
const stubWithStandard = (standard: string): any => ({
  standards: [standard],
  validTokenIds: [{ start: 1n, end: 1n }],
  collectionApprovals: [],
  collectionPermissions: {}
});

// All other standards that are NOT the one under test — used to assert
// every validator rejects every "wrong" tag.
const ALL_STANDARDS = [
  'Bounty',
  'Products',
  'Auction',
  'Crowdfund',
  'PaymentRequest',
  'Prediction Market',
  'Subscriptions',
  'Credit Token',
  'Smart Token'
] as const;

function otherStandards(self: string): readonly string[] {
  return ALL_STANDARDS.filter((s) => s !== self);
}

describe('cross-standard rejection', () => {
  describe('validateBountyCollection', () => {
    for (const wrong of otherStandards('Bounty')) {
      it(`rejects a "${wrong}" collection`, () => {
        const r = validateBountyCollection(stubWithStandard(wrong));
        expect(r.valid).toBe(false);
        expect(r.errors).toContain('Missing "Bounty" standard');
      });
    }
  });

  describe('validateProductCatalogCollection', () => {
    for (const wrong of otherStandards('Products')) {
      it(`rejects a "${wrong}" collection`, () => {
        const r = validateProductCatalogCollection(stubWithStandard(wrong));
        expect(r.valid).toBe(false);
        expect(r.errors).toContain('Missing "Products" standard');
      });
    }
  });

  describe('validateAuctionCollection', () => {
    for (const wrong of otherStandards('Auction')) {
      it(`rejects a "${wrong}" collection`, () => {
        const r = validateAuctionCollection(stubWithStandard(wrong));
        expect(r.valid).toBe(false);
        expect(r.errors).toContain('Missing "Auction" standard');
      });
    }
  });

  describe('validateCrowdfundCollection', () => {
    for (const wrong of otherStandards('Crowdfund')) {
      it(`rejects a "${wrong}" collection`, () => {
        const r = validateCrowdfundCollection(stubWithStandard(wrong));
        expect(r.valid).toBe(false);
        expect(r.errors).toContain('Missing "Crowdfund" standard');
      });
    }
  });

  describe('validatePaymentRequestCollection', () => {
    for (const wrong of otherStandards('PaymentRequest')) {
      it(`rejects a "${wrong}" collection`, () => {
        const r = validatePaymentRequestCollection(stubWithStandard(wrong));
        expect(r.valid).toBe(false);
        expect(r.errors).toContain('Missing "PaymentRequest" standard');
      });
    }
  });

  describe('validatePredictionMarketCollection', () => {
    for (const wrong of otherStandards('Prediction Market')) {
      it(`rejects a "${wrong}" collection`, () => {
        const r = validatePredictionMarketCollection(stubWithStandard(wrong));
        expect(r.valid).toBe(false);
        expect(isPredictionMarketValid(stubWithStandard(wrong))).toBe(false);
      });
    }
  });

  describe('doesCollectionFollowSubscriptionProtocol', () => {
    for (const wrong of otherStandards('Subscriptions')) {
      it(`returns false for a "${wrong}" collection`, () => {
        expect(doesCollectionFollowSubscriptionProtocol(stubWithStandard(wrong))).toBe(false);
      });
    }
  });

  describe('validateSmartTokenCollection', () => {
    for (const wrong of otherStandards('Smart Token')) {
      it(`rejects a "${wrong}" collection`, () => {
        const r = validateSmartTokenCollection(stubWithStandard(wrong));
        expect(r.valid).toBe(false);
        expect(r.errors).toContain('Missing "Smart Token" standard');
        expect(doesCollectionFollowSmartTokenProtocol(stubWithStandard(wrong))).toBe(false);
      });
    }
  });

  describe('doesCollectionFollowCreditTokenProtocol', () => {
    // Credit-tokens uses a structural fallback (any approvalId starting
    // with `credit-`) in addition to the standards tag. Our stubs have
    // [] approvals, so the structural fallback also misses — every
    // wrong-standard stub must return false.
    for (const wrong of otherStandards('Credit Token')) {
      it(`returns false for a "${wrong}" collection with no credit-* approvals`, () => {
        expect(doesCollectionFollowCreditTokenProtocol(stubWithStandard(wrong))).toBe(false);
      });
    }
  });
});
