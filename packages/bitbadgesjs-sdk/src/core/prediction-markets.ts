import type { iCollectionApproval } from '../interfaces/types/approvals.js';

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const MAX_UINT64 = '18446744073709551615';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Coerce any numeric-like value to string for comparison. */
function n(val: any): string {
  if (val === undefined || val === null) return '0';
  return val.toString();
}

/** Check if a UintRange array is exactly [{start: s, end: e}]. */
function isExactRange(arr: any[] | undefined, start: string, end: string): boolean {
  if (!Array.isArray(arr) || arr.length !== 1) return false;
  return n(arr[0].start) === start && n(arr[0].end) === end;
}

/** Check if permanentlyForbiddenTimes covers the full uint64 range. */
function isFrozen(permArr: any[] | undefined): boolean {
  if (!Array.isArray(permArr) || permArr.length === 0) return false;
  return permArr.some(
    (p: any) =>
      Array.isArray(p.permanentlyForbiddenTimes) &&
      p.permanentlyForbiddenTimes.some((t: any) => n(t.start) === '1' && n(t.end) === MAX_UINT64)
  );
}

/**
 * Extract the deposit denom from a prediction market collection's mint approval.
 * Returns the denom string (e.g., 'ubadge', 'ibc/F082B65...') or undefined if not found.
 */
export function getDepositDenom(collection: any): string | undefined {
  const approvals: any[] = collection?.collectionApprovals ?? [];
  const mintApproval = approvals.find((a: any) => a.fromListId === 'Mint');
  return mintApproval?.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom?.toString();
}

/**
 * Classification result for a settlement-shaped approval (single token-id
 * start balance + voting challenge + burn target). Used to disambiguate
 * "wins" approvals from "push" approvals without needing an explicit role
 * field on the approval.
 *
 * - 'wins-yes' / 'wins-no' — payout amount equals start balance (1:1)
 * - 'push'                 — payout amount equals exactly half the start
 *                            balance (push burns 2x tokens for 1x payout)
 * - 'ambiguous'            — payout matches NEITHER the wins nor the push
 *                            ratio cleanly, OR matches both at once (only
 *                            possible when the start balance is 0). The
 *                            validator surfaces this as a warning so the
 *                            user can fix the payout amount or otherwise
 *                            disambiguate the approval.
 * - 'unknown'              — not a recognizable settlement-shaped approval
 */
export type SettlementApprovalClassification = 'wins-yes' | 'wins-no' | 'push' | 'ambiguous' | 'unknown';

/**
 * Classify a settlement-shaped approval based on its coin transfer payout
 * vs its start balance amount. The token id targeted by the start balance
 * decides whether a "wins" classification is YES or NO.
 *
 * Pure heuristic — does not look at the broader collection. Callers should
 * already have filtered to approvals that look like settlement approvals
 * (burn target, single start balance, voting challenge present).
 */
export function classifySettlementApproval(approval: any): SettlementApprovalClassification {
  const criteria = approval?.approvalCriteria;
  const startBalances = criteria?.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  if (startBalances.length !== 1) return 'unknown';
  const startBalance = startBalances[0];
  const startBalanceAmount = BigInt(n(startBalance?.amount));
  const coinTransfer = criteria?.coinTransfers?.[0];
  if (!coinTransfer) return 'unknown';
  const coinAmount = BigInt(n(coinTransfer?.coins?.[0]?.amount));

  // Token id determines wins-yes vs wins-no
  const tokenIds = startBalance?.tokenIds;
  let winsLabel: 'wins-yes' | 'wins-no' | null = null;
  if (isExactRange(tokenIds, '1', '1')) winsLabel = 'wins-yes';
  else if (isExactRange(tokenIds, '2', '2')) winsLabel = 'wins-no';
  else return 'unknown';

  // Edge case: a 0 start balance makes "wins" (== startBalance) and "push"
  // (== startBalance / 2) collapse to the same value (0). We can't tell
  // them apart, so flag as ambiguous instead of silently picking one.
  if (startBalanceAmount === 0n) {
    return 'ambiguous';
  }

  const winsMatches = coinAmount === startBalanceAmount;
  const pushMatches = coinAmount < startBalanceAmount && coinAmount === startBalanceAmount / 2n;

  if (winsMatches && pushMatches) {
    // Should never happen with a non-zero start balance, but guard anyway.
    return 'ambiguous';
  }
  if (winsMatches) return winsLabel;
  if (pushMatches) return 'push';
  return 'ambiguous';
}

/**
 * Determine if an approval is a "push" variant. Thin wrapper around
 * {@link classifySettlementApproval} preserved for backwards compatibility
 * with the existing finder-based validation logic.
 */
function isApprovalPush(approval: any): boolean {
  return classifySettlementApproval(approval) === 'push';
}

// ---------------------------------------------------------------------------
// isPredictionMarketIntentApproval
// ---------------------------------------------------------------------------

/**
 * Detect prediction market intents (1 coinTransfer + predeterminedBalances for badge tokens).
 * Used for both outgoing (sell) and incoming (buy) approvals on prediction market collections.
 */
export const isPredictionMarketIntentApproval = (approval: iCollectionApproval<bigint>): boolean => {
  if (approval.initiatedByListId !== 'All') return false;
  if (approval.transferTimes.length !== 1) return false;

  // Exactly 1 coinTransfer (the payment side)
  const coinTransfers = approval.approvalCriteria?.coinTransfers ?? [];
  if (coinTransfers.length !== 1) return false;
  const ctAmount = BigInt(coinTransfers[0].coins?.[0]?.amount?.toString() ?? '0');
  if (ctAmount === 0n) return false;

  // Reject same-collection badgeslp coinTransfers (chain rejects these)
  const ctDenom = coinTransfers[0].coins?.[0]?.denom?.toString() ?? '';
  if (ctDenom.startsWith('badgeslp:')) return false;

  // Must have predeterminedBalances with actual token amounts
  const pb = approval.approvalCriteria?.predeterminedBalances;
  if (!pb?.incrementedBalances?.startBalances?.length) return false;
  const startBal = pb.incrementedBalances.startBalances[0];
  if (!startBal || BigInt(startBal.amount?.toString() ?? '0') === 0n) return false;
  if (!pb.orderCalculationMethod?.useOverallNumTransfers) return false;

  // Token IDs must be exactly 1 (YES) or 2 (NO)
  if (approval.tokenIds.length !== 1) return false;
  const tokenStart = BigInt(approval.tokenIds[0].start?.toString() ?? '0');
  const tokenEnd = BigInt(approval.tokenIds[0].end?.toString() ?? '0');
  if (tokenStart !== tokenEnd) return false;
  if (tokenStart !== 1n && tokenStart !== 2n) return false;

  // Must be all-or-nothing
  const maxTransfers = BigInt(approval.approvalCriteria?.maxNumTransfers?.overallMaxNumTransfers?.toString() ?? '0');
  if (maxTransfers !== 1n) return false;

  return true;
};

// ---------------------------------------------------------------------------
// Individual approval validators
// ---------------------------------------------------------------------------

function validateMintApproval(
  approval: any,
  errors: string[]
): {
  depositDenom?: string;
  depositAmount?: string;
  depositTo?: string;
} {
  const prefix = 'Paired mint approval';
  const result: { depositDenom?: string; depositAmount?: string; depositTo?: string } = {};

  if (approval.fromListId !== 'Mint') {
    errors.push(`${prefix}: fromListId must be "Mint", got "${approval.fromListId}"`);
  }
  if (approval.toListId !== 'All') {
    errors.push(`${prefix}: toListId must be "All", got "${approval.toListId}"`);
  }

  const criteria = approval.approvalCriteria;
  if (!criteria) {
    errors.push(`${prefix}: missing approvalCriteria`);
    return result;
  }

  const coinTransfers = criteria.coinTransfers ?? [];
  if (coinTransfers.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 coin transfer, got ${coinTransfers.length}`);
  } else {
    const ct = coinTransfers[0];
    if (ct.overrideFromWithApproverAddress !== false) {
      errors.push(`${prefix}: coin transfer overrideFromWithApproverAddress must be false`);
    }
    if (ct.overrideToWithInitiator === true) {
      errors.push(`${prefix}: coin transfer overrideToWithInitiator should not be true`);
    }
    if (!ct.to || ct.to.trim() === '') {
      errors.push(`${prefix}: coin transfer "to" must be "Mint" (auto-resolves to mintEscrowAddress) or a valid address, got empty`);
    }
    result.depositTo = ct.to;
    if (ct.coins?.length === 1) {
      result.depositDenom = ct.coins[0].denom;
      result.depositAmount = n(ct.coins[0].amount);
    }
  }

  // Predetermined balances — must cover both YES (token 1) and NO (token 2)
  const startBalances = criteria.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  const coversYes = startBalances.some((b: any) => isExactRange(b.tokenIds, '1', '1') || isExactRange(b.tokenIds, '1', '2'));
  const coversNo = startBalances.some((b: any) => isExactRange(b.tokenIds, '2', '2') || isExactRange(b.tokenIds, '1', '2'));
  if (!coversYes || !coversNo) {
    errors.push(`${prefix}: startBalances must cover both YES (token 1) and NO (token 2)`);
  }

  if (n(criteria.maxNumTransfers?.overallMaxNumTransfers) !== '0') {
    errors.push(`${prefix}: overallMaxNumTransfers should be 0 (unlimited) for minting`);
  }

  return result;
}

function validateRedeemApproval(approval: any, errors: string[]): void {
  const prefix = 'Pre-settlement redeem approval';

  if (approval.fromListId !== '!Mint') {
    errors.push(`${prefix}: fromListId must be "!Mint", got "${approval.fromListId}"`);
  }
  if (approval.toListId !== BURN_ADDRESS) {
    errors.push(`${prefix}: toListId must be the burn address, got "${approval.toListId}"`);
  }

  const criteria = approval.approvalCriteria;
  if (!criteria) {
    errors.push(`${prefix}: missing approvalCriteria`);
    return;
  }

  const coinTransfers = criteria.coinTransfers ?? [];
  if (coinTransfers.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 coin transfer, got ${coinTransfers.length}`);
  } else {
    const ct = coinTransfers[0];
    if (ct.overrideFromWithApproverAddress !== true) {
      errors.push(`${prefix}: coin transfer overrideFromWithApproverAddress must be true`);
    }
    if (ct.overrideToWithInitiator !== true) {
      errors.push(`${prefix}: coin transfer overrideToWithInitiator must be true`);
    }
  }

  const startBalances = criteria.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  const coversYes = startBalances.some((b: any) => isExactRange(b.tokenIds, '1', '1') || isExactRange(b.tokenIds, '1', '2'));
  const coversNo = startBalances.some((b: any) => isExactRange(b.tokenIds, '2', '2') || isExactRange(b.tokenIds, '1', '2'));
  if (!coversYes || !coversNo) {
    errors.push(`${prefix}: startBalances must cover both YES (token 1) and NO (token 2)`);
  }

  if (n(criteria.maxNumTransfers?.overallMaxNumTransfers) === '0') {
    errors.push(`${prefix}: overallMaxNumTransfers must be > 0 when using overrideFromWithApproverAddress`);
  }
}

function validateSettlementApproval(
  approval: any,
  label: string,
  expectedTokenStart: string,
  expectedTokenEnd: string,
  isPush: boolean,
  depositAmount: string | undefined,
  errors: string[],
  warnings: string[]
): { verifierAddress?: string } {
  const prefix = `${label} approval`;
  const result: { verifierAddress?: string } = {};

  if (approval.fromListId !== '!Mint') {
    errors.push(`${prefix}: fromListId must be "!Mint", got "${approval.fromListId}"`);
  }
  if (approval.toListId !== BURN_ADDRESS) {
    errors.push(`${prefix}: toListId must be the burn address, got "${approval.toListId}"`);
  }

  const criteria = approval.approvalCriteria;
  if (!criteria) {
    errors.push(`${prefix}: missing approvalCriteria`);
    return result;
  }

  const coinTransfers = criteria.coinTransfers ?? [];
  if (coinTransfers.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 coin transfer, got ${coinTransfers.length}`);
  } else {
    const ct = coinTransfers[0];
    if (ct.overrideFromWithApproverAddress !== true) {
      errors.push(`${prefix}: coin transfer overrideFromWithApproverAddress must be true`);
    }
    if (ct.overrideToWithInitiator !== true) {
      errors.push(`${prefix}: coin transfer overrideToWithInitiator must be true`);
    }

    if (isPush && depositAmount) {
      // Push uses 2:1 ratio: burn 2x base tokens, receive 1x base payout (avoids fractional micro-units)
      const expectedPayout = BigInt(depositAmount).toString();
      const actualPayout = n(ct.coins?.[0]?.amount);
      if (actualPayout !== expectedPayout) {
        warnings.push(`${prefix}: expected payout amount ${expectedPayout} (deposit base), got ${actualPayout}`);
      }
    }
  }

  const startBalances = criteria.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  if (startBalances.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 start balance, got ${startBalances.length}`);
  } else {
    if (!isExactRange(startBalances[0].tokenIds, expectedTokenStart, expectedTokenEnd)) {
      errors.push(`${prefix}: start balance must target token ID ${expectedTokenStart}`);
    }
  }

  if (n(criteria.maxNumTransfers?.overallMaxNumTransfers) === '0') {
    errors.push(`${prefix}: overallMaxNumTransfers must be > 0 when using overrideFromWithApproverAddress`);
  }

  const votingChallenges = criteria.votingChallenges ?? [];
  if (votingChallenges.length === 0) {
    errors.push(`${prefix}: must have at least 1 voting challenge for settlement gating`);
  } else {
    const voters = votingChallenges[0].voters ?? [];
    if (voters.length === 0) {
      errors.push(`${prefix}: voting challenge must have at least 1 voter (the verifier)`);
    } else {
      result.verifierAddress = voters[0].address;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// validatePredictionMarketCollection
// ---------------------------------------------------------------------------

export interface PredictionMarketValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    depositDenom?: string;
    depositAmount?: string;
    verifierAddress?: string;
    hasMintApproval: boolean;
    hasRedeemApproval: boolean;
    hasYesWinsApproval: boolean;
    hasNoWinsApproval: boolean;
    hasPushYesApproval: boolean;
    hasPushNoApproval: boolean;
  };
}

/**
 * Strict structural validation for prediction market collections.
 *
 * Validates every field that matters for correctness and safety:
 * - Standards include "Prediction Market"
 * - Valid token IDs are exactly [{start: 1, end: 2}]
 * - 2 alias paths (uyes, uno) with correct decimals and conversions
 * - All permissions are frozen
 * - 7 approvals: mint, redeem, YES wins, NO wins, push YES, push NO, transferable
 * - Cross-approval consistency (same denom, correct payout amounts)
 */
export function validatePredictionMarketCollection(collection: any): PredictionMarketValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: PredictionMarketValidationResult['details'] = {
    hasMintApproval: false,
    hasRedeemApproval: false,
    hasYesWinsApproval: false,
    hasNoWinsApproval: false,
    hasPushYesApproval: false,
    hasPushNoApproval: false
  };

  if (!collection) {
    errors.push('Collection is missing or undefined');
    return { valid: false, errors, warnings, details };
  }

  // 1. Standards
  const standards: string[] = collection.standards ?? [];
  if (!standards.includes('Prediction Market')) {
    errors.push('Collection standards must include "Prediction Market"');
  }

  // 2. Valid token IDs
  const validTokenIds = collection.validTokenIds ?? [];
  if (!isExactRange(validTokenIds, '1', '2')) {
    errors.push('Valid token IDs must be exactly [{start: 1, end: 2}] (only token IDs 1 and 2)');
  }

  if (collection.invariants?.disablePoolCreation === true) {
    errors.push('disablePoolCreation must be false — prediction markets require a YES/NO liquidity pool for trading.');
  }

  // 3. Alias paths
  const aliasPaths = collection.aliasPaths ?? [];
  if (aliasPaths.length !== 2) {
    errors.push(`Must have exactly 2 alias paths (YES and NO), got ${aliasPaths.length}`);
  } else {
    const uyesPath = aliasPaths.find((p: any) => p.denom === 'uyes');
    const unoPath = aliasPaths.find((p: any) => p.denom === 'uno');

    if (!uyesPath) {
      errors.push('Missing alias path with denom "uyes" for YES tokens');
    } else {
      const denomUnits = uyesPath.denomUnits ?? [];
      if (denomUnits.length === 0) {
        errors.push('YES alias path (uyes) must have at least one denomUnit');
      } else {
        const decimals = n(denomUnits[0].decimals);
        if (decimals !== '6') {
          warnings.push(`YES alias path (uyes) denomUnit decimals should be 6, got ${decimals}`);
        }
      }
      const sideB = uyesPath.conversion?.sideB ?? [];
      if (sideB.length === 0 || !isExactRange(sideB[0].tokenIds, '1', '1')) {
        errors.push('YES alias path (uyes) conversion must target token ID 1');
      }
    }

    if (!unoPath) {
      errors.push('Missing alias path with denom "uno" for NO tokens');
    } else {
      const denomUnits = unoPath.denomUnits ?? [];
      if (denomUnits.length === 0) {
        errors.push('NO alias path (uno) must have at least one denomUnit');
      } else {
        const decimals = n(denomUnits[0].decimals);
        if (decimals !== '6') {
          warnings.push(`NO alias path (uno) denomUnit decimals should be 6, got ${decimals}`);
        }
      }
      const sideB = unoPath.conversion?.sideB ?? [];
      if (sideB.length === 0 || !isExactRange(sideB[0].tokenIds, '2', '2')) {
        errors.push('NO alias path (uno) conversion must target token ID 2');
      }
    }
  }

  // 4. Permissions — all should be frozen
  const perms = collection.collectionPermissions;
  if (!perms) {
    errors.push('Collection permissions are missing');
  } else {
    const simplePerms: [string, string][] = [
      ['canDeleteCollection', 'Delete collection'],
      ['canArchiveCollection', 'Archive collection'],
      ['canUpdateStandards', 'Update standards'],
      ['canUpdateCustomData', 'Update custom data'],
      ['canUpdateManager', 'Update manager'],
      ['canUpdateCollectionMetadata', 'Update collection metadata'],
      ['canAddMoreAliasPaths', 'Add more alias paths'],
      ['canAddMoreCosmosCoinWrapperPaths', 'Add more Cosmos coin wrapper paths']
    ];
    for (const [key, label] of simplePerms) {
      if (!isFrozen(perms[key])) {
        warnings.push(`Permission "${label}" should be frozen (permanently forbidden)`);
      }
    }

    const tokenPerms: [string, string][] = [
      ['canUpdateValidTokenIds', 'Update valid token IDs'],
      ['canUpdateTokenMetadata', 'Update token metadata']
    ];
    for (const [key, label] of tokenPerms) {
      if (!isFrozen(perms[key])) {
        warnings.push(`Permission "${label}" should be frozen (permanently forbidden)`);
      }
    }

    if (!isFrozen(perms.canUpdateCollectionApprovals)) {
      warnings.push('Permission "Update collection approvals" should be frozen (permanently forbidden)');
    }
  }

  // 5. Approvals — should have 7 specific approvals
  const approvals: any[] = collection.collectionApprovals ?? [];
  if (approvals.length < 7) {
    errors.push(`Expected at least 7 collection approvals, got ${approvals.length}`);
  }

  const getStartBalances = (a: any) => a.approvalCriteria?.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  const getVotingChallenges = (a: any) => a.approvalCriteria?.votingChallenges ?? [];
  const isBurnTo = (a: any) => a.toListId === BURN_ADDRESS;

  const coversBothTokens = (a: any) => {
    const sbs = getStartBalances(a);
    if (sbs.length === 2) {
      const has1 = sbs.some((b: any) => isExactRange(b.tokenIds, '1', '1'));
      const has2 = sbs.some((b: any) => isExactRange(b.tokenIds, '2', '2'));
      return has1 && has2;
    }
    if (sbs.length === 1) {
      return isExactRange(sbs[0]?.tokenIds, '1', '2');
    }
    return false;
  };

  const mintApproval = approvals.find((a: any) => a.fromListId === 'Mint');
  const redeemApproval = approvals.find(
    (a: any) => a.fromListId !== 'Mint' && isBurnTo(a) && coversBothTokens(a) && getVotingChallenges(a).length === 0
  );
  const yesWinsApproval = approvals.find(
    (a: any) =>
      isBurnTo(a) &&
      getStartBalances(a).length === 1 &&
      isExactRange(getStartBalances(a)[0]?.tokenIds, '1', '1') &&
      getVotingChallenges(a).length > 0 &&
      !isApprovalPush(a)
  );
  const noWinsApproval = approvals.find(
    (a: any) =>
      isBurnTo(a) &&
      getStartBalances(a).length === 1 &&
      isExactRange(getStartBalances(a)[0]?.tokenIds, '2', '2') &&
      getVotingChallenges(a).length > 0 &&
      !isApprovalPush(a)
  );
  const pushYesApproval = approvals.find(
    (a: any) =>
      isBurnTo(a) &&
      getStartBalances(a).length === 1 &&
      isExactRange(getStartBalances(a)[0]?.tokenIds, '1', '1') &&
      getVotingChallenges(a).length > 0 &&
      isApprovalPush(a)
  );
  const pushNoApproval = approvals.find(
    (a: any) =>
      isBurnTo(a) &&
      getStartBalances(a).length === 1 &&
      isExactRange(getStartBalances(a)[0]?.tokenIds, '2', '2') &&
      getVotingChallenges(a).length > 0 &&
      isApprovalPush(a)
  );
  const transferableApproval = approvals.find(
    (a: any) =>
      a.fromListId !== 'Mint' &&
      a.toListId === 'All' &&
      getVotingChallenges(a).length === 0 &&
      (!a.approvalCriteria?.coinTransfers || a.approvalCriteria.coinTransfers.length === 0)
  );

  if (!transferableApproval) {
    errors.push('Missing freely transferable approval (allows transfers between users/pools)');
  }

  // Ambiguous-settlement detection. Surface a clear warning for any
  // settlement-shaped approval (burn target + 1 start balance on token 1
  // or 2 + voting challenge) that the heuristic classifier cannot
  // unambiguously place as wins or push. Two cases qualify:
  //
  //   1. classifySettlementApproval returns 'ambiguous' directly — payout
  //      matches neither the wins ratio nor the push ratio cleanly, or
  //      the start balance is 0 so wins and push are indistinguishable.
  //
  //   2. Two approvals on the same token id both classify the same way
  //      (e.g. two 'push' approvals on token 1). In that case at least
  //      one of them is misconfigured — most commonly a YES/NO wins
  //      approval whose payout was accidentally set to exactly half the
  //      start balance, which the legacy heuristic silently reclassified
  //      as a push. See backlog #214 for the original reproduction.
  //
  // This is additive: it never demotes errors to warnings, it never
  // changes how a non-ambiguous approval is classified, and it does not
  // require a schema change. Option 1 from the ticket (an explicit
  // predictionMarketRole field on approvals) remains a future option if
  // this proves insufficient.
  type SettlementInfo = { idx: number; approval: any; cls: SettlementApprovalClassification; tokenLabel: 'YES (token 1)' | 'NO (token 2)' };
  const settlementApprovals: SettlementInfo[] = [];
  for (let i = 0; i < approvals.length; i++) {
    const a = approvals[i];
    if (!isBurnTo(a)) continue;
    const sbs = getStartBalances(a);
    if (sbs.length !== 1) continue;
    const tokenIds = sbs[0]?.tokenIds;
    const isYesShape = isExactRange(tokenIds, '1', '1');
    const isNoShape = isExactRange(tokenIds, '2', '2');
    if (!isYesShape && !isNoShape) continue;
    if (getVotingChallenges(a).length === 0) continue;
    settlementApprovals.push({
      idx: i,
      approval: a,
      cls: classifySettlementApproval(a),
      tokenLabel: isYesShape ? 'YES (token 1)' : 'NO (token 2)'
    });
  }

  const emitAmbiguousWarning = (info: SettlementInfo, reason: string) => {
    const a = info.approval;
    const sbs = getStartBalances(a);
    const startBalanceAmount = n(sbs[0]?.amount);
    const coinAmount = n(a?.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.amount);
    let expectedHalf = '0';
    try {
      expectedHalf = (BigInt(startBalanceAmount) / 2n).toString();
    } catch {
      expectedHalf = '0';
    }
    const id = a.approvalId ? `"${a.approvalId}"` : `at index ${info.idx}`;
    warnings.push(
      `Ambiguous settlement approval ${id} for ${info.tokenLabel}: ${reason} ` +
        `(coinAmount=${coinAmount}, expected wins payout=${startBalanceAmount}, expected push payout=${expectedHalf}). ` +
        `Either change the payout amount to disambiguate, or set an explicit role hint in the approval metadata so the validator can classify it correctly.`
    );
  };

  // Case 1: directly-ambiguous approvals
  for (const info of settlementApprovals) {
    if (info.cls === 'ambiguous') {
      emitAmbiguousWarning(info, 'payout amount matches neither the wins ratio nor the push ratio cleanly.');
    }
  }

  // Case 2: duplicate classifications on the same token id — at least one
  // of the colliding approvals is misconfigured (typically a wins approval
  // whose payout was set to half the start balance, hiding inside the
  // push slot).
  const groupings = new Map<string, SettlementInfo[]>();
  for (const info of settlementApprovals) {
    if (info.cls === 'unknown' || info.cls === 'ambiguous') continue;
    const key = `${info.tokenLabel}::${info.cls}`;
    const list = groupings.get(key) ?? [];
    list.push(info);
    groupings.set(key, list);
  }
  for (const [, list] of groupings) {
    if (list.length < 2) continue;
    for (const info of list) {
      emitAmbiguousWarning(
        info,
        `more than one settlement approval on this token id classifies the same way (${info.cls}) — one of them is likely a misconfigured wins or push approval.`
      );
    }
  }

  if (!mintApproval) {
    errors.push('Missing paired mint approval (fromListId: "Mint")');
  } else {
    details.hasMintApproval = true;
    const mintResult = validateMintApproval(mintApproval, errors);
    details.depositDenom = mintResult.depositDenom;
    details.depositAmount = mintResult.depositAmount;
  }

  if (!redeemApproval) {
    errors.push('Missing pre-settlement redeem approval (burn YES + NO pair)');
  } else {
    details.hasRedeemApproval = true;
    validateRedeemApproval(redeemApproval, errors);
  }

  if (!yesWinsApproval) {
    errors.push('Missing "YES wins" settlement approval');
  } else {
    details.hasYesWinsApproval = true;
    const settleResult = validateSettlementApproval(yesWinsApproval, 'YES wins', '1', '1', false, details.depositAmount, errors, warnings);
    if (settleResult.verifierAddress) {
      details.verifierAddress = settleResult.verifierAddress;
    }
  }

  if (!noWinsApproval) {
    errors.push('Missing "NO wins" settlement approval');
  } else {
    details.hasNoWinsApproval = true;
    validateSettlementApproval(noWinsApproval, 'NO wins', '2', '2', false, details.depositAmount, errors, warnings);
  }

  if (!pushYesApproval) {
    errors.push('Missing "Push YES" settlement approval');
  } else {
    details.hasPushYesApproval = true;
    validateSettlementApproval(pushYesApproval, 'Push YES', '1', '1', true, details.depositAmount, errors, warnings);
  }

  if (!pushNoApproval) {
    errors.push('Missing "Push NO" settlement approval');
  } else {
    details.hasPushNoApproval = true;
    validateSettlementApproval(pushNoApproval, 'Push NO', '2', '2', true, details.depositAmount, errors, warnings);
  }

  // Cross-approval consistency
  const getCoinTransfer = (a: any) => a?.approvalCriteria?.coinTransfers?.[0];
  const getCoinAmount = (a: any) => n(getCoinTransfer(a)?.coins?.[0]?.amount);
  const getCoinDenom = (a: any) => getCoinTransfer(a)?.coins?.[0]?.denom;

  if (details.hasMintApproval) {
    const mintCt = getCoinTransfer(mintApproval);
    if (mintCt && mintCt.to !== 'Mint') {
      warnings.push(`Deposit coinTransfer "to" should be "Mint" for auto-routing to escrow, got "${mintCt.to}"`);
    }
    if (mintCt?.overrideFromWithApproverAddress) {
      errors.push('Deposit coinTransfer must not use overrideFromWithApproverAddress (initiator pays to escrow, not escrow pays)');
    }
  }

  const allApprovalsWithCoinTransfers = [mintApproval, redeemApproval, yesWinsApproval, noWinsApproval, pushYesApproval, pushNoApproval].filter(
    Boolean
  );
  const denoms = new Set(allApprovalsWithCoinTransfers.map(getCoinDenom).filter(Boolean));
  if (denoms.size > 1) {
    errors.push(`All coinTransfers must use the same denom, found: ${[...denoms].join(', ')}`);
  }

  if (details.depositAmount) {
    const deposit = BigInt(details.depositAmount);
    const checkPayoutAmount = (a: any, label: string, expectedAmount: bigint) => {
      if (!a) return;
      const actual = BigInt(getCoinAmount(a) || '0');
      if (actual !== expectedAmount) {
        errors.push(`${label}: payout amount ${actual} does not match expected ${expectedAmount}`);
      }
    };
    checkPayoutAmount(redeemApproval, 'Pre-settlement redeem', deposit);
    checkPayoutAmount(yesWinsApproval, 'YES wins', deposit);
    checkPayoutAmount(noWinsApproval, 'NO wins', deposit);
    // Push pays full deposit base but burns 2x tokens (2:1 ratio for 50% value return)
    checkPayoutAmount(pushYesApproval, 'Push YES', deposit);
    checkPayoutAmount(pushNoApproval, 'Push NO', deposit);
  }

  for (const [a, label] of [
    [redeemApproval, 'Pre-settlement redeem'],
    [yesWinsApproval, 'YES wins'],
    [noWinsApproval, 'NO wins'],
    [pushYesApproval, 'Push YES'],
    [pushNoApproval, 'Push NO']
  ] as [any, string][]) {
    if (!a) continue;
    const ct = getCoinTransfer(a);
    if (ct && !ct.overrideFromWithApproverAddress) {
      errors.push(`${label}: must use overrideFromWithApproverAddress: true (escrow pays out)`);
    }
    if (ct && !ct.overrideToWithInitiator) {
      errors.push(`${label}: must use overrideToWithInitiator: true (redeemer receives)`);
    }
  }

  return { valid: errors.length === 0, errors, warnings, details };
}

/**
 * Quick boolean check — returns true if the collection passes all validation
 * checks (no errors). Warnings are acceptable.
 */
export function isPredictionMarketValid(collection: any): boolean {
  return validatePredictionMarketCollection(collection).valid;
}

// ──────────────────────────────────────────────────────────────────────────
// End-user helpers (lifted from FE prediction/* components)
// ──────────────────────────────────────────────────────────────────────────

import { UintRangeArray } from './uintRanges.js';

export type PredictionMarketStatus = 'active' | 'closed' | 'resolved-yes' | 'resolved-no' | 'resolved-push';

/** Conservative status fallback when the indexer hasn't enriched standardsInfo yet. */
export function derivePredictionMarketStatusFallback(deadlineMs: bigint): PredictionMarketStatus {
  if (deadlineMs > 0n && BigInt(Date.now()) > deadlineMs) return 'closed';
  return 'active';
}

export interface PredictionMarketSideArgs {
  /** Trader address — the approval owner. */
  address: string;
  /** Market collection ID (each prediction market is its own collection). */
  collectionId: string;
  /** 1 = YES, 2 = NO. */
  tokenId: bigint;
  /** Quantity of YES/NO tokens being bought or sold. */
  tokenAmount: bigint;
  /** Payment denom (typically the deposit denom or a badgeslp:* alias). */
  paymentDenom: string;
  /** Payment amount in base units. */
  paymentAmount: bigint;
  /** Active window — typically a single range covering the trading period. */
  transferTimes: UintRangeArray<bigint>;
  /** Approval id — caller picks; usually a fresh random hex. */
  approvalId: string;
}

/**
 * Build a prediction-market BUY intent — INCOMING approval where the
 * creator wants to RECEIVE `tokenAmount` of token-id (1=YES / 2=NO) and
 * pays `paymentAmount` of `paymentDenom`. Proto-shape only.
 *
 * Pair with `MsgSetIncomingApproval` to post on-chain. Mirrors the FE's
 * `UserOutgoingApprovalRegistry.predictionMarketBuyIntent` (the FE name
 * is misleading — it's an incoming approval, posted via MsgSetIncomingApproval).
 */
export function buildPredictionMarketBuyIntent(args: PredictionMarketSideArgs): Record<string, unknown> {
  const tokenIds = [{ start: args.tokenId, end: args.tokenId }];
  return {
    fromListId: 'All',
    initiatedByListId: 'All',
    transferTimes: args.transferTimes,
    tokenIds,
    ownershipTimes: UintRangeArray.FullRanges(),
    approvalId: args.approvalId,
    version: 0n,
    approvalCriteria: {
      autoDeletionOptions: {
        afterOneUse: true,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      },
      coinTransfers: [
        {
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ amount: args.paymentAmount, denom: args.paymentDenom }]
        }
      ],
      predeterminedBalances: {
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
          startBalances: [{ amount: args.tokenAmount, tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 1n,
        perToAddressMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      dynamicStoreChallenges: [],
      ethSignatureChallenges: [],
      votingChallenges: [],
      evmQueryChallenges: [],
      requireFromEqualsInitiatedBy: false
    }
  };
}

/**
 * Build a prediction-market SELL intent — OUTGOING approval where the
 * creator wants to SEND `tokenAmount` of token-id (1=YES / 2=NO) and
 * receive `paymentAmount` of `paymentDenom`. Proto-shape only.
 */
export function buildPredictionMarketSellIntent(args: PredictionMarketSideArgs): Record<string, unknown> {
  const tokenIds = [{ start: args.tokenId, end: args.tokenId }];
  return {
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: args.transferTimes,
    tokenIds,
    ownershipTimes: UintRangeArray.FullRanges(),
    approvalId: args.approvalId,
    version: 0n,
    approvalCriteria: {
      autoDeletionOptions: {
        afterOneUse: true,
        afterOverallMaxNumTransfers: true,
        allowCounterpartyPurge: false,
        allowPurgeIfExpired: true
      },
      requireToDoesNotEqualInitiatedBy: false,
      coinTransfers: [
        {
          to: args.address,
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [{ amount: args.paymentAmount, denom: args.paymentDenom }]
        }
      ],
      predeterminedBalances: {
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
          startBalances: [{ amount: args.tokenAmount, tokenIds, ownershipTimes: UintRangeArray.FullRanges() }],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
        }
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 1n,
        perToAddressMaxNumTransfers: 0n,
        perFromAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      approvalAmounts: {
        overallApprovalAmount: 0n,
        perFromAddressApprovalAmount: 0n,
        perToAddressApprovalAmount: 0n,
        perInitiatedByAddressApprovalAmount: 0n,
        amountTrackerId: args.approvalId,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      dynamicStoreChallenges: [],
      ethSignatureChallenges: [],
      votingChallenges: [],
      evmQueryChallenges: []
    }
  };
}

// ── Deposit / Redeem / Resolve msg builders ───────────────────────────────

interface MsgEnvelope {
  typeUrl: '/tokenization.MsgTransferTokens' | '/tokenization.MsgCastVote';
  value: Record<string, unknown>;
}

const PM_FULL_OWNERSHIP = [{ start: '1', end: MAX_UINT64 }];

/** Deposit msg: mint paired YES+NO tokens 1:1 against the depositDenom. Single MsgTransferTokens, two transfers. */
export function buildPredictionMarketDepositMsg(
  creator: string,
  collectionId: string,
  amount: bigint,
  mintApprovalId: string
): MsgEnvelope {
  if (amount <= 0n) throw new Error('buildPredictionMarketDepositMsg: --amount must be > 0');
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: 'Mint',
          toAddresses: [creator],
          balances: [
            { amount: amount.toString(), tokenIds: [{ start: '1', end: '1' }], ownershipTimes: PM_FULL_OWNERSHIP },
            { amount: amount.toString(), tokenIds: [{ start: '2', end: '2' }], ownershipTimes: PM_FULL_OWNERSHIP }
          ],
          prioritizedApprovals: [
            { approvalId: mintApprovalId, approvalLevel: 'collection', approverAddress: '', version: '0' }
          ],
          onlyCheckPrioritizedCollectionApprovals: true,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  };
}

export interface RedeemArgs {
  creator: string;
  collectionId: string;
  state: 'active' | 'push' | 'yes-wins' | 'no-wins';
  pairAmount?: bigint;
  yesBalance?: bigint;
  noBalance?: bigint;
  redeemApprovalId?: string;
  yesWinsApprovalId?: string;
  noWinsApprovalId?: string;
  pushYesApprovalId?: string;
  pushNoApprovalId?: string;
}

/**
 * Build redeem msgs by state. Mirrors `PredictionRedeemPanel.tsx`:
 *   - active: burn YES+NO pairs to reclaim depositDenom 1:1.
 *   - push: burn YES + NO separately, each gets half payout.
 *   - yes-wins / no-wins: redeem winner 1:1, burn loser without payout.
 *
 * Returns `{messages: [...]}` ready for `bb deploy`. Emits empty array
 * when nothing is redeemable.
 */
export function buildPredictionMarketRedeemTx(args: RedeemArgs): { messages: MsgEnvelope[] } {
  const msgs: MsgEnvelope[] = [];
  const cid = String(args.collectionId);

  const burn = (amount: bigint, start: string, end: string, approvalId?: string): MsgEnvelope => ({
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: args.creator,
      collectionId: cid,
      transfers: [
        {
          from: args.creator,
          toAddresses: [BURN_ADDRESS],
          balances: [
            { amount: amount.toString(), tokenIds: [{ start, end }], ownershipTimes: PM_FULL_OWNERSHIP }
          ],
          prioritizedApprovals: approvalId
            ? [{ approvalId, approvalLevel: 'collection', approverAddress: '', version: '0' }]
            : [],
          onlyCheckPrioritizedCollectionApprovals: !!approvalId,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  });

  if (args.state === 'active') {
    const pairs = args.pairAmount ?? 0n;
    if (pairs > 0n) msgs.push(burn(pairs, '1', '2', args.redeemApprovalId));
  } else if (args.state === 'push') {
    if ((args.yesBalance ?? 0n) > 0n) msgs.push(burn(args.yesBalance!, '1', '1', args.pushYesApprovalId));
    if ((args.noBalance ?? 0n) > 0n) msgs.push(burn(args.noBalance!, '2', '2', args.pushNoApprovalId));
  } else if (args.state === 'yes-wins') {
    if ((args.yesBalance ?? 0n) > 0n) msgs.push(burn(args.yesBalance!, '1', '1', args.yesWinsApprovalId));
    if ((args.noBalance ?? 0n) > 0n) msgs.push(burn(args.noBalance!, '2', '2'));
  } else {
    // no-wins
    if ((args.noBalance ?? 0n) > 0n) msgs.push(burn(args.noBalance!, '2', '2', args.noWinsApprovalId));
    if ((args.yesBalance ?? 0n) > 0n) msgs.push(burn(args.yesBalance!, '1', '1'));
  }

  return { messages: msgs };
}

/**
 * Verifier-side resolve. Single MsgCastVote for yes/no, two for push.
 * Approval IDs come from the FE's classifySettlementApproval/standardsInfo.
 */
export function buildPredictionMarketResolveTx(
  creator: string,
  collectionId: string,
  outcome: 'yes' | 'no' | 'push',
  approvals: { yesWinsApprovalId?: string; noWinsApprovalId?: string; pushYesApprovalId?: string; pushNoApprovalId?: string }
): { messages: MsgEnvelope[] } {
  const cid = String(collectionId);
  const voteMsg = (approvalId: string): MsgEnvelope => ({
    typeUrl: '/tokenization.MsgCastVote',
    value: {
      creator,
      collection_id: cid,
      approval_level: 'collection',
      approver_address: '',
      approval_id: approvalId,
      proposal_id: approvalId,
      yes_weight: '100'
    }
  });

  if (outcome === 'yes') {
    if (!approvals.yesWinsApprovalId) throw new Error('Missing yesWinsApprovalId');
    return { messages: [voteMsg(approvals.yesWinsApprovalId)] };
  }
  if (outcome === 'no') {
    if (!approvals.noWinsApprovalId) throw new Error('Missing noWinsApprovalId');
    return { messages: [voteMsg(approvals.noWinsApprovalId)] };
  }
  if (!approvals.pushYesApprovalId || !approvals.pushNoApprovalId) {
    throw new Error('Missing pushYesApprovalId / pushNoApprovalId for outcome=push');
  }
  return { messages: [voteMsg(approvals.pushYesApprovalId), voteMsg(approvals.pushNoApprovalId)] };
}
