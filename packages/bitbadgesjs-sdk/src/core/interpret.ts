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
import type { CollectionApprovalWithDetails } from './approvals.js';
import type { ActionPermission, TokenIdsActionPermission, CollectionApprovalPermissionWithDetails } from './permissions.js';
import type { UintRangeArray } from './uintRanges.js';

// ---------------------------------------------------------------------------
// Human-readable conversion helpers
// ---------------------------------------------------------------------------

const MAX_UINT64 = GO_MAX_UINT_64;

/**
 * Convert a millisecond-epoch timestamp (bigint) to a human-readable date
 * string such as "January 1, 2025" or "January 1, 2025 at 14:30 UTC".
 * Returns descriptive text for boundary values.
 */
export function timestampToDate(ms: bigint): string {
  if (ms <= 0n) return 'the beginning of time';
  if (ms >= MAX_UINT64) return 'the end of time';
  const d = new Date(Number(ms));
  if (isNaN(d.getTime())) return `timestamp ${ms}`;
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  const hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  if (hours === 0 && minutes === 0) {
    return `${month} ${day}, ${year}`;
  }
  return `${month} ${day}, ${year} at ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} UTC`;
}

/**
 * Convert a duration in milliseconds (bigint) to a human-readable string
 * such as "24 hours", "7 days", "1 year", etc.
 */
export function durationToHuman(ms: bigint): string {
  if (ms <= 0n) return 'instant';
  if (ms >= MAX_UINT64) return 'forever';

  const seconds = Number(ms) / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const years = days / 365.25;

  if (years >= 1 && years === Math.floor(years)) return `${Math.floor(years)} year${Math.floor(years) > 1 ? 's' : ''}`;
  if (days >= 7 && days === Math.floor(days)) {
    if (days === 7) return '7 days (weekly)';
    if (days === 30 || days === 31) return `${Math.floor(days)} days (monthly)`;
    return `${Math.floor(days)} days`;
  }
  if (hours >= 1 && hours === Math.floor(hours)) return `${Math.floor(hours)} hour${Math.floor(hours) > 1 ? 's' : ''}`;
  if (minutes >= 1 && minutes === Math.floor(minutes)) return `${Math.floor(minutes)} minute${Math.floor(minutes) > 1 ? 's' : ''}`;
  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

/**
 * Map a raw denomination string to a human-readable symbol using the
 * SDK's CoinsRegistry. Unknown denoms are returned as-is.
 */
export function denomToHuman(denom: string): string {
  const entry = CoinsRegistry[denom];
  if (entry) return entry.symbol;
  // Handle shorthand matches like "ibc/USDC" used in tests
  if (denom.toLowerCase().includes('usdc')) return 'USDC';
  if (denom.toLowerCase().includes('atom')) return 'ATOM';
  if (denom.toLowerCase().includes('osmo')) return 'OSMO';
  return denom;
}

/**
 * Convert a base-unit amount + denom into a human-readable display amount
 * (e.g., 5000000 ubadge -> "5 BADGE"). Unknown denoms show the raw amount.
 */
export function amountToHuman(amount: bigint, denom: string): string {
  const symbol = denomToHuman(denom);
  const entry = CoinsRegistry[denom];
  if (entry) {
    const decimals = parseInt(entry.decimals, 10);
    if (decimals > 0) {
      const divisor = 10n ** BigInt(decimals);
      const whole = amount / divisor;
      const remainder = amount % divisor;
      if (remainder === 0n) {
        return `${whole.toLocaleString('en-US')} ${symbol}`;
      }
      const fracStr = remainder.toString().padStart(decimals, '0').replace(/0+$/, '');
      return `${whole}.${fracStr} ${symbol}`;
    }
  }
  return `${amount.toLocaleString('en-US')} ${symbol}`;
}

// ---------------------------------------------------------------------------
// Structural helpers (kept from original)
// ---------------------------------------------------------------------------

function isFullRange<T extends NumberType>(ranges: UintRangeArray<T> | undefined): boolean {
  if (!ranges || ranges.length === 0) return false;
  return ranges.some((r) => BigInt(r.start.valueOf()) === 1n && BigInt(r.end.valueOf()) === MAX_UINT64);
}

function isForbidden<T extends NumberType>(entries: ActionPermission<T>[] | TokenIdsActionPermission<T>[] | CollectionApprovalPermissionWithDetails<T>[] | undefined): boolean {
  if (!entries || entries.length === 0) return false;
  return entries.some((e: any) => isFullRange(e.permanentlyForbiddenTimes));
}

function isPermitted<T extends NumberType>(entries: ActionPermission<T>[] | TokenIdsActionPermission<T>[] | CollectionApprovalPermissionWithDetails<T>[] | undefined): boolean {
  if (!entries || entries.length === 0) return false;
  return entries.some((e: any) => isFullRange(e.permanentlyPermittedTimes));
}

function permState<T extends NumberType>(entries: ActionPermission<T>[] | TokenIdsActionPermission<T>[] | CollectionApprovalPermissionWithDetails<T>[] | undefined): 'locked' | 'open' | 'undecided' {
  if (isForbidden(entries)) return 'locked';
  if (isPermitted(entries)) return 'open';
  return 'undecided';
}

function rangeStr<T extends NumberType>(ranges: UintRangeArray<T> | { start: T; end: T }[]): string {
  if (!ranges || ranges.length === 0) return 'none';
  return (ranges as any[])
    .map((r: any) => {
      const s = BigInt(r.start.valueOf());
      const e = BigInt(r.end.valueOf());
      if (s === 1n && e === MAX_UINT64) return 'all';
      if (s === e) return `#${s}`;
      return `#${s}-#${e}`;
    })
    .join(', ');
}

function timeRangeStr<T extends NumberType>(ranges: UintRangeArray<T> | { start: T; end: T }[]): string {
  if (!ranges || ranges.length === 0) return 'none';
  return (ranges as any[])
    .map((r: any) => {
      const s = BigInt(r.start.valueOf());
      const e = BigInt(r.end.valueOf());
      if (s === 1n && e === MAX_UINT64) return 'all time';
      return `${timestampToDate(s)} through ${timestampToDate(e)}`;
    })
    .join(', ');
}

function countTokenIds<T extends NumberType>(ranges: UintRangeArray<T> | { start: T; end: T }[]): string {
  if (!ranges || ranges.length === 0) return '0';
  let total = 0n;
  for (const r of ranges as any[]) {
    const s = BigInt(r.start.valueOf());
    const e = BigInt(r.end.valueOf());
    total += e - s + 1n;
  }
  if (total >= MAX_UINT64) return 'unlimited';
  if (total > 1000000n) return `${total.toLocaleString('en-US')} (very large range)`;
  return total.toLocaleString('en-US');
}

function listIdHuman(listId: string): string {
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

function detectType<T extends NumberType>(collection: BitBadgesCollection<T>): string {
  const s = collection.standards ?? [];
  if (s.some((x) => x.toLowerCase().includes('subscription'))) return 'Subscription Token';
  if (s.some((x) => x.toLowerCase().includes('ai agent stablecoin'))) return 'AI Agent Stablecoin';
  if (s.some((x) => x.toLowerCase().includes('smart token')) || collection.invariants?.cosmosCoinBackedPath) return 'Smart Token (IBC-backed)';
  if (s.includes('NFTs')) return 'NFT Collection';
  if (s.includes('Fungible Tokens')) return 'Fungible Token';
  return 'Token Collection';
}

function bigVal<T extends NumberType>(v: T | undefined | null): bigint {
  if (v == null) return 0n;
  return BigInt(v.valueOf());
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
// Section builders — rich markdown output
// ---------------------------------------------------------------------------

function buildOverview<T extends NumberType>(col: BitBadgesCollection<T>): string {
  const type = detectType(col);
  const tokenCount = countTokenIds(col.validTokenIds);
  const maxSupply = col.invariants?.maxSupplyPerId != null ? bigVal(col.invariants.maxSupplyPerId) : 0n;
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
  const rangeDisplay = rangeStr(col.validTokenIds);
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

function buildBackingAndCrossChain<T extends NumberType>(col: BitBadgesCollection<T>): string {
  const hasAlias = col.aliasPaths && col.aliasPaths.length > 0;
  const hasWrapper = col.cosmosCoinWrapperPaths && col.cosmosCoinWrapperPaths.length > 0;
  const hasBacking = !!col.invariants?.cosmosCoinBackedPath;

  let md = '## Token Backing & Cross-Chain\n\n';

  if (!hasAlias && !hasWrapper && !hasBacking) {
    md += 'This is a native BitBadges collection with no cross-chain backing. Tokens are created and managed entirely within the BitBadges chain and are not pegged to any external asset or IBC denomination.\n\n';
    return md;
  }

  if (hasBacking) {
    const backing = col.invariants!.cosmosCoinBackedPath!;
    const rawDenom = backing.conversion?.sideA?.denom || 'unknown';
    const symbol = denomToHuman(rawDenom);
    const address = backing.address || 'unknown';
    const sideAAmount = backing.conversion?.sideA?.amount != null ? bigVal(backing.conversion.sideA.amount) : 1n;
    const sideBBalances = backing.conversion?.sideB;
    const sideBAmount = sideBBalances && sideBBalances.length > 0 ? bigVal((sideBBalances[0] as any).amount) : 1n;
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
    md += 'Users can deposit the backing asset to mint new collection tokens, and burn collection tokens to withdraw the backing asset. ';
    md += 'This mechanism ensures that the total supply of collection tokens never exceeds the reserves held at the backing address.\n\n';
  }

  if (hasAlias) {
    md += '### Alias Paths\n\n';
    md += 'Alias paths provide alternative denominations for display and trading purposes:\n\n';
    for (const alias of col.aliasPaths) {
      const aliasName = alias.metadata?.metadata?.name || alias.symbol || (alias as any).denom || 'unnamed';
      md += `- **${aliasName}**: denomination \`${(alias as any).denom || 'N/A'}\`, symbol \`${alias.symbol || 'N/A'}\`. `;
      md += 'This alias allows the token to appear under a different symbol in wallets and DEX interfaces.\n';
    }
    md += '\n';
  }

  if (hasWrapper) {
    md += '### Cosmos Coin Wrapper Paths\n\n';
    md += 'Wrapper paths allow this collection token to be wrapped as a native Cosmos SDK coin, enabling integration with standard Cosmos modules (staking, governance, IBC transfers):\n\n';
    for (const wrapper of col.cosmosCoinWrapperPaths) {
      const wrapperName = wrapper.metadata?.metadata?.name || (wrapper as any).symbol || (wrapper as any).denom || 'unnamed';
      md += `- **${wrapperName}**: denomination \`${(wrapper as any).denom || 'N/A'}\`, symbol \`${(wrapper as any).symbol || 'N/A'}\`\n`;
    }
    md += '\n';
  }

  return md;
}

function buildApprovalParagraph<T extends NumberType>(approval: CollectionApprovalWithDetails<T>, isForMint: boolean): string {
  const criteria = approval.approvalCriteria;
  let md = '';

  // Title
  const label = isForMint ? 'Mint Approval' : 'Transfer Approval';
  md += `### ${label}: "${approval.approvalId}"\n\n`;

  // Approval metadata (creator-provided)
  const approvalDetails = (approval as any).details;
  if (approvalDetails?.name) {
    md += `**"${approvalDetails.name}"** (creator-provided approval name)`;
    if (approvalDetails.description) {
      md += `\n\n> *Creator-provided approval description:* ${approvalDetails.description}\n\n`;
    } else {
      md += '\n\n';
    }
  } else if (approvalDetails?.description) {
    md += `> *Creator-provided approval description:* ${approvalDetails.description}\n\n`;
  }
  if (approvalDetails?.image) {
    md += `Approval image: ${approvalDetails.image}\n\n`;
  }

  // Direction paragraph
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
  const tokenRange = rangeStr(approval.tokenIds);
  const transferTiming = timeRangeStr(approval.transferTimes);
  const ownershipTiming = timeRangeStr(approval.ownershipTimes);

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
          const amt = bigVal(c.amount);
          const denom = c.denom || 'unknown';
          return amountToHuman(amt, denom);
        });
        md += `**Cost**: ${costParts.join(' + ')} per transfer. `;
        if ((ct as any).overrideFromWithApproverAddress) {
          md += 'The payment is deducted from the approver address (the address that set up this approval). ';
        } else {
          md += 'The payment is deducted from the transfer initiator. ';
        }
        if ((ct as any).overrideToWithInitiator) {
          md += 'Payment is sent to the transfer initiator. ';
        } else if ((ct as any).to) {
          md += `Payment is sent to address \`${(ct as any).to}\`. `;
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
    const oa = bigVal(amounts.overallApprovalAmount);
    if (oa > 0n && oa < MAX_UINT64) limitParts.push(`a total cap of ${oa.toLocaleString('en-US')} tokens across all users`);
    const pa = bigVal(amounts.perInitiatedByAddressApprovalAmount);
    if (pa > 0n && pa < MAX_UINT64) limitParts.push(`a per-user limit of ${pa.toLocaleString('en-US')} tokens`);
    const fa = bigVal(amounts.perFromAddressApprovalAmount);
    if (fa > 0n && fa < MAX_UINT64) limitParts.push(`a per-sender limit of ${fa.toLocaleString('en-US')} tokens`);
    const ta = bigVal(amounts.perToAddressApprovalAmount);
    if (ta > 0n && ta < MAX_UINT64) limitParts.push(`a per-recipient limit of ${ta.toLocaleString('en-US')} tokens`);
  }

  if (maxNum) {
    const on = bigVal(maxNum.overallMaxNumTransfers);
    if (on > 0n && on < MAX_UINT64) limitParts.push(`a total of ${on.toLocaleString('en-US')} transfer transactions overall`);
    const pn = bigVal(maxNum.perInitiatedByAddressMaxNumTransfers);
    if (pn > 0n && pn < MAX_UINT64) limitParts.push(`${pn.toLocaleString('en-US')} transfer transaction${pn > 1n ? 's' : ''} per user`);
    const fn = bigVal(maxNum.perFromAddressMaxNumTransfers);
    if (fn > 0n && fn < MAX_UINT64) limitParts.push(`${fn.toLocaleString('en-US')} transfer transaction${fn > 1n ? 's' : ''} per sender`);
    const tn = bigVal(maxNum.perToAddressMaxNumTransfers);
    if (tn > 0n && tn < MAX_UINT64) limitParts.push(`${tn.toLocaleString('en-US')} transfer transaction${tn > 1n ? 's' : ''} per recipient`);
  }

  if (limitParts.length > 0) {
    md += `**Limits**: This approval enforces ${limitParts.join(', ')}.`;

    // Reset time intervals for approval amounts
    const amountsReset = amounts?.resetTimeIntervals;
    const maxNumReset = maxNum?.resetTimeIntervals;
    const resetInterval = amountsReset || maxNumReset;
    if (resetInterval) {
      const intervalLen = bigVal((resetInterval as any).intervalLength);
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
      const minAmount = mot.amountRange ? bigVal(mot.amountRange.start) : 1n;
      const maxAmount = mot.amountRange ? bigVal(mot.amountRange.end) : 0n;
      let desc = '';
      if (maxAmount > 0n && maxAmount < MAX_UINT64 && maxAmount !== minAmount) {
        desc += `between ${minAmount.toLocaleString('en-US')} and ${maxAmount.toLocaleString('en-US')} tokens`;
      } else {
        desc += `at least ${minAmount.toLocaleString('en-US')} token${minAmount > 1n ? 's' : ''}`;
      }
      desc += ` from collection ${mot.collectionId}`;
      if (mot.tokenIds && mot.tokenIds.length > 0) {
        const tokenRange = rangeStr(mot.tokenIds);
        if (tokenRange !== 'all') desc += ` (token IDs: ${tokenRange})`;
      }
      if (mot.ownershipTimes && mot.ownershipTimes.length > 0) {
        const ownershipRange = timeRangeStr(mot.ownershipTimes);
        if (ownershipRange !== 'all time') desc += ` during ${ownershipRange}`;
      }
      if (mot.overrideWithCurrentTime) {
        desc += ' (ownership checked at the current block time)';
      }
      if (mot.mustSatisfyForAllAssets) {
        desc += ' (must hold ALL specified tokens)';
      }
      return desc;
    });
    md += `To use this approval, the user must already hold ${reqs.join(' and ')}. This acts as a token gate, restricting access to existing holders of specific collections.\n\n`;
  }

  // Predetermined balances
  if (criteria.predeterminedBalances) {
    const pb = criteria.predeterminedBalances;
    md += '**Distribution Method**: Tokens are distributed using sequential allocation. ';

    // Order calculation method
    const ocm = pb.orderCalculationMethod;
    if (ocm) {
      if (ocm.useOverallNumTransfers) {
        md += 'The order number is determined by the overall number of transfers across all users (the Nth person to claim gets the Nth allocation). ';
      } else if (ocm.usePerToAddressNumTransfers) {
        md += 'The order number is determined per recipient address (each recipient\'s own claim count determines their allocation). ';
      } else if (ocm.usePerFromAddressNumTransfers) {
        md += 'The order number is determined per sender address. ';
      } else if (ocm.usePerInitiatedByAddressNumTransfers) {
        md += 'The order number is determined per initiator address. ';
      } else if (ocm.useMerkleChallengeLeafIndex) {
        md += 'The order number is determined by the Merkle proof leaf index, reserving specific allocations for specific whitelist entries or codes. ';
      }
    }

    // Incremented balances
    const inc = pb.incrementedBalances;
    if (inc) {
      const incTokenIds = bigVal(inc.incrementTokenIdsBy);
      const incOwnership = bigVal(inc.incrementOwnershipTimesBy);
      const duration = bigVal(inc.durationFromTimestamp);
      if (incTokenIds > 0n) {
        md += `Each successive claim receives the next token ID in sequence, incrementing by ${incTokenIds.toLocaleString('en-US')}. `;
      }
      if (incOwnership > 0n) {
        md += `Ownership times increment by ${durationToHuman(incOwnership)} per claim. `;
      }
      if (duration > 0n) {
        md += `Each claim grants ownership for a duration of ${durationToHuman(duration)} starting from the claim timestamp. `;
      }
      if (inc.allowOverrideTimestamp) {
        md += 'The claimant can override the start timestamp. ';
      }
    }

    // Manual balances
    if (pb.manualBalances && pb.manualBalances.length > 0) {
      md += `There are ${pb.manualBalances.length} manually defined balance allocation(s). `;
    }

    md += '\n\n';
  }

  // Restrictions
  const restrictions: string[] = [];
  if (criteria.requireToEqualsInitiatedBy) {
    restrictions.push('the recipient must be the same address that initiates the transfer (self-claim only)');
  }
  if (criteria.requireFromEqualsInitiatedBy) {
    restrictions.push('the sender must be the same address that initiates the transfer');
  }
  if (criteria.requireToDoesNotEqualInitiatedBy) {
    restrictions.push('the recipient cannot be the same address that initiates the transfer');
  }
  if (criteria.requireFromDoesNotEqualInitiatedBy) {
    restrictions.push('the sender cannot be the same address that initiates the transfer');
  }
  if (restrictions.length > 0) {
    md += `**Restrictions**: ${restrictions.join('; ')}.\n\n`;
  }

  // Overrides (forceful behavior)
  if (criteria.overridesFromOutgoingApprovals || criteria.overridesToIncomingApprovals) {
    md += '**Forceful Behavior**: ';
    if (criteria.overridesFromOutgoingApprovals) {
      md += 'This approval **overrides the sender\'s personal outgoing approval**. This means the sender\'s personal outgoing approval tier is skipped — the sender does NOT need to consent to this specific transfer. Normally, the sender must approve their own outgoing transfers, but this override bypasses that check. Tokens can be moved from a holder without their explicit per-transfer consent. ';
    }
    if (criteria.overridesToIncomingApprovals) {
      md += 'This approval **overrides the recipient\'s personal incoming approval**. This means the recipient\'s incoming approval tier is skipped — the recipient does NOT need to consent to receiving these tokens. Normally, the recipient can control which incoming transfers they accept, but this override bypasses that check. Tokens can be deposited into any address without the recipient opting in. ';
    }
    md += '\n\n';
  }

  // Backed minting
  if (criteria.allowBackedMinting) {
    md += '**IBC Backing**: This approval is used for IBC-backed minting or withdrawal operations. Tokens are created or destroyed in exchange for the underlying IBC asset.\n\n';
  }

  // Special wrapping
  if (criteria.allowSpecialWrapping) {
    md += '**Special Wrapping**: This approval is used for Cosmos coin wrapping/unwrapping operations. Tokens can be wrapped into or unwrapped from a native Cosmos SDK coin denomination.\n\n';
  }

  // Must prioritize
  if (criteria.mustPrioritize) {
    md += '**Priority**: This approval must be explicitly prioritized to be used. It will not be automatically selected during transfer matching.\n\n';
  }

  // Merkle challenges (with inline claim details if available)
  if (criteria.merkleChallenges && criteria.merkleChallenges.length > 0) {
    const linkedClaims = criteria.merkleChallenges
      .map((mc: any) => mc.challengeInfoDetails?.claim)
      .filter((c: any) => !!c);

    md += `**Verification Challenges**: ${criteria.merkleChallenges.length} Merkle proof challenge${criteria.merkleChallenges.length > 1 ? 's' : ''} must be satisfied. `;
    if (linkedClaims.length === 0) {
      md += 'This typically means the user must provide a valid proof of inclusion in a whitelist or enter a valid claim code.\n\n';
    } else {
      md += '\n\n';
      for (const claim of linkedClaims) {
        md += `#### Linked Claim: "${claim.claimId}"\n\n`;

        // Claim metadata (creator-provided)
        const claimName = claim.metadata?.name;
        const claimDesc = claim.metadata?.description;
        if (claimName) md += `**"${claimName}"** (creator-provided claim name)\n\n`;
        if (claimDesc) md += `> *Creator-provided claim description:* ${claimDesc}\n\n`;

        // Categories
        if (claim.categories && claim.categories.length > 0) {
          md += `**Categories**: ${claim.categories.join(', ')}\n\n`;
        }

        // Plugins — what the user needs to do
        if (claim.plugins && claim.plugins.length > 0) {
          md += 'To complete this claim, the user must satisfy the following verification steps:\n\n';
          for (const plugin of claim.plugins) {
            const pluginName = pluginDisplayName(plugin.pluginId || 'unknown plugin');
            md += `- **${pluginName}**`;
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

        // Rewards
        if (claim.rewards && claim.rewards.length > 0) {
          md += `**Rewards**: ${claim.rewards.length} reward${claim.rewards.length > 1 ? 's' : ''} upon successful completion.\n\n`;
        }
      }
    }
  }

  // EVM query challenges
  if ((criteria as any).evmQueryChallenges && (criteria as any).evmQueryChallenges.length > 0) {
    md += `**On-Chain Verification**: ${(criteria as any).evmQueryChallenges.length} EVM smart contract query check${(criteria as any).evmQueryChallenges.length > 1 ? 's' : ''} must pass. The on-chain contract is queried to verify eligibility before the transfer can proceed.\n\n`;
  }

  // Dynamic store challenges
  if (criteria.dynamicStoreChallenges && criteria.dynamicStoreChallenges.length > 0) {
    md += `**Dynamic Store Checks**: ${criteria.dynamicStoreChallenges.length} dynamic store verification${criteria.dynamicStoreChallenges.length > 1 ? 's' : ''} must pass. Dynamic stores are on-chain key-value databases that can be updated externally (for example, by an oracle or off-chain service). This approval checks values in the dynamic store to determine eligibility, enabling conditions that can change over time without modifying the approval itself.\n\n`;
  }

  // Eth signature challenges
  if (criteria.ethSignatureChallenges && criteria.ethSignatureChallenges.length > 0) {
    md += `**Signature Verification**: ${criteria.ethSignatureChallenges.length} Ethereum signature challenge${criteria.ethSignatureChallenges.length > 1 ? 's' : ''} must be satisfied. The user must cryptographically sign a specific message with their Ethereum wallet to prove ownership of an address or authorization.\n\n`;
  }

  // Voting challenges
  if (criteria.votingChallenges && criteria.votingChallenges.length > 0) {
    md += `**Voting Requirements**: ${criteria.votingChallenges.length} voting challenge${criteria.votingChallenges.length > 1 ? 's' : ''} must be satisfied. A governance vote must reach the required threshold before this approval can be used, enabling community-controlled transfers or minting.\n\n`;
  }

  // Address checks
  if (criteria.senderChecks) {
    const sc = criteria.senderChecks;
    const parts: string[] = [];
    if (sc.mustBeEvmContract) parts.push('the sender must be an EVM contract');
    if (sc.mustNotBeEvmContract) parts.push('the sender must NOT be an EVM contract (must be an externally-owned account)');
    if (sc.mustBeLiquidityPool) parts.push('the sender must be a liquidity pool');
    if (sc.mustNotBeLiquidityPool) parts.push('the sender must NOT be a liquidity pool');
    if (parts.length > 0) {
      md += `**Sender Checks**: ${parts.join('; ')}.\n\n`;
    } else {
      md += '**Sender Checks**: Additional sender address verification is configured.\n\n';
    }
  }
  if (criteria.recipientChecks) {
    const rc = criteria.recipientChecks;
    const parts: string[] = [];
    if (rc.mustBeEvmContract) parts.push('the recipient must be an EVM contract');
    if (rc.mustNotBeEvmContract) parts.push('the recipient must NOT be an EVM contract (must be an externally-owned account)');
    if (rc.mustBeLiquidityPool) parts.push('the recipient must be a liquidity pool');
    if (rc.mustNotBeLiquidityPool) parts.push('the recipient must NOT be a liquidity pool');
    if (parts.length > 0) {
      md += `**Recipient Checks**: ${parts.join('; ')}.\n\n`;
    } else {
      md += '**Recipient Checks**: Additional recipient address verification is configured.\n\n';
    }
  }
  if (criteria.initiatorChecks) {
    const ic = criteria.initiatorChecks;
    const parts: string[] = [];
    if (ic.mustBeEvmContract) parts.push('the initiator must be an EVM contract');
    if (ic.mustNotBeEvmContract) parts.push('the initiator must NOT be an EVM contract (must be an externally-owned account)');
    if (ic.mustBeLiquidityPool) parts.push('the initiator must be a liquidity pool');
    if (ic.mustNotBeLiquidityPool) parts.push('the initiator must NOT be a liquidity pool');
    if (parts.length > 0) {
      md += `**Initiator Checks**: ${parts.join('; ')}.\n\n`;
    } else {
      md += '**Initiator Checks**: Additional initiator address verification is configured.\n\n';
    }
  }

  // Alt time checks
  if (criteria.altTimeChecks) {
    const atc = criteria.altTimeChecks;
    const timeParts: string[] = [];
    if (atc.offlineHours && atc.offlineHours.length > 0) {
      const hourRanges = (atc.offlineHours as any[]).map((r: any) => `${bigVal(r.start)}:00-${bigVal(r.end)}:00 UTC`).join(', ');
      timeParts.push(`denied during hours ${hourRanges}`);
    }
    if (atc.offlineDays && atc.offlineDays.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayRanges = (atc.offlineDays as any[]).map((r: any) => {
        const s = Number(bigVal(r.start));
        const e = Number(bigVal(r.end));
        if (s === e) return dayNames[s] || `day ${s}`;
        return `${dayNames[s] || `day ${s}`} through ${dayNames[e] || `day ${e}`}`;
      }).join(', ');
      timeParts.push(`denied on ${dayRanges}`);
    }
    if (timeParts.length > 0) {
      md += `**Time Restrictions**: Transfers are ${timeParts.join(' and ')}.\n\n`;
    } else {
      md += '**Time Restrictions**: Transfers may be restricted during certain hours or days based on alternative time-check rules.\n\n';
    }
  }

  // User royalties
  if (criteria.userRoyalties) {
    const ur = criteria.userRoyalties;
    const percentage = bigVal((ur as any).percentage);
    const payoutAddress = (ur as any).payoutAddress || 'unspecified';
    if (percentage > 0n) {
      const basisPoints = Number(percentage);
      const pct = (basisPoints / 100).toFixed(2);
      md += `**Royalties**: A royalty of **${pct}%** (${basisPoints} basis points) of the transfer value is automatically redistributed to \`${payoutAddress}\` on each transfer.\n\n`;
    } else {
      md += '**Royalties**: User royalties are configured. A portion of the transfer value is automatically distributed to the designated royalty recipients.\n\n';
    }
  }

  // Auto-deletion
  if (criteria.autoDeletionOptions) md += '**Auto-Deletion**: This approval may be automatically removed after its conditions are fully consumed.\n\n';

  // Forceful transfer warning
  if (!isForMint && approval.fromListId === 'All' && approval.initiatedByListId === 'All' && !criteria.requireToEqualsInitiatedBy && !criteria.requireFromEqualsInitiatedBy) {
    if (!criteria.overridesFromOutgoingApprovals) {
      // Not actually forceful if overrides are not set — user approvals still apply
    } else {
      md += '> **Warning**: This approval allows anyone to move tokens from any holder, combined with an override on outgoing approvals. This means forceful transfers or seizure of tokens is possible under this rule.\n\n';
    }
  }

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
    md += buildApprovalParagraph(approval, true);
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
    md += buildApprovalParagraph(approval, false);
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
      const oa = bigVal(amounts.overallApprovalAmount);
      if (oa > 0n && oa < MAX_UINT64) md += `There is a total withdrawal limit of ${oa.toLocaleString('en-US')} tokens. `;
      const fa = bigVal(amounts.perFromAddressApprovalAmount);
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

function buildPermissions<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## Permissions -- What Can Change Later\n\n';

  const manager = col.manager || 'not set';
  md += `The **manager** is a single address that has administrative control over the collection. The manager is the ONLY address that can execute changes allowed by unfrozen permissions. If a permission is locked (forbidden), even the manager cannot make that change. If no manager is set, no one can make administrative changes.\n\n`;
  if (!col.manager) {
    md += '> **No Manager Set**: This collection has no manager address. No administrative changes can be made to the collection, regardless of permission settings. All unlocked permissions below are effectively inert until a manager is set (if the "Manager Transfer" permission allows it).\n\n';
  }
  md += `Current manager: \`${manager}\`. Each permission below determines whether the manager can modify a specific aspect of the collection in the future.\n\n`;

  const permDescriptions: Record<string, { label: string; lockedDesc: string; openDesc: string; undecidedDesc: string }> = {
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
      lockedDesc: 'The transfer and minting rules described in this report are permanently locked. They can never be changed by anyone, including the collection manager. This provides the strongest possible guarantee that the rules will remain as described.',
      openDesc: 'The manager can modify transfer and minting rules at any time. This means the transferability, fees, limits, and minting conditions described in this report could be changed in the future without holder consent. This is the most powerful permission.',
      undecidedDesc: 'The manager can currently modify transfer and minting rules. This permission could be locked in the future, but until then, the rules described in this report may change.'
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

  let lockedCount = 0;
  let openCount = 0;
  let undecidedCount = 0;

  const perms = col.collectionPermissions;
  for (const [key, info] of Object.entries(permDescriptions)) {
    const permArray = (perms as any)[key] as any[] | undefined;
    const state = permState(permArray);

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
    md += 'The collection is **fully immutable**. The manager cannot change anything about this collection. This provides the maximum level of trust and predictability for token holders.';
  } else if (lockedCount >= total * 0.7) {
    md += `Only ${total - lockedCount} aspect${total - lockedCount > 1 ? 's' : ''} can be changed, providing **strong guarantees** that the rules will remain as described.`;
  } else if (lockedCount >= total * 0.4) {
    md += 'The collection is **partially locked**. The manager retains significant control over some aspects. Holders should carefully review which permissions remain open.';
  } else {
    md += 'The collection is **highly mutable**. The manager can change most aspects of the collection. Only trust this collection if you trust the manager.';
  }
  md += '\n\n';

  // Critical callouts
  const approvalState = permState(perms.canUpdateCollectionApprovals);
  if (approvalState !== 'locked') {
    md += `> **Important**: Transfer rules are ${approvalState === 'open' ? 'permanently changeable' : 'currently changeable'}. `;
    const hasMint = col.collectionApprovals.some((a) => a.fromList.checkAddress('Mint'));
    if (hasMint) {
      md += 'Since the collection has mint approvals, the manager could potentially change minting rules (add unlimited minting, change prices, etc.).\n\n';
    } else {
      md += 'The manager could add new transfer rules or modify existing ones.\n\n';
    }
  }

  const validTokenState = permState(perms.canUpdateValidTokenIds);
  if (validTokenState !== 'locked') {
    md += `> **Important**: Token ID creation is ${validTokenState === 'open' ? 'permanently allowed' : 'currently allowed'}. The manager can create new token IDs, which means new supply can be minted, potentially diluting existing holders.`;
    // Interaction effect: even if transfer rules are locked, new token IDs can flow through existing mint approvals
    if (approvalState === 'locked') {
      const hasMint = col.collectionApprovals.some((a) => a.fromList.checkAddress('Mint'));
      if (hasMint) {
        md += ' Note: even though the transfer rules are permanently locked, existing mint approvals may cover a broad range of token IDs (such as "all"), so newly created token IDs could be minted through the existing rules without any rule changes.';
      }
    }
    md += '\n\n';
  }

  return md;
}

function buildInvariants<T extends NumberType>(col: BitBadgesCollection<T>): string {
  const inv = col.invariants;
  let md = '## Invariants -- On-Chain Guarantees\n\n';

  if (!inv) {
    md += 'No invariants are set for this collection. Without invariants, the on-chain protocol does not enforce any additional constraints beyond the standard approval system.\n\n';
    return md;
  }

  md += 'Invariants are permanent, on-chain rules that cannot be changed once set. They provide the strongest level of guarantee available on BitBadges, as they are enforced by the protocol itself regardless of any permission or approval changes.\n\n';

  // Max supply
  const maxSupply = inv.maxSupplyPerId != null ? bigVal(inv.maxSupplyPerId) : 0n;
  if (maxSupply > 0n) {
    md += `**Maximum Supply**: Each token ID has a hard cap of **${maxSupply.toLocaleString('en-US')} tokens**. This is enforced at the protocol level and cannot be overridden by anyone, even if other permissions change. This guarantees scarcity and protects holders against unlimited inflation.\n\n`;
  } else {
    md += '**Maximum Supply**: No maximum supply limit is set. Tokens can be minted without an on-chain cap, subject only to the approval rules.\n\n';
  }

  // No forceful transfers
  if (inv.noForcefulPostMintTransfers) {
    md += '**No Forceful Post-Mint Transfers**: Once tokens are minted to a holder, they cannot be forcefully seized or moved by anyone other than the holder. This is a critical safety guarantee that protects holders from rug pulls and unauthorized token seizure. Even if transfer approval rules are changed in the future, this invariant ensures that no approval can override a holder\'s custody of their tokens.\n\n';
  } else {
    md += '**No Forceful Post-Mint Transfers**: Not enforced. Depending on the collection\'s approval rules, it may be possible for a third party to move tokens from a holder\'s account without their consent. Review the transfer rules carefully.\n\n';
  }

  // No custom ownership times
  if (inv.noCustomOwnershipTimes) {
    md += '**No Custom Ownership Times**: All ownership is treated as full-range (always active). This simplifies the token model by preventing time-windowed ownership, making balances straightforward to understand and display.\n\n';
  } else {
    md += '**Custom Ownership Times**: Allowed. Tokens can have time-windowed ownership periods, where a holder owns a token only during specified time ranges. This enables time-based access passes and subscriptions.\n\n';
  }

  // Pool creation
  if (inv.disablePoolCreation) {
    md += '**Pool Creation**: Disabled. No liquidity pools can be created for this collection\'s tokens. This prevents automated market-making and ensures tokens can only be transferred through the standard approval system.\n\n';
  } else {
    md += '**Pool Creation**: Allowed. Liquidity pools can be created for this collection\'s tokens, enabling automated market-making and decentralized trading.\n\n';
  }

  // IBC backing invariant
  if (inv.cosmosCoinBackedPath) {
    const rawDenom = inv.cosmosCoinBackedPath.conversion?.sideA?.denom || 'unknown';
    const symbol = denomToHuman(rawDenom);
    const address = inv.cosmosCoinBackedPath.address || 'unknown';
    md += `**IBC Backing**: This collection is permanently backed 1:1 by **${symbol}** (\`${rawDenom}\`). The backing address is \`${address}\`. This invariant guarantees that the backing relationship cannot be altered or removed.\n\n`;
  }

  // EVM query invariants
  if (inv.evmQueryChallenges && inv.evmQueryChallenges.length > 0) {
    md += `**EVM Query Invariants**: ${inv.evmQueryChallenges.length} on-chain contract verification${inv.evmQueryChallenges.length > 1 ? 's are' : ' is'} checked after every transfer. These invariants call external smart contracts to enforce custom rules at the protocol level.\n\n`;
  }

  return md;
}

function buildDefaultBalances<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## Default Balances & Auto-Approve Settings\n\n';

  const defaults = col.defaultBalances;
  if (!defaults) {
    md += 'No default balance configuration is set for this collection.\n\n';
    return md;
  }

  // Starting balances
  if (defaults.balances && defaults.balances.length > 0) {
    md += 'Every new address that interacts with this collection starts with the following default balances:\n\n';
    for (const bal of defaults.balances) {
      const amount = bigVal(bal.amount);
      md += `- **${amount.toLocaleString('en-US')} tokens** for token IDs ${rangeStr(bal.tokenIds)}`;
      const ownershipRange = rangeStr(bal.ownershipTimes);
      if (ownershipRange !== 'all') md += ` (ownership times: ${timeRangeStr(bal.ownershipTimes)})`;
      md += '\n';
    }
    md += '\n';
  } else {
    md += 'Users start with zero balance. Tokens must be obtained through minting, claiming, or receiving a transfer.\n\n';
  }

  // Auto-approve
  md += '### Auto-Approve Settings\n\n';
  md += 'These settings determine how transfers are handled at the user level by default:\n\n';

  if (defaults.autoApproveSelfInitiatedOutgoingTransfers) {
    md += '- **Auto-approve self-initiated outgoing transfers**: Yes. Users can send their own tokens without needing to set up additional approvals. This is the standard, expected behavior.\n';
  } else {
    md += '- **Auto-approve self-initiated outgoing transfers**: No. Users must explicitly approve even their own outgoing transfers. This is unusual and may complicate the user experience.\n';
  }

  if (defaults.autoApproveSelfInitiatedIncomingTransfers) {
    md += '- **Auto-approve self-initiated incoming transfers**: Yes. When a user initiates a transfer to themselves, it is automatically approved on the receiving side.\n';
  } else {
    md += '- **Auto-approve self-initiated incoming transfers**: No. Even self-initiated incoming transfers require explicit approval.\n';
  }

  if (defaults.autoApproveAllIncomingTransfers) {
    md += '- **Auto-approve all incoming transfers**: Yes. Any token sent to any address is automatically accepted. No one can block incoming tokens. **Warning**: This means holders cannot prevent unwanted or spam tokens from appearing in their balance. If collection-level approvals allow open transfers, anyone can send tokens to any address.\n';
  } else {
    md += '- **Auto-approve all incoming transfers**: No. Recipients can control which incoming transfers they accept. This prevents unwanted token spam and gives holders the ability to refuse unsolicited tokens.\n';
  }

  md += '\n';
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
  report += buildBackingAndCrossChain(col);
  report += buildHowTokensAreCreated(col);
  report += buildTransferRules(col);
  report += buildPermissions(col);
  report += buildInvariants(col);
  report += buildDefaultBalances(col);
  report += buildClaims(col, linkedClaimIds);
  report += buildKeyReference(col);
  report += buildSummary(col);

  return report;
}

function buildSummary<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let md = '## Summary & Key Takeaways\n\n';

  const type = detectType(col);
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
  const permKeys = [
    'canDeleteCollection', 'canArchiveCollection', 'canUpdateStandards',
    'canUpdateCustomData', 'canUpdateManager', 'canUpdateCollectionMetadata',
    'canUpdateValidTokenIds', 'canUpdateTokenMetadata', 'canUpdateCollectionApprovals',
    'canUpdateAutoApproveSelfInitiatedIncomingTransfers', 'canUpdateAutoApproveSelfInitiatedOutgoingTransfers',
    'canUpdateAutoApproveAllIncomingTransfers', 'canAddMoreAliasPaths', 'canAddMoreCosmosCoinWrapperPaths'
  ];
  let lockedCount = 0;
  for (const key of permKeys) {
    if (permState((perms as any)[key]) === 'locked') lockedCount++;
  }
  const total = permKeys.length;

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
