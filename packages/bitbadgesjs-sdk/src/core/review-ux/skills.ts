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

export const skillChecks: UxCheck[] = [
  // NFT without maxSupplyPerId = 1. Gated on the NFTs standard (not the
  // skill) so ctx-less callers like the indexer don't misfire on fungible
  // / credit / address-list collections that legitimately have no cap.
  (value) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    if (!standards.includes('NFTs')) return out;
    const invariants = value?.invariants || {};
    if (!invariants.maxSupplyPerId || invariants.maxSupplyPerId === '0') {
      out.push({
        code: 'review.ux.nft_no_supply_cap',
        severity: 'warning',
        source: 'ux',
        category: 'skills',
        localeKey: 'review_nft_no_supply_cap',
        messageEn: 'NFT collection has no maxSupplyPerId cap — multiple copies of the same token can be minted.',
        recommendationEn: 'Set invariants.maxSupplyPerId to "1" for true NFTs.'
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
        localeKey: 'review_fungible_multiple_ids',
        params: { count: totalIds },
        messageEn: `Fungible token with ${totalIds} valid token IDs — fungibles typically use a single ID.`,
        recommendationEn: 'Collapse validTokenIds to a single range of 1 ID.'
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
          out.push({
            code: `review.ux.protocol_mismatch_${key}`,
            severity: 'critical',
            source: 'ux',
            category: 'skills',
            localeKey: `review_${key}_protocol`,
            params: { protocol: standard },
            messageEn: `Collection does not follow the ${standard} protocol shape required by the selected skill or standard.`,
            recommendationEn: `Rebuild the collection using the ${standard} template, or remove the skill/standard.`
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
        localeKey: 'review_no_mint_approvals',
        messageEn: 'No Mint approvals are present — nothing can be minted.',
        recommendationEn: 'Add an approval with fromListId = Mint, or use a smart-token backed minting flow.'
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
        localeKey: 'review_backed_path_multi_token',
        messageEn: 'Backed path smart tokens must have exactly 1 token ID.',
        recommendationEn: 'Set validTokenIds to a single range of 1.'
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
      localeKey: 'review_credit_transfers',
      params: { count: nonMint.length },
      messageEn: `Credit token has ${nonMint.length} non-mint transfer approval(s) — credit tokens are typically non-transferable.`,
      recommendationEn: 'Remove non-mint transfer approvals so credits can only be incremented, not sent between users.'
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
      localeKey: 'review_addresslist_transfers',
      params: { count: nonMint.length },
      messageEn: `Address list token has ${nonMint.length} non-mint transfer approval(s) — membership tokens are typically non-transferable.`,
      recommendationEn: 'Remove transfer approvals so membership is admin-managed only.'
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
        localeKey: 'review_lp_no_alias',
        messageEn: 'Liquidity Pools standard is set but the collection has no alias paths.',
        recommendationEn: 'Add at least one alias path to represent the pool LP denomination.'
      });
    }
    return out;
  }
];
