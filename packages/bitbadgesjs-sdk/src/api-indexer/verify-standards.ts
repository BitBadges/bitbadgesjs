/**
 * Deterministic skill/standard verification.
 *
 * These validators run POST-BUILD with 0 AI tokens. They check only
 * 100% deterministic structural rules that are critical for:
 *   - Correct on-chain functionality
 *   - Frontend display/protocol support
 *   - SDK constructor compatibility
 *
 * The AI handles creative work (metadata, naming, amounts, addresses).
 * These validators ensure the structural skeleton is correct.
 */

import { CollectionDoc } from './docs-types/docs.js';
import { doesCollectionFollowSubscriptionProtocol } from '../core/subscriptions.js';
import { normalizeForReview } from '../core/review-normalize.js';
import { parseInlineCustomData } from './metadata/inlineCustomData.js';

/**
 * True if a metadata entity carries inline JSON in `customData` that
 * resolves to a valid Metadata via parseInlineCustomData. Used by the
 * placeholder-URI / missing-URI checks below to suppress warnings for
 * the inline-customData configuration (Phase 1 of metadata hosting).
 */
function hasInlineCustomData(m: any): boolean {
  if (!m || typeof m !== 'object') return false;
  return parseInlineCustomData(typeof m.customData === 'string' ? m.customData : '') !== null;
}

const MAX_UINT64 = 18446744073709551615n;
const FOREVER = [{ start: 1n, end: MAX_UINT64 }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

// ============================================================
// Types
// ============================================================

export interface StandardViolation {
  standard: string;
  field: string;
  message: string;
  fix?: string; // Optional auto-fix description
}

export interface VerificationResult {
  valid: boolean;
  violations: StandardViolation[];
  standardsChecked: string[];
}

// ============================================================
// Helpers
// ============================================================

function isForever(times: any[]): boolean {
  if (!Array.isArray(times) || times.length !== 1) return false;
  return times[0]?.start === 1n && times[0]?.end === MAX_UINT64;
}

function isSingleToken(tokenIds: any[]): boolean {
  if (!Array.isArray(tokenIds) || tokenIds.length !== 1) return false;
  return tokenIds[0]?.start === 1n && tokenIds[0]?.end === 1n;
}

function getApprovals(value: any): any[] {
  return value?.collectionApprovals || [];
}

function getStandards(value: any): string[] {
  return value?.standards || [];
}

function getInvariants(value: any): any {
  return value?.invariants || {};
}

function getMintApprovals(value: any): any[] {
  return getApprovals(value).filter((a: any) => a.fromListId === 'Mint');
}

/**
 * Build a CollectionDoc-like object from raw transaction value for SDK protocol checks.
 * Uses the SDK's own .convert(BigInt) to handle all type conversions safely.
 * Do NOT pre-convert with JSON.parse reviver — that causes "Cannot mix BigInt and other types"
 * when the CollectionDoc constructor does arithmetic before .convert() runs.
 */
function buildCollectionDocLike(value: any): any {
  try {
    // Deep clone without any type conversion — keep all values as strings/numbers/booleans
    const raw = JSON.parse(JSON.stringify(value));

    // The SDK expects iCollectionDoc shape — wrap the MsgUniversalUpdateCollection value
    // Let .convert(BigInt) handle all string→BigInt conversion uniformly
    return new CollectionDoc({
      ...raw,
      collectionId: raw.collectionId ?? '0',
      createdBy: raw.creator ?? '',
      createdBlock: '0',
      createdTimestamp: '0',
      updateHistory: [],
      mintEscrowAddress: '',
      cosmosCoinWrapperPaths: raw.cosmosCoinWrapperPathsToAdd ?? [],
      aliasPaths: raw.aliasPathsToAdd ?? [],
      invariants: raw.invariants ?? {},
      collectionMetadata: raw.collectionMetadata ?? { uri: '', customData: '' },
      tokenMetadata: raw.tokenMetadata ?? [],
      customData: raw.customData ?? '',
      isArchived: raw.isArchived ?? false,
      defaultBalances: raw.defaultBalances ?? {
        balances: [],
        outgoingApprovals: [],
        incomingApprovals: [],
        autoApproveAllIncomingTransfers: false,
        autoApproveSelfInitiatedOutgoingTransfers: false,
        autoApproveSelfInitiatedIncomingTransfers: false,
        userPermissions: {
          canUpdateOutgoingApprovals: [],
          canUpdateIncomingApprovals: [],
          canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
          canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
          canUpdateAutoApproveAllIncomingTransfers: []
        }
      },
      _docId: '',
      _id: ''
    }).convert(BigInt);
  } catch {
    return null;
  }
}

// ============================================================
// Per-Standard Validators
// ============================================================

function verifySmartToken(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Smart Token';
  const approvals = getApprovals(value);
  const invariants = getInvariants(value);

  // Must have cosmosCoinBackedPath or cosmosCoinWrapperPathsToAdd
  const hasCosmosCoinPath =
    invariants.cosmosCoinBackedPath ||
    (value.cosmosCoinWrapperPathsToAdd && value.cosmosCoinWrapperPathsToAdd.length > 0);
  if (!hasCosmosCoinPath) {
    violations.push({
      standard: std,
      field: 'invariants.cosmosCoinBackedPath',
      message: 'Smart tokens MUST have a cosmosCoinBackedPath or cosmosCoinWrapperPathsToAdd defining the IBC backing.',
      fix: 'Add cosmosCoinWrapperPathsToAdd with the IBC denom and conversion ratio.'
    });
  }

  // Must have at least a backing approval (allowBackedMinting: true)
  const backingApprovals = approvals.filter(
    (a: any) => a.approvalCriteria?.allowBackedMinting === true || a.approvalCriteria?.allowBackedMinting === 'true'
  );
  if (backingApprovals.length === 0) {
    violations.push({
      standard: std,
      field: 'collectionApprovals',
      message: 'Smart tokens MUST have at least one approval with allowBackedMinting: true (backing/deposit approval).'
    });
  }

  // Backing approvals must have mustPrioritize: true
  for (const ba of backingApprovals) {
    if (ba.approvalCriteria?.mustPrioritize !== true && ba.approvalCriteria?.mustPrioritize !== 'true') {
      violations.push({
        standard: std,
        field: `collectionApprovals[${ba.approvalId}].approvalCriteria.mustPrioritize`,
        message: `Backing approval "${ba.approvalId}" MUST have mustPrioritize: true. Without it, users can bypass the backing mechanism.`,
        fix: 'Set mustPrioritize: true on this approval.'
      });
    }
  }

  // Should NOT have fromListId: "Mint" approvals (smart tokens mint via IBC backing, not direct mint)
  const mintApprovals = getMintApprovals(value);
  if (mintApprovals.length > 0) {
    violations.push({
      standard: std,
      field: 'collectionApprovals',
      message:
        'Smart tokens should NOT have fromListId: "Mint" approvals. Tokens are created via IBC backing deposits, not traditional minting.'
    });
  }

  // Must have alias path. Tolerate both field names:
  //   - aliasPathsToAdd (MsgUniversalUpdateCollection create shape)
  //   - aliasPaths (frontend collection store shape)
  const aliasPaths = value.aliasPathsToAdd || value.aliasPaths || [];
  const hasAliasPath = aliasPaths.length > 0 || invariants.aliasPath;
  if (!hasAliasPath) {
    violations.push({
      standard: std,
      field: 'aliasPathsToAdd',
      message: 'Smart tokens MUST have an alias path configured for the IBC denom conversion.',
      fix: 'Add aliasPathsToAdd with the IBC denom and decimal configuration.'
    });
  }

  return violations;
}

function verifySubscription(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Subscription';

  // validTokenIds must start at 1 (one range, supports multi-tier)
  const vt = value.validTokenIds;
  if (!Array.isArray(vt) || vt.length !== 1 || vt[0]?.start !== 1n) {
    violations.push({
      standard: std,
      field: 'validTokenIds',
      message: 'Subscription collections MUST have validTokenIds starting at 1 (e.g. [{ start: "1", end: "1" }] for single tier, or [{ start: "1", end: "3" }] for 3 tiers).',
      fix: 'Set validTokenIds to [{ "start": "1", "end": "<numTiers>" }].'
    });
  }

  // Must have at least one subscription faucet approval
  const mintApprovals = getMintApprovals(value);
  if (mintApprovals.length === 0) {
    violations.push({
      standard: std,
      field: 'collectionApprovals',
      message: 'Subscription collections MUST have at least one mint approval (fromListId: "Mint") acting as a subscription faucet.'
    });
    return violations; // Can't check further without approvals
  }

  for (const approval of mintApprovals) {
    const ac = approval.approvalCriteria || {};
    const prefix = `collectionApprovals[${approval.approvalId}]`;

    // Must have overridesFromOutgoingApprovals: true
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({
        standard: std,
        field: `${prefix}.approvalCriteria.overridesFromOutgoingApprovals`,
        message: `Mint approval "${approval.approvalId}" MUST have overridesFromOutgoingApprovals: true.`,
        fix: 'Set overridesFromOutgoingApprovals: true.'
      });
    }

    // Must have predeterminedBalances with incrementedBalances
    const pb = ac.predeterminedBalances;
    const ib = pb?.incrementedBalances;
    if (!ib) {
      violations.push({
        standard: std,
        field: `${prefix}.approvalCriteria.predeterminedBalances.incrementedBalances`,
        message: `Subscription approval "${approval.approvalId}" MUST use predeterminedBalances with incrementedBalances.`
      });
      continue;
    }

    // startBalances must be length 1 with amount 1
    if (!Array.isArray(ib.startBalances) || ib.startBalances.length !== 1) {
      violations.push({
        standard: std,
        field: `${prefix}.predeterminedBalances.incrementedBalances.startBalances`,
        message: `Subscription approval "${approval.approvalId}" startBalances must have exactly 1 entry.`
      });
    } else if (ib.startBalances[0]?.amount !== 1n) {
      violations.push({
        standard: std,
        field: `${prefix}.predeterminedBalances.incrementedBalances.startBalances[0].amount`,
        message: `Subscription approval "${approval.approvalId}" startBalances amount must be "1".`
      });
    }

    // durationFromTimestamp must be non-zero
    if (!ib.durationFromTimestamp || ib.durationFromTimestamp === 0n) {
      violations.push({
        standard: std,
        field: `${prefix}.predeterminedBalances.incrementedBalances.durationFromTimestamp`,
        message: `Subscription approval "${approval.approvalId}" MUST have a non-zero durationFromTimestamp (subscription duration in ms). Common values: 2592000000 (30 days), 31536000000 (1 year).`,
        fix: 'Set durationFromTimestamp to the subscription period in milliseconds.'
      });
    }

    // allowOverrideTimestamp must be true (for renewal)
    if (ib.allowOverrideTimestamp !== true && ib.allowOverrideTimestamp !== 'true') {
      violations.push({
        standard: std,
        field: `${prefix}.predeterminedBalances.incrementedBalances.allowOverrideTimestamp`,
        message: `Subscription approval "${approval.approvalId}" MUST have allowOverrideTimestamp: true to allow subscription renewal.`,
        fix: 'Set allowOverrideTimestamp: true.'
      });
    }

    // incrementTokenIdsBy and incrementOwnershipTimesBy should be 0
    if (ib.incrementTokenIdsBy && ib.incrementTokenIdsBy !== 0n) {
      violations.push({
        standard: std,
        field: `${prefix}.predeterminedBalances.incrementedBalances.incrementTokenIdsBy`,
        message: `Subscription approval "${approval.approvalId}" incrementTokenIdsBy should be 0 (single token ID for subscriptions).`
      });
    }
    if (ib.incrementOwnershipTimesBy && ib.incrementOwnershipTimesBy !== 0n) {
      violations.push({
        standard: std,
        field: `${prefix}.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy`,
        message: `Subscription approval "${approval.approvalId}" incrementOwnershipTimesBy should be 0.`
      });
    }

    // Mutual exclusivity: only ONE of durationFromTimestamp, incrementOwnershipTimesBy, recurringOwnershipTimes can be non-zero
    const rot = ib.recurringOwnershipTimes;
    const hasDuration = ib.durationFromTimestamp && ib.durationFromTimestamp !== 0n;
    const hasIncrement = ib.incrementOwnershipTimesBy && ib.incrementOwnershipTimesBy !== 0n;
    const hasRecurring =
      rot &&
      ((rot.startTime && rot.startTime !== 0n) ||
        (rot.intervalLength && rot.intervalLength !== 0n) ||
        (rot.chargePeriodLength && rot.chargePeriodLength !== 0n));
    const activeCount = [hasDuration, hasIncrement, hasRecurring].filter(Boolean).length;
    if (activeCount > 1) {
      violations.push({
        standard: std,
        field: `${prefix}.predeterminedBalances.incrementedBalances`,
        message: `Subscription approval "${approval.approvalId}" has multiple ownership-time methods set (durationFromTimestamp, incrementOwnershipTimesBy, recurringOwnershipTimes). The chain requires EXACTLY ONE. For subscriptions, use durationFromTimestamp and set recurringOwnershipTimes to all-zeros { startTime: "0", intervalLength: "0", chargePeriodLength: "0" }.`,
        fix: 'Keep durationFromTimestamp set to the subscription period. Set recurringOwnershipTimes to { startTime: "0", intervalLength: "0", chargePeriodLength: "0" } and incrementOwnershipTimesBy to "0".'
      });
    }

    // coinTransfers validation
    const ct = ac.coinTransfers;
    if (Array.isArray(ct) && ct.length > 0) {
      for (const coin of ct) {
        if (coin.overrideFromWithApproverAddress === true || coin.overrideFromWithApproverAddress === 'true') {
          violations.push({
            standard: std,
            field: `${prefix}.approvalCriteria.coinTransfers.overrideFromWithApproverAddress`,
            message: `Subscription approval "${approval.approvalId}" coinTransfers MUST have overrideFromWithApproverAddress: false.`
          });
        }
        if (coin.overrideToWithInitiator === true || coin.overrideToWithInitiator === 'true') {
          violations.push({
            standard: std,
            field: `${prefix}.approvalCriteria.coinTransfers.overrideToWithInitiator`,
            message: `Subscription approval "${approval.approvalId}" coinTransfers MUST have overrideToWithInitiator: false.`
          });
        }
      }
    }
  }

  // Final check: use SDK's canonical doesCollectionFollowSubscriptionProtocol
  // This is the same function the frontend/indexer uses to determine protocol compliance
  try {
    const collectionLike = buildCollectionDocLike(value);
    if (collectionLike && !doesCollectionFollowSubscriptionProtocol(collectionLike as any)) {
      violations.push({
        standard: std,
        field: 'collection',
        message:
          'Collection does not pass the SDK doesCollectionFollowSubscriptionProtocol() check. The frontend will not recognize this as a valid subscription collection. Review the subscription faucet approval structure.'
      });
    }
  } catch (e: any) {
    violations.push({
      standard: std,
      field: 'collection',
      message: `SDK subscription protocol check threw an error: ${e.message}. This likely means the approval structure is malformed.`
    });
  }

  return violations;
}

function verifyFungibleToken(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Fungible Token';

  // validTokenIds must be exactly 1 token
  if (!isSingleToken(value.validTokenIds)) {
    violations.push({
      standard: std,
      field: 'validTokenIds',
      message: 'Fungible token collections MUST have validTokenIds = [{ start: "1", end: "1" }]. All units share token ID 1.',
      fix: 'Set validTokenIds to [{ "start": "1", "end": "1" }].'
    });
  }

  // Mint approvals must have overridesFromOutgoingApprovals: true
  for (const approval of getMintApprovals(value)) {
    const ac = approval.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({
        standard: std,
        field: `collectionApprovals[${approval.approvalId}].approvalCriteria.overridesFromOutgoingApprovals`,
        message: `Mint approval "${approval.approvalId}" MUST have overridesFromOutgoingApprovals: true.`,
        fix: 'Set overridesFromOutgoingApprovals: true.'
      });
    }
  }

  return violations;
}

function verifyNFTCollection(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'NFT Collection';
  const invariants = getInvariants(value);

  // maxSupplyPerId should be "1" for true NFTs
  if (!invariants.maxSupplyPerId || invariants.maxSupplyPerId !== 1n) {
    violations.push({
      standard: std,
      field: 'invariants.maxSupplyPerId',
      message:
        'NFT collections should have maxSupplyPerId: "1" to ensure each token ID is unique (true NFT). Current value: "' +
        (invariants.maxSupplyPerId || '0') +
        '".',
      fix: 'Set invariants.maxSupplyPerId to "1".'
    });
  }

  // Mint approvals must have overridesFromOutgoingApprovals: true
  for (const approval of getMintApprovals(value)) {
    const ac = approval.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({
        standard: std,
        field: `collectionApprovals[${approval.approvalId}].approvalCriteria.overridesFromOutgoingApprovals`,
        message: `Mint approval "${approval.approvalId}" MUST have overridesFromOutgoingApprovals: true.`,
        fix: 'Set overridesFromOutgoingApprovals: true.'
      });
    }
  }

  return violations;
}

function verifyAddressList(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Address List';

  // validTokenIds must be exactly 1 token
  if (!isSingleToken(value.validTokenIds)) {
    violations.push({
      standard: std,
      field: 'validTokenIds',
      message: 'Address list collections MUST have validTokenIds = [{ start: "1", end: "1" }]. Membership = owning x1 of token ID 1.',
      fix: 'Set validTokenIds to [{ "start": "1", "end": "1" }].'
    });
  }

  const approvals = getApprovals(value);

  // Must have a manager-add approval (Mint → All)
  const addApprovals = approvals.filter((a: any) => a.fromListId === 'Mint' && a.toListId === 'All');
  if (addApprovals.length === 0) {
    violations.push({
      standard: std,
      field: 'collectionApprovals',
      message: 'Address list MUST have a manager-add approval (fromListId: "Mint", toListId: "All") for adding members.',
      fix: 'Add a mint approval with fromListId: "Mint", toListId: "All", initiatedByListId: manager address.'
    });
  }

  // Must have a manager-remove approval (All → burn address)
  const removeApprovals = approvals.filter((a: any) => a.toListId === BURN_ADDRESS);
  if (removeApprovals.length === 0) {
    violations.push({
      standard: std,
      field: 'collectionApprovals',
      message: `Address list MUST have a manager-remove approval (toListId: "${BURN_ADDRESS}") for removing members.`,
      fix: `Add a burn approval with fromListId: "All", toListId: "${BURN_ADDRESS}", initiatedByListId: manager address.`
    });
  }

  // Mint approvals must have overridesFromOutgoingApprovals: true
  for (const approval of getMintApprovals(value)) {
    const ac = approval.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({
        standard: std,
        field: `collectionApprovals[${approval.approvalId}].approvalCriteria.overridesFromOutgoingApprovals`,
        message: `Mint approval "${approval.approvalId}" MUST have overridesFromOutgoingApprovals: true.`,
        fix: 'Set overridesFromOutgoingApprovals: true.'
      });
    }
  }

  return violations;
}

function verifyCustom2FA(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Custom-2FA';
  const approvals = getApprovals(value);
  const invariants = getInvariants(value);

  // Must have at least one approval with autoDeletionOptions.allowPurgeIfExpired
  const has2FAApproval = approvals.some(
    (a: any) =>
      a.approvalCriteria?.autoDeletionOptions?.allowPurgeIfExpired === true ||
      a.approvalCriteria?.autoDeletionOptions?.allowPurgeIfExpired === 'true'
  );

  if (!has2FAApproval) {
    violations.push({
      standard: std,
      field: 'collectionApprovals.approvalCriteria.autoDeletionOptions',
      message:
        'Custom-2FA collections MUST have at least one approval with autoDeletionOptions.allowPurgeIfExpired: true so expired 2FA tokens can be cleaned up.'
    });
  }

  // Pool creation should be disabled for 2FA tokens
  if (invariants.disablePoolCreation !== true && invariants.disablePoolCreation !== 'true') {
    violations.push({
      standard: std,
      field: 'invariants.disablePoolCreation',
      message: 'Custom-2FA collections should have disablePoolCreation: true. 2FA tokens should not be tradable on DEX.',
      fix: 'Set invariants.disablePoolCreation to true.'
    });
  }

  return violations;
}

function verifyLiquidityPools(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Liquidity Pools';
  const invariants = getInvariants(value);

  // disablePoolCreation must be false or absent
  if (invariants.disablePoolCreation === true || invariants.disablePoolCreation === 'true') {
    violations.push({
      standard: std,
      field: 'invariants.disablePoolCreation',
      message: 'Liquidity pool collections MUST have disablePoolCreation: false (or omitted).',
      fix: 'Set invariants.disablePoolCreation to false or remove it.'
    });
  }

  // Must have alias path
  const hasAliasPath = (value.aliasPathsToAdd && value.aliasPathsToAdd.length > 0) || invariants.aliasPath;
  if (!hasAliasPath) {
    violations.push({
      standard: std,
      field: 'aliasPathsToAdd',
      message: 'Liquidity pool collections MUST have at least one alias path configured for DEX trading.'
    });
  }

  return violations;
}

function verifyCreditToken(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Credit Token';

  // Must be single token ID
  if (!isSingleToken(value.validTokenIds)) {
    violations.push({
      standard: std,
      field: 'validTokenIds',
      message: 'Credit token collections MUST have validTokenIds = [{ start: "1", end: "1" }].',
      fix: 'Set validTokenIds to [{ "start": "1", "end": "1" }].'
    });
  }

  // Should not have non-mint, non-wrapping transfer approvals (non-transferable)
  const approvals = getApprovals(value);
  const peerTransfers = approvals.filter(
    (a: any) =>
      a.fromListId !== 'Mint' && !a.approvalCriteria?.allowSpecialWrapping && !a.approvalCriteria?.allowBackedMinting
  );
  if (peerTransfers.length > 0) {
    violations.push({
      standard: std,
      field: 'collectionApprovals',
      message:
        'Credit tokens are typically non-transferable (increment-only). Found peer-to-peer transfer approvals. Remove them if credits should not be tradable between users.'
    });
  }

  return violations;
}

function verifyQuest(_value: any): StandardViolation[] {
  // Quest-specific checks moved to review-ux/skills.ts so they can ship
  // as soft warnings instead of critical standards violations. The user
  // can fund mint escrow post-creation by sending coins to the escrow
  // address, so "no escrow configured" is informational not blocking.
  return [];
}

function verifyTradableNFT(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Tradable NFT';
  const standards = getStandards(value);

  // Must have NFTs standard
  if (!standards.includes('NFTs')) {
    violations.push({
      standard: std,
      field: 'standards',
      message: 'Tradable NFT collections MUST include the "NFTs" standard alongside "NFTMarketplace".',
      fix: 'Add "NFTs" to the standards array.'
    });
  }

  // Must have NFTPricingDenom:* standard
  const hasPricingDenom = standards.some((s) => s.startsWith('NFTPricingDenom:'));
  if (!hasPricingDenom) {
    violations.push({
      standard: std,
      field: 'standards',
      message:
        'Tradable NFT collections MUST include an "NFTPricingDenom:{denom}" standard to set the pricing currency for the orderbook.',
      fix: 'Add "NFTPricingDenom:ubadge" (or desired denom) to the standards array.'
    });
  }

  return violations;
}

function verifyNonTransferable(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Non-Transferable';
  const approvals = getApprovals(value);

  // Should NOT have peer-to-peer transfer approvals (fromListId: "!Mint", toListId: "All" or similar)
  const peerTransfers = approvals.filter(
    (a: any) => a.fromListId !== 'Mint' && a.toListId !== BURN_ADDRESS && a.fromListId !== BURN_ADDRESS
  );

  // Only flag if the collection explicitly says non-transferable but has transfer approvals
  // This is just an info-level check since the standard name implies non-transferable
  // but the user might want controlled transfers (e.g., manager-only)
  if (peerTransfers.length > 0) {
    // Intentionally empty — kept for future use
  }

  return violations;
}

// ============================================================
// Common Mint Approval Checks (run for ALL standards with mint approvals)
// ============================================================

/**
 * True when the transaction targets an existing collection — i.e. it's
 * an update, not a create. Detected by a non-"0" collectionId (chain
 * convention for new collections). Used to skip structural checks on
 * CREATE-ONLY fields (defaultBalances, invariants) that the chain
 * ignores on MsgUpdateCollection and that the session layer already
 * blocks the AI from modifying on update builds.
 */
function isUpdateTransaction(value: any): boolean {
  const cid = value?.collectionId;
  if (cid == null) return false;
  const s = String(cid);
  return s !== '' && s !== '0';
}

function verifyCommonMintRules(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const mintApprovals = getMintApprovals(value);
  const defaultBalances = value.defaultBalances || {};

  // defaultBalances is a CREATION-ONLY field — the chain ignores it on
  // MsgUpdateCollection and the session layer blocks set_default_balances
  // on updates. For an update tx the on-chain collection already has its
  // defaultBalances set; we can't change it from this message anyway.
  // Checking the tx body here fires on every update that adds or touches
  // a Mint approval (see ses_1ps5eu91pxxa). Skip the auto-approve
  // incoming rule for updates; it remains enforced on create.
  const isUpdate = isUpdateTransaction(value);

  // If there are mint approvals, defaultBalances should have autoApproveAllIncomingTransfers
  if (mintApprovals.length > 0 && !isUpdate) {
    if (
      defaultBalances.autoApproveAllIncomingTransfers !== true &&
      defaultBalances.autoApproveAllIncomingTransfers !== 'true'
    ) {
      violations.push({
        standard: 'Common',
        field: 'defaultBalances.autoApproveAllIncomingTransfers',
        message:
          'Collections with token-creation (Mint) approvals MUST have defaultBalances.autoApproveAllIncomingTransfers: true. Without this, recipients cannot receive newly created tokens.',
        fix: 'Set defaultBalances.autoApproveAllIncomingTransfers: true.'
      });
    }
  }

  // Each mint approval must have overridesFromOutgoingApprovals: true
  for (const approval of mintApprovals) {
    const ac = approval.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({
        standard: 'Common',
        field: `collectionApprovals[${approval.approvalId}].approvalCriteria.overridesFromOutgoingApprovals`,
        message: `Mint approval "${approval.approvalId}" MUST have overridesFromOutgoingApprovals: true. This is required for all Mint (fromListId: "Mint") approvals.`,
        fix: 'Set overridesFromOutgoingApprovals: true.'
      });
    }
  }

  // Mint approvals with predeterminedBalances must have exactly one
  // orderCalculationMethod — but ONLY when the predetermined balances
  // are actually being used. Per `approvalCriteriaUsesPredeterminedBalances`,
  // that means either `incrementedBalances.startBalances` OR
  // `manualBalances` is non-empty. The chain's `validate_basic.go` rule
  // is "when using predetermined balances, exactly one order calculation
  // can be set to true". An approval with both arrays empty (e.g.
  // custom-2fa, which enforces expiration via allowPurgeIfExpired) has
  // nothing to order, so the chain accepts all flags false.
  for (const approval of mintApprovals) {
    const ac = approval.approvalCriteria || {};
    const pb = ac.predeterminedBalances;
    const incStart = pb?.incrementedBalances?.startBalances;
    const manual = pb?.manualBalances;
    const usesPredetermined =
      (Array.isArray(incStart) && incStart.length > 0) ||
      (Array.isArray(manual) && manual.length > 0);
    if (pb?.orderCalculationMethod && usesPredetermined) {
      const ocm = pb.orderCalculationMethod;
      const trueCount = [
        ocm.useOverallNumTransfers,
        ocm.usePerToAddressNumTransfers,
        ocm.usePerFromAddressNumTransfers,
        ocm.usePerInitiatedByAddressNumTransfers,
        ocm.useMerkleChallengeLeafIndex
      ].filter((v) => v === true || v === 'true').length;

      if (trueCount === 0) {
        violations.push({
          standard: 'Common',
          field: `collectionApprovals[${approval.approvalId}].predeterminedBalances.orderCalculationMethod`,
          message: `Approval "${approval.approvalId}" uses predeterminedBalances (incrementedBalances.startBalances or manualBalances) but no orderCalculationMethod is set to true. Exactly one must be true.`,
          fix: 'Set useOverallNumTransfers: true (most common default).'
        });
      } else if (trueCount > 1) {
        violations.push({
          standard: 'Common',
          field: `collectionApprovals[${approval.approvalId}].predeterminedBalances.orderCalculationMethod`,
          message: `Approval "${approval.approvalId}" has ${trueCount} orderCalculationMethods set to true. Exactly one must be true.`
        });
      }
    }
  }

  return violations;
}

// ============================================================
// PaymentRequest Validator
// ============================================================

function verifyPaymentRequest(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'PaymentRequest';
  const approvals = getApprovals(value);

  if (!isSingleToken(value.validTokenIds)) {
    violations.push({ standard: std, field: 'validTokenIds', message: 'PaymentRequest collections MUST have validTokenIds = [{ start: "1", end: "1" }].' });
  }

  // Must have 2 approvals: pay, deny
  if (approvals.length < 2) {
    violations.push({ standard: std, field: 'collectionApprovals', message: `PaymentRequest requires at least 2 approvals (pay, deny). Found ${approvals.length}.` });
  }

  const mintApprovals = approvals.filter((a: any) => a.fromListId === 'Mint');
  for (const a of mintApprovals) {
    const ac = a.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].overridesFromOutgoingApprovals`, message: `PaymentRequest approval "${a.approvalId}" MUST have overridesFromOutgoingApprovals: true.` });
    }
    if (ac.overridesToIncomingApprovals !== true && ac.overridesToIncomingApprovals !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].overridesToIncomingApprovals`, message: `PaymentRequest approval "${a.approvalId}" MUST have overridesToIncomingApprovals: true.` });
    }
    const mnt = ac.maxNumTransfers;
    if (mnt && mnt.overallMaxNumTransfers !== 1n) {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].maxNumTransfers`, message: `PaymentRequest approval "${a.approvalId}" overallMaxNumTransfers must be "1".` });
    }
    // Inverse-of-Bounty invariant: PaymentRequest must never use voting.
    // Approval gating happens via initiatedByListId scoped to the payer.
    if (ac.votingChallenges && ac.votingChallenges.length > 0) {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].votingChallenges`, message: `PaymentRequest approval "${a.approvalId}" MUST NOT use votingChallenges — gating happens via initiatedByListId.` });
    }
  }

  // Exactly one approval may carry a coinTransfer (the pay approval).
  // It must NOT use overrideFromWithApproverAddress — the chain default
  // routes "from" to the initiator (the payer), which is the whole
  // point of the no-escrow inversion.
  const withCoinTransfer = mintApprovals.filter((a: any) => a.approvalCriteria?.coinTransfers?.length > 0);
  if (withCoinTransfer.length !== 1) {
    violations.push({ standard: std, field: 'collectionApprovals.coinTransfers', message: `PaymentRequest must have exactly 1 approval with a coinTransfer (pay). Found ${withCoinTransfer.length}.` });
  } else {
    const payApproval = withCoinTransfer[0];
    const ct = payApproval.approvalCriteria.coinTransfers[0];
    if (ct.overrideFromWithApproverAddress === true || ct.overrideFromWithApproverAddress === 'true') {
      violations.push({ standard: std, field: 'collectionApprovals.coinTransfers[0].overrideFromWithApproverAddress', message: 'PaymentRequest pay approval MUST have overrideFromWithApproverAddress=false (debit initiator/payer, not escrow).' });
    }
    // Payer (initiator) must not equal the recipient — self-payment is
    // a no-op that bypasses the intent of the standard.
    if (ct.to && payApproval.initiatedByListId && ct.to === payApproval.initiatedByListId) {
      violations.push({ standard: std, field: 'collectionApprovals.coinTransfers[0].to', message: 'PaymentRequest pay recipient MUST NOT equal the payer (initiatedByListId).' });
    }
  }

  return violations;
}

// ============================================================
// Bounty Validator
// ============================================================

function verifyBounty(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Bounty';
  const approvals = getApprovals(value);

  if (!isSingleToken(value.validTokenIds)) {
    violations.push({ standard: std, field: 'validTokenIds', message: 'Bounty collections MUST have validTokenIds = [{ start: "1", end: "1" }].' });
  }

  // Must have 3 approvals: accept, deny, expire
  if (approvals.length < 3) {
    violations.push({ standard: std, field: 'collectionApprovals', message: `Bounty requires at least 3 approvals (accept, deny, expire). Found ${approvals.length}.` });
  }

  const mintApprovals = approvals.filter((a: any) => a.fromListId === 'Mint');
  for (const a of mintApprovals) {
    const ac = a.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].overridesFromOutgoingApprovals`, message: `Bounty approval "${a.approvalId}" MUST have overridesFromOutgoingApprovals: true.` });
    }
    if (ac.overridesToIncomingApprovals !== true && ac.overridesToIncomingApprovals !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].overridesToIncomingApprovals`, message: `Bounty approval "${a.approvalId}" MUST have overridesToIncomingApprovals: true.` });
    }
    // Each should have maxNumTransfers.overallMaxNumTransfers = 1
    const mnt = ac.maxNumTransfers;
    if (mnt && mnt.overallMaxNumTransfers !== 1n) {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].maxNumTransfers`, message: `Bounty approval "${a.approvalId}" overallMaxNumTransfers must be "1".` });
    }
  }

  // Verify voting challenges exist on at least 2 approvals
  const withVoting = mintApprovals.filter((a: any) => a.approvalCriteria?.votingChallenges?.length > 0);
  if (withVoting.length < 2) {
    violations.push({ standard: std, field: 'collectionApprovals.votingChallenges', message: 'Bounty requires at least 2 approvals with votingChallenges (accept + deny).' });
  }

  return violations;
}

// ============================================================
// Crowdfund Validator
// ============================================================

function verifyCrowdfund(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Crowdfund';
  const approvals = getApprovals(value);

  // Must have 2 token IDs (refund + progress)
  const tokenIds = value.validTokenIds;
  if (!Array.isArray(tokenIds) || tokenIds.length !== 1 || tokenIds[0]?.start !== 1n || tokenIds[0]?.end !== 2n) {
    violations.push({ standard: std, field: 'validTokenIds', message: 'Crowdfund collections MUST have validTokenIds = [{ start: "1", end: "2" }] (refund + progress tokens).' });
  }

  // Must have at least 4 approvals
  if (approvals.length < 4) {
    violations.push({ standard: std, field: 'collectionApprovals', message: `Crowdfund requires at least 4 approvals (deposit-refund, deposit-progress, success, refund). Found ${approvals.length}.` });
  }

  // Check mint approvals have overrides
  for (const a of getMintApprovals(value)) {
    const ac = a.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].overridesFromOutgoingApprovals`, message: `Mint approval "${a.approvalId}" MUST have overridesFromOutgoingApprovals: true.` });
    }
  }

  return violations;
}

// ============================================================
// Auction Validator
// ============================================================

function verifyAuction(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Auction';

  if (!isSingleToken(value.validTokenIds)) {
    violations.push({ standard: std, field: 'validTokenIds', message: 'Auction collections MUST have validTokenIds = [{ start: "1", end: "1" }].' });
  }

  const approvals = getApprovals(value);
  const mintApprovals = getMintApprovals(value);

  // Post-settlement state is valid: the mint-to-winner approval uses
  // autoDeletionOptions.afterOneUse, so it's gone once the auction settles.
  if (mintApprovals.length === 0) {
    return violations;
  }

  for (const a of mintApprovals) {
    const ac = a.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].overridesFromOutgoingApprovals`, message: `Mint approval "${a.approvalId}" MUST have overridesFromOutgoingApprovals: true.` });
    }
    // Must have maxNumTransfers = 1
    const mnt = ac.maxNumTransfers;
    if (mnt && mnt.overallMaxNumTransfers !== 1n) {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].maxNumTransfers`, message: `Auction mint-to-winner overallMaxNumTransfers must be "1".` });
    }
    // Transfer times should be bounded (not FOREVER)
    if (isForever(a.transferTimes || [])) {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].transferTimes`, message: 'Auction mint-to-winner transferTimes should be time-bounded (bid deadline → accept window), not FOREVER.' });
    }
  }

  return violations;
}

// ============================================================
// Products Validator
// ============================================================

function verifyProducts(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Products';
  const approvals = getApprovals(value);
  const invariants = getInvariants(value);

  if (invariants.noCustomOwnershipTimes !== true && invariants.noCustomOwnershipTimes !== 'true') {
    violations.push({ standard: std, field: 'invariants.noCustomOwnershipTimes', message: 'Product catalog should have noCustomOwnershipTimes: true.' });
  }

  const purchaseApprovals = getMintApprovals(value);
  for (const a of purchaseApprovals) {
    const ac = a.approvalCriteria || {};
    if (ac.overridesFromOutgoingApprovals !== true && ac.overridesFromOutgoingApprovals !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].overridesFromOutgoingApprovals`, message: `Purchase approval "${a.approvalId}" MUST have overridesFromOutgoingApprovals: true.` });
    }
    // Each purchase approval should have coin transfers
    if (!ac.coinTransfers || ac.coinTransfers.length === 0) {
      violations.push({ standard: std, field: `collectionApprovals[${a.approvalId}].coinTransfers`, message: `Purchase approval "${a.approvalId}" should have coinTransfers to the store address.` });
    }
  }

  return violations;
}

// ============================================================
// Prediction Market Validator
// ============================================================

function verifyPredictionMarket(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Prediction Market';
  const approvals = getApprovals(value);

  // Must have 2 token IDs (YES/NO)
  const tokenIds = value.validTokenIds;
  if (!Array.isArray(tokenIds) || tokenIds.length !== 1 || tokenIds[0]?.start !== 1n || tokenIds[0]?.end !== 2n) {
    violations.push({ standard: std, field: 'validTokenIds', message: 'Prediction market MUST have validTokenIds = [{ start: "1", end: "2" }] (YES + NO tokens).' });
  }

  // Should have a paired mint approval with scaling
  const pairedMint = approvals.find((a: any) => {
    const ib = a.approvalCriteria?.predeterminedBalances?.incrementedBalances;
    return a.fromListId === 'Mint' && (ib?.allowAmountScaling === true || ib?.allowAmountScaling === 'true');
  });
  if (!pairedMint) {
    violations.push({ standard: std, field: 'collectionApprovals', message: 'Prediction market MUST have a paired mint approval with allowAmountScaling: true for depositing.' });
  }

  // Should have settlement approvals with voting challenges
  const settlements = approvals.filter((a: any) => a.approvalCriteria?.votingChallenges?.length > 0);
  if (settlements.length === 0) {
    violations.push({ standard: std, field: 'collectionApprovals.votingChallenges', message: 'Prediction market MUST have settlement approvals with votingChallenges for the verifier to resolve outcomes.' });
  }

  // Should have 2 alias paths (YES/NO)
  const aliasPaths = value.aliasPathsToAdd || [];
  if (aliasPaths.length < 2) {
    violations.push({ standard: std, field: 'aliasPathsToAdd', message: 'Prediction market should have 2 alias paths (YES + NO tokens).' });
  }

  return violations;
}

// ============================================================
// Vault Validator
// ============================================================

function verifyVault(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Vault';
  const approvals = getApprovals(value);
  const invariants = getInvariants(value);

  // Must have cosmosCoinBackedPath
  if (!invariants.cosmosCoinBackedPath) {
    violations.push({ standard: std, field: 'invariants.cosmosCoinBackedPath', message: 'Vault collections MUST have a cosmosCoinBackedPath defining the IBC backing.' });
  }

  // Must have backing approvals
  const backingApprovals = approvals.filter((a: any) => a.approvalCriteria?.allowBackedMinting === true || a.approvalCriteria?.allowBackedMinting === 'true');
  if (backingApprovals.length === 0) {
    violations.push({ standard: std, field: 'collectionApprovals', message: 'Vault MUST have at least one approval with allowBackedMinting: true.' });
  }

  for (const ba of backingApprovals) {
    if (ba.approvalCriteria?.mustPrioritize !== true && ba.approvalCriteria?.mustPrioritize !== 'true') {
      violations.push({ standard: std, field: `collectionApprovals[${ba.approvalId}].mustPrioritize`, message: `Vault backing approval "${ba.approvalId}" MUST have mustPrioritize: true.` });
    }
  }

  return violations;
}

// ============================================================
// Standard → Validator Map
// ============================================================

const STANDARD_VALIDATORS: Record<string, (value: any) => StandardViolation[]> = {
  'Smart Token': verifySmartToken,
  Subscriptions: verifySubscription,
  'Fungible Tokens': verifyFungibleToken,
  NFTs: verifyNFTCollection,
  'Address List': verifyAddressList,
  'Custom-2FA': verifyCustom2FA,
  'Liquidity Pools': verifyLiquidityPools,
  'Credit Token': verifyCreditToken,
  Quests: verifyQuest,
  NFTMarketplace: verifyTradableNFT,
  'Non-Transferable': verifyNonTransferable,
  Bounty: verifyBounty,
  PaymentRequest: verifyPaymentRequest,
  Crowdfund: verifyCrowdfund,
  Auction: verifyAuction,
  Products: verifyProducts,
  'Prediction Market': verifyPredictionMarket,
  Vault: verifyVault
};

// Also match common alternative names
const STANDARD_ALIASES: Record<string, string> = {
  'Smart Token': 'Smart Token',
  'IBC Token Factory': 'Smart Token',
  Subscription: 'Subscriptions',
  Subscriptions: 'Subscriptions',
  'Fungible Token': 'Fungible Tokens',
  'Fungible Tokens': 'Fungible Tokens',
  NFT: 'NFTs',
  NFTs: 'NFTs',
  'NFT Collection': 'NFTs',
  'Address List': 'Address List',
  'Custom-2FA': 'Custom-2FA',
  'Liquidity Pools': 'Liquidity Pools',
  'Credit Token': 'Credit Token',
  Quests: 'Quests',
  Quest: 'Quests',
  NFTMarketplace: 'NFTMarketplace',
  Tradable: 'NFTMarketplace',
  'Non-Transferable': 'Non-Transferable',
  Bounty: 'Bounty',
  PaymentRequest: 'PaymentRequest',
  'Payment Request': 'PaymentRequest',
  Invoice: 'PaymentRequest',
  Crowdfund: 'Crowdfund',
  Auction: 'Auction',
  Products: 'Products',
  'Product Catalog': 'Products',
  'Prediction Market': 'Prediction Market',
  Vault: 'Vault'
};

// ============================================================
// Common: Approval Metadata
// ============================================================

function verifyApprovalMetadata(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const approvals = getApprovals(value);

  for (const a of approvals) {
    const id = a.approvalId || 'unnamed';
    // Approvals should have a URI set (placeholder or real) so they display properly in the frontend
    if (!a.uri && a.uri !== '') {
      // Missing entirely — not a blocker but note it
    }
    // More importantly: if collectionMetadata has placeholder URIs set, approvals should too
    // The frontend renders approval cards and needs metadata for each
    // Check: if the collection uses placeholder metadata pattern, approvals should match
    const collUri = value.collectionMetadata?.uri || '';
    const usesPlaceholders = collUri.startsWith('ipfs://METADATA_');
    if (usesPlaceholders && (!a.uri || a.uri === '') && !hasInlineCustomData(a)) {
      violations.push({
        standard: 'Common',
        field: `collectionApprovals[${id}].uri`,
        message: `Approval "${id}" has no metadata URI. All approvals should have a placeholder URI (e.g. "ipfs://METADATA_APPROVAL_${id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}") with corresponding metadata set via set_metadata_placeholders, OR carry inline JSON metadata in customData. The frontend renders approval cards and needs name/description for each.`,
        fix: `Set uri to a placeholder like "ipfs://METADATA_APPROVAL_${id.toUpperCase().replace(/[^A-Z0-9]/g, '_')}" and call set_metadata_placeholders with a descriptive name and description, or write {"name":"...","description":"..."} JSON into customData.`
      });
    }
  }

  return violations;
}

// ============================================================
// Common: Reserved Symbol Check
// ============================================================

const RESERVED_SYMBOLS = new Set([
  // Major tokens — these already exist on-chain and should not be reused
  'USDC',
  'usdc',
  'uusdc',
  'ATOM',
  'atom',
  'uatom',
  'OSMO',
  'osmo',
  'uosmo',
  'BADGE',
  'badge',
  'ubadge',
  'ETH',
  'eth',
  'wei',
  'BTC',
  'btc',
  'sat',
  'sats',
  'USDT',
  'usdt',
  'DAI',
  'dai',
  'WETH',
  'weth',
  'WBTC',
  'wbtc',
  'SOL',
  'sol',
  'DOT',
  'dot',
  'AVAX',
  'avax',
  'BNB',
  'bnb',
  'MATIC',
  'matic',
  'ARB',
  'arb',
  'OP',
  'op',
  'TIA',
  'tia',
  'utia',
  'STARS',
  'stars',
  'ustars',
  'JUNO',
  'juno',
  'ujuno',
  'EVMOS',
  'evmos',
  'aevmos',
  'INJ',
  'inj'
]);

function verifyReservedSymbols(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Common';

  // Check aliasPathsToAdd
  const aliasPaths = value.aliasPathsToAdd || [];
  for (let i = 0; i < aliasPaths.length; i++) {
    const ap = aliasPaths[i];
    // Check for invalid characters in denom/symbol (only a-zA-Z, _, {, }, - allowed)
    const VALID_DENOM_RE = /^[a-zA-Z_{}/-]+$/; // Note: / is invalid but IBC denoms have it
    const INVALID_DENOM_RE = /[^a-zA-Z0-9_{}/-]/; // any truly invalid chars
    if (ap.denom && ap.denom.includes('/')) {
      violations.push({
        standard: std,
        field: `aliasPathsToAdd[${i}].denom`,
        message: `Alias path denom "${ap.denom}" contains "/" which is not allowed. Do NOT use the raw IBC denom as the alias path denom — create a new unique symbol like "wuusdc" or "uwrapped".`,
        fix: `Change denom to a simple alphanumeric string like "wuusdc" (no "/" characters).`
      });
    }
    if (ap.symbol && ap.symbol.includes('/')) {
      violations.push({
        standard: std,
        field: `aliasPathsToAdd[${i}].symbol`,
        message: `Alias path symbol "${ap.symbol}" contains "/" which is not allowed. Create a new unique symbol.`,
        fix: `Change symbol to a simple alphanumeric string (no "/" characters).`
      });
    }
    if (ap.symbol && RESERVED_SYMBOLS.has(ap.symbol)) {
      violations.push({
        standard: std,
        field: `aliasPathsToAdd[${i}].symbol`,
        message: `Alias path symbol "${ap.symbol}" is a reserved/existing token symbol. New wrapped tokens must use a unique symbol (e.g. "w${ap.symbol}", "v${ap.symbol}", or a custom name) to avoid confusion with the underlying native token.`,
        fix: `Change the symbol to something unique like "w${ap.symbol}" or a custom name for this wrapped token.`
      });
    }
    // Also check denomUnits
    if (Array.isArray(ap.denomUnits)) {
      for (let j = 0; j < ap.denomUnits.length; j++) {
        const du = ap.denomUnits[j];
        if (du.symbol && RESERVED_SYMBOLS.has(du.symbol)) {
          violations.push({
            standard: std,
            field: `aliasPathsToAdd[${i}].denomUnits[${j}].symbol`,
            message: `Denom unit symbol "${du.symbol}" is a reserved/existing token symbol. Use a unique display symbol (e.g. "w${du.symbol}", "v${du.symbol}") for your new wrapped token.`,
            fix: `Change to a unique symbol like "w${du.symbol}" to distinguish from the native ${du.symbol} token.`
          });
        }
      }
    }
    // Check denom field too
    if (ap.denom && RESERVED_SYMBOLS.has(ap.denom)) {
      violations.push({
        standard: std,
        field: `aliasPathsToAdd[${i}].denom`,
        message: `Alias path denom "${ap.denom}" is a reserved token denom. Use a unique denom for the alias path (e.g. "w${ap.denom}").`,
        fix: `Change denom to a unique value like "w${ap.denom}".`
      });
    }
  }

  // Check cosmosCoinWrapperPathsToAdd
  const wrapperPaths = value.cosmosCoinWrapperPathsToAdd || [];
  for (let i = 0; i < wrapperPaths.length; i++) {
    const wp = wrapperPaths[i];
    if (wp.symbol && RESERVED_SYMBOLS.has(wp.symbol)) {
      violations.push({
        standard: std,
        field: `cosmosCoinWrapperPathsToAdd[${i}].symbol`,
        message: `Cosmos coin wrapper symbol "${wp.symbol}" is a reserved token symbol. Use a unique symbol for this wrapped token.`,
        fix: `Change to a unique symbol like "w${wp.symbol}".`
      });
    }
    if (wp.denom && RESERVED_SYMBOLS.has(wp.denom)) {
      violations.push({
        standard: std,
        field: `cosmosCoinWrapperPathsToAdd[${i}].denom`,
        message: `Cosmos coin wrapper denom "${wp.denom}" is a reserved token denom. Use a unique denom.`,
        fix: `Change to a unique denom like "w${wp.denom}".`
      });
    }
  }

  return violations;
}

// ============================================================
// Common: Metadata Quality
// ============================================================

const LAZY_METADATA_PATTERNS = [
  /^(collection|token|badge|nft|approval|metadata)\s*(name|#?\d*)?$/i,
  /^(name|title|description)\s*(here|placeholder|todo|tbd|tba|example)?$/i,
  /^(approval|transfer)\s*\d+$/i,
  /^my (token|collection|nft|badge)$/i,
  /^(test|sample|placeholder|default)\s*(token|collection|nft|badge|metadata)?$/i,
  /^(token|badge|nft)\s*#?\{?id\}?$/i // "Token #1", "NFT {id}", "Badge #id"
];

function isLazyMetadata(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const trimmed = text.trim();
  if (trimmed.length < 3) return true;
  return LAZY_METADATA_PATTERNS.some((p) => p.test(trimmed));
}

const BITBADGES_DEFAULT_IMAGE = 'ipfs://QmNTpizCkY5tcMpPMf1kkn7Y5YxFQo3oT54A9oKP5ijP9E';
const FAKE_IMAGE_PATTERNS = [
  /^ipfs:\/\/Qm(NonExistent|Placeholder|Example|Default|Test|TODO|TBD|XXXXX)/i,
  /^ipfs:\/\/baf(NonExistent|Placeholder|Example|Default|Test|TODO)/i,
  /^https?:\/\/(example\.com|placeholder|test)/i
];

function isFakeOrMissingImage(image: string | undefined): boolean {
  if (!image || image.trim() === '') return true;
  return FAKE_IMAGE_PATTERNS.some((p) => p.test(image));
}

/**
 * True if a PathMetadata.uri is missing, blank, or matches one of the
 * known fake/placeholder patterns. Empty `ipfs://METADATA_*` internal
 * placeholders from the template/session flow count as VALID here — they
 * intentionally mark "substitute this at deploy time" and are honoured by
 * the metadata auto-apply layer.
 */
function isFakeOrMissingUri(uri: string | undefined): boolean {
  if (!uri || uri.trim() === '') return true;
  // Internal placeholders emitted by buildAliasPath / session builders
  // are valid — they're substituted during the metadata auto-apply flow.
  if (/^ipfs:\/\/METADATA_[A-Z]/.test(uri)) return false;
  return FAKE_IMAGE_PATTERNS.some((p) => p.test(uri));
}

/**
 * True if a path metadata object is in the frontend "WithDetails" shape
 * — a nested `metadata.metadata` object with inline name / image /
 * description. The frontend stores this pre-upload; the metadata
 * auto-apply flow uploads the inline content to IPFS and populates the
 * `uri` field on submit. When in this state, the `uri` is intentionally
 * blank and "missing URI" violations are false positives.
 */
function isPreApplyMetadata(m: any): boolean {
  if (!m || typeof m !== 'object') return false;
  const inner = m.metadata;
  if (!inner || typeof inner !== 'object') return false;
  return Boolean(inner.name || inner.image || inner.description);
}

function verifyMetadataPlaceholders(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const std = 'Common';

  // Check tokenMetadata for lazy patterns in inline metadata
  if (Array.isArray(value.tokenMetadata)) {
    for (let i = 0; i < value.tokenMetadata.length; i++) {
      const tm = value.tokenMetadata[i];
      if (tm?.name && isLazyMetadata(tm.name)) {
        violations.push({
          standard: std,
          field: `tokenMetadata[${i}].name`,
          message: `Token metadata name "${tm.name}" looks like a placeholder. Every name must be specific and descriptive.`,
          fix: 'Replace with a real, descriptive name that explains what this token represents.'
        });
      }
      if (tm?.description && isLazyMetadata(tm.description)) {
        violations.push({
          standard: std,
          field: `tokenMetadata[${i}].description`,
          message: `Token metadata description "${tm.description}" looks like a placeholder. Every description must be meaningful (1-2 sentences).`,
          fix: 'Replace with a real description explaining what this token does and who can use it.'
        });
      }
    }
  }

  // Check approval names for lazy patterns
  const approvals = getApprovals(value);
  for (const a of approvals) {
    if (a.approvalId && isLazyMetadata(a.approvalId)) {
      violations.push({
        standard: std,
        field: `collectionApprovals[${a.approvalId}].approvalId`,
        message: `Approval ID "${a.approvalId}" looks like a placeholder. Approval IDs should be descriptive (e.g. "public-mint", "manager-transfer").`,
        fix: 'Use a descriptive, kebab-case approval ID that explains what this approval does.'
      });
    }
  }

  // Check alias path metadata — PathMetadata only has {uri, customData}. The
  // image lives inside the off-chain JSON referenced by `uri`. Every alias
  // path and every denomUnit MUST have a metadata.uri set (ideally a
  // placeholder like ipfs://METADATA_ALIAS_<denom> that gets substituted
  // post-build via the metadata auto-apply flow).
  const aliasPaths = value.aliasPathsToAdd || [];
  for (let i = 0; i < aliasPaths.length; i++) {
    const ap = aliasPaths[i];
    if (!ap.metadata) {
      violations.push({
        standard: std,
        field: `aliasPathsToAdd[${i}].metadata`,
        message: `Alias path "${ap.denom || i}" is missing PathMetadata entirely. All alias paths MUST have metadata: { uri, customData }.`,
        fix: `Add metadata: { uri: "ipfs://METADATA_ALIAS_${ap.denom || '<DENOM>'}", customData: "" } and upload the image inside the JSON at that URI via the auto-apply flow.`
      });
    } else if (
      isFakeOrMissingUri(ap.metadata?.uri) &&
      !isPreApplyMetadata(ap.metadata) &&
      !hasInlineCustomData(ap.metadata)
    ) {
      violations.push({
        standard: std,
        field: `aliasPathsToAdd[${i}].metadata.uri`,
        message: `Alias path "${ap.denom || i}" metadata.uri is missing or is a fake placeholder, and metadata.customData does not carry inline JSON metadata. The image must live inside the off-chain JSON at this URI (or inline in customData).`,
        fix: `Set metadata.uri to a placeholder like "ipfs://METADATA_ALIAS_${ap.denom || '<DENOM>'}" (the metadata auto-apply flow replaces this with a real upload), to a real uploaded URI directly, or stash {"name":"...","image":"...","description":"..."} JSON in metadata.customData.`
      });
    }
    if ('image' in (ap.metadata || {})) {
      violations.push({
        standard: std,
        field: `aliasPathsToAdd[${i}].metadata.image`,
        message: `aliasPathsToAdd[${i}].metadata.image is not a valid field. PathMetadata only has { uri, customData }. Put the image inside the off-chain JSON referenced by metadata.uri.`,
        fix: `Remove metadata.image and place the image field inside the JSON blob hosted at metadata.uri.`
      });
    }
    // Check denomUnit metadata — each denomUnit MUST have PathMetadata with uri
    if (Array.isArray(ap.denomUnits)) {
      for (let j = 0; j < ap.denomUnits.length; j++) {
        const du = ap.denomUnits[j];
        if (!du.metadata) {
          violations.push({
            standard: std,
            field: `aliasPathsToAdd[${i}].denomUnits[${j}].metadata`,
            message: `Denom unit "${du.symbol || j}" is missing PathMetadata entirely. All denomUnits MUST have metadata: { uri, customData }.`,
            fix: `Add metadata: { uri: "ipfs://METADATA_ALIAS_${ap.denom || '<DENOM>'}_UNIT", customData: "" }.`
          });
        } else if (
          isFakeOrMissingUri(du.metadata?.uri) &&
          !isPreApplyMetadata(du.metadata) &&
          !hasInlineCustomData(du.metadata)
        ) {
          violations.push({
            standard: std,
            field: `aliasPathsToAdd[${i}].denomUnits[${j}].metadata.uri`,
            message: `Denom unit "${du.symbol || j}" metadata.uri is missing or is a fake placeholder, and metadata.customData does not carry inline JSON metadata.`,
            fix: `Set metadata.uri to a placeholder like "ipfs://METADATA_ALIAS_${ap.denom || '<DENOM>'}_UNIT", to a real uploaded URI directly, or stash inline JSON metadata in metadata.customData.`
          });
        }
        if ('image' in (du.metadata || {})) {
          violations.push({
            standard: std,
            field: `aliasPathsToAdd[${i}].denomUnits[${j}].metadata.image`,
            message: `denomUnits[${j}].metadata.image is not a valid field. PathMetadata only has { uri, customData }. Put the image inside the off-chain JSON referenced by metadata.uri.`,
            fix: `Remove metadata.image and place the image field inside the JSON blob hosted at metadata.uri.`
          });
        }
      }
    }
  }

  // Check cosmos coin wrapper path metadata — same PathMetadata shape
  const wrapperPaths = value.cosmosCoinWrapperPathsToAdd || [];
  for (let i = 0; i < wrapperPaths.length; i++) {
    const wp = wrapperPaths[i];
    if (!wp.metadata) {
      violations.push({
        standard: std,
        field: `cosmosCoinWrapperPathsToAdd[${i}].metadata`,
        message: `Cosmos coin wrapper path is missing PathMetadata entirely. MUST have metadata: { uri, customData }.`,
        fix: `Add metadata: { uri: "ipfs://METADATA_WRAPPER_${wp.denom || '<DENOM>'}", customData: "" }.`
      });
    } else if (isFakeOrMissingUri(wp.metadata?.uri) && !hasInlineCustomData(wp.metadata)) {
      violations.push({
        standard: std,
        field: `cosmosCoinWrapperPathsToAdd[${i}].metadata.uri`,
        message: `Cosmos coin wrapper path metadata.uri is missing or is a fake placeholder, and metadata.customData does not carry inline JSON metadata.`,
        fix: `Set metadata.uri to a placeholder like "ipfs://METADATA_WRAPPER_${wp.denom || '<DENOM>'}", a real uploaded URI, or stash inline JSON metadata in metadata.customData.`
      });
    }
    if ('image' in (wp.metadata || {})) {
      violations.push({
        standard: std,
        field: `cosmosCoinWrapperPathsToAdd[${i}].metadata.image`,
        message: `cosmosCoinWrapperPathsToAdd[${i}].metadata.image is not a valid field. PathMetadata only has { uri, customData }.`,
        fix: `Remove metadata.image and place the image field inside the JSON blob hosted at metadata.uri.`
      });
    }
  }

  return violations;
}

// ============================================================
// Common: Approval Tracking Fields (approvalAmounts / maxNumTransfers)
// ============================================================

const TRACKING_REQUIRED_FIELDS: Record<string, string[]> = {
  approvalAmounts: [
    'overallApprovalAmount',
    'perToAddressApprovalAmount',
    'perFromAddressApprovalAmount',
    'perInitiatedByAddressApprovalAmount',
    'amountTrackerId',
    'resetTimeIntervals'
  ],
  maxNumTransfers: [
    'overallMaxNumTransfers',
    'perToAddressMaxNumTransfers',
    'perFromAddressMaxNumTransfers',
    'perInitiatedByAddressMaxNumTransfers',
    'amountTrackerId',
    'resetTimeIntervals'
  ]
};

function verifyApprovalTrackingFields(value: any): StandardViolation[] {
  const violations: StandardViolation[] = [];
  const approvals = value.collectionApprovals || [];

  for (const approval of approvals) {
    const criteria = approval.approvalCriteria;
    if (!criteria) continue;

    for (const [field, requiredKeys] of Object.entries(TRACKING_REQUIRED_FIELDS)) {
      const obj = criteria[field];
      if (!obj || typeof obj !== 'object') continue;

      const missing = requiredKeys.filter((k) => !(k in obj));
      if (missing.length > 0) {
        violations.push({
          standard: 'Common',
          field: `collectionApprovals[${approval.approvalId}].approvalCriteria.${field}`,
          message: `Incomplete ${field}: missing required fields [${missing.join(', ')}]. All fields must be present — use "0" for unused limits and {startTime: "0", intervalLength: "0"} for resetTimeIntervals.`
        });
      }

      // Check resetTimeIntervals sub-fields
      if (obj.resetTimeIntervals && typeof obj.resetTimeIntervals === 'object') {
        if (!('startTime' in obj.resetTimeIntervals) || !('intervalLength' in obj.resetTimeIntervals)) {
          violations.push({
            standard: 'Common',
            field: `collectionApprovals[${approval.approvalId}].approvalCriteria.${field}.resetTimeIntervals`,
            message: `resetTimeIntervals must have both "startTime" and "intervalLength" — use "0" for no time intervals.`
          });
        }
      }
    }
  }

  return violations;
}

// ============================================================
// Main Entry Point
// ============================================================

/**
 * Verify that a collection transaction satisfies all deterministic
 * requirements for its declared standards.
 *
 * Runs with 0 AI tokens — pure structural validation.
 *
 * @param transaction - The full transaction object (with messages array)
 * @param onChainCollection - Optional prior on-chain state. Required for
 *   accurate verification of update transactions — the chain ignores
 *   `defaultBalances` and `invariants` on MsgUpdateCollection, so those
 *   fields are absent from the tx body even though the checks below
 *   depend on them. When supplied, we splice the on-chain values onto
 *   the verification view so every downstream check runs against the
 *   full effective collection state.
 * @returns VerificationResult with violations and checked standards
 */
export function verifyStandardsCompliance(
  transaction: any,
  onChainCollection?: any
): VerificationResult {
  // normalizeForReview unwraps tx/msg wrappers, mirrors aliasPaths field
  // names, and converts all numeric fields to bigints via the Msg class's
  // registered .convert(BigIntify). Every downstream check here assumes
  // that normalized shape. Idempotent — safe to run on already-normalized
  // input (reviewCollection pipeline) or raw input (direct callers like
  // the builders test suite).
  const normalized = normalizeForReview(transaction);
  let value: any = normalized && typeof normalized === 'object' ? normalized : null;
  if (!value) {
    return {
      valid: false,
      violations: [{ standard: 'Common', field: 'messages', message: 'Transaction has no messages.' }],
      standardsChecked: []
    };
  }

  // For update transactions, overlay on-chain create-only fields onto
  // the verification view. If the caller didn't supply on-chain state,
  // the per-field checks already short-circuit via isUpdateTransaction()
  // so they don't fire spurious "missing default" errors — see
  // verifyCommonMintRules() and ses_1ps5eu91pxxa for the motivating case.
  if (isUpdateTransaction(value) && onChainCollection && typeof onChainCollection === 'object') {
    const chainValue =
      (onChainCollection as any)?.messages?.[0]?.value ||
      (onChainCollection as any)?.messages?.[0] ||
      onChainCollection;
    value = {
      ...value,
      defaultBalances: value.defaultBalances ?? chainValue?.defaultBalances,
      invariants: value.invariants ?? chainValue?.invariants
    };
  }

  const standards = getStandards(value);
  const violations: StandardViolation[] = [];
  const standardsChecked: string[] = [];

  // Always run common checks
  violations.push(...verifyCommonMintRules(value));
  violations.push(...verifyApprovalMetadata(value));
  violations.push(...verifyReservedSymbols(value));
  violations.push(...verifyMetadataPlaceholders(value));
  violations.push(...verifyApprovalTrackingFields(value));
  standardsChecked.push(
    'Common (mint rules)',
    'Common (approval metadata)',
    'Common (reserved symbols)',
    'Common (metadata quality)',
    'Common (approval tracking)'
  );

  // Run per-standard validators
  for (const std of standards) {
    const canonical = STANDARD_ALIASES[std];
    if (canonical && STANDARD_VALIDATORS[canonical]) {
      violations.push(...STANDARD_VALIDATORS[canonical](value));
      if (!standardsChecked.includes(canonical)) {
        standardsChecked.push(canonical);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    standardsChecked
  };
}

/**
 * Format verification results as a human-readable string for error display.
 */
export function formatVerificationResult(result: VerificationResult): string {
  if (result.valid) {
    return `Standards verification PASSED. Checked: ${result.standardsChecked.join(', ')}.`;
  }

  const lines: string[] = [];
  lines.push(`Standards verification FAILED — ${result.violations.length} violation(s) found.`);
  lines.push(`Standards checked: ${result.standardsChecked.join(', ')}.`);
  lines.push('');

  for (const v of result.violations) {
    lines.push(`[${v.standard}] ${v.field}: ${v.message}`);
    if (v.fix) {
      lines.push(`  Fix: ${v.fix}`);
    }
  }

  return lines.join('\n');
}
