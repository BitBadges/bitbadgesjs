/**
 * interpretCollection — pure, deterministic function that produces a thorough
 * plaintext explanation of a BitBadgesCollection.
 *
 * @module
 * @category Collections
 */
import type { NumberType } from '../common/string-numbers.js';
import { GO_MAX_UINT_64 } from '../common/math.js';
import type { iBitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import { BitBadgesCollection } from '../api-indexer/BitBadgesCollection.js';
import { getMintApprovals, getNonMintApprovals } from './approval-utils.js';
import type { CollectionApprovalWithDetails } from './approvals.js';
import type { PermissionNameString } from './permission-utils.js';
import { getPermissionVariablesFromName } from './permission-utils.js';
import type { ActionPermission, TokenIdsActionPermission, CollectionApprovalPermissionWithDetails } from './permissions.js';
import type { UintRangeArray } from './uintRanges.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MAX_UINT64 = GO_MAX_UINT_64;

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

function permLabel(state: 'locked' | 'open' | 'undecided'): string {
  if (state === 'locked') return 'LOCKED';
  if (state === 'open') return 'OPEN';
  return 'UNDECIDED';
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

function countTokenIds<T extends NumberType>(ranges: UintRangeArray<T> | { start: T; end: T }[]): string {
  if (!ranges || ranges.length === 0) return '0';
  let total = 0n;
  for (const r of ranges as any[]) {
    const s = BigInt(r.start.valueOf());
    const e = BigInt(r.end.valueOf());
    total += e - s + 1n;
  }
  if (total > 1000000n) return `${total} (very large range)`;
  return total.toString();
}

function listIdHuman(listId: string): string {
  if (listId === 'All') return 'anyone';
  if (listId === 'Mint') return 'the Mint address (new token creation)';
  if (listId === '!Mint') return 'any holder (not Mint)';
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

// ---------------------------------------------------------------------------
// Section builders
// ---------------------------------------------------------------------------

function buildOverview<T extends NumberType>(col: BitBadgesCollection<T>): string {
  const type = detectType(col);
  const tokenCount = countTokenIds(col.validTokenIds);
  const maxSupply = col.invariants?.maxSupplyPerId != null ? BigInt(col.invariants.maxSupplyPerId.valueOf()).toString() : '0';
  const metadata = col.getCollectionMetadata();

  let lines = 'OVERVIEW\n\n';
  if (metadata?.name) lines += `Name: ${metadata.name}\n`;
  if (metadata?.description) lines += `Description: ${metadata.description}\n`;
  if (metadata?.image) lines += `Image: ${metadata.image}\n`;
  lines += `Type: ${type}\n`;
  lines += `Collection ID: ${col.collectionId || '(new - not yet deployed)'}\n`;
  lines += `Manager: ${col.manager || '(none)'}\n`;
  lines += `Token IDs: ${rangeStr(col.validTokenIds)} (${tokenCount} unique IDs)\n`;
  lines += `Max supply per ID: ${maxSupply === '0' ? 'Unlimited' : maxSupply}\n`;
  lines += `Standards: ${col.standards && col.standards.length > 0 ? col.standards.join(', ') : '(none set)'}\n`;

  if (col.isArchived) {
    lines += `Status: ARCHIVED - this collection is no longer active\n`;
  }

  lines += '\nWhat is this?\n\n';
  if (type === 'NFT Collection') {
    lines += `This is an NFT collection with ${tokenCount} unique tokens. Each token ID has a maximum supply of ${maxSupply === '1' ? '1 (each is truly unique)' : maxSupply === '0' ? 'unlimited' : maxSupply}.`;
  } else if (type.includes('Smart Token')) {
    const backing = col.invariants?.cosmosCoinBackedPath;
    const denom = backing?.conversion?.sideA?.denom || 'an IBC asset';
    lines += `This is a smart token backed 1:1 by ${denom}. Users can deposit the IBC asset to receive collection tokens, and withdraw collection tokens to get the IBC asset back.`;
  } else if (type === 'Fungible Token') {
    lines += `This is a fungible token (like ERC-20). All tokens are interchangeable. ${maxSupply === '0' ? 'There is no supply cap.' : `Maximum supply: ${maxSupply}.`}`;
  } else if (type === 'Subscription Token') {
    lines += `This is a subscription token. Holding it grants access to something for a time period. It may require periodic renewal or payment.`;
  } else if (type === 'AI Agent Stablecoin') {
    lines += `This is an AI agent-managed stablecoin vault. An AI agent manages the vault and controls minting and burning.`;
  } else {
    lines += `This is a token collection on BitBadges.`;
  }

  return lines + '\n';
}

function buildMetadata<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let lines = '\nMETADATA\n\n';
  const metadata = col.getCollectionMetadata();

  lines += `Collection metadata URI: ${col.collectionMetadata?.uri || '(not set)'}\n`;
  if (metadata?.name) lines += `Collection name: ${metadata.name}\n`;
  if (metadata?.description) lines += `Collection description: ${metadata.description}\n`;
  if (metadata?.image) lines += `Collection image: ${metadata.image}\n`;
  if (metadata?.externalUrl) lines += `External URL: ${metadata.externalUrl}\n`;
  if (metadata?.category) lines += `Category: ${metadata.category}\n`;
  if (metadata?.tags && metadata.tags.length > 0) lines += `Tags: ${metadata.tags.join(', ')}\n`;

  const tokenMeta = col.getTokenMetadata();
  if (tokenMeta && tokenMeta.length > 0) {
    lines += '\nToken metadata:\n';
    if (tokenMeta.length === 1) {
      lines += `All tokens share the same metadata URI: ${tokenMeta[0].uri || '(not set)'}\n`;
      if (tokenMeta[0].metadata?.name) lines += `Token name: ${tokenMeta[0].metadata.name}\n`;
    } else {
      lines += `There are ${tokenMeta.length} token metadata entries with different URIs for different token ID ranges.\n`;
      for (const tm of tokenMeta.slice(0, 5)) {
        lines += `  Token IDs ${rangeStr(tm.tokenIds)}: URI ${tm.uri || '(not set)'}`;
        if (tm.metadata?.name) lines += ` - "${tm.metadata.name}"`;
        lines += '\n';
      }
      if (tokenMeta.length > 5) {
        lines += `  ... and ${tokenMeta.length - 5} more entries\n`;
      }
    }
  } else {
    lines += '\nNo token metadata has been set or fetched.\n';
  }

  return lines;
}

function buildApprovalDetails<T extends NumberType>(approval: CollectionApprovalWithDetails<T>, isForMint: boolean): string {
  let lines = '';
  const criteria = approval.approvalCriteria;

  // Who
  if (isForMint) {
    lines += `  Who can initiate: ${listIdHuman(approval.initiatedByListId)}\n`;
    lines += `  Recipients: ${listIdHuman(approval.toListId)}\n`;
  } else {
    lines += `  From: ${listIdHuman(approval.fromListId)}\n`;
    lines += `  To: ${listIdHuman(approval.toListId)}\n`;
    lines += `  Initiated by: ${listIdHuman(approval.initiatedByListId)}\n`;
  }

  lines += `  Token IDs: ${rangeStr(approval.tokenIds)}\n`;
  lines += `  Transfer times: ${rangeStr(approval.transferTimes)}\n`;
  lines += `  Ownership times: ${rangeStr(approval.ownershipTimes)}\n`;

  if (!criteria) return lines;

  // Payment / coin transfers
  if (criteria.coinTransfers && criteria.coinTransfers.length > 0) {
    for (const ct of criteria.coinTransfers) {
      const coins = ct.coins || [];
      const costStr = coins.map((c: any) => `${c.amount} ${c.denom}`).join(' + ');
      lines += `  Cost: ${costStr}\n`;
      if ((ct as any).to) lines += `  Payment goes to: ${(ct as any).to}\n`;
    }
  } else {
    lines += `  Cost: Free (no payment required)\n`;
  }

  // Limits
  const amounts = criteria.approvalAmounts;
  const maxNum = criteria.maxNumTransfers;
  if (amounts) {
    const oa = amounts.overallApprovalAmount != null ? BigInt(amounts.overallApprovalAmount.valueOf()).toString() : '0';
    if (oa !== '0') lines += `  Total supply cap for this approval: ${oa} tokens\n`;

    const pa = amounts.perInitiatedByAddressApprovalAmount != null ? BigInt(amounts.perInitiatedByAddressApprovalAmount.valueOf()).toString() : '0';
    if (pa !== '0') lines += `  Maximum per user: ${pa} tokens\n`;

    const fa = amounts.perFromAddressApprovalAmount != null ? BigInt(amounts.perFromAddressApprovalAmount.valueOf()).toString() : '0';
    if (fa !== '0') lines += `  Maximum per sender address: ${fa} tokens\n`;

    const ta = amounts.perToAddressApprovalAmount != null ? BigInt(amounts.perToAddressApprovalAmount.valueOf()).toString() : '0';
    if (ta !== '0') lines += `  Maximum per recipient address: ${ta} tokens\n`;
  }

  if (maxNum) {
    const on = maxNum.overallMaxNumTransfers != null ? BigInt(maxNum.overallMaxNumTransfers.valueOf()).toString() : '0';
    if (on !== '0') lines += `  Total number of transfers allowed: ${on}\n`;

    const pn = maxNum.perInitiatedByAddressMaxNumTransfers != null ? BigInt(maxNum.perInitiatedByAddressMaxNumTransfers.valueOf()).toString() : '0';
    if (pn !== '0') lines += `  Transfers allowed per user: ${pn}\n`;

    const fn = maxNum.perFromAddressMaxNumTransfers != null ? BigInt(maxNum.perFromAddressMaxNumTransfers.valueOf()).toString() : '0';
    if (fn !== '0') lines += `  Transfers allowed per sender: ${fn}\n`;

    const tn = maxNum.perToAddressMaxNumTransfers != null ? BigInt(maxNum.perToAddressMaxNumTransfers.valueOf()).toString() : '0';
    if (tn !== '0') lines += `  Transfers allowed per recipient: ${tn}\n`;
  }

  // Ownership gate
  if (criteria.mustOwnTokens && criteria.mustOwnTokens.length > 0) {
    for (const mot of criteria.mustOwnTokens) {
      const minAmount = mot.amountRange ? BigInt((mot.amountRange as any).start.valueOf()).toString() : '1';
      lines += `  Requirement: Must own at least ${minAmount} of collection ${mot.collectionId} tokens\n`;
    }
  }

  // Predetermined balances
  if (criteria.predeterminedBalances) {
    lines += `  Distribution: Sequential allocation (each participant gets the next token in sequence)\n`;
  }

  // Require sender/receiver equals initiator
  if (criteria.requireToEqualsInitiatedBy) {
    lines += `  Restriction: The recipient must be the same address that initiated the transfer (self-claim only)\n`;
  }
  if (criteria.requireFromEqualsInitiatedBy) {
    lines += `  Restriction: The sender must be the same address that initiated the transfer\n`;
  }
  if (criteria.requireToDoesNotEqualInitiatedBy) {
    lines += `  Restriction: The recipient cannot be the same address that initiated the transfer\n`;
  }
  if (criteria.requireFromDoesNotEqualInitiatedBy) {
    lines += `  Restriction: The sender cannot be the same address that initiated the transfer\n`;
  }

  // Overrides
  if (criteria.overridesFromOutgoingApprovals) {
    lines += `  Note: This approval overrides the sender's personal outgoing approval settings\n`;
  }
  if (criteria.overridesToIncomingApprovals) {
    lines += `  Note: This approval overrides the recipient's personal incoming approval settings\n`;
  }

  // Backed minting
  if (criteria.allowBackedMinting) {
    lines += `  Note: This approval is used for IBC-backed minting or withdrawal operations\n`;
  }

  // Must prioritize
  if (criteria.mustPrioritize) {
    lines += `  Note: This approval must be explicitly prioritized to be used\n`;
  }

  // Merkle challenges (without private data)
  if (criteria.merkleChallenges && criteria.merkleChallenges.length > 0) {
    lines += `  Merkle proof challenges: ${criteria.merkleChallenges.length} challenge(s) must be satisfied (e.g., whitelist or code-based)\n`;
  }

  // EVM query challenges
  if ((criteria as any).evmQueryChallenges && (criteria as any).evmQueryChallenges.length > 0) {
    lines += `  On-chain verification: ${(criteria as any).evmQueryChallenges.length} EVM contract query check(s) must pass\n`;
  }

  // Dynamic store challenges
  if (criteria.dynamicStoreChallenges && criteria.dynamicStoreChallenges.length > 0) {
    lines += `  Dynamic store challenges: ${criteria.dynamicStoreChallenges.length} dynamic store check(s) required\n`;
  }

  // Eth signature challenges (sanitized - no content)
  if (criteria.ethSignatureChallenges && criteria.ethSignatureChallenges.length > 0) {
    lines += `  Signature verification: ${criteria.ethSignatureChallenges.length} Ethereum signature challenge(s) required\n`;
  }

  // Voting challenges (sanitized - no content)
  if (criteria.votingChallenges && criteria.votingChallenges.length > 0) {
    lines += `  Voting requirements: ${criteria.votingChallenges.length} voting challenge(s) must be satisfied\n`;
  }

  // Address checks
  if (criteria.senderChecks) lines += `  Sender address checks are configured\n`;
  if (criteria.recipientChecks) lines += `  Recipient address checks are configured\n`;
  if (criteria.initiatorChecks) lines += `  Initiator address checks are configured\n`;

  // Alt time checks
  if (criteria.altTimeChecks) lines += `  Time-based restrictions: Transfers may be restricted during certain hours or days\n`;

  // User royalties
  if (criteria.userRoyalties) lines += `  Royalties: User royalties are configured for this approval\n`;

  // Auto-deletion
  if (criteria.autoDeletionOptions) lines += `  Auto-deletion: This approval may be automatically removed after use\n`;

  // Forceful transfer warning
  if (!isForMint && approval.fromListId === 'All' && approval.initiatedByListId === 'All' && !criteria.requireToEqualsInitiatedBy) {
    lines += `  WARNING: This approval allows ANYONE to move tokens FROM any holder. This means forceful transfers or seizure are possible.\n`;
  }

  return lines;
}

function buildHowTokensAreCreated<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let lines = '\nHOW TOKENS ARE CREATED / OBTAINED\n\n';

  const mintApprovals = getMintApprovals(col.collectionApprovals);
  const backingApprovals = col.collectionApprovals.filter(
    (a) => a.approvalCriteria?.allowBackedMinting && a.fromList.checkAddress('Mint')
  );

  if (mintApprovals.length === 0 && backingApprovals.length === 0) {
    lines += 'There are no active minting or deposit approvals. Tokens can only be obtained via transfer from existing holders (if the collection is transferable).\n';
    return lines;
  }

  for (const approval of mintApprovals) {
    lines += `Mint approval: "${approval.approvalId}"\n`;
    lines += buildApprovalDetails(approval, true);
    lines += '\n';
  }

  for (const approval of backingApprovals) {
    if (mintApprovals.some((m) => m.approvalId === approval.approvalId)) continue;
    const backing = col.invariants?.cosmosCoinBackedPath;
    const denom = backing?.conversion?.sideA?.denom || 'the IBC asset';
    lines += `IBC Deposit approval: "${approval.approvalId}"\n`;
    lines += `  How: Send ${denom} to the backing address to receive collection tokens\n`;
    lines += `  Rate: 1:1 (each unit of ${denom} gives 1 collection token)\n`;
    lines += `  Who can deposit: ${listIdHuman(approval.toListId)}\n`;
    lines += '\n';
  }

  return lines;
}

function buildTransferability<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let lines = '\nTRANSFERABILITY\n\n';

  const nonMintApprovals = getNonMintApprovals(col.collectionApprovals);
  const transferApprovals = nonMintApprovals.filter((a) => !a.approvalCriteria?.allowBackedMinting);
  const unbackingApprovals = col.collectionApprovals.filter(
    (a) => a.approvalCriteria?.allowBackedMinting && !a.fromList.checkAddress('Mint')
  );

  if (transferApprovals.length === 0 && unbackingApprovals.length === 0) {
    lines += 'Non-transferable (soulbound): Once minted, tokens cannot be sent to another address.\n';
    return lines;
  }

  for (const approval of transferApprovals) {
    lines += `Transfer approval: "${approval.approvalId}"\n`;
    lines += buildApprovalDetails(approval, false);
    lines += '\n';
  }

  for (const approval of unbackingApprovals) {
    const backing = col.invariants?.cosmosCoinBackedPath;
    const denom = backing?.conversion?.sideA?.denom || 'the IBC asset';
    lines += `IBC Withdrawal approval: "${approval.approvalId}"\n`;
    lines += `  How: Send collection tokens to the backing address to receive ${denom} back\n`;
    lines += `  Who can withdraw: ${listIdHuman(approval.fromListId)}\n`;

    const amounts = approval.approvalCriteria?.approvalAmounts;
    if (amounts) {
      const oa = amounts.overallApprovalAmount != null ? BigInt(amounts.overallApprovalAmount.valueOf()).toString() : '0';
      if (oa !== '0') lines += `  Total withdrawal limit: ${oa}\n`;
      const fa = amounts.perFromAddressApprovalAmount != null ? BigInt(amounts.perFromAddressApprovalAmount.valueOf()).toString() : '0';
      if (fa !== '0') lines += `  Per-user withdrawal limit: ${fa}\n`;
    }
    lines += '\n';
  }

  if (col.invariants?.noForcefulPostMintTransfers) {
    lines += 'Safety guarantee: No one can forcefully move tokens from holders after minting. This is enforced on-chain.\n';
  }

  return lines;
}

function buildDefaultBalances<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let lines = '\nDEFAULT BALANCES AND AUTO-APPROVE SETTINGS\n\n';

  const defaults = col.defaultBalances;
  if (!defaults) {
    lines += 'No default balance configuration is set.\n';
    return lines;
  }

  if (defaults.balances && defaults.balances.length > 0) {
    lines += 'Default balances are assigned to every new address upon first interaction:\n';
    for (const bal of defaults.balances) {
      const amount = BigInt(bal.amount.valueOf()).toString();
      lines += `  ${amount} of token IDs ${rangeStr(bal.tokenIds)} for ownership times ${rangeStr(bal.ownershipTimes)}\n`;
    }
  } else {
    lines += 'No default balances are assigned. Users start with zero balance.\n';
  }

  lines += '\nAuto-approve settings:\n';
  lines += `  Auto-approve self-initiated outgoing transfers: ${defaults.autoApproveSelfInitiatedOutgoingTransfers ? 'Yes' : 'No'}\n`;
  lines += `  Auto-approve self-initiated incoming transfers: ${defaults.autoApproveSelfInitiatedIncomingTransfers ? 'Yes' : 'No'}\n`;
  lines += `  Auto-approve all incoming transfers: ${defaults.autoApproveAllIncomingTransfers ? 'Yes' : 'No'}\n`;

  return lines;
}

function buildPermissions<T extends NumberType>(col: BitBadgesCollection<T>): string {
  let lines = '\nPERMISSIONS\n\n';
  lines += `The manager (${col.manager || 'not set'}) has the following control over this collection:\n\n`;

  const permDescriptions: Record<string, { label: string; desc: string }> = {
    canDeleteCollection: { label: 'Delete collection', desc: 'Permanently destroy the entire collection and all tokens' },
    canArchiveCollection: { label: 'Archive collection', desc: 'Mark the collection as archived (inactive)' },
    canUpdateStandards: { label: 'Change standards', desc: 'Change what type of collection this is (NFT, fungible, etc.)' },
    canUpdateCustomData: { label: 'Update custom data', desc: 'Change the custom JSON data stored on the collection' },
    canUpdateManager: { label: 'Transfer management', desc: 'Hand over management control to a different address' },
    canUpdateCollectionMetadata: { label: 'Update collection info', desc: 'Change the collection name, description, and image' },
    canUpdateValidTokenIds: { label: 'Create new token IDs', desc: 'Add new token IDs (this creates new supply that can be minted)' },
    canUpdateTokenMetadata: { label: 'Update token metadata', desc: 'Change individual token names, images, and descriptions' },
    canUpdateCollectionApprovals: { label: 'Change transfer rules', desc: 'Modify who can mint, transfer, or receive tokens. This is the most powerful permission' },
    canUpdateAutoApproveSelfInitiatedIncomingTransfers: { label: 'Update auto-approve incoming (self-initiated)', desc: 'Change the default auto-approve setting for self-initiated incoming transfers' },
    canUpdateAutoApproveSelfInitiatedOutgoingTransfers: { label: 'Update auto-approve outgoing (self-initiated)', desc: 'Change the default auto-approve setting for self-initiated outgoing transfers' },
    canUpdateAutoApproveAllIncomingTransfers: { label: 'Update auto-approve all incoming', desc: 'Change the default auto-approve setting for all incoming transfers' },
    canAddMoreAliasPaths: { label: 'Add alias paths', desc: 'Add new trading pairs for liquidity pools' },
    canAddMoreCosmosCoinWrapperPaths: { label: 'Add IBC backing paths', desc: 'Add new IBC asset backing configurations' }
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

    let meaning: string;
    if (state === 'locked') {
      meaning = 'Permanently frozen. This can never be done.';
    } else if (state === 'open') {
      meaning = `Manager CAN ${info.desc.toLowerCase()}.`;
    } else {
      meaning = `Currently allowed. The manager could lock or keep open later.`;
    }

    lines += `${info.label}: [${permLabel(state)}] ${meaning}\n`;
  }

  const total = lockedCount + openCount + undecidedCount;
  lines += `\nTrust summary:\n`;
  lines += `  ${lockedCount} of ${total} permissions are permanently LOCKED (cannot change)\n`;
  lines += `  ${openCount} are permanently OPEN (manager can always use)\n`;
  lines += `  ${undecidedCount} are UNDECIDED (currently allowed, could be locked later)\n\n`;

  if (lockedCount === total) {
    lines += 'Fully immutable. The manager cannot change anything about this collection. Maximum trust.\n';
  } else if (lockedCount >= total * 0.7) {
    lines += `Mostly immutable. Only ${total - lockedCount} aspects can be changed. Good trust level.\n`;
  } else if (lockedCount >= total * 0.4) {
    lines += 'Partially locked. The manager retains significant control. Review what is open carefully.\n';
  } else {
    lines += 'Highly mutable. The manager can change most things. Only trust this collection if you trust the manager.\n';
  }

  // Critical callouts
  const approvalState = permState(perms.canUpdateCollectionApprovals);
  if (approvalState !== 'locked') {
    lines += `\nImportant: Transfer rules are ${approvalState === 'open' ? 'permanently changeable' : 'currently changeable'}. `;
    const hasMint = col.collectionApprovals.some((a) => a.fromList.checkAddress('Mint'));
    if (hasMint) {
      lines += 'Since the collection has mint approvals, the manager could potentially change minting rules (add unlimited minting, change prices, etc.).\n';
    } else {
      lines += 'The manager could add new transfer rules or modify existing ones.\n';
    }
  }

  const validTokenState = permState(perms.canUpdateValidTokenIds);
  if (validTokenState !== 'locked') {
    lines += `\nImportant: Token ID creation is ${validTokenState === 'open' ? 'permanently allowed' : 'currently allowed'}. The manager can create new token IDs, which means new supply can be minted.\n`;
  }

  const managerState = permState(perms.canUpdateManager);
  if (managerState !== 'locked') {
    lines += '\nNote: Management can be transferred to another address.\n';
  }

  return lines;
}

function buildInvariants<T extends NumberType>(col: BitBadgesCollection<T>): string {
  const inv = col.invariants;
  if (!inv) return '\nINVARIANTS\n\nNo invariants are set for this collection.\n';

  let lines = '\nINVARIANTS (ON-CHAIN GUARANTEES)\n\n';
  lines += 'These are on-chain guarantees that cannot be changed once set:\n\n';

  const maxSupply = inv.maxSupplyPerId != null ? BigInt(inv.maxSupplyPerId.valueOf()).toString() : '0';
  lines += `Max supply per token ID: ${maxSupply === '0' ? 'No limit set' : maxSupply}\n`;
  lines += `No forceful post-mint transfers: ${inv.noForcefulPostMintTransfers ? 'Yes. Tokens cannot be forcefully seized after minting.' : 'No. Forceful transfers may be possible depending on approvals.'}\n`;
  lines += `No custom ownership times: ${inv.noCustomOwnershipTimes ? 'Yes. Simplified time model - all ownership times are full range.' : 'No. Custom ownership time windows are allowed.'}\n`;
  lines += `Pool creation disabled: ${inv.disablePoolCreation ? 'Yes. No liquidity pools can be created.' : 'No. Liquidity pools are allowed.'}\n`;

  if (inv.cosmosCoinBackedPath) {
    const denom = inv.cosmosCoinBackedPath.conversion?.sideA?.denom || 'unknown';
    const address = inv.cosmosCoinBackedPath.address || 'unknown';
    lines += `IBC backing: Backed 1:1 by ${denom}. Backing address: ${address}\n`;
  }

  if (inv.evmQueryChallenges && inv.evmQueryChallenges.length > 0) {
    lines += `EVM query invariants: ${inv.evmQueryChallenges.length} on-chain contract verification(s) are checked after every transfer.\n`;
  }

  return lines;
}

function buildClaims<T extends NumberType>(col: BitBadgesCollection<T>): string {
  if (!col.claims || col.claims.length === 0) {
    return '\nCLAIMS\n\nNo off-chain claims are configured for this collection.\n';
  }

  let lines = '\nCLAIMS\n\n';
  lines += `There are ${col.claims.length} claim(s) configured:\n\n`;

  for (const claim of col.claims) {
    lines += `Claim: "${claim.claimId}"\n`;

    if (claim.metadata?.name) lines += `  Name: ${claim.metadata.name}\n`;
    if (claim.metadata?.description) lines += `  Description: ${claim.metadata.description}\n`;
    if (claim.categories && claim.categories.length > 0) lines += `  Categories: ${claim.categories.join(', ')}\n`;
    if (claim.approach) lines += `  Approach: ${claim.approach}\n`;
    if (claim.estimatedCost) lines += `  Estimated cost: ${claim.estimatedCost}\n`;
    if (claim.estimatedTime) lines += `  Estimated time: ${claim.estimatedTime}\n`;
    if (claim.assignMethod) lines += `  Assignment method: ${claim.assignMethod}\n`;
    if (claim.manualDistribution) lines += `  Manual distribution: Yes\n`;

    // Plugins (sanitized - no private params)
    if (claim.plugins && claim.plugins.length > 0) {
      lines += `  Plugins (${claim.plugins.length}):\n`;
      for (const plugin of claim.plugins) {
        lines += `    - ${plugin.pluginId || 'unknown'}`;
        if ((plugin as any).publicParams) {
          const publicKeys = Object.keys((plugin as any).publicParams);
          if (publicKeys.length > 0) lines += ` (public settings: ${publicKeys.join(', ')})`;
        }
        lines += '\n';
      }
    }

    // Rewards
    if (claim.rewards && claim.rewards.length > 0) {
      lines += `  Rewards: ${claim.rewards.length} reward(s) configured\n`;
    }

    lines += '\n';
  }

  return lines;
}

function buildIbcCrossChain<T extends NumberType>(col: BitBadgesCollection<T>): string {
  const hasAlias = col.aliasPaths && col.aliasPaths.length > 0;
  const hasWrapper = col.cosmosCoinWrapperPaths && col.cosmosCoinWrapperPaths.length > 0;
  const hasBacking = !!col.invariants?.cosmosCoinBackedPath;

  if (!hasAlias && !hasWrapper && !hasBacking) {
    return '\nIBC / CROSS-CHAIN\n\nNo IBC or cross-chain features are configured.\n';
  }

  let lines = '\nIBC / CROSS-CHAIN\n\n';

  if (hasBacking) {
    const backing = col.invariants!.cosmosCoinBackedPath!;
    const denom = backing.conversion?.sideA?.denom || 'unknown';
    lines += `IBC Backing: This collection is backed 1:1 by ${denom}.\n`;
    lines += `  Backing address: ${backing.address}\n`;
    lines += '\n';
  }

  if (hasAlias) {
    lines += `Alias paths (${col.aliasPaths.length}):\n`;
    for (const alias of col.aliasPaths) {
      lines += `  - Denom: ${alias.denom}, Symbol: ${alias.symbol}\n`;
      if (alias.metadata?.metadata?.name) lines += `    Name: ${alias.metadata.metadata.name}\n`;
    }
    lines += '\n';
  }

  if (hasWrapper) {
    lines += `Cosmos coin wrapper paths (${col.cosmosCoinWrapperPaths.length}):\n`;
    for (const wrapper of col.cosmosCoinWrapperPaths) {
      lines += `  - Denom: ${(wrapper as any).denom || 'N/A'}, Symbol: ${(wrapper as any).symbol || 'N/A'}\n`;
      if (wrapper.metadata?.metadata?.name) lines += `    Name: ${wrapper.metadata.metadata.name}\n`;
    }
    lines += '\n';
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Produces a thorough plaintext explanation of a BitBadgesCollection.
 * The output is always user-facing, plain language, with no jargon.
 *
 * Privacy: Sensitive fields (seed codes, preimages, private params, template info,
 * signature challenge content, voting challenge content) are never included in
 * the output.
 *
 * @param collection - A BitBadgesCollection instance or plain interface object
 * @returns A single string with a comprehensive explanation of the collection
 *
 * @category Collections
 */
export function interpretCollection<T extends NumberType>(
  collection: BitBadgesCollection<T> | iBitBadgesCollection<T>
): string {
  // Ensure we have a class instance for helper methods
  const col = collection instanceof BitBadgesCollection ? collection : new BitBadgesCollection(collection);

  let report = '';
  report += buildOverview(col);
  report += buildMetadata(col);
  report += buildHowTokensAreCreated(col);
  report += buildTransferability(col);
  report += buildDefaultBalances(col);
  report += buildPermissions(col);
  report += buildInvariants(col);
  report += buildClaims(col);
  report += buildIbcCrossChain(col);

  return report;
}
