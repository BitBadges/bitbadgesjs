/**
 * interpretTransaction — pure, deterministic function that produces a thorough
 * markdown explanation of a raw MsgUniversalUpdateCollection transaction body,
 * suitable for AI builder post-build review.
 *
 * Unlike interpretCollection() which works with hydrated BitBadgesCollection
 * instances, this function works with the raw JSON `value` object from the
 * transaction message. All values are strings or numbers, not BigInt.
 *
 * @module
 * @category Collections
 */
import {
  big,
  listIdHuman,
  rangeStr,
  timeRangeStr,
  countTokenIds,
  detectType,
  buildTypeExplanation,
  buildStandardExplanations,
  buildApprovalParagraph,
  buildPermissionsSection as buildPermissionsSectionShared,
  buildDefaultBalancesSection as buildDefaultBalancesSectionShared,
  buildBackingAndPathsSection,
  buildInvariantsSection as buildInvariantsSectionShared,
  buildKeyReferenceSection,
  denomToHuman
} from './interpret-shared.js';

// ---------------------------------------------------------------------------
// Flag-to-section mapping for update mode
// ---------------------------------------------------------------------------

const FLAG_TO_SECTIONS: Record<string, number[]> = {
  updateCollectionApprovals: [7],
  updateCollectionMetadata: [2],
  updateTokenMetadata: [2],
  updateCollectionPermissions: [8],
  updateValidTokenIds: [2],
  updateManager: [6],
  updateStandards: [5],
  updateCustomData: [6],
  updateDefaultBalances: [9],
  updateInvariants: [3, 4],
  updateIsArchived: [2],
  updateAliasPaths: [3],
  updateCosmosCoinWrapperPaths: [3]
};

// ---------------------------------------------------------------------------
// Section builders for raw transaction data
// ---------------------------------------------------------------------------

function buildTransactionSummary(txBody: Record<string, any>, isUpdate: boolean, activeUpdateFlags: string[]): string {
  let md = '## Transaction Summary\n\n';

  const type = detectType(txBody.standards || [], !!txBody.invariants?.cosmosCoinBackedPath);
  const meta = txBody.collectionMetadata?.metadata || txBody.collectionMetadata || {};
  const name = meta.name || 'Unnamed Collection';

  if (isUpdate) {
    const flagDescriptions: string[] = [];
    for (const flag of activeUpdateFlags) {
      switch (flag) {
        case 'updateCollectionApprovals':
          flagDescriptions.push('transfer and minting rules');
          break;
        case 'updateCollectionMetadata':
          flagDescriptions.push('collection metadata (name, description, image)');
          break;
        case 'updateTokenMetadata':
          flagDescriptions.push('token metadata');
          break;
        case 'updateCollectionPermissions':
          flagDescriptions.push('permissions');
          break;
        case 'updateValidTokenIds':
          flagDescriptions.push('valid token IDs');
          break;
        case 'updateManager':
          flagDescriptions.push('manager address');
          break;
        case 'updateStandards':
          flagDescriptions.push('declared standards');
          break;
        case 'updateCustomData':
          flagDescriptions.push('custom data');
          break;
        case 'updateDefaultBalances':
          flagDescriptions.push('default user balances and auto-approve settings');
          break;
        case 'updateInvariants':
          flagDescriptions.push('on-chain invariants');
          break;
        case 'updateIsArchived':
          flagDescriptions.push('archived status');
          break;
        default:
          flagDescriptions.push(flag);
      }
    }
    md += `Update collection "${name}" to change: ${flagDescriptions.join(', ')}.\n\n`;
  } else {
    md += `Create a new ${type} called "${name}" on BitBadges.\n\n`;
  }

  return md;
}

function buildCollectionOverview(txBody: Record<string, any>): string {
  const type = detectType(txBody.standards || [], !!txBody.invariants?.cosmosCoinBackedPath);
  const tokenCount = countTokenIds(txBody.validTokenIds);
  const inv = txBody.invariants || {};
  const maxSupply = big(inv.maxSupplyPerId);
  const meta = txBody.collectionMetadata?.metadata || txBody.collectionMetadata || {};

  let md = '## Collection Overview\n\n';

  const name = meta.name || 'Unnamed Collection';
  const desc = meta.description || '';
  md += `**"${name}"** (creator-provided name) is a ${type} on BitBadges. `;
  if (desc) md += `\n\n> *Creator-provided description:* ${desc}\n\n`;

  // Token ID range
  const rangeDisplay = rangeStr(txBody.validTokenIds);
  if (rangeDisplay === 'all') {
    md += 'The collection supports an unlimited range of token IDs. ';
  } else if (rangeDisplay === 'none') {
    md += 'No token IDs have been defined yet. This means no tokens can currently be minted or transferred until valid token IDs are added by the manager. ';
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
  const backingDenom = inv.cosmosCoinBackedPath?.conversion?.sideA?.denom ? denomToHuman(inv.cosmosCoinBackedPath.conversion.sideA.denom) : undefined;
  md += buildTypeExplanation(type, maxSupply, backingDenom);

  const standards: string[] = txBody.standards || [];
  if (standards.length > 0) {
    md += `\n\nDeclared standards: ${standards.join(', ')}. See the Standards section below for details.`;
  }

  // Token metadata
  if (txBody.tokenMetadata && txBody.tokenMetadata.length > 0) {
    md += '\n\n### Per-Token Metadata\n\n';
    for (const tm of txBody.tokenMetadata) {
      const tmMeta = tm.metadata?.metadata || tm.metadata || {};
      const tmName = tmMeta.name || 'unnamed';
      const tmDesc = tmMeta.description || '';
      const tokenIds = rangeStr(tm.tokenIds);
      md += `- Token IDs ${tokenIds}: **"${tmName}"**`;
      if (tmDesc) md += ` -- ${tmDesc}`;
      md += '\n';
    }
  }

  // Custom data
  if (txBody.customData) {
    md += `\n\n**Custom Data**: \`${typeof txBody.customData === 'string' ? txBody.customData : JSON.stringify(txBody.customData)}\``;
  }

  // Archived
  if (txBody.isArchived) {
    md += '\n\n> **This collection is ARCHIVED.** It is no longer active and no new operations should be expected.';
  }

  md += '\n\n';
  return md;
}

function buildStandardsSection(txBody: Record<string, any>): string {
  const standards: string[] = txBody.standards || [];

  let md = '## Standards\n\n';

  if (standards.length === 0) {
    md += 'No standards are declared for this collection.\n\n';
    return md;
  }

  md += 'Standards tell wallets, marketplaces, and other tools how to interpret and display these tokens. The collection declares the following standards:\n\n';

  const explanations = buildStandardExplanations(standards);
  for (const explanation of explanations) {
    md += `- ${explanation}\n`;
  }

  md += '\n';
  return md;
}

function buildMintingSection(txBody: Record<string, any>): string {
  const approvals: any[] = Array.isArray(txBody.collectionApprovals) ? txBody.collectionApprovals : [];
  const mintApprovals = approvals.filter((a: any) => a.fromListId === 'Mint');

  if (mintApprovals.length === 0) {
    return '## How Tokens Are Created\n\nThere are no active minting approvals configured for this collection. New tokens cannot be created through the standard approval system. The only way to obtain tokens is through transfers from existing holders (if the collection supports transfers).\n\n';
  }

  let md = '## How Tokens Are Created\n\n';

  for (const approval of mintApprovals) {
    md += buildApprovalParagraph(approval, true);
  }

  // Practical guidance
  const hasClaims = mintApprovals.some((a: any) => a.approvalCriteria?.merkleChallenges?.length > 0);
  const hasCost = mintApprovals.some((a: any) => a.approvalCriteria?.coinTransfers?.length > 0);
  const hasSelfClaim = mintApprovals.some((a: any) => a.approvalCriteria?.requireToEqualsInitiatedBy);
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

  return md;
}

function buildTransferRulesSection(txBody: Record<string, any>): string {
  const approvals: any[] = Array.isArray(txBody.collectionApprovals) ? txBody.collectionApprovals : [];
  const nonMintApprovals = approvals.filter((a: any) => a.fromListId !== 'Mint');
  const transferApprovals = nonMintApprovals.filter((a: any) => !a.approvalCriteria?.allowBackedMinting);
  const unbackingApprovals = nonMintApprovals.filter((a: any) => a.approvalCriteria?.allowBackedMinting);

  let md = '## Transfer & Approval Rules\n\n';
  md += 'This section describes the rules that control how tokens can be moved between addresses after they have been created. When someone tries to transfer tokens, the chain checks each collection-level approval rule in order. The first rule whose conditions match the transfer (correct sender, recipient, token IDs, timing, etc.) is used. If no rule matches, the transfer is blocked. This is a "default-deny" system — nothing is allowed unless there is a specific rule that permits it.\n\n';
  md += 'Remember: even after a collection-level rule approves a transfer, the sender\'s personal outgoing approval and the recipient\'s personal incoming approval must also agree. All three layers must pass.\n\n';

  if (transferApprovals.length === 0 && unbackingApprovals.length === 0) {
    md += 'This collection is **non-transferable (soulbound)**. There are no transfer approval rules configured, which means once tokens are created and delivered to a holder, they can never be sent to another address. The tokens are permanently bound to whoever receives them. ';
    md += 'This will remain the case as long as the transfer rules are not changed (check the Permissions section to see whether the manager has the ability to add transfer rules in the future). ';
    md += 'Non-transferable tokens are commonly used for credentials, certificates, membership badges, and reputation scores where it is important that the token cannot be sold or given away.\n\n';
    return md;
  }

  for (const approval of transferApprovals) {
    md += buildApprovalParagraph(approval, false);
  }

  // Asset-backed withdrawal approvals
  for (const approval of unbackingApprovals) {
    const inv = txBody.invariants || {};
    const rawDenom = inv.cosmosCoinBackedPath?.conversion?.sideA?.denom || 'the backing asset';
    const symbol = denomToHuman(rawDenom);
    md += `### Withdrawal: "${approval.approvalId}"\n\n`;
    md += `This approval allows token holders to redeem their collection tokens for the underlying backing asset (**${symbol}**). The holder sends their collection tokens to the backing address, and the tokens are destroyed (burned) in exchange for receiving the equivalent amount of **${symbol}** back. `;
    md += `Who can withdraw: ${listIdHuman(approval.fromListId)}.\n\n`;
  }

  md += 'Any transfer that does not match one of the approvals listed above will be rejected.\n\n';

  // noForcefulPostMintTransfers callout
  if (txBody.invariants?.noForcefulPostMintTransfers) {
    md += '> **Safety Guarantee**: This collection has an unbreakable on-chain rule that prevents anyone from forcefully moving tokens out of a holder\'s account after minting. This is enforced by the blockchain itself and cannot be overridden by anyone, including the collection manager.\n\n';
  }

  return md;
}

function buildTokenTransfersSection(messages: any[]): string {
  // Skip first message (MsgUniversalUpdateCollection)
  const transferMsgs = messages.slice(1).filter((m: any) =>
    m.typeUrl?.includes('MsgTransferTokens') || m['@type']?.includes('MsgTransferTokens')
  );
  if (transferMsgs.length === 0) return '';

  let md = '## Token Transfers\n\n';
  md += `This transaction includes ${transferMsgs.length} token transfer message${transferMsgs.length > 1 ? 's' : ''}:\n\n`;

  for (const msg of transferMsgs) {
    const value = msg.value || msg;
    const from = value.from || value.creator || 'unknown';
    const transfers: any[] = value.transfers || [];
    for (const transfer of transfers) {
      const to = transfer.to || 'unknown';
      const balances: any[] = transfer.balances || [];
      md += `- **From** \`${from}\` **to** \`${to}\``;
      if (balances.length > 0) {
        const balDesc = balances.map((b: any) => {
          const amt = big(b.amount);
          const tokenIds = rangeStr(b.tokenIds);
          return `${amt.toLocaleString('en-US')} token(s) [IDs: ${tokenIds}]`;
        }).join(', ');
        md += `: ${balDesc}`;
      }
      md += '\n';
    }
  }

  md += '\n';
  return md;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Produces a thorough markdown explanation of a raw MsgUniversalUpdateCollection
 * transaction body, structured as a professional report with full paragraphs,
 * proper headings, and human-readable values.
 *
 * Unlike interpretCollection() which works with hydrated BitBadgesCollection
 * instances, this function works with the raw JSON `value` object from the
 * transaction message. All values are strings or numbers, not BigInt.
 *
 * @param txBody - The raw `value` object from MsgUniversalUpdateCollection
 * @param isUpdate - Whether this is an update to an existing collection (default: false)
 * @param activeUpdateFlags - The list of fields being updated (e.g., ['updateCollectionApprovals'])
 * @param messages - Optional full messages array for multi-message transactions
 * @returns A single markdown string with a comprehensive explanation
 *
 * @category Collections
 */
export function interpretTransaction(
  txBody: Record<string, any>,
  isUpdate?: boolean,
  activeUpdateFlags?: string[],
  messages?: any[]
): string {
  const update = isUpdate ?? false;
  const flags = activeUpdateFlags || [];

  // Determine which sections to include
  const activeSections = new Set<number>();

  // Always include sections 1 (summary) and 6 (key reference)
  activeSections.add(1);
  activeSections.add(6);

  if (update && flags.length > 0) {
    for (const flag of flags) {
      const sections = FLAG_TO_SECTIONS[flag];
      if (sections) {
        for (const s of sections) activeSections.add(s);
      }
    }
  } else {
    // Include all sections for create
    for (let i = 1; i <= 10; i++) activeSections.add(i);
  }

  let report = '';

  // Section 1: Transaction Summary
  report += buildTransactionSummary(txBody, update, flags);

  // Section 2: Collection Overview
  if (activeSections.has(2)) {
    report += buildCollectionOverview(txBody);
  }

  // Section 3: Token Backing & Paths
  if (activeSections.has(3)) {
    report += buildBackingAndPathsSection(
      txBody.invariants || {},
      txBody.aliasPaths || [],
      txBody.cosmosCoinWrapperPaths || []
    );
  }

  // Section 4: Invariants
  if (activeSections.has(4)) {
    report += buildInvariantsSectionShared(txBody.invariants);
  }

  // Section 5: Standards
  if (activeSections.has(5)) {
    report += buildStandardsSection(txBody);
  }

  // Section 6: Key Reference Information
  report += buildKeyReferenceSection(txBody);

  // Section 7a: How Tokens Are Created (minting)
  if (activeSections.has(7)) {
    report += buildMintingSection(txBody);
  }

  // Section 7b: Transfer & Approval Rules (transfers)
  if (activeSections.has(7)) {
    report += buildTransferRulesSection(txBody);
  }

  // Section 8: Permissions
  if (activeSections.has(8)) {
    report += buildPermissionsSectionShared(
      txBody.collectionPermissions || {},
      txBody.manager || null
    );
  }

  // Section 9: Default User Balances
  if (activeSections.has(9)) {
    report += buildDefaultBalancesSectionShared(txBody.defaultBalances);
  }

  // Section 10: Token Transfers (multi-message)
  // Always show token transfers if present, even in update mode — bundled transfers
  // are always relevant regardless of which fields are being updated
  if (activeSections.has(10) && messages && messages.length > 1) {
    report += buildTokenTransfersSection(messages);
  }

  return report;
}
