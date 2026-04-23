/**
 * Standards conformance decisions.
 *
 * Each entry wraps one of the existing `doesCollectionFollowXProtocol`
 * helpers in `src/core/`. The status semantics:
 *
 *   - `n/a`   — the collection does not claim the standard in its
 *               `standards[]` array, so the protocol check isn't
 *               meaningful for this collection.
 *   - `pass`  — the standard is claimed AND the full cross-field
 *               protocol check passes (fields are structured per spec).
 *   - `fail`  — the standard is claimed but the protocol check fails;
 *               the collection won't behave as the named standard.
 *
 * "Standards claimed" is read off `collection.standards: string[]` —
 * the single free-form field that applications use to discover support.
 */

import type { DesignDecision } from '../review-types.js';
import { doesCollectionFollowSubscriptionProtocol } from '../subscriptions.js';
import { doesCollectionFollowBountyProtocol } from '../bounties.js';
import { doesCollectionFollowAuctionProtocol } from '../auctions.js';
import { doesCollectionFollowInvoiceProtocol } from '../invoices.js';
import { doesCollectionFollowCrowdfundProtocol } from '../crowdfunds.js';
import { doesCollectionFollowQuestProtocol } from '../quests.js';
import { doesCollectionFollowProductProtocol, doesCollectionFollowProductCatalogProtocol } from '../products.js';

interface StandardEntry {
  code: string;
  label: string;
  standard: string;
  check: (c: any) => boolean;
}

const ENTRIES: StandardEntry[] = [
  { code: 'design.standards.subscription', label: 'Subscription protocol', standard: 'Subscriptions', check: (c) => doesCollectionFollowSubscriptionProtocol(c) },
  { code: 'design.standards.bounty', label: 'Bounty protocol', standard: 'Bounties', check: (c) => doesCollectionFollowBountyProtocol(c) },
  { code: 'design.standards.auction', label: 'Auction protocol', standard: 'Auctions', check: (c) => doesCollectionFollowAuctionProtocol(c) },
  { code: 'design.standards.invoice', label: 'Invoice protocol', standard: 'Invoices', check: (c) => doesCollectionFollowInvoiceProtocol(c) },
  { code: 'design.standards.crowdfund', label: 'Crowdfund protocol', standard: 'Crowdfunds', check: (c) => doesCollectionFollowCrowdfundProtocol(c) },
  { code: 'design.standards.quest', label: 'Quest protocol', standard: 'Quests', check: (c) => doesCollectionFollowQuestProtocol(c) },
  { code: 'design.standards.product', label: 'Product protocol', standard: 'Products', check: (c) => doesCollectionFollowProductProtocol(c) },
  { code: 'design.standards.product_catalog', label: 'Product Catalog protocol', standard: 'ProductCatalogs', check: (c) => doesCollectionFollowProductCatalogProtocol(c) }
];

export function standardsDecisions(collection: any): DesignDecision[] {
  if (!collection || typeof collection !== 'object') return [];
  const claimed: string[] = Array.isArray(collection.standards) ? collection.standards : [];
  const out: DesignDecision[] = [];

  for (const entry of ENTRIES) {
    const isClaimed = claimed.includes(entry.standard);
    if (!isClaimed) {
      out.push({
        code: entry.code,
        category: 'standards',
        title: { en: `Follows the ${entry.label}` },
        detail: { en: `Does not claim the "${entry.standard}" standard.` },
        status: 'n/a'
      });
      continue;
    }

    // Claimed — run the deterministic cross-field check.
    let ok = false;
    try {
      ok = !!entry.check(collection);
    } catch {
      ok = false;
    }

    out.push({
      code: entry.code,
      category: 'standards',
      title: { en: `Follows the ${entry.label}` },
      detail: ok
        ? { en: `Claims the "${entry.standard}" standard and satisfies the full structural protocol.` }
        : { en: `Claims the "${entry.standard}" standard but does NOT satisfy the protocol's structural requirements.` },
      status: ok ? 'pass' : 'fail',
      evidence: `standards[] contains "${entry.standard}"`
    });
  }

  return out;
}
