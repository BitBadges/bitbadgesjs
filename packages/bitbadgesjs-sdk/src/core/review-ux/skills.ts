/**
 * Skill-specific UX checks — NFT/fungible shape, protocol matchers, mint approvals,
 * liquidity pools, backed paths. Ported from frontend reviewItems.ts.
 *
 * All checks in this file gate on the collection's declared `standards` or on
 * structural markers (cosmosCoinBackedPath, allowBackedMinting, wrapper paths).
 * We do NOT gate on `ctx.selectedSkills` — ctx-less callers like the indexer
 * and MCP would otherwise misfire on every collection.
 */

import type { Finding } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { getApprovals, getAllApprovals } from './shared.js';
import { doesCollectionFollowSubscriptionProtocol } from '../subscriptions.js';
import { doesCollectionFollowQuestProtocol } from '../quests.js';
import { doesCollectionFollowBountyProtocol } from '../bounties.js';
import { doesCollectionFollowCrowdfundProtocol } from '../crowdfunds.js';
import { doesCollectionFollowAuctionProtocol } from '../auctions.js';
import { doesCollectionFollowProductProtocol } from '../products.js';

interface ProtocolCopy {
  title: string;
  detail: string;
  recommendation: string;
}

const PROTOCOL_COPY: Record<string, ProtocolCopy> = {
  subscription: {
    title: 'Collection does not follow the subscription protocol',
    detail:
      'This collection has the Subscriptions standard but does not meet all the requirements for a valid subscription. It may not work correctly with subscription features like auto-renewal and recurring payments.',
    recommendation: 'Fix the subscription setup to follow the subscription protocol requirements'
  },
  quest: {
    title: 'Collection does not follow the quest protocol',
    detail:
      'This collection has the Quests standard but does not meet all the requirements for a valid quest collection.',
    recommendation: 'Fix the quest setup to follow the quest protocol requirements'
  },
  bounty: {
    title: 'Collection does not follow the bounty protocol',
    detail: 'This collection has the Bounty standard but does not meet all the requirements for a valid bounty.',
    recommendation: 'Fix the bounty setup to follow the bounty protocol requirements'
  },
  crowdfund: {
    title: 'Collection does not follow the crowdfund protocol',
    detail:
      'This collection has the Crowdfund standard but does not meet all the requirements for a valid crowdfund.',
    recommendation: 'Fix the crowdfund setup to follow the crowdfund protocol requirements'
  },
  auction: {
    title: 'Collection does not follow the auction protocol',
    detail: 'This collection has the Auction standard but does not meet all the requirements for a valid auction.',
    recommendation: 'Fix the auction setup to follow the auction protocol requirements'
  },
  product_catalog: {
    title: 'Collection does not follow the product catalog protocol',
    detail:
      'This collection has the Products standard but does not meet all the requirements for a valid product catalog.',
    recommendation: 'Fix the product catalog setup to follow the product catalog protocol requirements'
  }
};

export const skillChecks: UxCheck[] = [
  // NFT without maxSupplyPerId = 1. Gated on the NFTs standard (not the
  // skill) so ctx-less callers like the indexer don't misfire on fungible
  // / credit / address-list collections that legitimately have no cap.
  (value) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    if (!standards.includes('NFTs')) return out;
    const invariants = value?.invariants || {};
    if (!invariants.maxSupplyPerId || String(invariants.maxSupplyPerId) === '0') {
      out.push({
        code: 'review.ux.nft_no_supply_cap',
        severity: 'warning',
        source: 'ux',
        category: 'skills',
        title: {
          en: 'NFT without per-token supply cap'
        },
        detail: {
          en: 'The per-token supply cap is not set to 1. Multiple copies of the same NFT token ID can be minted.'
        },
        recommendation: {
          en: 'Set the per-token supply cap to 1 so each NFT token ID is unique'
        }
      });
    }
    return out;
  },

  // Fungible token with multiple token IDs. Gated on the Fungible Tokens
  // standard (not the skill) so ctx-less callers don't misfire on NFT /
  // multi-tier collections.
  (value) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    if (!standards.includes('Fungible Tokens')) return out;
    const validTokenIds: any[] = value?.validTokenIds || [];
    if (validTokenIds.length === 0) return out;
    const totalIds = validTokenIds.reduce(
      (sum: number, r: any) => sum + (Number(r.end || 0) - Number(r.start || 0) + 1),
      0
    );
    if (totalIds > 1) {
      out.push({
        code: 'review.ux.fungible_multiple_token_ids',
        severity: 'warning',
        source: 'ux',
        category: 'skills',
        title: {
          en: 'Fungible token has multiple token IDs'
        },
        detail: {
          en: `Expected a single token ID for a fungible token, but found ${totalIds} IDs. Fungible tokens typically use only token ID 1.`
        },
        recommendation: {
          en: 'Change valid token IDs to only include token ID 1'
        }
      });
    }
    return out;
  },

  // Protocol matcher checks — gated on declared standard only
  (value) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    const protocolChecks: Array<{
      standard: string;
      check: (c: any) => boolean;
      key: string;
    }> = [
      { standard: 'Subscriptions', check: doesCollectionFollowSubscriptionProtocol as any, key: 'subscription' },
      { standard: 'Quests', check: doesCollectionFollowQuestProtocol as any, key: 'quest' },
      { standard: 'Bounty', check: doesCollectionFollowBountyProtocol as any, key: 'bounty' },
      { standard: 'Crowdfund', check: doesCollectionFollowCrowdfundProtocol as any, key: 'crowdfund' },
      { standard: 'Auction', check: doesCollectionFollowAuctionProtocol as any, key: 'auction' },
      { standard: 'Products', check: doesCollectionFollowProductProtocol as any, key: 'product_catalog' }
    ];
    for (const { standard, check, key } of protocolChecks) {
      if (!standards.includes(standard)) continue;
      try {
        if (!check(value)) {
          const copy = PROTOCOL_COPY[key];
          out.push({
            code: `review.ux.protocol_mismatch_${key}`,
            severity: 'critical',
            source: 'ux',
            category: 'skills',
            title: { en: copy.title },
            detail: { en: copy.detail },
            recommendation: { en: copy.recommendation }
          });
        }
      } catch {
        // Collection may not be fully hydrated — skip
      }
    }
    return out;
  },

  // No mint approvals (nothing can be minted). Smart-token collections are
  // excluded structurally via hasBackedMinting — they mint via backed paths
  // / wrapper paths, not Mint approvals.
  (value) => {
    const out: Finding[] = [];
    const approvals = getApprovals(value);
    const mintApprovals = approvals.filter((a: any) => a.fromListId === 'Mint');
    const hasBackedMinting =
      getAllApprovals(value).some((a: any) => a.approvalCriteria?.allowBackedMinting) ||
      (Array.isArray(value?.cosmosCoinWrapperPaths) && value.cosmosCoinWrapperPaths.length > 0) ||
      (Array.isArray(value?.cosmosCoinWrapperPathsToAdd) && value.cosmosCoinWrapperPathsToAdd.length > 0);
    if (mintApprovals.length === 0 && approvals.length > 0 && !hasBackedMinting) {
      out.push({
        code: 'review.ux.no_mint_approvals',
        severity: 'warning',
        source: 'ux',
        category: 'skills',
        title: {
          en: 'No mint approvals configured'
        },
        detail: {
          en: 'The collection has transfer approvals but no mint approvals. No tokens can be created.'
        },
        recommendation: {
          en: 'Add a mint approval so tokens can be created'
        }
      });
    }
    return out;
  },

  // Backed path requires exactly 1 token ID
  (value) => {
    const out: Finding[] = [];
    const invariants = value?.invariants || {};
    if (!invariants.cosmosCoinBackedPath) return out;
    const validTokenIds: any[] = value?.validTokenIds || [];
    const total = validTokenIds.reduce(
      (sum: number, r: any) => sum + (Number(r.end || 0) - Number(r.start || 0) + 1),
      0
    );
    if (total > 1) {
      out.push({
        code: 'review.ux.backed_path_multi_token',
        severity: 'warning',
        source: 'ux',
        category: 'skills',
        title: {
          en: 'Smart token has multiple token IDs'
        },
        detail: {
          en: 'IBC-backed smart tokens must have exactly one token ID. Multiple token IDs are not supported for backed collections.'
        },
        recommendation: {
          en: 'Set valid token IDs to exactly one token (1-1)'
        }
      });
    }
    return out;
  },

  // Credit tokens should be non-transferable (increment-only)
  (value) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    if (!standards.includes('Credit Token')) return out;
    const nonMint = getApprovals(value).filter((a: any) => a.fromListId !== 'Mint' && a.fromListId !== 'All');
    if (nonMint.length === 0) return out;
    out.push({
      code: 'review.ux.credit_token_transfers_allowed',
      severity: 'warning',
      source: 'ux',
      category: 'skills',
      title: {
        en: 'Credit token allows transfers'
      },
      detail: {
        en: 'Credit tokens are typically non-transferable (increment-only). This collection has non-mint transfer approvals which would allow credits to be sent between users.'
      },
      recommendation: {
        en: 'Remove the non-mint transfer approvals to make this a non-transferable credit token'
      }
    });
    return out;
  },

  // Address list tokens should be non-transferable (admin-managed)
  (value) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    if (!standards.includes('Address List')) return out;
    const nonMint = getApprovals(value).filter((a: any) => a.fromListId !== 'Mint' && a.fromListId !== 'All');
    if (nonMint.length === 0) return out;
    out.push({
      code: 'review.ux.addresslist_transfers_allowed',
      severity: 'warning',
      source: 'ux',
      category: 'skills',
      title: {
        en: 'Address list allows token transfers'
      },
      detail: {
        en: 'Address list tokens are typically non-transferable (membership is managed by the admin). Transfer approvals exist which would allow users to send their membership token.'
      },
      recommendation: {
        en: 'Remove the transfer approvals to make address list tokens non-transferable'
      }
    });
    return out;
  },

  // Liquidity Pools standard requires alias paths
  (value) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    if (!standards.includes('Liquidity Pools')) return out;
    const aliasPaths: any[] = value?.aliasPaths || value?.aliasPathsToAdd || [];
    if (aliasPaths.length === 0) {
      out.push({
        code: 'review.ux.liquidity_pool_no_alias',
        severity: 'critical',
        source: 'ux',
        category: 'skills',
        title: {
          en: 'Liquidity Pools standard but no alias paths'
        },
        detail: {
          en: 'This collection has the Liquidity Pools standard but no alias paths configured. Alias paths are required for DEX trading denomination display.'
        },
        recommendation: {
          en: 'Add at least one alias path for the trading denomination'
        }
      });
    }
    return out;
  }
];
