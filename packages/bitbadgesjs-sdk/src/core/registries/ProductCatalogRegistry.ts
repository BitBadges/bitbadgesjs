import { AddressList } from '../addressLists.js';
import { UintRangeArray } from '../uintRanges.js';
import { doesCollectionFollowProtocol } from '../quests.js';
import type { RequiredApprovalProps } from '../approval-utils.js';
import type { iUintRange } from '../../interfaces/types/core.js';
import crypto from 'crypto';

const FOREVER: iUintRange<bigint>[] = [{ start: 1n, end: BigInt('18446744073709551615') }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

/** Check if an approval is a product catalog purchase approval */
export function isProductCatalogPurchaseApproval(approval: any): boolean {
  if (approval.fromListId !== 'Mint') return false;
  if (!approval.approvalCriteria) return false;
  if (!approval.approvalCriteria.overridesFromOutgoingApprovals) return false;
  if (!approval.approvalCriteria.overridesToIncomingApprovals) return false;
  const ct = approval.approvalCriteria.coinTransfers;
  if (!ct || ct.length < 1) return false;
  if (!ct[0].to) return false;
  if (!ct[0].coins?.length) return false;
  return true;
}

/** Check if an approval is the burn approval */
function isBurnApproval(approval: any): boolean {
  return approval.fromListId === '!Mint' && approval.toListId === BURN_ADDRESS;
}

/**
 * Strict validation for the Product Catalog protocol.
 * Returns errors array for display. Empty = valid.
 */
export function validateProductCatalogCollection(collection: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!collection) {
    errors.push('Collection is missing or undefined');
    return { valid: false, errors };
  }

  // Standards
  if (!doesCollectionFollowProtocol(collection, 'Products')) {
    errors.push('Collection standards must include "Products"');
  }

  // Valid token IDs — must start at 1 and be contiguous
  const tokenIds = UintRangeArray.From(collection.validTokenIds ?? []).sortAndMerge().convert(BigInt);
  if (tokenIds.length < 1) {
    errors.push('Must have at least one valid token ID');
  } else if (tokenIds[0]?.start !== 1n) {
    errors.push('Token IDs must start at 1');
  }

  // Invariants
  if (collection.invariants?.noCustomOwnershipTimes !== true) {
    errors.push('noCustomOwnershipTimes must be true');
  }

  // Approvals
  const approvals = collection.collectionApprovals ?? [];
  const purchaseApprovals = approvals.filter(isProductCatalogPurchaseApproval);
  const burnApprovals = approvals.filter(isBurnApproval);
  const unknownApprovals = approvals.filter((a: any) => !isProductCatalogPurchaseApproval(a) && !isBurnApproval(a));

  if (purchaseApprovals.length < 1) {
    errors.push('Must have at least one purchase approval (fromListId="Mint" with coinTransfers)');
  }

  if (unknownApprovals.length > 0) {
    errors.push(`Found ${unknownApprovals.length} unrecognized approval(s) — all approvals must be purchase or burn approvals`);
  }

  // Validate each purchase approval strictly
  for (let i = 0; i < purchaseApprovals.length; i++) {
    const a = purchaseApprovals[i];
    const prefix = `Purchase approval #${i + 1}`;
    const criteria = a.approvalCriteria;

    // fromListId
    if (a.fromListId !== 'Mint') errors.push(`${prefix}: fromListId must be "Mint"`);

    // toListId — must be "All" or burn address
    if (a.toListId !== 'All' && a.toListId !== BURN_ADDRESS) {
      errors.push(`${prefix}: toListId must be "All" or burn address`);
    }

    // initiatedByListId
    if (a.initiatedByListId !== 'All') errors.push(`${prefix}: initiatedByListId must be "All"`);

    // overrides
    if (!criteria?.overridesFromOutgoingApprovals) errors.push(`${prefix}: overridesFromOutgoingApprovals must be true`);
    if (!criteria?.overridesToIncomingApprovals) errors.push(`${prefix}: overridesToIncomingApprovals must be true`);

    // tokenIds — must be a single token ID
    const tIds = a.tokenIds ?? [];
    if (tIds.length !== 1 || BigInt(tIds[0]?.start ?? 0) !== BigInt(tIds[0]?.end ?? 0)) {
      errors.push(`${prefix}: must target exactly one token ID`);
    }

    // coinTransfers — exactly 1 with a to address and coins
    const ct = criteria?.coinTransfers ?? [];
    if (ct.length !== 1) {
      errors.push(`${prefix}: must have exactly 1 coinTransfer`);
    } else {
      if (!ct[0].to) errors.push(`${prefix}: coinTransfer must have a "to" (payment) address`);
      if (!ct[0].coins?.length || BigInt(ct[0].coins[0]?.amount ?? 0) <= 0n) {
        errors.push(`${prefix}: coinTransfer must have a non-zero payment amount`);
      }
    }

    // predeterminedBalances — must use useOverallNumTransfers with startBalance amount=1
    const pb = criteria?.predeterminedBalances;
    if (!pb?.orderCalculationMethod?.useOverallNumTransfers) {
      errors.push(`${prefix}: must use useOverallNumTransfers for predetermined balances`);
    }
    const startBal = pb?.incrementedBalances?.startBalances?.[0];
    if (!startBal || BigInt(startBal.amount ?? 0) !== 1n) {
      errors.push(`${prefix}: startBalances must mint exactly 1 token per purchase`);
    }

    // No voting, merkle, mustOwnTokens, etc.
    if (criteria?.merkleChallenges?.length) errors.push(`${prefix}: merkleChallenges must be empty`);
    if (criteria?.mustOwnTokens?.length) errors.push(`${prefix}: mustOwnTokens must be empty`);
    if (criteria?.votingChallenges?.length) errors.push(`${prefix}: votingChallenges must be empty`);
    if (criteria?.dynamicStoreChallenges?.length) errors.push(`${prefix}: dynamicStoreChallenges must be empty`);
  }

  // Validate burn approval (at most 1)
  if (burnApprovals.length > 1) {
    errors.push('Must have at most 1 burn approval');
  }
  for (const ba of burnApprovals) {
    if (ba.fromListId !== '!Mint') errors.push('Burn approval: fromListId must be "!Mint"');
    if (ba.toListId !== BURN_ADDRESS) errors.push('Burn approval: toListId must be burn address');
    if (ba.initiatedByListId !== 'All') errors.push('Burn approval: initiatedByListId must be "All"');
    if (!ba.approvalCriteria?.overridesFromOutgoingApprovals) errors.push('Burn approval: overridesFromOutgoingApprovals must be true');
    if (!ba.approvalCriteria?.overridesToIncomingApprovals) errors.push('Burn approval: overridesToIncomingApprovals must be true');
    if (ba.approvalCriteria?.coinTransfers?.length) errors.push('Burn approval: must have no coinTransfers');
  }

  return { valid: errors.length === 0, errors };
}

/** Simple boolean check */
export function doesCollectionFollowProductCatalogProtocol(collection: any): boolean {
  return validateProductCatalogCollection(collection).valid;
}

export interface ProductItem {
  tokenId: bigint;
  storeAddress: string;
  priceDenom: string;
  priceAmount: bigint;
  maxSupply: bigint; // 0 = unlimited
  burnOnPurchase: boolean; // true = token burns on purchase, false = user keeps it
  name?: string;
  description?: string;
}

export interface ProductCatalogParams {
  storeAddress: string;
  priceDenom: string;
  priceAmount: bigint;
  maxSupply: bigint; // 0 for unlimited
}

const defaultChecks = { mustBeEvmContract: false, mustNotBeEvmContract: false, mustBeLiquidityPool: false, mustNotBeLiquidityPool: false };
const zeroResetIntervals = { startTime: 0n, intervalLength: 0n };

function defaultApprovalAmounts(trackerId: string) {
  return {
    overallApprovalAmount: 0n,
    perFromAddressApprovalAmount: 0n,
    perToAddressApprovalAmount: 0n,
    perInitiatedByAddressApprovalAmount: 0n,
    amountTrackerId: trackerId,
    resetTimeIntervals: zeroResetIntervals
  };
}

/** Mint 1x the given token ID to buyer */
function mintToUserBalances(tokenId: bigint) {
  const tokenRange: iUintRange<bigint>[] = [{ start: tokenId, end: tokenId }];
  return {
    manualBalances: [],
    orderCalculationMethod: {
      useOverallNumTransfers: true,
      usePerToAddressNumTransfers: false,
      usePerFromAddressNumTransfers: false,
      usePerInitiatedByAddressNumTransfers: false,
      useMerkleChallengeLeafIndex: false,
      challengeTrackerId: ''
    },
    incrementedBalances: {
      startBalances: [{ amount: 1n, tokenIds: tokenRange, ownershipTimes: UintRangeArray.FullRanges() }],
      incrementTokenIdsBy: 0n,
      incrementOwnershipTimesBy: 0n,
      durationFromTimestamp: 0n,
      allowOverrideTimestamp: false,
      allowOverrideWithAnyValidToken: false,
      allowAmountScaling: false,
      maxScalingMultiplier: 0n,
      recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
    }
  };
}

const emptyPredeterminedBalances = {
  manualBalances: [],
  orderCalculationMethod: {
    useOverallNumTransfers: false, usePerToAddressNumTransfers: false, usePerFromAddressNumTransfers: false,
    usePerInitiatedByAddressNumTransfers: false, useMerkleChallengeLeafIndex: false, challengeTrackerId: ''
  },
  incrementedBalances: {
    startBalances: [], incrementTokenIdsBy: 0n, incrementOwnershipTimesBy: 0n, durationFromTimestamp: 0n,
    allowOverrideTimestamp: false, allowOverrideWithAnyValidToken: false, allowAmountScaling: false, maxScalingMultiplier: 0n,
    recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
  }
};
const defaultAutoDeletion = { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false };
const defaultAltTimeChecks = { offlineHours: [], offlineDays: [] };
const defaultRoyalties = { percentage: 0n, payoutAddress: '' };
const emptyArrayFields = {
  merkleChallenges: [] as any[],
  mustOwnTokens: [] as any[],
  dynamicStoreChallenges: [] as any[],
  ethSignatureChallenges: [] as any[],
  evmQueryChallenges: [] as any[]
};

export class ProductCatalogRegistry {
  /** Purchase approval for a single product item */
  static purchaseApproval(item: ProductItem, approvalId?: string): RequiredApprovalProps {
    const id = approvalId ?? crypto.randomBytes(16).toString('hex');
    const tokenRange: iUintRange<bigint>[] = [{ start: item.tokenId, end: item.tokenId }];
    return {
      details: { name: item.name || 'Purchase', description: item.description || '', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: item.burnOnPurchase ? AddressList.Reserved(BURN_ADDRESS) : AddressList.AllAddresses(),
      toListId: item.burnOnPurchase ? BURN_ADDRESS : 'All',
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: FOREVER,
      tokenIds: tokenRange,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `product-purchase-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [
          {
            to: item.storeAddress,
            overrideFromWithApproverAddress: false,
            overrideToWithInitiator: false,
            coins: [{ denom: item.priceDenom, amount: item.priceAmount }]
          }
        ],
        predeterminedBalances: mintToUserBalances(item.tokenId),
        maxNumTransfers: {
          overallMaxNumTransfers: item.maxSupply,
          perToAddressMaxNumTransfers: 0n,
          perFromAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n,
          amountTrackerId: id,
          resetTimeIntervals: zeroResetIntervals
        },
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: defaultAutoDeletion,
        altTimeChecks: defaultAltTimeChecks,
        userApprovalSettings: { userRoyalties: defaultRoyalties },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Burn: anyone can burn any product token to the burn address */
  static burnApproval(numProducts: number): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Burn', description: 'Burn product token', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('!Mint'),
      fromListId: '!Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: FOREVER,
      tokenIds: [{ start: 1n, end: BigInt(numProducts) }],
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `product-burn-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [],
        predeterminedBalances: emptyPredeterminedBalances,
        maxNumTransfers: {
          overallMaxNumTransfers: 0n,
          perToAddressMaxNumTransfers: 0n,
          perFromAddressMaxNumTransfers: 0n,
          perInitiatedByAddressMaxNumTransfers: 0n,
          amountTrackerId: id,
          resetTimeIntervals: zeroResetIntervals
        },
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        votingChallenges: [],
        evmQueryChallenges: [],
        requireToEqualsInitiatedBy: false,
        requireFromEqualsInitiatedBy: false,
        requireToDoesNotEqualInitiatedBy: false,
        requireFromDoesNotEqualInitiatedBy: false,
        autoDeletionOptions: defaultAutoDeletion,
        altTimeChecks: defaultAltTimeChecks,
        userApprovalSettings: { userRoyalties: defaultRoyalties },
        mustPrioritize: false,
        allowBackedMinting: false,
        allowSpecialWrapping: false
      }
    };
  }

  /** Build all approvals: purchase approvals + burn approval */
  static allApprovals(items: ProductItem[]): RequiredApprovalProps[] {
    if (items.length === 0) return [];
    return [...items.map((item) => this.purchaseApproval(item)), this.burnApproval(items.length)];
  }

  /** Fully frozen permissions — nothing can change after creation */
  static frozenPermissions() {
    const frozen = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const frozenTokens = [{ tokenIds: FOREVER, permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const allList = AddressList.AllAddresses();
    const frozenApprovals = [
      {
        approvalId: 'All',
        fromListId: 'All',
        fromList: allList,
        toListId: 'All',
        toList: allList,
        initiatedByListId: 'All',
        initiatedByList: allList,
        transferTimes: FOREVER,
        tokenIds: FOREVER,
        ownershipTimes: FOREVER,
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: FOREVER
      }
    ];

    return {
      canDeleteCollection: frozen,
      canArchiveCollection: frozen,
      canUpdateStandards: frozen,
      canUpdateCustomData: frozen,
      canUpdateManager: frozen,
      canUpdateCollectionMetadata: frozen,
      canUpdateValidTokenIds: frozenTokens,
      canUpdateTokenMetadata: frozenTokens,
      canUpdateCollectionApprovals: frozenApprovals,
      canAddMoreAliasPaths: frozen,
      canAddMoreCosmosCoinWrapperPaths: frozen
    };
  }
}
