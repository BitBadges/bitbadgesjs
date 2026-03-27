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
  buildApprovalParagraph,
  buildPermissionsSection as buildPermissionsSectionShared,
  buildDefaultBalancesSection as buildDefaultBalancesSectionShared,
  buildBackingAndPathsSection,
  buildInvariantsSection as buildInvariantsSectionShared,
  buildKeyReferenceSection,
  denomToHuman,
  amountToHuman
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
  updateInvariants: [4],
  updateIsArchived: [2]
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

  // Standards inline
  const standards: string[] = txBody.standards || [];
  if (standards.length > 0) {
    md += `\n\nThe collection declares the following standards: **${standards.join(', ')}**.`;
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

  for (const std of standards) {
    const lower = std.toLowerCase();
    if (std === 'NFTs') {
      md += `- **NFTs**: Each token ID is a distinct asset with its own metadata, similar to ERC-721 on Ethereum.\n`;
    } else if (std === 'Fungible Tokens') {
      md += `- **Fungible Tokens**: All tokens of the same ID are interchangeable, similar to ERC-20 on Ethereum.\n`;
    } else if (lower.includes('non-transferable') || lower.includes('soulbound')) {
      md += `- **${std}**: Tokens cannot be transferred once received; they are permanently bound to the holder.\n`;
    } else if (lower.includes('subscription')) {
      md += `- **${std}**: Tokens represent time-limited access that may require periodic renewal.\n`;
    } else if (lower.includes('smart token')) {
      md += `- **${std}**: The token is backed by an external asset and supports deposit/withdrawal.\n`;
    } else if (lower.includes('ai agent')) {
      md += `- **${std}**: The token is managed by an AI agent that controls minting, burning, or other operations.\n`;
    } else {
      md += `- **${std}**\n`;
    }
  }

  md += '\n';
  return md;
}

function buildTransferAndApprovalRules(txBody: Record<string, any>): string {
  const approvals: any[] = txBody.collectionApprovals || [];

  let md = '## Transfer & Approval Rules\n\n';
  md += 'When a transfer is submitted, the chain checks each collection-level approval (a rule that governs who can send tokens to whom and under what conditions) in order. The first approval whose criteria match the transfer is used. If no approval matches, the transfer is rejected. This is a default-deny system -- only explicitly approved operations can proceed.\n\n';

  if (approvals.length === 0) {
    md += 'No collection-level approvals are configured. No transfers or minting can occur.\n\n';
    return md;
  }

  for (const approval of approvals) {
    const isMint = approval.fromListId === 'Mint';
    md += buildApprovalParagraph(approval, isMint);
  }

  md += 'Any transfer that does not match one of the approvals listed above will be rejected.\n\n';

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

  // Section 7: Transfer & Approval Rules
  if (activeSections.has(7)) {
    report += buildTransferAndApprovalRules(txBody);
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
  if (messages && messages.length > 1) {
    report += buildTokenTransfersSection(messages);
  }

  return report;
}
