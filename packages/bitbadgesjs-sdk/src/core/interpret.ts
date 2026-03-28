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
  buildTypeExplanation,
  buildStandardExplanations,
  pluginDisplayName,
  buildApprovalParagraph,
  buildPermissionsSection,
  buildDefaultBalancesSection,
  buildBackingAndPathsSection,
  buildInvariantsSection,
  buildKeyReferenceSection,
  PERM_KEYS,
  aOrAn,
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
  md += `**"${name}"** (creator-provided name) is ${aOrAn(type)} ${type} on BitBadges`;
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

  // Type-specific explanation (using shared builder for consistency)
  md += '\n\n';
  const backingDenom = col.invariants?.cosmosCoinBackedPath?.conversion?.sideA?.denom
    ? denomToHuman(col.invariants.cosmosCoinBackedPath.conversion.sideA.denom)
    : undefined;
  md += buildTypeExplanation(type, maxSupply, backingDenom);

  // Standards (using shared builder for consistency)
  if (col.standards && col.standards.length > 0) {
    md += `\n\nThe collection declares the following standards: **${col.standards.join(', ')}**. `;
    md += 'Standards tell wallets, marketplaces, and other tools how to interpret and display these tokens. ';
    const explanations = buildStandardExplanations(col.standards);
    if (explanations.length > 0) {
      md += 'Specifically: ' + explanations.join('; ') + '.';
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
    md += `This approval enables IBC-backed minting. Users deposit **${symbol}** into the backing address and receive collection tokens in return at a 1:1 conversion rate. `;
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
  md += 'This section describes the rules that control how tokens can be moved between addresses after they have been created. When someone tries to transfer tokens, the chain checks each collection-level approval rule in order. The first rule whose conditions match the transfer (correct sender, recipient, token IDs, timing, etc.) is used. If a rule has the "must be explicitly selected" flag, it will only be used if the user specifically requests it by its approval ID. If no rule matches, the transfer is blocked. This is a "default-deny" system — nothing is allowed unless there is a specific rule that permits it.\n\n';
  md += 'Remember: even after a collection-level rule approves a transfer, the sender\'s personal outgoing approval and the recipient\'s personal incoming approval must also agree. All three layers must pass.\n\n';

  const nonMintApprovals = getNonMintApprovals(col.collectionApprovals);
  const transferApprovals = nonMintApprovals.filter((a) => !a.approvalCriteria?.allowBackedMinting);
  const unbackingApprovals = col.collectionApprovals.filter(
    (a) => a.approvalCriteria?.allowBackedMinting && !a.fromList.checkAddress('Mint')
  );

  if (transferApprovals.length === 0 && unbackingApprovals.length === 0) {
    md += 'This collection is **non-transferable (soulbound)**. There are no transfer approval rules configured, which means once tokens are created and delivered to a holder, they can never be sent to another address. The tokens are permanently bound to whoever receives them. ';
    md += 'This will remain the case as long as the transfer rules are not changed (check the Permissions section to see whether the manager has the ability to add transfer rules in the future). ';
    md += 'Non-transferable tokens are commonly used for credentials, certificates, membership badges, and reputation scores where it is important that the token cannot be sold or given away.\n\n';
    return md;
  }

  for (const approval of transferApprovals) {
    md += buildApprovalParagraph(approval as any, false);
  }

  for (const approval of unbackingApprovals) {
    const backing = col.invariants?.cosmosCoinBackedPath;
    const rawDenom = backing?.conversion?.sideA?.denom || 'the IBC asset';
    const symbol = denomToHuman(rawDenom);

    md += `### Withdrawal: "${approval.approvalId}"\n\n`;
    md += `This approval allows token holders to redeem their collection tokens for the underlying backing asset (**${symbol}**). The holder sends their collection tokens to the backing address, and the tokens are destroyed in exchange for receiving the equivalent amount of **${symbol}** back. `;
    md += `Who can withdraw: ${listIdHuman(approval.fromListId)}. `;

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
    md += '> **Safety Guarantee**: This collection has an unbreakable on-chain rule that prevents anyone from forcefully moving tokens out of a holder\'s account after minting. This is enforced by the blockchain itself and cannot be overridden by anyone, including the collection manager.\n\n';
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
  report += 'BitBadges uses a **three-tier approval system** to control all token operations. For any transfer (moving tokens from one address to another) to succeed, it must pass through three independent layers of approval:\n\n';
  report += '1. **Collection-level approvals** — rules set by the collection creator that apply to everyone. These are the "global" rules for the collection and are the primary focus of this report.\n';
  report += '2. **Sender\'s outgoing approvals** — personal rules that each token holder sets for tokens leaving their own account. By default, holders automatically approve transfers that they themselves initiate, but they can customize these rules.\n';
  report += '3. **Recipient\'s incoming approvals** — personal rules that each address sets for tokens arriving in their account. By default, all incoming transfers are automatically accepted, but recipients can restrict which tokens they are willing to receive.\n\n';
  report += 'All three layers must independently approve a transfer for it to go through. If any single layer rejects, the entire transfer fails. This is a **"default-deny"** system — if no matching approval rule exists at any layer, the transfer is blocked.\n\n';
  report += '**Permissions** control what the collection manager (the administrator of the collection) can change in the future. If a permission is "locked", that aspect of the collection can never be changed by anyone. **Invariants** are permanent guarantees enforced by the blockchain itself that can never be altered or overridden. Together, permissions and invariants determine how much you can trust that the rules described in this report will remain unchanged over time.\n\n';

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
  report += buildKeyReferenceSection({
    manager: col.manager || null,
    creator: col.createdBy || 'unknown',
    collectionId: col.collectionId || null,
    invariants: col.invariants,
    collectionApprovals: col.collectionApprovals?.map((a: any) => ({
      approvalId: a.approvalId,
      fromListId: a.fromListId,
      toListId: a.toListId,
      approvalCriteria: a.approvalCriteria
    })) || []
  });
  report += buildSummary(col);

  return report;
}

function buildSummary<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## Summary & Key Takeaways\n\n';

  const type = detectTypeTyped(col);
  const metadata = col.getCollectionMetadata();
  const name = metadata?.name || 'This collection';

  md += `**${name}** is ${aOrAn(type)} ${type} on BitBadges. `;

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
