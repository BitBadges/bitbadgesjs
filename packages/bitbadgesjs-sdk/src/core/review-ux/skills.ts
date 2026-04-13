/**
 * Skill-specific UX checks — NFT/fungible shape, protocol matchers, mint approvals,
 * liquidity pools, backed paths. Ported from frontend reviewItems.ts.
 *
 * When ctx.selectedSkills is undefined we run the union of all skill checks and
 * tag findings with params.requiresSkill so callers can filter.
 */

import type { Finding, ReviewContext } from '../review-types.js';
import type { UxCheck } from './shared.js';
import { hasSkill, getApprovals, getAllApprovals } from './shared.js';
import { doesCollectionFollowSubscriptionProtocol } from '../subscriptions.js';
import { doesCollectionFollowQuestProtocol } from '../quests.js';
import { doesCollectionFollowBountyProtocol } from '../bounties.js';
import { doesCollectionFollowCrowdfundProtocol } from '../crowdfunds.js';
import { doesCollectionFollowAuctionProtocol } from '../auctions.js';
import { doesCollectionFollowProductProtocol } from '../products.js';

function tagSkill(f: Finding, ctx: ReviewContext, skill: string): Finding {
  if (!ctx.selectedSkills) {
    f.params = { ...(f.params || {}), requiresSkill: skill };
  }
  return f;
}

export const skillChecks: UxCheck[] = [
  // NFT without maxSupplyPerId = 1
  (value, ctx) => {
    const out: Finding[] = [];
    const invariants = value?.invariants || {};
    if (!hasSkill(ctx, 'nft-collection')) return out;
    if (!invariants.maxSupplyPerId || invariants.maxSupplyPerId === '0') {
      out.push(
        tagSkill(
          {
            code: 'review.ux.nft_no_supply_cap',
            severity: 'warning',
            source: 'ux',
            category: 'skills',
            messageEn: 'NFT collection has no maxSupplyPerId cap — multiple copies of the same token can be minted.',
            recommendationEn: 'Set invariants.maxSupplyPerId to "1" for true NFTs.'
          },
          ctx,
          'nft-collection'
        )
      );
    }
    return out;
  },

  // Fungible token with multiple token IDs
  (value, ctx) => {
    const out: Finding[] = [];
    if (!hasSkill(ctx, 'fungible-token')) return out;
    const validTokenIds: any[] = value?.validTokenIds || [];
    if (validTokenIds.length === 0) return out;
    const totalIds = validTokenIds.reduce(
      (sum: number, r: any) => sum + (Number(r.end || 0) - Number(r.start || 0) + 1),
      0
    );
    if (totalIds > 1) {
      out.push(
        tagSkill(
          {
            code: 'review.ux.fungible_multiple_token_ids',
            severity: 'warning',
            source: 'ux',
            category: 'skills',
            params: { count: totalIds },
            messageEn: `Fungible token skill selected but ${totalIds} token IDs are valid — fungibles typically use a single ID.`,
            recommendationEn: 'Collapse validTokenIds to a single range of 1 ID.'
          },
          ctx,
          'fungible-token'
        )
      );
    }
    return out;
  },

  // Protocol matcher checks
  (value, ctx) => {
    const out: Finding[] = [];
    const standards: string[] = value?.standards || [];
    const protocolChecks: Array<{
      skill: string;
      standard: string;
      check: (c: any) => boolean;
      key: string;
    }> = [
      { skill: 'subscription', standard: 'Subscriptions', check: doesCollectionFollowSubscriptionProtocol as any, key: 'subscription' },
      { skill: 'quest', standard: 'Quests', check: doesCollectionFollowQuestProtocol as any, key: 'quest' },
      { skill: 'bounty', standard: 'Bounty', check: doesCollectionFollowBountyProtocol as any, key: 'bounty' },
      { skill: 'crowdfund', standard: 'Crowdfund', check: doesCollectionFollowCrowdfundProtocol as any, key: 'crowdfund' },
      { skill: 'auction', standard: 'Auction', check: doesCollectionFollowAuctionProtocol as any, key: 'auction' },
      { skill: 'product-catalog', standard: 'Products', check: doesCollectionFollowProductProtocol as any, key: 'product_catalog' }
    ];
    for (const { skill, standard, check, key } of protocolChecks) {
      if (!(hasSkill(ctx, skill) || standards.includes(standard))) continue;
      try {
        if (!check(value)) {
          out.push(
            tagSkill(
              {
                code: `review.ux.protocol_mismatch_${key}`,
                severity: 'critical',
                source: 'ux',
                category: 'skills',
                params: { protocol: standard },
                messageEn: `Collection does not follow the ${standard} protocol shape required by the selected skill or standard.`,
                recommendationEn: `Rebuild the collection using the ${standard} template, or remove the skill/standard.`
              },
              ctx,
              skill
            )
          );
        }
      } catch {
        // Collection may not be fully hydrated — skip
      }
    }
    return out;
  },

  // No mint approvals (nothing can be minted)
  (value, ctx) => {
    const out: Finding[] = [];
    const approvals = getApprovals(value);
    const mintApprovals = approvals.filter((a: any) => a.fromListId === 'Mint');
    const hasBackedMinting =
      getAllApprovals(value).some((a: any) => a.approvalCriteria?.allowBackedMinting) ||
      (Array.isArray(value?.cosmosCoinWrapperPaths) && value.cosmosCoinWrapperPaths.length > 0) ||
      (Array.isArray(value?.cosmosCoinWrapperPathsToAdd) && value.cosmosCoinWrapperPathsToAdd.length > 0);
    if (
      mintApprovals.length === 0 &&
      approvals.length > 0 &&
      !hasSkill(ctx, 'smart-token') &&
      !hasBackedMinting
    ) {
      out.push({
        code: 'review.ux.no_mint_approvals',
        severity: 'warning',
        source: 'ux',
        category: 'skills',
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
        messageEn: 'Backed path smart tokens must have exactly 1 token ID.',
        recommendationEn: 'Set validTokenIds to a single range of 1.'
      });
    }
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
        messageEn: 'Liquidity Pools standard is set but the collection has no alias paths.',
        recommendationEn: 'Add at least one alias path to represent the pool LP denomination.'
      });
    }
    return out;
  }
];
