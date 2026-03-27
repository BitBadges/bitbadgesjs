/**
 * interpretCollection — pure, deterministic function that produces a thorough
 * markdown explanation of a BitBadgesCollection, suitable for rendering as a
 * professional report.
 *
 * @module
 * @category Collections
 */
import type { NumberType } from '../common/string-numbers.js';
import { GO_MAX_UINT_64 } from '../common/math.js';
import { CoinsRegistry } from '../common/constants.js';
import type { iBitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import { BitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import { getMintApprovals, getNonMintApprovals } from './approval-utils.js';
import {
  big,
  permState,
  listIdHuman,
  rangeStr,
  timeRangeStr,
  countTokenIds,
  detectType as detectTypeShared,
  pluginDisplayName,
  buildApprovalParagraph,
  buildPermissionsSection,
  buildDefaultBalancesSection,
  buildBackingAndPathsSection,
  buildInvariantsSection,
  PERM_KEYS,
  timestampToDate,
  durationToHuman,
  denomToHuman,
  amountToHuman
} from './interpret-shared.js';

// Re-export helpers so existing consumers of interpret.js still work
export { timestampToDate, durationToHuman, denomToHuman, amountToHuman };

// ---------------------------------------------------------------------------
// Typed helpers (thin wrappers around shared functions for typed callers)
// ---------------------------------------------------------------------------

const MAX_UINT64 = GO_MAX_UINT_64;

function detectTypeTyped<T extends NumberType>(collection: BitBadgesCollection<T>): string {
  return detectTypeShared(collection.standards ?? [], !!collection.invariants?.cosmosCoinBackedPath);
}

// ---------------------------------------------------------------------------
// Section builders — rich markdown output
// ---------------------------------------------------------------------------

function buildOverview<T extends NumberType>(col: BitBadgesCollection<T>): string {
  const type = detectTypeTyped(col);
  const tokenCount = countTokenIds(col.validTokenIds as any);
  const maxSupply = col.invariants?.maxSupplyPerId != null ? big(col.invariants.maxSupplyPerId) : 0n;
  const metadata = col.getCollectionMetadata();

  let md = '## Collection Overview\n\n';

  // Opening paragraph: name, description, type
  const name = metadata?.name || 'Unnamed Collection';
  const desc = metadata?.description || '';
  md += `**"${name}"** (creator-provided name) is a ${type} on BitBadges`;
  if (col.collectionId) {
    md += ` (Collection ID: ${col.collectionId})`;
  } else {
    md += ' (not yet deployed)';
  }
  md += '. ';
  if (desc) md += `\n\n> *Creator-provided description:* ${desc}\n\n`;

  // Token ID range
  const rangeDisplay = rangeStr(col.validTokenIds as any);
  if (rangeDisplay === 'all') {
    md += `The collection supports an unlimited range of token IDs. `;
  } else if (rangeDisplay === 'none') {
    md += `No token IDs have been defined yet. This means no tokens can currently be minted or transferred until valid token IDs are added by the manager. `;
  } else {
    md += `It contains ${tokenCount} unique token ID${tokenCount === '1' ? '' : 's'} (${rangeDisplay}). `;
  }

  // Supply cap
  if (maxSupply === 0n) {
    md += 'There is no hard cap on supply per token ID, meaning tokens can be minted without an on-chain maximum.';
  } else {
    md += `Each token ID has a maximum supply of ${maxSupply.toLocaleString('en-US')} tokens, enforced at the protocol level.`;
  }

  // Type-specific explanation
  md += '\n\n';
  if (type === 'NFT Collection') {
    md += `As an NFT collection, each token ID represents a distinct, individually identifiable asset. `;
    if (maxSupply === 1n) {
      md += 'With a maximum supply of 1 per ID, each token is truly unique and non-fungible.';
    } else if (maxSupply === 0n) {
      md += 'There is no supply cap, so multiple copies of each token ID can exist.';
    } else {
      md += `Up to ${maxSupply.toLocaleString('en-US')} copies of each token ID can exist.`;
    }
  } else if (type.includes('Smart Token')) {
    const backing = col.invariants?.cosmosCoinBackedPath;
    const denom = backing?.conversion?.sideA?.denom ? denomToHuman(backing.conversion.sideA.denom) : 'an IBC asset';
    md += `This is a smart token backed 1:1 by ${denom}. Users can deposit the backing asset to receive collection tokens, and redeem collection tokens to withdraw the backing asset.`;
  } else if (type === 'Fungible Token') {
    md += `As a fungible token, all tokens of the same ID are interchangeable, similar to an ERC-20 token. `;
    if (maxSupply === 0n) {
      md += 'There is no supply cap.';
    } else {
      md += `The maximum total supply is ${maxSupply.toLocaleString('en-US')} tokens.`;
    }
  } else if (type === 'Subscription Token') {
    md += 'This is a subscription token. Holding it grants access to a service or resource for a defined time period. It may require periodic renewal or payment.';
  } else if (type === 'AI Agent Stablecoin') {
    md += 'This is an AI agent-managed stablecoin vault. An AI agent manages the vault and controls minting and burning operations.';
  } else {
    md += 'This is a token collection on BitBadges.';
  }

  // Standards
  if (col.standards && col.standards.length > 0) {
    md += `\n\nThe collection declares the following standards: **${col.standards.join(', ')}**. `;
    md += 'Standards tell wallets, marketplaces, and other tools how to interpret and display these tokens. ';
    const standardExplanations: string[] = [];
    for (const std of col.standards) {
      const lower = std.toLowerCase();
      if (std === 'NFTs') standardExplanations.push('"NFTs" -- each token ID is a distinct asset with its own metadata, similar to ERC-721 on Ethereum');
      else if (std === 'Fungible Tokens') standardExplanations.push('"Fungible Tokens" -- all tokens of the same ID are interchangeable, similar to ERC-20 on Ethereum');
      else if (lower.includes('non-transferable') || lower.includes('soulbound')) standardExplanations.push(`"${std}" -- tokens cannot be transferred once received; they are permanently bound to the holder`);
      else if (lower.includes('subscription')) standardExplanations.push(`"${std}" -- tokens represent time-limited access that may require periodic renewal`);
      else if (lower.includes('tradable') || lower.includes('marketplace') || std === 'NFTMarketplace') standardExplanations.push(`"${std}" -- the collection is designed for secondary market trading`);
      else if (lower.includes('smart token')) standardExplanations.push(`"${std}" -- the token is backed by an external asset and supports deposit/withdrawal`);
      else if (lower.includes('ai agent')) standardExplanations.push(`"${std}" -- the token is managed by an AI agent that controls minting, burning, or other operations`);
    }
    if (standardExplanations.length > 0) {
      md += 'Specifically: ' + standardExplanations.join('; ') + '.';
    }
  }

  // Archived
  if (col.isArchived) {
    md += '\n\n> **This collection is ARCHIVED.** It is no longer active and no new operations should be expected.';
  }

  // Image
  if (metadata?.image) {
    md += `\n\nCollection image: ${metadata.image}`;
  }

  // Token metadata pattern
  const tokenMeta = col.getTokenMetadata();
  if (tokenMeta && tokenMeta.length > 0) {
    const hasPerToken = tokenMeta.some((tm: any) => tm.uri || tm.customData);
    if (hasPerToken) {
      md += '\n\nEach token ID has its own individual metadata (name, image, description). This means different token IDs may represent different items or assets.';
    }
  } else if (type === 'Fungible Token') {
    md += '\n\nAll tokens share the same collection-level metadata, as is typical for fungible tokens.';
  }

  md += '\n\n';
  return md;
}

function buildHowTokensAreCreated<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## How Tokens Are Created\n\n';

  const mintApprovals = getMintApprovals(col.collectionApprovals);
  const backingApprovals = col.collectionApprovals.filter(
    (a) => a.approvalCriteria?.allowBackedMinting && a.fromList.checkAddress('Mint')
  );

  if (mintApprovals.length === 0 && backingApprovals.length === 0) {
    md += 'There are no active minting approvals configured for this collection. New tokens cannot be created through the standard approval system. ';
    md += 'The only way to obtain tokens is through transfers from existing holders (if the collection supports transfers).\n\n';
    return md;
  }

  for (const approval of mintApprovals) {
    md += buildApprovalParagraph(approval as any, true);
  }

  for (const approval of backingApprovals) {
    if (mintApprovals.some((m) => m.approvalId === approval.approvalId)) continue;
    const backing = col.invariants?.cosmosCoinBackedPath;
    const rawDenom = backing?.conversion?.sideA?.denom || 'the IBC asset';
    const symbol = denomToHuman(rawDenom);

    md += `### IBC Deposit: "${approval.approvalId}"\n\n`;
    md += `This approval enables IBC-backed minting. Users send **${symbol}** to the backing address and receive collection tokens in return at a 1:1 conversion rate. `;
    md += `Deposits are available to ${listIdHuman(approval.toListId)}. `;
    md += 'The backing mechanism ensures that every collection token in circulation is fully reserved by the underlying asset.\n\n';
  }

  // Practical guidance
  if (mintApprovals.length > 0) {
    const hasClaims = mintApprovals.some((a) => a.approvalCriteria?.merkleChallenges && a.approvalCriteria.merkleChallenges.length > 0);
    const hasCost = mintApprovals.some((a) => a.approvalCriteria?.coinTransfers && a.approvalCriteria.coinTransfers.length > 0);
    const hasSelfClaim = mintApprovals.some((a) => a.approvalCriteria?.requireToEqualsInitiatedBy);
    md += '### How to Mint\n\n';
    if (hasClaims) {
      md += 'To mint tokens from this collection, you would typically go through a claim flow: visit the collection page, complete the required verification steps (listed above for each approval), and submit the claim. ';
    } else if (hasSelfClaim) {
      md += 'To mint tokens, you submit a mint transaction where you are both the initiator and the recipient. ';
    } else {
      md += 'To mint tokens, submit a transfer transaction from the Mint address to the desired recipient. ';
    }
    if (hasCost) {
      md += 'A payment is required (see the cost listed for each approval above). ';
    }
    md += 'Make sure you meet any ownership requirements and that the mint has not exceeded its limits.\n\n';
  }

  return md;
}

function buildTransferRules<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## Transfer & Approval Rules\n\n';
  md += 'When a transfer is submitted, the chain checks each collection-level approval in order. The first approval whose criteria match the transfer (correct sender, recipient, token IDs, timing, etc.) is used. If an approval with `mustPrioritize` is set, it must be explicitly referenced. If no approval matches, the transfer is rejected.\n\n';

  const nonMintApprovals = getNonMintApprovals(col.collectionApprovals);
  const transferApprovals = nonMintApprovals.filter((a) => !a.approvalCriteria?.allowBackedMinting);
  const unbackingApprovals = col.collectionApprovals.filter(
    (a) => a.approvalCriteria?.allowBackedMinting && !a.fromList.checkAddress('Mint')
  );

  if (transferApprovals.length === 0 && unbackingApprovals.length === 0) {
    md += 'This collection is **non-transferable (soulbound)**. Once tokens are minted to a holder, they cannot be sent to another address. ';
    md += 'This is a permanent characteristic of the tokens as long as the transfer rules remain unchanged. ';
    md += 'Soulbound tokens are commonly used for credentials, membership badges, and reputation scores that should not be tradeable.\n\n';
    return md;
  }

  for (const approval of transferApprovals) {
    md += buildApprovalParagraph(approval as any, false);
  }

  for (const approval of unbackingApprovals) {
    const backing = col.invariants?.cosmosCoinBackedPath;
    const rawDenom = backing?.conversion?.sideA?.denom || 'the IBC asset';
    const symbol = denomToHuman(rawDenom);

    md += `### IBC Withdrawal: "${approval.approvalId}"\n\n`;
    md += `This approval enables IBC-backed withdrawal (burning). Holders send collection tokens to the backing address and receive **${symbol}** back at a 1:1 conversion rate. `;
    md += `Withdrawals are available to ${listIdHuman(approval.fromListId)}. `;

    const amounts = approval.approvalCriteria?.approvalAmounts;
    if (amounts) {
      const oa = big(amounts.overallApprovalAmount);
      if (oa > 0n && oa < MAX_UINT64) md += `There is a total withdrawal limit of ${oa.toLocaleString('en-US')} tokens. `;
      const fa = big(amounts.perFromAddressApprovalAmount);
      if (fa > 0n && fa < MAX_UINT64) md += `Each address can withdraw up to ${fa.toLocaleString('en-US')} tokens. `;
    }
    md += '\n\n';
  }

  md += 'Any transfer that does not match one of the approvals listed above will be rejected. This is a default-deny system — only explicitly approved operations can proceed.\n\n';

  if (col.invariants?.noForcefulPostMintTransfers) {
    md += '> **Safety Guarantee**: The on-chain invariant `noForcefulPostMintTransfers` is active. No one can forcefully move tokens from holders after minting. This is enforced at the protocol level and cannot be overridden.\n\n';
  }

  return md;
}

function collectLinkedClaimIds<T extends NumberType>(col: BitBadgesCollection<T>): Set<string> {
  const linked = new Set<string>();
  for (const approval of col.collectionApprovals) {
    const challenges = approval.approvalCriteria?.merkleChallenges;
    if (!challenges) continue;
    for (const mc of challenges) {
      const claim = (mc as any).challengeInfoDetails?.claim;
      if (claim?.claimId) linked.add(claim.claimId);
    }
  }
  return linked;
}

function buildClaims<T extends NumberType>(col: BitBadgesCollection<T>, linkedClaimIds: Set<string>): string {
  if (!col.claims || col.claims.length === 0) {
    return '## Claims\n\nNo off-chain claims are configured for this collection. Tokens can only be obtained through on-chain minting approvals or transfers.\n\n';
  }

  const orphanedClaims = col.claims.filter((c) => !linkedClaimIds.has(c.claimId));

  if (orphanedClaims.length === 0) {
    return '## Claims\n\nAll claims are described above alongside their corresponding approvals.\n\n';
  }

  let md = '## Claims\n\n';
  if (linkedClaimIds.size > 0) {
    md += `${linkedClaimIds.size} claim${linkedClaimIds.size > 1 ? 's are' : ' is'} described above alongside ${linkedClaimIds.size > 1 ? 'their' : 'its'} corresponding approval${linkedClaimIds.size > 1 ? 's' : ''}. `;
  }
  md += `${orphanedClaims.length} additional claim${orphanedClaims.length > 1 ? 's are' : ' is'} configured below. Claims allow users to obtain tokens through an off-chain verification flow before triggering the on-chain mint.\n\n`;

  for (const claim of orphanedClaims) {
    md += `### Claim: "${claim.claimId}"\n\n`;

    // Metadata (creator-provided)
    const claimName = (claim as any).metadata?.name;
    const claimDesc = (claim as any).metadata?.description;
    if (claimName) md += `**"${claimName}"** (creator-provided claim name)\n\n`;
    if (claimDesc) md += `> *Creator-provided claim description:* ${claimDesc}\n\n`;

    // Categories, approach, cost, time
    const details: string[] = [];
    if (claim.categories && claim.categories.length > 0) details.push(`categories: ${claim.categories.join(', ')}`);
    if (claim.approach) details.push(`approach: ${claim.approach}`);
    if (claim.estimatedCost) details.push(`estimated cost: ${claim.estimatedCost}`);
    if (claim.estimatedTime) details.push(`estimated time: ${claim.estimatedTime}`);
    if (claim.assignMethod) details.push(`assignment method: ${claim.assignMethod}`);
    if (claim.manualDistribution) details.push('manual distribution is required');
    if (details.length > 0) {
      md += `This claim uses the following configuration: ${details.join(', ')}.\n\n`;
    }

    // Plugins (sanitized)
    if (claim.plugins && claim.plugins.length > 0) {
      md += 'To complete this claim, the user must satisfy the following verification steps:\n\n';
      for (const plugin of claim.plugins) {
        const pluginName = pluginDisplayName(plugin.pluginId || 'unknown plugin');
        md += `- **${pluginName}**`;
        if ((plugin as any).publicParams) {
          const publicKeys = Object.keys((plugin as any).publicParams).filter(
            (k) => k !== 'seedCode' && k !== 'preimages' && !k.startsWith('_')
          );
          if (publicKeys.length > 0) {
            const paramStrs = publicKeys.map((k) => `${k}: ${JSON.stringify((plugin as any).publicParams[k])}`);
            md += ` (${paramStrs.join(', ')})`;
          }
        }
        md += '\n';
      }
      md += '\n';
    }

    // Rewards
    if (claim.rewards && claim.rewards.length > 0) {
      md += `Upon successful completion, the user receives ${claim.rewards.length} reward${claim.rewards.length > 1 ? 's' : ''}.\n\n`;
    }
  }

  return md;
}

function buildKeyReference<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## Key Reference Information\n\n';

  md += `- **Manager**: \`${col.manager || 'not set'}\`\n`;
  md += `- **Collection ID**: ${col.collectionId || '(new, not yet deployed)'}\n`;
  md += `- **Created by**: \`${col.createdBy || 'unknown'}\`\n`;

  // Backing address
  if (col.invariants?.cosmosCoinBackedPath?.address) {
    md += `- **Backing address**: \`${col.invariants.cosmosCoinBackedPath.address}\`\n`;
  }

  // Key approval IDs
  if (col.collectionApprovals && col.collectionApprovals.length > 0) {
    md += '\n**Approval IDs**:\n\n';
    for (const approval of col.collectionApprovals) {
      const isMint = approval.fromList.checkAddress('Mint');
      const isBacked = approval.approvalCriteria?.allowBackedMinting;
      let type = 'transfer';
      if (isMint && isBacked) type = 'IBC deposit/mint';
      else if (isMint) type = 'mint';
      else if (isBacked) type = 'IBC withdrawal';
      md += `- \`${approval.approvalId}\` -- ${type} approval for ${listIdHuman(approval.toListId)}\n`;
    }
  }

  // Denomination details
  const denomsSeen = new Set<string>();
  for (const approval of col.collectionApprovals) {
    const coinTransfers = approval.approvalCriteria?.coinTransfers;
    if (coinTransfers) {
      for (const ct of coinTransfers) {
        for (const coin of ct.coins || []) {
          if (coin.denom) denomsSeen.add(coin.denom);
        }
      }
    }
  }
  if (col.invariants?.cosmosCoinBackedPath?.conversion?.sideA?.denom) {
    denomsSeen.add(col.invariants.cosmosCoinBackedPath.conversion.sideA.denom);
  }

  if (denomsSeen.size > 0) {
    md += '\n**Denominations used**:\n\n';
    for (const denom of denomsSeen) {
      const entry = CoinsRegistry[denom];
      if (entry) {
        md += `- \`${denom}\` = **${entry.symbol}** (${entry.decimals} decimals)\n`;
      } else {
        md += `- \`${denom}\` = ${denomToHuman(denom)}\n`;
      }
    }
  }

  md += '\n';
  return md;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Produces a thorough markdown explanation of a BitBadgesCollection,
 * structured as a professional report with full paragraphs, proper
 * headings, and human-readable values.
 *
 * Privacy: Sensitive fields (seed codes, preimages, private params,
 * template info, signature challenge content, voting challenge content)
 * are never included in the output.
 *
 * @param collection - A BitBadgesCollection instance or plain interface object
 * @returns A single markdown string with a comprehensive explanation
 *
 * @category Collections
 */
export function interpretCollection<T extends NumberType>(
  collection: BitBadgesCollection<T> | iBitBadgesCollection<T>
): string {
  // Ensure we have a class instance for helper methods
  const col = collection instanceof BitBadgesCollection ? collection : new BitBadgesCollection(collection);

  const linkedClaimIds = collectLinkedClaimIds(col);

  let report = '';

  // Preamble
  report += '## How BitBadges Collections Work\n\n';
  report += 'BitBadges uses a **three-tier approval system** to control all token operations. For any transfer to succeed, it must pass through three levels of approval:\n\n';
  report += '1. **Collection-level approvals** — rules set by the collection creator that apply to everyone (described in this report)\n';
  report += '2. **Sender\'s outgoing approvals** — personal rules each holder sets for tokens leaving their account (by default, holders auto-approve their own sends)\n';
  report += '3. **Recipient\'s incoming approvals** — personal rules each address sets for tokens arriving (by default, all incoming transfers are auto-approved)\n\n';
  report += 'All three tiers must approve for a transfer to proceed. If any tier rejects, the transfer fails. This is a **default-deny** system — if no approval matches a transfer, it is rejected.\n\n';
  report += '**Permissions** control what the collection manager can change in the future. **Invariants** are permanent on-chain rules that can never be changed by anyone. Together, they determine how much you can trust that the rules described below will remain as they are.\n\n';

  report += buildOverview(col);
  report += buildBackingAndPathsSection(
    col.invariants as any,
    (col.aliasPaths || []) as any[],
    (col.cosmosCoinWrapperPaths || []) as any[]
  );
  report += buildHowTokensAreCreated(col);
  report += buildTransferRules(col);
  report += buildPermissionsSection(col.collectionPermissions as any, col.manager || null);
  report += buildInvariantsSection(col.invariants as any);
  report += buildDefaultBalancesSection(col.defaultBalances as any);
  report += buildClaims(col, linkedClaimIds);
  report += buildKeyReference(col);
  report += buildSummary(col);

  return report;
}

function buildSummary<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## Summary & Key Takeaways\n\n';

  const type = detectTypeTyped(col);
  const metadata = col.getCollectionMetadata();
  const name = metadata?.name || 'This collection';

  md += `**${name}** is a ${type} on BitBadges. `;

  // Transferability summary
  const nonMintApprovals = getNonMintApprovals(col.collectionApprovals);
  const transferApprovals = nonMintApprovals.filter((a) => !a.approvalCriteria?.allowBackedMinting);
  if (transferApprovals.length === 0) {
    md += 'Tokens are non-transferable (soulbound). ';
  } else {
    md += 'Tokens are transferable. ';
  }

  // Minting summary
  const mintApprovals = getMintApprovals(col.collectionApprovals);
  if (mintApprovals.length > 0) {
    md += `There ${mintApprovals.length === 1 ? 'is 1 minting rule' : `are ${mintApprovals.length} minting rules`} configured. `;
  } else {
    md += 'No minting is currently possible. ';
  }

  // Trust level
  const perms = col.collectionPermissions;
  let lockedCount = 0;
  for (const key of PERM_KEYS) {
    if (permState((perms as any)[key]) === 'locked') lockedCount++;
  }
  const total = PERM_KEYS.length;

  md += '\n\n**Trust Level**: ';
  if (lockedCount === total) {
    md += 'Fully immutable -- no aspect of this collection can be changed by anyone.';
  } else if (lockedCount >= total * 0.7) {
    md += `High trust -- ${lockedCount} of ${total} permissions are permanently locked.`;
  } else if (lockedCount >= total * 0.4) {
    md += `Moderate trust -- ${lockedCount} of ${total} permissions are locked. The manager retains meaningful control.`;
  } else {
    md += `Low trust -- only ${lockedCount} of ${total} permissions are locked. The manager can change most aspects of this collection. Only use if you trust the manager.`;
  }

  // Key risks
  const risks: string[] = [];
  if (permState(perms.canUpdateCollectionApprovals) !== 'locked') risks.push('transfer and minting rules can be changed');
  if (permState(perms.canUpdateValidTokenIds) !== 'locked') risks.push('new token IDs can be created (supply dilution)');
  if (permState((perms as any).canDeleteCollection) !== 'locked') risks.push('the collection can be deleted');
  if (!col.invariants?.noForcefulPostMintTransfers) {
    const hasForceOverride = col.collectionApprovals.some(
      (a) => a.approvalCriteria?.overridesFromOutgoingApprovals && !a.fromList.checkAddress('Mint')
    );
    if (hasForceOverride) risks.push('forceful token seizure is possible through at least one approval');
  }

  if (risks.length > 0) {
    md += '\n\n**Key Risks**: ' + risks.join('; ') + '.';
  } else {
    md += '\n\n**Key Risks**: None identified -- the collection is well-locked with strong holder protections.';
  }

  md += '\n\n';
  return md;
}
