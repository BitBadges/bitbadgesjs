/**
 * interpret-shared — shared constants, utilities, and core section builders
 * used by both interpretCollection() and interpretTransaction().
 *
 * All functions accept raw `any` values so they work with both typed SDK
 * objects and raw JSON transaction bodies.
 *
 * @module
 * @category Collections
 */
import { GO_MAX_UINT_64 } from '../common/math.js';
import { CoinsRegistry } from '../common/constants.js';

const MAX_UINT64 = GO_MAX_UINT_64;

// ---------------------------------------------------------------------------
// Human-readable conversion helpers (canonical location)
// ---------------------------------------------------------------------------

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
// Constants
// ---------------------------------------------------------------------------

export const PLUGIN_DISPLAY_NAMES: Record<string, string> = {
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

export const PERM_DESCRIPTIONS: Record<string, { label: string; lockedDesc: string; openDesc: string; undecidedDesc: string }> = {
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

export const PERM_KEYS = Object.keys(PERM_DESCRIPTIONS);

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/** Safe BigInt conversion from any value */
export function big(val: any): bigint {
  if (val == null || val === '') return 0n;
  return BigInt(val.valueOf ? val.valueOf() : val);
}

/** Check if any range covers 1 -> MAX_UINT64 */
export function isFullRange(ranges: any[] | undefined): boolean {
  if (!ranges || ranges.length === 0) return false;
  return ranges.some((r: any) => big(r?.start) === 1n && big(r?.end) === MAX_UINT64);
}

/** Determine permission state from entries array */
export function permState(entries: any[] | undefined): 'locked' | 'open' | 'undecided' {
  if (!entries || entries.length === 0) return 'undecided';
  const forbidden = entries.some((e: any) => isFullRange(e.permanentlyForbiddenTimes));
  if (forbidden) return 'locked';
  const permitted = entries.some((e: any) => isFullRange(e.permanentlyPermittedTimes));
  if (permitted) return 'open';
  return 'undecided';
}

/** Translate list IDs to plain English */
export function listIdHuman(listId: string): string {
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

/** Format token ID ranges */
export function rangeStr(ranges: any[] | undefined): string {
  if (!ranges || ranges.length === 0) return 'none';
  return (ranges as any[])
    .map((r: any) => {
      const s = big(r?.start);
      const e = big(r?.end);
      if (s === 1n && e === MAX_UINT64) return 'all';
      if (s === e) return `#${s}`;
      return `#${s}-#${e}`;
    })
    .join(', ');
}

/** Format time ranges using timestampToDate */
export function timeRangeStr(ranges: any[] | undefined): string {
  if (!ranges || ranges.length === 0) return 'none';
  return (ranges as any[])
    .map((r: any) => {
      const s = big(r?.start);
      const e = big(r?.end);
      if (s === 1n && e === MAX_UINT64) return 'all time';
      return `${timestampToDate(s)} through ${timestampToDate(e)}`;
    })
    .join(', ');
}

/** Count total token IDs in a range array */
export function countTokenIds(ranges: any[] | undefined): string {
  if (!ranges || ranges.length === 0) return '0';
  let total = 0n;
  for (const r of ranges as any[]) {
    const s = big(r?.start);
    const e = big(r?.end);
    total += e - s + 1n;
  }
  if (total >= MAX_UINT64) return 'unlimited';
  if (total > 1000000n) return `${total.toLocaleString('en-US')} (very large range)`;
  return total.toLocaleString('en-US');
}

/** Detect collection type from standards array and backing path */
export function detectType(standards: string[], hasBackingPath: boolean): string {
  const s = standards || [];
  if (s.some((x) => x.toLowerCase().includes('subscription'))) return 'Subscription Token';
  if (s.some((x) => x.toLowerCase().includes('ai agent stablecoin'))) return 'AI Agent Stablecoin';
  if (s.some((x) => x.toLowerCase().includes('smart token')) || hasBackingPath) return 'Smart Token (IBC-backed)';
  if (s.includes('NFTs')) return 'NFT Collection';
  if (s.includes('Fungible Tokens')) return 'Fungible Token';
  return 'Token Collection';
}

/** Lookup plugin display name */
export function pluginDisplayName(pluginId: string): string {
  return PLUGIN_DISPLAY_NAMES[pluginId] || pluginId;
}

// ---------------------------------------------------------------------------
// Core builders
// ---------------------------------------------------------------------------

/**
 * Build a full markdown paragraph for a single approval entry.
 * Works with both typed SDK objects and raw JSON.
 */
export function buildApprovalParagraph(approval: any, isForMint: boolean): string {
  const criteria = approval.approvalCriteria || {};
  let md = '';

  // Title
  const label = isForMint ? 'Mint Approval' : 'Transfer Approval';
  md += `### ${label}: "${approval.approvalId}"\n\n`;

  // Approval metadata (creator-provided)
  const approvalDetails = approval.details;
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

  if (!approval.approvalCriteria) return md;

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
          md += 'The payment is deducted from the approver address (the address that set up this approval). ';
        } else {
          md += 'The payment is deducted from the transfer initiator. ';
        }
        if (ct.overrideToWithInitiator) {
          md += 'Payment is sent to the transfer initiator. ';
        } else if (ct.to) {
          md += `Payment is sent to address \`${ct.to}\`. `;
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

    // Reset time intervals
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

  // Ownership gate (mustOwnTokens)
  if (criteria.mustOwnTokens && criteria.mustOwnTokens.length > 0) {
    md += '**Ownership Requirements**: ';
    const reqs = criteria.mustOwnTokens.map((mot: any) => {
      const minAmount = mot.amountRange ? big(mot.amountRange.start) : 1n;
      const maxAmount = mot.amountRange ? big(mot.amountRange.end) : 0n;
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
      const incTokenIds = big(inc.incrementTokenIdsBy);
      const incOwnership = big(inc.incrementOwnershipTimesBy);
      const duration = big(inc.durationFromTimestamp);
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

        // Plugins
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
  if (criteria.evmQueryChallenges && criteria.evmQueryChallenges.length > 0) {
    md += `**On-Chain Verification**: ${criteria.evmQueryChallenges.length} EVM smart contract query check${criteria.evmQueryChallenges.length > 1 ? 's' : ''} must pass. The on-chain contract is queried to verify eligibility before the transfer can proceed.\n\n`;
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

  // Sender checks
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

  // Recipient checks
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

  // Initiator checks
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
      const hourRanges = (atc.offlineHours as any[]).map((r: any) => `${big(r.start)}:00-${big(r.end)}:00 UTC`).join(', ');
      timeParts.push(`denied during hours ${hourRanges}`);
    }
    if (atc.offlineDays && atc.offlineDays.length > 0) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayRanges = (atc.offlineDays as any[]).map((r: any) => {
        const s = Number(big(r.start));
        const e = Number(big(r.end));
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
    const percentage = big(ur.percentage);
    const payoutAddress = ur.payoutAddress || 'unspecified';
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
    if (criteria.overridesFromOutgoingApprovals) {
      md += '> **Warning**: This approval allows anyone to move tokens from any holder, combined with an override on outgoing approvals. This means forceful transfers or seizure of tokens is possible under this rule.\n\n';
    }
  }

  return md;
}

/**
 * Build the permissions section markdown.
 * Works with raw `any` permission objects.
 */
export function buildPermissionsSection(perms: any, manager: string | null | undefined): string {
  let md = '## Permissions -- What Can Change Later\n\n';

  const managerAddr = manager || 'not set';
  md += `The **manager** is a single address that has administrative control over the collection. The manager is the ONLY address that can execute changes allowed by unfrozen permissions. If a permission is locked (forbidden), even the manager cannot make that change. If no manager is set, no one can make administrative changes.\n\n`;
  if (!manager) {
    md += '> **No Manager Set**: This collection has no manager address. No administrative changes can be made to the collection, regardless of permission settings. All unlocked permissions below are effectively inert until a manager is set (if the "Manager Transfer" permission allows it).\n\n';
  }
  md += `Current manager: \`${managerAddr}\`. Each permission below determines whether the manager can modify a specific aspect of the collection in the future.\n\n`;

  const permObj = perms || {};

  let lockedCount = 0;
  let openCount = 0;
  let undecidedCount = 0;

  for (const [key, info] of Object.entries(PERM_DESCRIPTIONS)) {
    const permArray = permObj[key] as any[] | undefined;
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
  const approvalState = permState(permObj.canUpdateCollectionApprovals);
  if (approvalState !== 'locked') {
    md += `> **Important**: Transfer rules are ${approvalState === 'open' ? 'permanently changeable' : 'currently changeable'}. `;
    md += 'The manager could add new transfer rules or modify existing ones.\n\n';
  }

  const validTokenState = permState(permObj.canUpdateValidTokenIds);
  if (validTokenState !== 'locked') {
    md += `> **Important**: Token ID creation is ${validTokenState === 'open' ? 'permanently allowed' : 'currently allowed'}. The manager can create new token IDs, which means new supply can be minted, potentially diluting existing holders.`;
    if (approvalState === 'locked') {
      md += ' Note: even though the transfer rules are permanently locked, existing mint approvals may cover a broad range of token IDs (such as "all"), so newly created token IDs could be minted through the existing rules without any rule changes.';
    }
    md += '\n\n';
  }

  return md;
}

/**
 * Build the default balances section markdown.
 * Works with raw `any` defaults object.
 */
export function buildDefaultBalancesSection(defaults: any): string {
  let md = '## Default Balances & Auto-Approve Settings\n\n';

  if (!defaults) {
    md += 'No default balance configuration is set for this collection.\n\n';
    return md;
  }

  // Starting balances
  if (defaults.balances && defaults.balances.length > 0) {
    md += 'Every new address that interacts with this collection starts with the following default balances:\n\n';
    for (const bal of defaults.balances) {
      const amount = big(bal.amount);
      md += `- **${amount.toLocaleString('en-US')} tokens** for token IDs ${rangeStr(bal.tokenIds)}`;
      if (bal.ownershipTimes && bal.ownershipTimes.length > 0) {
        const ownershipRange = timeRangeStr(bal.ownershipTimes);
        if (ownershipRange !== 'all time') md += ` (ownership times: ${ownershipRange})`;
      }
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

  // Default incoming approvals
  if (defaults.incomingApprovals && defaults.incomingApprovals.length > 0) {
    md += '### Default Incoming Approvals\n\n';
    md += 'The following incoming approval rules are set by default for all users:\n\n';
    for (const approval of defaults.incomingApprovals) {
      md += buildApprovalParagraph(approval, false);
    }
  }

  // Default outgoing approvals
  if (defaults.outgoingApprovals && defaults.outgoingApprovals.length > 0) {
    md += '### Default Outgoing Approvals\n\n';
    md += 'The following outgoing approval rules are set by default for all users:\n\n';
    for (const approval of defaults.outgoingApprovals) {
      md += buildApprovalParagraph(approval, false);
    }
  }

  // User permissions
  if (defaults.userPermissions) {
    const up = defaults.userPermissions;
    const userPermParts: string[] = [];
    if (up.canUpdateIncomingApprovals && up.canUpdateIncomingApprovals.length > 0) {
      const state = permState(up.canUpdateIncomingApprovals);
      userPermParts.push(`Update incoming approvals: ${state}`);
    }
    if (up.canUpdateOutgoingApprovals && up.canUpdateOutgoingApprovals.length > 0) {
      const state = permState(up.canUpdateOutgoingApprovals);
      userPermParts.push(`Update outgoing approvals: ${state}`);
    }
    if (up.canUpdateAutoApproveSelfInitiatedIncomingTransfers && up.canUpdateAutoApproveSelfInitiatedIncomingTransfers.length > 0) {
      const state = permState(up.canUpdateAutoApproveSelfInitiatedIncomingTransfers);
      userPermParts.push(`Update auto-approve self-initiated incoming: ${state}`);
    }
    if (up.canUpdateAutoApproveSelfInitiatedOutgoingTransfers && up.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.length > 0) {
      const state = permState(up.canUpdateAutoApproveSelfInitiatedOutgoingTransfers);
      userPermParts.push(`Update auto-approve self-initiated outgoing: ${state}`);
    }
    if (userPermParts.length > 0) {
      md += '### User Permissions\n\n';
      md += 'Each user has the following default permissions for modifying their own approval settings:\n\n';
      for (const part of userPermParts) {
        md += `- ${part}\n`;
      }
      md += '\n';
    }
  }

  return md;
}

/**
 * Build the backing and paths section.
 */
export function buildBackingAndPathsSection(invariants: any, aliasPaths: any[], wrapperPaths: any[]): string {
  const hasAlias = aliasPaths && aliasPaths.length > 0;
  const hasWrapper = wrapperPaths && wrapperPaths.length > 0;
  const hasBacking = !!invariants?.cosmosCoinBackedPath;

  let md = '## Token Backing & Cross-Chain\n\n';

  if (!hasAlias && !hasWrapper && !hasBacking) {
    md += 'This is a native BitBadges collection with no cross-chain backing. Tokens are created and managed entirely within the BitBadges chain and are not pegged to any external asset or IBC denomination.\n\n';
    return md;
  }

  if (hasBacking) {
    const backing = invariants.cosmosCoinBackedPath;
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
    md += 'Users can deposit the backing asset to mint new collection tokens, and burn collection tokens to withdraw the backing asset. ';
    md += 'This mechanism ensures that the total supply of collection tokens never exceeds the reserves held at the backing address.\n\n';
  }

  if (hasAlias) {
    md += '### Alias Paths\n\n';
    md += 'Alias paths provide alternative denominations for display and trading purposes. They allow the token to appear under a different symbol in wallets and DEX interfaces:\n\n';
    for (const alias of aliasPaths) {
      const aliasName = alias.metadata?.metadata?.name || alias.symbol || alias.denom || 'unnamed';
      md += `- **${aliasName}**: denomination \`${alias.denom || 'N/A'}\`, symbol \`${alias.symbol || 'N/A'}\`\n`;
    }
    md += '\n';
  }

  if (hasWrapper) {
    md += '### Cosmos Coin Wrapper Paths\n\n';
    md += 'Wrapper paths allow this collection token to be wrapped as a native Cosmos SDK coin, enabling integration with standard Cosmos modules (staking, governance, IBC transfers):\n\n';
    for (const wrapper of wrapperPaths) {
      const wrapperName = wrapper.metadata?.metadata?.name || wrapper.symbol || wrapper.denom || 'unnamed';
      md += `- **${wrapperName}**: denomination \`${wrapper.denom || 'N/A'}\`, symbol \`${wrapper.symbol || 'N/A'}\`\n`;
    }
    md += '\n';
  }

  return md;
}

/**
 * Build the invariants section.
 */
export function buildInvariantsSection(invariants: any): string {
  let md = '## Invariants -- On-Chain Guarantees\n\n';

  if (!invariants) {
    md += 'No invariants are set for this collection. Without invariants, the on-chain protocol does not enforce any additional constraints beyond the standard approval system.\n\n';
    return md;
  }

  md += 'Invariants are permanent, on-chain rules that cannot be changed once set. They provide the strongest level of guarantee available on BitBadges, as they are enforced by the protocol itself regardless of any permission or approval changes.\n\n';

  // Max supply
  const maxSupply = big(invariants.maxSupplyPerId);
  if (maxSupply > 0n) {
    md += `**Maximum Supply**: Each token ID has a hard cap of **${maxSupply.toLocaleString('en-US')} tokens**. This is enforced at the protocol level and cannot be overridden by anyone, even if other permissions change. This guarantees scarcity and protects holders against unlimited inflation.\n\n`;
  } else {
    md += '**Maximum Supply**: No maximum supply limit is set. Tokens can be minted without an on-chain cap, subject only to the approval rules.\n\n';
  }

  // No forceful transfers
  if (invariants.noForcefulPostMintTransfers) {
    md += '**No Forceful Post-Mint Transfers**: Once tokens are minted to a holder, they cannot be forcefully seized or moved by anyone other than the holder. This is a critical safety guarantee that protects holders from rug pulls and unauthorized token seizure. Even if transfer approval rules are changed in the future, this invariant ensures that no approval can override a holder\'s custody of their tokens.\n\n';
  } else {
    md += '**No Forceful Post-Mint Transfers**: Not enforced. Depending on the collection\'s approval rules, it may be possible for a third party to move tokens from a holder\'s account without their consent. Review the transfer rules carefully.\n\n';
  }

  // No custom ownership times
  if (invariants.noCustomOwnershipTimes) {
    md += '**No Custom Ownership Times**: All ownership is treated as full-range (always active). This simplifies the token model by preventing time-windowed ownership, making balances straightforward to understand and display.\n\n';
  } else {
    md += '**Custom Ownership Times**: Allowed. Tokens can have time-windowed ownership periods, where a holder owns a token only during specified time ranges. This enables time-based access passes and subscriptions.\n\n';
  }

  // Pool creation
  if (invariants.disablePoolCreation) {
    md += '**Pool Creation**: Disabled. No liquidity pools can be created for this collection\'s tokens. This prevents automated market-making and ensures tokens can only be transferred through the standard approval system.\n\n';
  } else {
    md += '**Pool Creation**: Allowed. Liquidity pools can be created for this collection\'s tokens, enabling automated market-making and decentralized trading.\n\n';
  }

  // IBC backing invariant
  if (invariants.cosmosCoinBackedPath) {
    const rawDenom = invariants.cosmosCoinBackedPath.conversion?.sideA?.denom || 'unknown';
    const symbol = denomToHuman(rawDenom);
    const address = invariants.cosmosCoinBackedPath.address || 'unknown';
    md += `**IBC Backing**: This collection is permanently backed 1:1 by **${symbol}** (\`${rawDenom}\`). The backing address is \`${address}\`. This invariant guarantees that the backing relationship cannot be altered or removed.\n\n`;
  }

  // EVM query invariants
  if (invariants.evmQueryChallenges && invariants.evmQueryChallenges.length > 0) {
    md += `**EVM Query Invariants**: ${invariants.evmQueryChallenges.length} on-chain contract verification${invariants.evmQueryChallenges.length > 1 ? 's are' : ' is'} checked after every transfer. These invariants call external smart contracts to enforce custom rules at the protocol level.\n\n`;
  }

  return md;
}

/**
 * Build the key reference section for a transaction body.
 */
export function buildKeyReferenceSection(txBody: any): string {
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
