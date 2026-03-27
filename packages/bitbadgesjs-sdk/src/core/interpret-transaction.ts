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
import { GO_MAX_UINT_64 } from '../common/math.js';
import { CoinsRegistry } from '../common/constants.js';
import { timestampToDate, durationToHuman, denomToHuman, amountToHuman } from './interpret.js';

const MAX_UINT64 = GO_MAX_UINT_64;

// ---------------------------------------------------------------------------
// Raw-data helpers (work with string/number values, not BigInt)
// ---------------------------------------------------------------------------

function big(val: any): bigint {
  if (val == null || val === '') return 0n;
  return BigInt(val);
}

function isFullRangeRaw(ranges: any[] | undefined): boolean {
  if (!ranges || ranges.length === 0) return false;
  return ranges.some((r: any) => big(r.start) === 1n && big(r.end) === MAX_UINT64);
}

function permStateRaw(entries: any[] | undefined): 'locked' | 'open' | 'undecided' {
  if (!entries || entries.length === 0) return 'undecided';
  const forbidden = entries.some((e: any) => isFullRangeRaw(e.permanentlyForbiddenTimes));
  if (forbidden) return 'locked';
  const permitted = entries.some((e: any) => isFullRangeRaw(e.permanentlyPermittedTimes));
  if (permitted) return 'open';
  return 'undecided';
}

function rangeStrRaw(ranges: any[] | undefined): string {
  if (!ranges || ranges.length === 0) return 'none';
  return ranges
    .map((r: any) => {
      const s = big(r.start);
      const e = big(r.end);
      if (s === 1n && e === MAX_UINT64) return 'all';
      if (s === e) return `#${s}`;
      return `#${s}-#${e}`;
    })
    .join(', ');
}

function timeRangeStrRaw(ranges: any[] | undefined): string {
  if (!ranges || ranges.length === 0) return 'none';
  return ranges
    .map((r: any) => {
      const s = big(r.start);
      const e = big(r.end);
      if (s === 1n && e === MAX_UINT64) return 'all time';
      return `${timestampToDate(s)} through ${timestampToDate(e)}`;
    })
    .join(', ');
}

function countTokenIdsRaw(ranges: any[] | undefined): string {
  if (!ranges || ranges.length === 0) return '0';
  let total = 0n;
  for (const r of ranges) {
    const s = big(r.start);
    const e = big(r.end);
    total += e - s + 1n;
  }
  if (total >= MAX_UINT64) return 'unlimited';
  if (total > 1000000n) return `${total.toLocaleString('en-US')} (very large range)`;
  return total.toLocaleString('en-US');
}

function listIdHuman(listId: string): string {
  if (!listId) return 'unspecified';
  if (listId === 'All') return 'anyone';
  if (listId === 'Mint') return 'the Mint address (new token creation)';
  if (listId === '!Mint') return 'any existing holder (not the Mint)';
  if (listId === 'Total') return 'Total (aggregate tracker)';
  if (listId.startsWith('!Mint:')) return `any holder except ${listId.slice(6)}`;
  if (listId.startsWith('!')) return `anyone except ${listId.slice(1)}`;
  if (listId.includes(':')) return listId.split(':').join(' and ');
  if (listId.startsWith('bb1')) return `address ${listId.slice(0, 12)}...`;
  return listId;
}

function detectTypeRaw(txBody: Record<string, any>): string {
  const s: string[] = txBody.standards || [];
  if (s.some((x) => x.toLowerCase().includes('subscription'))) return 'Subscription Token';
  if (s.some((x) => x.toLowerCase().includes('ai agent stablecoin'))) return 'AI Agent Stablecoin';
  if (s.some((x) => x.toLowerCase().includes('smart token')) || txBody.invariants?.cosmosCoinBackedPath)
    return 'Smart Token (IBC-backed)';
  if (s.includes('NFTs')) return 'NFT Collection';
  if (s.includes('Fungible Tokens')) return 'Fungible Token';
  return 'Token Collection';
}

const PLUGIN_DISPLAY_NAMES: Record<string, string> = {
  numUses: 'Usage Limit (limits how many times each user can claim)',
  codes: 'Claim Code (user must enter a secret code)',
  password: 'Password (user must enter the correct password)',
  whitelist: 'Whitelist (user must be on an approved address list)',
  discord: 'Discord Verification (user must authenticate via Discord)',
  twitter: 'Twitter/X Verification (user must authenticate via Twitter/X)',
  github: 'GitHub Verification (user must authenticate via GitHub)',
  google: 'Google Verification (user must authenticate via Google)',
  email: 'Email Verification (user must verify their email address)',
  geolocation: 'Geolocation Check (user must be in an allowed region)',
  initiatedBy: 'Initiator Check (verifies the claiming address)',
  transferTimes: 'Transfer Time Window (claim is only available during specific times)',
  requiresProofOfAddress: 'Address Ownership Proof (user must prove they control the address)'
};

function pluginDisplayName(pluginId: string): string {
  return PLUGIN_DISPLAY_NAMES[pluginId] || pluginId;
}

// ---------------------------------------------------------------------------
// Permission key descriptions (same as interpret.ts)
// ---------------------------------------------------------------------------

const PERM_DESCRIPTIONS: Record<string, { label: string; lockedDesc: string; openDesc: string; undecidedDesc: string }> = {
  canDeleteCollection: {
    label: 'Delete Collection',
    lockedDesc: 'The collection cannot be deleted. This is permanent and provides assurance that the collection will continue to exist.',
    openDesc: 'The manager can permanently destroy the entire collection and all tokens at any time.',
    undecidedDesc: 'The manager can currently delete the collection. This permission could be locked in the future.'
  },
  canArchiveCollection: {
    label: 'Archive Collection',
    lockedDesc: 'The collection cannot be archived or unarchived. Its active status is permanent.',
    openDesc: 'The manager can mark the collection as archived (inactive) at any time.',
    undecidedDesc: 'The manager can currently archive the collection. This permission could be locked in the future.'
  },
  canUpdateStandards: {
    label: 'Standards',
    lockedDesc: 'The declared standards for this collection are permanently locked and cannot be changed.',
    openDesc: 'The manager can change the declared standards at any time, which could alter how wallets and interfaces interpret the tokens.',
    undecidedDesc: 'The manager can currently update standards. This permission could be locked in the future.'
  },
  canUpdateCustomData: {
    label: 'Custom Data',
    lockedDesc: 'The custom data field is permanently locked and cannot be modified.',
    openDesc: 'The manager can change the custom JSON data stored on the collection at any time.',
    undecidedDesc: 'The manager can currently update custom data. This permission could be locked in the future.'
  },
  canUpdateManager: {
    label: 'Manager Transfer',
    lockedDesc: 'The manager address is permanently locked. Management cannot be transferred to another address.',
    openDesc: 'The manager can transfer management control to a different address at any time.',
    undecidedDesc: 'The manager can currently transfer management. This permission could be locked in the future.'
  },
  canUpdateCollectionMetadata: {
    label: 'Collection Metadata',
    lockedDesc: 'The collection name, description, and image are permanently locked and cannot be changed.',
    openDesc: 'The manager can change the collection name, description, and image at any time.',
    undecidedDesc: 'The manager can currently update collection metadata. This permission could be locked in the future.'
  },
  canUpdateValidTokenIds: {
    label: 'Token ID Creation',
    lockedDesc: 'No new token IDs can be created. The set of valid token IDs is permanent, protecting against supply dilution.',
    openDesc: 'The manager can add new token IDs at any time, which means new supply can be minted.',
    undecidedDesc: 'The manager can currently create new token IDs. This permission could be locked in the future.'
  },
  canUpdateTokenMetadata: {
    label: 'Token Metadata',
    lockedDesc: 'Individual token names, images, and descriptions are permanently locked and cannot be changed.',
    openDesc: 'The manager can change individual token metadata (names, images, descriptions) at any time.',
    undecidedDesc: 'The manager can currently update token metadata. This permission could be locked in the future.'
  },
  canUpdateCollectionApprovals: {
    label: 'Transfer Rules',
    lockedDesc:
      'The transfer and minting rules described in this report are permanently locked. They can never be changed by anyone, including the collection manager. This provides the strongest possible guarantee that the rules will remain as described.',
    openDesc:
      'The manager can modify transfer and minting rules at any time. This means the transferability, fees, limits, and minting conditions described in this report could be changed in the future without holder consent. This is the most powerful permission.',
    undecidedDesc:
      'The manager can currently modify transfer and minting rules. This permission could be locked in the future, but until then, the rules described in this report may change.'
  },
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: {
    label: 'Auto-Approve Incoming (Self-Initiated)',
    lockedDesc: 'The default auto-approve setting for self-initiated incoming transfers is permanently locked.',
    openDesc: 'The manager can change the default auto-approve setting for self-initiated incoming transfers.',
    undecidedDesc: 'The manager can currently update this setting. This permission could be locked in the future.'
  },
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: {
    label: 'Auto-Approve Outgoing (Self-Initiated)',
    lockedDesc: 'The default auto-approve setting for self-initiated outgoing transfers is permanently locked.',
    openDesc: 'The manager can change the default auto-approve setting for self-initiated outgoing transfers.',
    undecidedDesc: 'The manager can currently update this setting. This permission could be locked in the future.'
  },
  canUpdateAutoApproveAllIncomingTransfers: {
    label: 'Auto-Approve All Incoming',
    lockedDesc: 'The default auto-approve setting for all incoming transfers is permanently locked.',
    openDesc: 'The manager can change the default auto-approve setting for all incoming transfers.',
    undecidedDesc: 'The manager can currently update this setting. This permission could be locked in the future.'
  },
  canAddMoreAliasPaths: {
    label: 'Alias Paths',
    lockedDesc: 'No new alias paths (trading pairs) can be added. The current set is permanent.',
    openDesc: 'The manager can add new alias paths (trading pairs) for liquidity pools.',
    undecidedDesc: 'The manager can currently add alias paths. This permission could be locked in the future.'
  },
  canAddMoreCosmosCoinWrapperPaths: {
    label: 'IBC Wrapper Paths',
    lockedDesc: 'No new IBC asset backing configurations can be added. The current set is permanent.',
    openDesc: 'The manager can add new IBC asset backing configurations.',
    undecidedDesc: 'The manager can currently add IBC wrapper paths. This permission could be locked in the future.'
  }
};

const PERM_KEYS = Object.keys(PERM_DESCRIPTIONS);

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
  updateInvariants: [4]
};

// ---------------------------------------------------------------------------
// Section builders for raw transaction data
// ---------------------------------------------------------------------------

function buildTransactionSummary(txBody: Record<string, any>, isUpdate: boolean, activeUpdateFlags: string[]): string {
  let md = '## Transaction Summary\n\n';

  const type = detectTypeRaw(txBody);
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
  const type = detectTypeRaw(txBody);
  const tokenCount = countTokenIdsRaw(txBody.validTokenIds);
  const inv = txBody.invariants || {};
  const maxSupply = big(inv.maxSupplyPerId);
  const meta = txBody.collectionMetadata?.metadata || txBody.collectionMetadata || {};

  let md = '## Collection Overview\n\n';

  const name = meta.name || 'Unnamed Collection';
  const desc = meta.description || '';
  md += `**"${name}"** (creator-provided name) is a ${type} on BitBadges. `;
  if (desc) md += `\n\n> *Creator-provided description:* ${desc}\n\n`;

  // Token ID range
  const rangeDisplay = rangeStrRaw(txBody.validTokenIds);
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

  md += '\n\n';
  return md;
}

function buildBackingAndPaths(txBody: Record<string, any>): string {
  const hasAlias = txBody.aliasPaths && txBody.aliasPaths.length > 0;
  const hasWrapper = txBody.cosmosCoinWrapperPaths && txBody.cosmosCoinWrapperPaths.length > 0;
  const inv = txBody.invariants || {};
  const hasBacking = !!inv.cosmosCoinBackedPath;

  let md = '## Token Backing & Paths\n\n';

  if (!hasAlias && !hasWrapper && !hasBacking) {
    md += 'This is a native BitBadges collection with no cross-chain backing. Tokens are created and managed entirely within the BitBadges chain and are not pegged to any external asset or IBC denomination.\n\n';
    return md;
  }

  if (hasBacking) {
    const backing = inv.cosmosCoinBackedPath;
    const rawDenom = backing.conversion?.sideA?.denom || 'unknown';
    const symbol = denomToHuman(rawDenom);
    const address = backing.address || 'unknown';
    const sideAAmount = big(backing.conversion?.sideA?.amount || '1');
    const sideBBalances: any[] = backing.conversion?.sideB || [];
    const sideBAmount = sideBBalances.length > 0 ? big(sideBBalances[0].amount || '1') : 1n;
    let rateDesc: string;
    if (sideAAmount === sideBAmount) {
      rateDesc = '1:1';
    } else if (sideBAmount > 0n) {
      rateDesc = `${sideAAmount.toLocaleString('en-US')} ${symbol} per ${sideBAmount.toLocaleString('en-US')} collection token${sideBAmount > 1n ? 's' : ''}`;
    } else {
      rateDesc = '1:1';
    }

    md += `This collection is **IBC-backed**, meaning each token is redeemable for the underlying asset at a **${rateDesc}** conversion rate. `;
    md += `The backing asset is **${symbol}** (denomination: \`${rawDenom}\`). `;
    md += `All backing funds are held at the backing address (\`${address}\`). `;
    md += 'Users can deposit the backing asset to mint new collection tokens (a process called "depositing"), and burn collection tokens to withdraw the backing asset (a process called "withdrawing"). ';
    md += 'This mechanism ensures that the total supply of collection tokens never exceeds the reserves held at the backing address.\n\n';
  }

  if (hasAlias) {
    md += '### Alias Paths\n\n';
    md += 'Alias paths provide alternative denominations for display and trading purposes. They allow the token to appear under a different symbol in wallets and DEX interfaces:\n\n';
    for (const alias of txBody.aliasPaths) {
      const aliasName = alias.metadata?.metadata?.name || alias.symbol || alias.denom || 'unnamed';
      md += `- **${aliasName}**: denomination \`${alias.denom || 'N/A'}\`, symbol \`${alias.symbol || 'N/A'}\`\n`;
    }
    md += '\n';
  }

  if (hasWrapper) {
    md += '### Cosmos Coin Wrapper Paths\n\n';
    md += 'Wrapper paths allow this collection token to be wrapped as a native Cosmos SDK coin, enabling integration with standard Cosmos modules (staking, governance, IBC transfers):\n\n';
    for (const wrapper of txBody.cosmosCoinWrapperPaths) {
      const wrapperName = wrapper.metadata?.metadata?.name || wrapper.symbol || wrapper.denom || 'unnamed';
      md += `- **${wrapperName}**: denomination \`${wrapper.denom || 'N/A'}\`, symbol \`${wrapper.symbol || 'N/A'}\`\n`;
    }
    md += '\n';
  }

  return md;
}

function buildInvariantsSection(txBody: Record<string, any>): string {
  const inv = txBody.invariants;

  let md = '## Invariants\n\n';

  if (!inv) {
    md += 'No invariants are set for this collection. Without invariants, the on-chain protocol does not enforce any additional constraints beyond the standard approval system.\n\n';
    return md;
  }

  md += 'Invariants are permanent, on-chain rules that cannot be changed once set. They provide the strongest level of guarantee available on BitBadges, as they are enforced by the protocol itself regardless of any permission or approval changes.\n\n';

  const maxSupply = big(inv.maxSupplyPerId);
  if (maxSupply > 0n) {
    md += `**Maximum Supply**: Each token ID has a hard cap of **${maxSupply.toLocaleString('en-US')} tokens**. This is enforced at the protocol level and cannot be overridden by anyone, even if other permissions change. This guarantees scarcity and protects holders against unlimited inflation.\n\n`;
  } else {
    md += '**Maximum Supply**: No maximum supply limit is set. Tokens can be minted without an on-chain cap, subject only to the approval rules.\n\n';
  }

  if (inv.noForcefulPostMintTransfers) {
    md += '**No Forceful Post-Mint Transfers**: Once tokens are minted to a holder, they cannot be forcefully seized or moved by anyone other than the holder. This is a critical safety guarantee that protects holders from unauthorized token seizure. Even if transfer approval rules are changed in the future, this invariant ensures that no approval can override a holder\'s custody of their tokens.\n\n';
  } else {
    md += '**No Forceful Post-Mint Transfers**: Not enforced. Depending on the collection\'s approval rules, it may be possible for a third party to move tokens from a holder\'s account without their consent. Review the transfer rules carefully.\n\n';
  }

  if (inv.noCustomOwnershipTimes) {
    md += '**No Custom Ownership Times**: All ownership is treated as full-range (always active). This simplifies the token model by preventing time-windowed ownership.\n\n';
  }

  if (inv.disablePoolCreation) {
    md += '**Pool Creation**: Disabled. No liquidity pools can be created for this collection\'s tokens.\n\n';
  }

  if (inv.cosmosCoinBackedPath) {
    const rawDenom = inv.cosmosCoinBackedPath.conversion?.sideA?.denom || 'unknown';
    const symbol = denomToHuman(rawDenom);
    const address = inv.cosmosCoinBackedPath.address || 'unknown';
    md += `**IBC Backing**: This collection is permanently backed 1:1 by **${symbol}** (\`${rawDenom}\`). The backing address is \`${address}\`. This invariant guarantees that the backing relationship cannot be altered or removed.\n\n`;
  }

  if (inv.evmQueryChallenges && inv.evmQueryChallenges.length > 0) {
    md += `**EVM Query Invariants**: ${inv.evmQueryChallenges.length} on-chain contract verification${inv.evmQueryChallenges.length > 1 ? 's are' : ' is'} checked after every transfer.\n\n`;
  }

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

function buildKeyReference(txBody: Record<string, any>): string {
  let md = '## Key Reference Information\n\n';

  md += `- **Manager**: \`${txBody.manager || 'not set'}\`\n`;
  md += `- **Creator**: \`${txBody.creator || 'unknown'}\`\n`;
  md += `- **Collection ID**: ${txBody.collectionId || '(new, not yet deployed)'}\n`;

  // Backing address
  const inv = txBody.invariants || {};
  if (inv.cosmosCoinBackedPath?.address) {
    md += `- **Backing address**: \`${inv.cosmosCoinBackedPath.address}\`\n`;
  }

  // Key approval IDs
  const approvals: any[] = txBody.collectionApprovals || [];
  if (approvals.length > 0) {
    md += '\n**Approval IDs**:\n\n';
    for (const approval of approvals) {
      const isMint = approval.fromListId === 'Mint';
      const isBacked = approval.approvalCriteria?.allowBackedMinting;
      let type = 'transfer';
      if (isMint && isBacked) type = 'IBC deposit/mint';
      else if (isMint) type = 'mint';
      else if (isBacked) type = 'IBC withdrawal';
      md += `- \`${approval.approvalId}\` -- ${type} approval for ${listIdHuman(approval.toListId)}\n`;
    }
  }

  // Denominations
  const denomsSeen = new Set<string>();
  for (const approval of approvals) {
    const coinTransfers = approval.approvalCriteria?.coinTransfers;
    if (coinTransfers) {
      for (const ct of coinTransfers) {
        for (const coin of ct.coins || []) {
          if (coin.denom) denomsSeen.add(coin.denom);
        }
      }
    }
  }
  if (inv.cosmosCoinBackedPath?.conversion?.sideA?.denom) {
    denomsSeen.add(inv.cosmosCoinBackedPath.conversion.sideA.denom);
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

function buildApprovalParagraphRaw(approval: any, isForMint: boolean): string {
  const criteria = approval.approvalCriteria;
  let md = '';

  // Title
  const label = isForMint ? 'Mint Approval' : 'Transfer Approval';
  md += `### ${label}: "${approval.approvalId}"\n\n`;

  // Approval metadata
  const approvalDetails = approval.details;
  if (approvalDetails?.name) {
    md += `**"${approvalDetails.name}"** (creator-provided approval name)`;
    if (approvalDetails.description) {
      md += `\n\n> *Creator-provided approval description:* ${approvalDetails.description}\n\n`;
    } else {
      md += '\n\n';
    }
  }

  // Direction
  if (isForMint) {
    md += `This approval governs the creation of new tokens. `;
    md += `It allows ${listIdHuman(approval.initiatedByListId)} to initiate minting, `;
    md += `with tokens being delivered to ${listIdHuman(approval.toListId)}. `;
  } else {
    md += `This approval governs token transfers. `;
    md += `It permits tokens to be sent from ${listIdHuman(approval.fromListId)} `;
    md += `to ${listIdHuman(approval.toListId)}, `;
    md += `initiated by ${listIdHuman(approval.initiatedByListId)}. `;

    // Two-level approval clarification
    if (approval.initiatedByListId === 'All' && !criteria?.overridesFromOutgoingApprovals) {
      md += 'Note that while the collection-level rule does not restrict who initiates, the sender\'s personal outgoing approval must still pass. By default, only the sender themselves can initiate their own outgoing transfer. ';
    }
  }

  // Token scope and timing
  const tokenRange = rangeStrRaw(approval.tokenIds);
  const transferTiming = timeRangeStrRaw(approval.transferTimes);
  const ownershipTiming = timeRangeStrRaw(approval.ownershipTimes);

  if (tokenRange === 'all' && transferTiming === 'all time' && ownershipTiming === 'all time') {
    md += 'This applies to all token IDs, at all times, for all ownership periods.';
  } else {
    md += `This applies to token IDs ${tokenRange}`;
    if (transferTiming !== 'all time') md += `, available during ${transferTiming}`;
    if (ownershipTiming !== 'all time') md += `, for ownership times ${ownershipTiming}`;
    md += '.';
  }
  md += '\n\n';

  if (!criteria) return md;

  // Payment / cost
  if (criteria.coinTransfers && criteria.coinTransfers.length > 0) {
    for (const ct of criteria.coinTransfers) {
      const coins = ct.coins || [];
      if (coins.length > 0) {
        const costParts = coins.map((c: any) => {
          const amt = big(c.amount);
          const denom = c.denom || 'unknown';
          return amountToHuman(amt, denom);
        });
        md += `**Cost**: ${costParts.join(' + ')} per transfer. `;
        if (ct.overrideFromWithApproverAddress) {
          md += 'The payment is deducted from the approver address. ';
        } else {
          md += 'The payment is deducted from the transfer initiator. ';
        }
      }
    }
    md += '\n\n';
  } else {
    md += '**Cost**: Free (no payment required).\n\n';
  }

  // Limits
  const amounts = criteria.approvalAmounts;
  const maxNum = criteria.maxNumTransfers;
  const limitParts: string[] = [];

  if (amounts) {
    const oa = big(amounts.overallApprovalAmount);
    if (oa > 0n && oa < MAX_UINT64) limitParts.push(`a total cap of ${oa.toLocaleString('en-US')} tokens across all users`);
    const pa = big(amounts.perInitiatedByAddressApprovalAmount);
    if (pa > 0n && pa < MAX_UINT64) limitParts.push(`a per-user limit of ${pa.toLocaleString('en-US')} tokens`);
    const fa = big(amounts.perFromAddressApprovalAmount);
    if (fa > 0n && fa < MAX_UINT64) limitParts.push(`a per-sender limit of ${fa.toLocaleString('en-US')} tokens`);
    const ta = big(amounts.perToAddressApprovalAmount);
    if (ta > 0n && ta < MAX_UINT64) limitParts.push(`a per-recipient limit of ${ta.toLocaleString('en-US')} tokens`);
  }

  if (maxNum) {
    const on = big(maxNum.overallMaxNumTransfers);
    if (on > 0n && on < MAX_UINT64) limitParts.push(`a total of ${on.toLocaleString('en-US')} transfer transactions overall`);
    const pn = big(maxNum.perInitiatedByAddressMaxNumTransfers);
    if (pn > 0n && pn < MAX_UINT64) limitParts.push(`${pn.toLocaleString('en-US')} transfer transaction${pn > 1n ? 's' : ''} per user`);
    const fn = big(maxNum.perFromAddressMaxNumTransfers);
    if (fn > 0n && fn < MAX_UINT64) limitParts.push(`${fn.toLocaleString('en-US')} transfer transaction${fn > 1n ? 's' : ''} per sender`);
    const tn = big(maxNum.perToAddressMaxNumTransfers);
    if (tn > 0n && tn < MAX_UINT64) limitParts.push(`${tn.toLocaleString('en-US')} transfer transaction${tn > 1n ? 's' : ''} per recipient`);
  }

  if (limitParts.length > 0) {
    md += `**Limits**: This approval enforces ${limitParts.join(', ')}.`;

    const amountsReset = amounts?.resetTimeIntervals;
    const maxNumReset = maxNum?.resetTimeIntervals;
    const resetInterval = amountsReset || maxNumReset;
    if (resetInterval) {
      const intervalLen = big(resetInterval.intervalLength);
      if (intervalLen > 0n) {
        md += ` These limits reset every ${durationToHuman(intervalLen)}.`;
      }
    }
    md += '\n\n';
  }

  // Ownership gate
  if (criteria.mustOwnTokens && criteria.mustOwnTokens.length > 0) {
    md += '**Ownership Requirements**: ';
    const reqs = criteria.mustOwnTokens.map((mot: any) => {
      const minAmount = mot.amountRange ? big(mot.amountRange.start) : 1n;
      let desc = `at least ${minAmount.toLocaleString('en-US')} token${minAmount > 1n ? 's' : ''} from collection ${mot.collectionId}`;
      if (mot.tokenIds && mot.tokenIds.length > 0) {
        const tr = rangeStrRaw(mot.tokenIds);
        if (tr !== 'all') desc += ` (token IDs: ${tr})`;
      }
      return desc;
    });
    md += `To use this approval, the user must already hold ${reqs.join(' and ')}.\n\n`;
  }

  // Predetermined balances
  if (criteria.predeterminedBalances) {
    const pb = criteria.predeterminedBalances;
    md += '**Distribution Method**: Tokens are distributed using sequential allocation. ';

    const ocm = pb.orderCalculationMethod;
    if (ocm) {
      if (ocm.useOverallNumTransfers) md += 'The order number is determined by the overall number of transfers across all users. ';
      else if (ocm.usePerToAddressNumTransfers) md += 'The order number is determined per recipient address. ';
      else if (ocm.usePerInitiatedByAddressNumTransfers) md += 'The order number is determined per initiator address. ';
      else if (ocm.useMerkleChallengeLeafIndex) md += 'The order number is determined by the Merkle proof leaf index. ';
    }

    const inc = pb.incrementedBalances;
    if (inc) {
      const incTokenIds = big(inc.incrementTokenIdsBy);
      if (incTokenIds > 0n) md += `Each successive claim receives the next token ID in sequence, incrementing by ${incTokenIds.toLocaleString('en-US')}. `;
      const duration = big(inc.durationFromTimestamp);
      if (duration > 0n) md += `Each claim grants ownership for a duration of ${durationToHuman(duration)} starting from the claim timestamp. `;
    }

    md += '\n\n';
  }

  // Restrictions
  const restrictions: string[] = [];
  if (criteria.requireToEqualsInitiatedBy) restrictions.push('the recipient must be the same address that initiates the transfer (self-claim only)');
  if (criteria.requireFromEqualsInitiatedBy) restrictions.push('the sender must be the same address that initiates the transfer');
  if (criteria.requireToDoesNotEqualInitiatedBy) restrictions.push('the recipient cannot be the same address that initiates the transfer');
  if (criteria.requireFromDoesNotEqualInitiatedBy) restrictions.push('the sender cannot be the same address that initiates the transfer');
  if (restrictions.length > 0) {
    md += `**Restrictions**: ${restrictions.join('; ')}.\n\n`;
  }

  // Overrides (forceful behavior)
  if (criteria.overridesFromOutgoingApprovals || criteria.overridesToIncomingApprovals) {
    md += '**Forceful Behavior**: ';
    if (criteria.overridesFromOutgoingApprovals) {
      md += 'This approval **overrides the sender\'s personal outgoing approval**. This means the sender does NOT need to consent to this specific transfer. Tokens can be moved from a holder without their explicit per-transfer consent. ';
    }
    if (criteria.overridesToIncomingApprovals) {
      md += 'This approval **overrides the recipient\'s personal incoming approval**. Tokens can be deposited into any address without the recipient opting in. ';
    }
    md += '\n\n';
  }

  // Backed minting
  if (criteria.allowBackedMinting) {
    md += '**IBC Backing**: This approval is used for IBC-backed minting or withdrawal operations. Tokens are created or destroyed in exchange for the underlying IBC asset.\n\n';
  }

  // Special wrapping
  if (criteria.allowSpecialWrapping) {
    md += '**Special Wrapping**: This approval is used for Cosmos coin wrapping/unwrapping operations.\n\n';
  }

  // Must prioritize
  if (criteria.mustPrioritize) {
    md += '**Priority**: This approval must be explicitly prioritized to be used.\n\n';
  }

  // Merkle challenges
  if (criteria.merkleChallenges && criteria.merkleChallenges.length > 0) {
    md += `**Verification Challenges**: ${criteria.merkleChallenges.length} Merkle proof challenge${criteria.merkleChallenges.length > 1 ? 's' : ''} must be satisfied. `;

    const linkedClaims = criteria.merkleChallenges
      .map((mc: any) => mc.challengeInfoDetails?.claim)
      .filter((c: any) => !!c);

    if (linkedClaims.length === 0) {
      md += 'This typically means the user must provide a valid proof of inclusion in a whitelist or enter a valid claim code.\n\n';
    } else {
      md += '\n\n';
      for (const claim of linkedClaims) {
        md += `#### Linked Claim: "${claim.claimId}"\n\n`;
        if (claim.metadata?.name) md += `**"${claim.metadata.name}"** (creator-provided claim name)\n\n`;

        if (claim.plugins && claim.plugins.length > 0) {
          md += 'To complete this claim, the user must satisfy the following verification steps:\n\n';
          for (const plugin of claim.plugins) {
            const plugName = pluginDisplayName(plugin.pluginId || 'unknown plugin');
            md += `- **${plugName}**`;
            if (plugin.publicParams) {
              const publicKeys = Object.keys(plugin.publicParams).filter(
                (k: string) => k !== 'seedCode' && k !== 'preimages' && !k.startsWith('_')
              );
              if (publicKeys.length > 0) {
                const paramStrs = publicKeys.map((k: string) => `${k}: ${JSON.stringify(plugin.publicParams[k])}`);
                md += ` (${paramStrs.join(', ')})`;
              }
            }
            md += '\n';
          }
          md += '\n';
        }
      }
    }
  }

  // Dynamic store challenges
  if (criteria.dynamicStoreChallenges && criteria.dynamicStoreChallenges.length > 0) {
    md += `**Dynamic Store Checks**: ${criteria.dynamicStoreChallenges.length} dynamic store verification${criteria.dynamicStoreChallenges.length > 1 ? 's' : ''} must pass.\n\n`;
  }

  // Forceful transfer warning
  if (
    !isForMint &&
    approval.fromListId === 'All' &&
    approval.initiatedByListId === 'All' &&
    !criteria.requireToEqualsInitiatedBy &&
    !criteria.requireFromEqualsInitiatedBy &&
    criteria.overridesFromOutgoingApprovals
  ) {
    md += '> **Warning**: This approval allows anyone to move tokens from any holder, combined with an override on outgoing approvals. This means forceful transfers or seizure of tokens is possible under this rule.\n\n';
  }

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
    md += buildApprovalParagraphRaw(approval, isMint);
  }

  md += 'Any transfer that does not match one of the approvals listed above will be rejected.\n\n';

  return md;
}

function buildPermissionsSection(txBody: Record<string, any>): string {
  let md = '## Permissions -- What Can Change Later\n\n';

  const manager = txBody.manager || 'not set';
  md += `The **manager** (currently \`${manager}\`) is the single address that has administrative control over the collection. If a permission is locked (permanently forbidden), even the manager cannot make that change.\n\n`;

  const perms = txBody.collectionPermissions || {};

  let lockedCount = 0;
  let openCount = 0;
  let undecidedCount = 0;

  for (const [key, info] of Object.entries(PERM_DESCRIPTIONS)) {
    const permArray = perms[key] as any[] | undefined;
    const state = permStateRaw(permArray);

    if (state === 'locked') lockedCount++;
    else if (state === 'open') openCount++;
    else undecidedCount++;

    let desc: string;
    if (state === 'locked') desc = info.lockedDesc;
    else if (state === 'open') desc = info.openDesc;
    else desc = info.undecidedDesc;

    const stateLabel = state === 'locked' ? 'Permanently Locked' : state === 'open' ? 'Explicitly Allowed' : 'Unlocked (Undecided)';
    md += `**${info.label}**: *${stateLabel}*. ${desc}\n\n`;
  }

  // Trust summary
  const total = lockedCount + openCount + undecidedCount;
  md += '### Trust Summary\n\n';
  md += `This collection has **${lockedCount} of ${total}** permissions permanently locked. `;

  if (lockedCount === total) {
    md += 'The collection is **fully immutable**.';
  } else if (lockedCount >= total * 0.7) {
    md += `Only ${total - lockedCount} aspect${total - lockedCount > 1 ? 's' : ''} can be changed, providing **strong guarantees**.`;
  } else if (lockedCount >= total * 0.4) {
    md += 'The collection is **partially locked**. The manager retains significant control over some aspects.';
  } else {
    md += 'The collection is **highly mutable**. The manager can change most aspects. Only trust if you trust the manager.';
  }
  md += '\n\n';

  return md;
}

function buildDefaultBalancesSection(txBody: Record<string, any>): string {
  let md = '## Default User Balances\n\n';

  const defaults = txBody.defaultBalances;
  if (!defaults) {
    md += 'No default balance configuration is set for this collection.\n\n';
    return md;
  }

  // Starting balances
  if (defaults.balances && defaults.balances.length > 0) {
    md += 'Every new address that interacts with this collection starts with the following default balances:\n\n';
    for (const bal of defaults.balances) {
      const amount = big(bal.amount);
      md += `- **${amount.toLocaleString('en-US')} tokens** for token IDs ${rangeStrRaw(bal.tokenIds)}\n`;
    }
    md += '\n';
  } else {
    md += 'Users start with zero balance. Tokens must be obtained through minting, claiming, or receiving a transfer.\n\n';
  }

  // Auto-approve settings
  md += '### Auto-Approve Settings\n\n';
  md += 'These settings determine how transfers are handled at the user level by default:\n\n';

  if (defaults.autoApproveSelfInitiatedOutgoingTransfers) {
    md += '- **Auto-approve self-initiated outgoing transfers**: Yes. Users can send their own tokens without needing additional approvals. This is the standard, expected behavior.\n';
  } else {
    md += '- **Auto-approve self-initiated outgoing transfers**: No. Users must explicitly approve even their own outgoing transfers.\n';
  }

  if (defaults.autoApproveSelfInitiatedIncomingTransfers) {
    md += '- **Auto-approve self-initiated incoming transfers**: Yes. When a user initiates a transfer to themselves, it is automatically approved on the receiving side.\n';
  } else {
    md += '- **Auto-approve self-initiated incoming transfers**: No. Even self-initiated incoming transfers require explicit approval.\n';
  }

  if (defaults.autoApproveAllIncomingTransfers) {
    md += '- **Auto-approve all incoming transfers**: Yes. Any token sent to any address is automatically accepted. No one can block incoming tokens.\n';
  } else {
    md += '- **Auto-approve all incoming transfers**: No. Recipients can control which incoming transfers they accept.\n';
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
 * @returns A single markdown string with a comprehensive explanation
 *
 * @category Collections
 */
export function interpretTransaction(
  txBody: Record<string, any>,
  isUpdate?: boolean,
  activeUpdateFlags?: string[]
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
    for (let i = 1; i <= 9; i++) activeSections.add(i);
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
    report += buildBackingAndPaths(txBody);
  }

  // Section 4: Invariants
  if (activeSections.has(4)) {
    report += buildInvariantsSection(txBody);
  }

  // Section 5: Standards
  if (activeSections.has(5)) {
    report += buildStandardsSection(txBody);
  }

  // Section 6: Key Reference Information
  report += buildKeyReference(txBody);

  // Section 7: Transfer & Approval Rules
  if (activeSections.has(7)) {
    report += buildTransferAndApprovalRules(txBody);
  }

  // Section 8: Permissions
  if (activeSections.has(8)) {
    report += buildPermissionsSection(txBody);
  }

  // Section 9: Default User Balances
  if (activeSections.has(9)) {
    report += buildDefaultBalancesSection(txBody);
  }

  return report;
}
