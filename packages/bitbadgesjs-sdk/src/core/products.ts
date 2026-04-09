import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';
import type { iCollectionApproval, iUserOutgoingApproval } from '@/interfaces/types/approvals.js';
import { UintRangeArray } from './uintRanges.js';

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

export interface ProductValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details?: {
    productCount: number;
    hasBurnApproval: boolean;
  };
}

export const validateProductCatalogCollection = (collection: Readonly<iCollectionDoc<bigint>>): ProductValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: ProductValidationResult['details'] = { productCount: 0, hasBurnApproval: false };

  // 1. Standard
  if (!collection.standards?.includes('Products')) errors.push('Missing "Products" standard');

  // 2. validTokenIds starts at 1n
  const tokenIds = UintRangeArray.From(collection.validTokenIds).sortAndMerge().convert(BigInt);
  if (tokenIds.length === 0 || tokenIds[0].start !== 1n) {
    errors.push('validTokenIds must start at 1');
  }

  // 3. Invariants check
  const invariants = (collection as any).invariants;
  if (invariants && !invariants.noCustomOwnershipTimes) {
    warnings.push('invariants.noCustomOwnershipTimes should be true for product catalogs');
  }

  // 4. Validate each approval
  const approvals = collection.collectionApprovals;
  const purchaseApprovals = approvals.filter((a) => a.fromListId === 'Mint');
  const burnApprovals = approvals.filter((a) => a.fromListId !== 'Mint' && a.toListId === BURN_ADDRESS);

  details.productCount = purchaseApprovals.length;
  details.hasBurnApproval = burnApprovals.length > 0;

  if (purchaseApprovals.length === 0) {
    errors.push('No purchase approvals found (fromListId="Mint")');
  }

  for (let i = 0; i < purchaseApprovals.length; i++) {
    const a = purchaseApprovals[i];
    const prefix = `Purchase approval #${i + 1}`;
    const criteria = a.approvalCriteria;

    // toListId = "All" or burn address
    if (a.toListId !== 'All' && a.toListId !== BURN_ADDRESS) {
      errors.push(`${prefix}: toListId must be "All" or burn address`);
    }

    // initiatedByListId = "All"
    if (a.initiatedByListId !== 'All') {
      errors.push(`${prefix}: initiatedByListId must be "All"`);
    }

    // overrides
    if (!criteria?.overridesFromOutgoingApprovals) {
      errors.push(`${prefix}: overridesFromOutgoingApprovals must be true`);
    }
    if (!criteria?.overridesToIncomingApprovals) {
      errors.push(`${prefix}: overridesToIncomingApprovals must be true`);
    }

    // tokenIds targets exactly 1 token (start=end)
    const aTokenIds = UintRangeArray.From(a.tokenIds).sortAndMerge().convert(BigInt);
    if (aTokenIds.length !== 1 || aTokenIds.size() !== 1n) {
      errors.push(`${prefix}: tokenIds must target exactly 1 token (start=end)`);
    }

    // coinTransfers.length = 1 with non-zero amount
    if (!criteria?.coinTransfers || criteria.coinTransfers.length !== 1) {
      errors.push(`${prefix}: must have exactly 1 coinTransfer`);
    } else {
      const ct = criteria.coinTransfers[0];
      if (ct.coins.length !== 1) {
        errors.push(`${prefix}: coinTransfer must have exactly 1 coin`);
      } else if (ct.coins[0].amount <= 0n) {
        errors.push(`${prefix}: coinTransfer amount must be > 0`);
      }

      // NO overrideFromWithApproverAddress, NO overrideToWithInitiator
      if (ct.overrideFromWithApproverAddress) {
        errors.push(`${prefix}: coinTransfer must NOT use overrideFromWithApproverAddress`);
      }
      if (ct.overrideToWithInitiator) {
        errors.push(`${prefix}: coinTransfer must NOT use overrideToWithInitiator`);
      }
    }

    // predeterminedBalances with amount=1, useOverallNumTransfers=true
    const ib = criteria?.predeterminedBalances?.incrementedBalances;
    if (!ib) {
      errors.push(`${prefix}: must have predeterminedBalances.incrementedBalances`);
    } else {
      if (ib.startBalances.length !== 1 || ib.startBalances[0].amount !== 1n) {
        errors.push(`${prefix}: predeterminedBalances startBalances amount must be 1`);
      }
    }

    const maxNumTransfers = criteria?.maxNumTransfers;
    if (!maxNumTransfers) {
      errors.push(`${prefix}: must have maxNumTransfers set`);
    }

    // NO challenges (merkle, voting, dynamic store)
    if (criteria?.merkleChallenges?.length) {
      errors.push(`${prefix}: must NOT have merkleChallenges`);
    }
    if ((criteria as any)?.votingChallenges?.length) {
      errors.push(`${prefix}: must NOT have votingChallenges`);
    }
    if ((criteria as any)?.dynamicStoreChallenges?.length) {
      errors.push(`${prefix}: must NOT have dynamicStoreChallenges`);
    }
  }

  // 5. Optional burn approval validation
  for (let i = 0; i < burnApprovals.length; i++) {
    const a = burnApprovals[i];
    const prefix = `Burn approval #${i + 1}`;
    const criteria = a.approvalCriteria;

    if (criteria?.coinTransfers?.length) {
      errors.push(`${prefix}: burn approval must NOT have coinTransfers`);
    }
  }

  return { valid: errors.length === 0, errors, warnings, details };
};

/**
 * @deprecated Use doesCollectionFollowProductCatalogProtocol or validateProductCatalogCollection instead.
 * This legacy check only supports single-product collections (tokenIds 1-1).
 */
export const doesCollectionFollowProductProtocol = (collection?: Readonly<iCollectionDoc<bigint>>) => {
  if (!collection) {
    return false;
  }

  // Since we removed timelineTimes, we just check if the standard exists
  const found = collection.standards.includes('Products');

  if (!found) {
    return false;
  }

  // Assert valid token IDs are only 1n-1n
  const tokenIds = UintRangeArray.From(collection.validTokenIds).sortAndMerge().convert(BigInt);
  if (tokenIds.length !== 1 || tokenIds.size() !== 1n) {
    return false;
  }

  if (tokenIds[0].start !== 1n || tokenIds[0].end !== 1n) {
    return false;
  }

  return true;
};

/**
 * Comprehensive product catalog protocol check. Supports multi-product collections.
 */
export const doesCollectionFollowProductCatalogProtocol = (collection?: Readonly<iCollectionDoc<bigint>>): boolean => {
  if (!collection) return false;
  return validateProductCatalogCollection(collection).valid;
};

export const isProductApproval = (approval: iCollectionApproval<bigint>) => {
  const approvalCriteria = approval.approvalCriteria;
  if (!approvalCriteria?.coinTransfers) {
    return false;
  }

  if (approval.fromListId !== 'Mint') {
    return false;
  }

  for (const challenge of approvalCriteria.merkleChallenges ?? []) {
    if (challenge.maxUsesPerLeaf !== 1n) {
      return false;
    }

    if (challenge.useCreatorAddressAsLeaf) {
      return false;
    }
  }

  if (approvalCriteria.coinTransfers.length !== 1) {
    return false;
  }

  for (const coinTransfer of approvalCriteria.coinTransfers) {
    if (coinTransfer.coins.length !== 1) {
      return false;
    }

    if (coinTransfer.coins[0].denom !== 'ubadge') {
      return false;
    }

    if (coinTransfer.overrideFromWithApproverAddress || coinTransfer.overrideToWithInitiator) {
      return false;
    }
  }

  const incrementedBalances = approvalCriteria.predeterminedBalances?.incrementedBalances;
  if (!incrementedBalances) {
    return false;
  }

  if (incrementedBalances.allowAmountScaling) {
    return false;
  }

  if (incrementedBalances.startBalances.length !== 1) {
    return false;
  }

  const allTokenIds = UintRangeArray.From(incrementedBalances.startBalances[0].tokenIds).sortAndMerge().convert(BigInt);
  if (allTokenIds.length !== 1 || allTokenIds.size() !== 1n) {
    return false;
  }

  if (allTokenIds[0].start !== 1n || allTokenIds[0].end !== 1n) {
    return false;
  }

  const amount = incrementedBalances.startBalances[0].amount;
  if (amount !== 1n) {
    return false;
  }

  if (incrementedBalances.incrementTokenIdsBy !== 0n) {
    return false;
  }

  if (incrementedBalances.incrementOwnershipTimesBy !== 0n) {
    return false;
  }

  if (incrementedBalances.durationFromTimestamp !== 0n) {
    return false;
  }

  //Needs this to be true for the subscription faucet to work
  if (incrementedBalances.allowOverrideTimestamp) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.startTime !== 0n) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.intervalLength !== 0n) {
    return false;
  }

  if (incrementedBalances.recurringOwnershipTimes.chargePeriodLength !== 0n) {
    return false;
  }

  if (approvalCriteria.requireToEqualsInitiatedBy) {
    return false;
  }

  if (approvalCriteria.mustOwnTokens?.length) {
    return false;
  }

  return true;
};
