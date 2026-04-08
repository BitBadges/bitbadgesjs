import { AddressList } from '../addressLists.js';
import { UintRangeArray } from '../uintRanges.js';
import type { RequiredApprovalProps } from '../approval-utils.js';
import type { iUintRange } from '../../interfaces/types/core.js';
import crypto from 'crypto';

import { type TFunction, defaultT } from './types.js';

const FOREVER: iUintRange<bigint>[] = [{ start: 1n, end: BigInt('18446744073709551615') }];
const MAX_UINT = BigInt('18446744073709551615');
const TOKEN_REFUND: iUintRange<bigint>[] = [{ start: 1n, end: 1n }];
const TOKEN_PROGRESS: iUintRange<bigint>[] = [{ start: 2n, end: 2n }];
const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

/**
 * Crowdfund standard — on-chain goal tracking via mustOwnTokens.
 *
 * Token ID 1 = Refund token (contributor holds — burn to refund)
 * Token ID 2 = Progress token (crowdfunder accumulates — tracks total raised)
 *
 * 4 approvals:
 * 1. Deposit-Refund: Mint → contributor, Token ID 1, contributor pays USDC to escrow
 * 2. Deposit-Progress: Mint → crowdfunder, Token ID 2, no coinTransfer (paired with #1)
 * 3. Success: Mint → burn, mustOwnTokens checks crowdfunder has >= goal of Token 2, escrow → crowdfunder
 * 4. Refund: contributor burns Token 1 → escrow pays contributor (time-gated after deadline)
 */

interface CrowdfundParams {
  crowdfunderAddress: string;
  goalAmount: bigint;
  depositDenom: string;
  deadlineTime: bigint;
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

function defaultOrderCalc() {
  return {
    useOverallNumTransfers: true,
    usePerToAddressNumTransfers: false,
    usePerFromAddressNumTransfers: false,
    usePerInitiatedByAddressNumTransfers: false,
    useMerkleChallengeLeafIndex: false,
    challengeTrackerId: ''
  };
}

const defaultAutoDeletion = { afterOneUse: false, afterOverallMaxNumTransfers: false, allowCounterpartyPurge: false, allowPurgeIfExpired: false };
const defaultAltTimeChecks = { offlineHours: [], offlineDays: [] };
const defaultRoyalties = { percentage: 0n, payoutAddress: '' };
const emptyArrayFields = {
  merkleChallenges: [] as any[],
  dynamicStoreChallenges: [] as any[],
  ethSignatureChallenges: [] as any[],
  evmQueryChallenges: [] as any[]
};

function unlimitedTransfers(trackerId: string) {
  return {
    overallMaxNumTransfers: 0n,
    perToAddressMaxNumTransfers: 0n,
    perFromAddressMaxNumTransfers: 0n,
    perInitiatedByAddressMaxNumTransfers: 0n,
    amountTrackerId: trackerId,
    resetTimeIntervals: zeroResetIntervals
  };
}

function maxOneTransfer(trackerId: string) {
  return {
    overallMaxNumTransfers: 1n,
    perToAddressMaxNumTransfers: 0n,
    perFromAddressMaxNumTransfers: 0n,
    perInitiatedByAddressMaxNumTransfers: 0n,
    amountTrackerId: trackerId,
    resetTimeIntervals: zeroResetIntervals
  };
}

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
      p.permanentlyForbiddenTimes.some((t: any) => n(t.start) === '1' && n(t.end) === MAX_UINT.toString())
  );
}

// ---------------------------------------------------------------------------
// Validation result interface
// ---------------------------------------------------------------------------

export interface CrowdfundValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    depositDenom?: string;
    crowdfunderAddress?: string;
    goalAmount?: string;
    deadlineTime?: string;
    hasDepositRefundApproval: boolean;
    hasDepositProgressApproval: boolean;
    hasSuccessApproval: boolean;
    hasRefundApproval: boolean;
  };
}

// ---------------------------------------------------------------------------
// Individual approval validators
// ---------------------------------------------------------------------------

/** Validate that incrementedBalances inner fields are safe defaults. */
function validateIncrementedBalancesDefaults(incBal: any, prefix: string, errors: string[], warnings: string[]): void {
  if (!incBal) return;
  if (n(incBal.incrementTokenIdsBy) !== '0') {
    errors.push(`${prefix}: incrementTokenIdsBy must be 0, got ${n(incBal.incrementTokenIdsBy)}`);
  }
  if (n(incBal.incrementOwnershipTimesBy) !== '0') {
    errors.push(`${prefix}: incrementOwnershipTimesBy must be 0, got ${n(incBal.incrementOwnershipTimesBy)}`);
  }
  if (n(incBal.durationFromTimestamp) !== '0') {
    errors.push(`${prefix}: durationFromTimestamp must be 0, got ${n(incBal.durationFromTimestamp)}`);
  }
  if (incBal.allowOverrideTimestamp === true) {
    errors.push(`${prefix}: allowOverrideTimestamp must be false`);
  }
  if (incBal.allowOverrideWithAnyValidToken === true) {
    errors.push(`${prefix}: allowOverrideWithAnyValidToken must be false`);
  }
  if (n(incBal.maxScalingMultiplier) !== MAX_UINT.toString() && incBal.allowAmountScaling === true) {
    warnings.push(`${prefix}: maxScalingMultiplier should be MAX_UINT for unrestricted scaling, got ${n(incBal.maxScalingMultiplier)}`);
  }
}

/** Validate that challenge arrays are all empty (no merkle, dynamic store, eth sig, evm query, voting). */
function validateNoChallenges(criteria: any, prefix: string, errors: string[]): void {
  if ((criteria.merkleChallenges?.length ?? 0) > 0) {
    errors.push(`${prefix}: merkleChallenges must be empty`);
  }
  if ((criteria.dynamicStoreChallenges?.length ?? 0) > 0) {
    errors.push(`${prefix}: dynamicStoreChallenges must be empty`);
  }
  if ((criteria.ethSignatureChallenges?.length ?? 0) > 0) {
    errors.push(`${prefix}: ethSignatureChallenges must be empty`);
  }
  if ((criteria.evmQueryChallenges?.length ?? 0) > 0) {
    errors.push(`${prefix}: evmQueryChallenges must be empty`);
  }
  if ((criteria.votingChallenges?.length ?? 0) > 0) {
    errors.push(`${prefix}: votingChallenges must be empty`);
  }
}

/** Validate sender/recipient/initiator checks are all default (no contract or liquidity pool requirements). */
function validateDefaultAddressChecks(criteria: any, prefix: string, errors: string[]): void {
  for (const key of ['senderChecks', 'recipientChecks', 'initiatorChecks']) {
    const checks = criteria[key];
    if (!checks) continue;
    if (checks.mustBeEvmContract === true) {
      errors.push(`${prefix}: ${key}.mustBeEvmContract must be false`);
    }
    if (checks.mustBeLiquidityPool === true) {
      errors.push(`${prefix}: ${key}.mustBeLiquidityPool must be false`);
    }
  }
}

/** Validate autoDeletionOptions are all disabled. */
function validateNoAutoDeletion(criteria: any, prefix: string, errors: string[]): void {
  const opts = criteria.autoDeletionOptions;
  if (!opts) return;
  if (opts.afterOneUse === true) {
    errors.push(`${prefix}: autoDeletionOptions.afterOneUse must be false`);
  }
  if (opts.afterOverallMaxNumTransfers === true) {
    errors.push(`${prefix}: autoDeletionOptions.afterOverallMaxNumTransfers must be false`);
  }
  if (opts.allowCounterpartyPurge === true) {
    errors.push(`${prefix}: autoDeletionOptions.allowCounterpartyPurge must be false`);
  }
  if (opts.allowPurgeIfExpired === true) {
    errors.push(`${prefix}: autoDeletionOptions.allowPurgeIfExpired must be false`);
  }
}

function validateDepositRefundApproval(approval: any, errors: string[], warnings: string[]): { depositDenom?: string; deadlineTime?: string } {
  const prefix = 'Deposit-Refund approval';
  const result: { depositDenom?: string; deadlineTime?: string } = {};

  if (approval.fromListId !== 'Mint') {
    errors.push(`${prefix}: fromListId must be "Mint", got "${approval.fromListId}"`);
  }
  if (approval.toListId !== 'All') {
    errors.push(`${prefix}: toListId must be "All", got "${approval.toListId}"`);
  }
  if (approval.initiatedByListId !== 'All') {
    errors.push(`${prefix}: initiatedByListId must be "All", got "${approval.initiatedByListId}"`);
  }

  // Token IDs must be exactly Token 1 (refund token)
  if (!isExactRange(approval.tokenIds, '1', '1')) {
    errors.push(`${prefix}: tokenIds must be exactly [{start: 1, end: 1}] (refund token)`);
  }

  const criteria = approval.approvalCriteria;
  if (!criteria) {
    errors.push(`${prefix}: missing approvalCriteria`);
    return result;
  }

  // coinTransfers
  const coinTransfers = criteria.coinTransfers ?? [];
  if (coinTransfers.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 coin transfer, got ${coinTransfers.length}`);
  } else {
    const ct = coinTransfers[0];
    if (ct.overrideFromWithApproverAddress !== false) {
      errors.push(`${prefix}: coinTransfer overrideFromWithApproverAddress must be false (contributor pays)`);
    }
    if (ct.overrideToWithInitiator === true) {
      errors.push(`${prefix}: coinTransfer overrideToWithInitiator must be false`);
    }
    if (!ct.to || ct.to.trim() === '') {
      errors.push(`${prefix}: coinTransfer "to" must be "Mint" (auto-resolves to escrow), got empty`);
    }
    if (ct.coins?.length === 1) {
      result.depositDenom = ct.coins[0].denom;
      if (!ct.coins[0].denom || ct.coins[0].denom.trim() === '') {
        errors.push(`${prefix}: coinTransfer denom must not be empty`);
      }
    } else {
      errors.push(`${prefix}: coinTransfer must have exactly 1 coin entry`);
    }
  }

  // Transfer times (deadline)
  const transferTimes = approval.transferTimes ?? [];
  if (transferTimes.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 transfer time window`);
  } else {
    result.deadlineTime = n(transferTimes[0].end);
    if (n(transferTimes[0].start) !== '1') {
      warnings.push(`${prefix}: transfer time start should be 1 (beginning of time), got ${n(transferTimes[0].start)}`);
    }
    // Deadline must be in the future or at least a valid timestamp
    if (BigInt(result.deadlineTime) <= 0n) {
      errors.push(`${prefix}: deadline (transfer time end) must be > 0`);
    }
  }

  // Predetermined balances
  const startBalances = criteria.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  if (startBalances.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 start balance entry, got ${startBalances.length}`);
  } else {
    if (!isExactRange(startBalances[0].tokenIds, '1', '1')) {
      errors.push(`${prefix}: start balance must target token ID 1 (refund token)`);
    }
  }

  // Manual balances must be empty
  if ((criteria.predeterminedBalances?.manualBalances?.length ?? 0) > 0) {
    errors.push(`${prefix}: manualBalances must be empty`);
  }

  // Order calculation must use overall num transfers
  const orderCalc = criteria.predeterminedBalances?.orderCalculationMethod;
  if (orderCalc) {
    if (orderCalc.useOverallNumTransfers !== true) {
      errors.push(`${prefix}: orderCalculationMethod.useOverallNumTransfers must be true`);
    }
    if (orderCalc.useMerkleChallengeLeafIndex === true) {
      errors.push(`${prefix}: orderCalculationMethod.useMerkleChallengeLeafIndex must be false`);
    }
  }

  // allowAmountScaling must be true (contributors choose deposit size)
  const incBal = criteria.predeterminedBalances?.incrementedBalances;
  if (incBal && incBal.allowAmountScaling !== true) {
    errors.push(`${prefix}: allowAmountScaling must be true (contributors choose deposit amount)`);
  }
  validateIncrementedBalancesDefaults(incBal, prefix, errors, warnings);

  // requireToEqualsInitiatedBy must be true (contributor receives their own refund token)
  if (criteria.requireToEqualsInitiatedBy !== true) {
    errors.push(`${prefix}: requireToEqualsInitiatedBy must be true (contributor must receive their own refund token)`);
  }

  // Other require* flags must be false
  if (criteria.requireFromEqualsInitiatedBy === true) {
    errors.push(`${prefix}: requireFromEqualsInitiatedBy must be false`);
  }
  if (criteria.requireToDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireToDoesNotEqualInitiatedBy must be false`);
  }
  if (criteria.requireFromDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireFromDoesNotEqualInitiatedBy must be false`);
  }

  // overridesFromOutgoingApprovals and overridesToIncomingApprovals should be true
  if (criteria.overridesFromOutgoingApprovals !== true) {
    errors.push(`${prefix}: overridesFromOutgoingApprovals must be true`);
  }
  if (criteria.overridesToIncomingApprovals !== true) {
    errors.push(`${prefix}: overridesToIncomingApprovals must be true`);
  }

  // maxNumTransfers should be unlimited (0)
  if (n(criteria.maxNumTransfers?.overallMaxNumTransfers) !== '0') {
    errors.push(`${prefix}: overallMaxNumTransfers should be 0 (unlimited) for deposits`);
  }

  // mustOwnTokens should be empty
  if ((criteria.mustOwnTokens?.length ?? 0) > 0) {
    errors.push(`${prefix}: mustOwnTokens must be empty`);
  }

  // No challenges
  validateNoChallenges(criteria, prefix, errors);

  // No dangerous features
  if (criteria.allowBackedMinting === true) {
    errors.push(`${prefix}: allowBackedMinting must be false`);
  }
  if (criteria.allowSpecialWrapping === true) {
    errors.push(`${prefix}: allowSpecialWrapping must be false`);
  }
  // mustPrioritize is acceptable (ensures this approval is checked first)

  // Validate address checks and auto-deletion
  validateDefaultAddressChecks(criteria, prefix, errors);
  validateNoAutoDeletion(criteria, prefix, errors);

  return result;
}

function validateDepositProgressApproval(
  approval: any, errors: string[], warnings: string[], expectedDeadline?: string
): { crowdfunderAddress?: string } {
  const prefix = 'Deposit-Progress approval';
  const result: { crowdfunderAddress?: string } = {};

  if (approval.fromListId !== 'Mint') {
    errors.push(`${prefix}: fromListId must be "Mint", got "${approval.fromListId}"`);
  }
  if (approval.toListId === 'All' || approval.toListId === BURN_ADDRESS) {
    errors.push(`${prefix}: toListId must be a specific crowdfunder address, got "${approval.toListId}"`);
  } else {
    result.crowdfunderAddress = approval.toListId;
  }

  // Token IDs must be exactly Token 2 (progress token)
  if (!isExactRange(approval.tokenIds, '2', '2')) {
    errors.push(`${prefix}: tokenIds must be exactly [{start: 2, end: 2}] (progress token)`);
  }

  const criteria = approval.approvalCriteria;
  if (!criteria) {
    errors.push(`${prefix}: missing approvalCriteria`);
    return result;
  }

  // No coinTransfers (this is the paired counterpart — no payment)
  const coinTransfers = criteria.coinTransfers ?? [];
  if (coinTransfers.length !== 0) {
    errors.push(`${prefix}: must have 0 coin transfers (paired with deposit-refund), got ${coinTransfers.length}`);
  }

  // Transfer times must match deposit-refund deadline
  const transferTimes = approval.transferTimes ?? [];
  if (transferTimes.length !== 1) {
    warnings.push(`${prefix}: expected exactly 1 transfer time window`);
  } else if (expectedDeadline && n(transferTimes[0].end) !== expectedDeadline) {
    errors.push(`${prefix}: deadline (${n(transferTimes[0].end)}) must match deposit-refund deadline (${expectedDeadline})`);
  }

  // Predetermined balances
  const startBalances = criteria.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  if (startBalances.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 start balance entry, got ${startBalances.length}`);
  } else {
    if (!isExactRange(startBalances[0].tokenIds, '2', '2')) {
      errors.push(`${prefix}: start balance must target token ID 2 (progress token)`);
    }
  }

  // allowAmountScaling must be true
  const incBal = criteria.predeterminedBalances?.incrementedBalances;
  if (incBal && incBal.allowAmountScaling !== true) {
    errors.push(`${prefix}: allowAmountScaling must be true (must scale with deposit amount)`);
  }

  // Manual balances must be empty
  if ((criteria.predeterminedBalances?.manualBalances?.length ?? 0) > 0) {
    errors.push(`${prefix}: manualBalances must be empty`);
  }

  // Order calculation must use overall num transfers
  const orderCalc = criteria.predeterminedBalances?.orderCalculationMethod;
  if (orderCalc) {
    if (orderCalc.useOverallNumTransfers !== true) {
      errors.push(`${prefix}: orderCalculationMethod.useOverallNumTransfers must be true`);
    }
    if (orderCalc.useMerkleChallengeLeafIndex === true) {
      errors.push(`${prefix}: orderCalculationMethod.useMerkleChallengeLeafIndex must be false`);
    }
  }

  validateIncrementedBalancesDefaults(incBal, prefix, errors, warnings);

  // requireToEqualsInitiatedBy should be false (progress goes to crowdfunder, not initiator)
  if (criteria.requireToEqualsInitiatedBy === true) {
    errors.push(`${prefix}: requireToEqualsInitiatedBy must be false (progress token goes to crowdfunder, not contributor)`);
  }
  if (criteria.requireFromEqualsInitiatedBy === true) {
    errors.push(`${prefix}: requireFromEqualsInitiatedBy must be false`);
  }
  if (criteria.requireToDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireToDoesNotEqualInitiatedBy must be false`);
  }
  if (criteria.requireFromDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireFromDoesNotEqualInitiatedBy must be false`);
  }

  if (criteria.overridesFromOutgoingApprovals !== true) {
    errors.push(`${prefix}: overridesFromOutgoingApprovals must be true`);
  }
  if (criteria.overridesToIncomingApprovals !== true) {
    errors.push(`${prefix}: overridesToIncomingApprovals must be true`);
  }

  if (n(criteria.maxNumTransfers?.overallMaxNumTransfers) !== '0') {
    errors.push(`${prefix}: overallMaxNumTransfers should be 0 (unlimited) for progress tracking`);
  }

  // mustOwnTokens should be empty
  if ((criteria.mustOwnTokens?.length ?? 0) > 0) {
    errors.push(`${prefix}: mustOwnTokens must be empty`);
  }

  // No challenges
  validateNoChallenges(criteria, prefix, errors);

  if (criteria.allowBackedMinting === true) {
    errors.push(`${prefix}: allowBackedMinting must be false`);
  }
  if (criteria.allowSpecialWrapping === true) {
    errors.push(`${prefix}: allowSpecialWrapping must be false`);
  }
  // mustPrioritize is acceptable (ensures this approval is checked first)

  validateDefaultAddressChecks(criteria, prefix, errors);
  validateNoAutoDeletion(criteria, prefix, errors);

  return result;
}

function validateSuccessApproval(
  approval: any, errors: string[], warnings: string[],
  expectedCrowdfunder?: string, expectedDenom?: string, expectedDeadline?: string,
  collection?: any
): { goalAmount?: string } {
  const prefix = 'Success (withdraw) approval';
  const result: { goalAmount?: string } = {};

  if (approval.fromListId !== 'Mint') {
    errors.push(`${prefix}: fromListId must be "Mint", got "${approval.fromListId}"`);
  }
  if (approval.toListId !== BURN_ADDRESS) {
    errors.push(`${prefix}: toListId must be the burn address, got "${approval.toListId}"`);
  }

  const criteria = approval.approvalCriteria;
  if (!criteria) {
    errors.push(`${prefix}: missing approvalCriteria`);
    return result;
  }

  // initiatedByListId should be the crowdfunder (only they can withdraw)
  if (expectedCrowdfunder && approval.initiatedByListId !== expectedCrowdfunder) {
    errors.push(`${prefix}: initiatedByListId must be the crowdfunder address "${expectedCrowdfunder}", got "${approval.initiatedByListId}"`);
  }

  // maxNumTransfers must be exactly 1 (single withdrawal)
  if (n(criteria.maxNumTransfers?.overallMaxNumTransfers) !== '1') {
    errors.push(`${prefix}: overallMaxNumTransfers must be exactly 1 (single withdrawal), got ${n(criteria.maxNumTransfers?.overallMaxNumTransfers)}`);
  }

  // coinTransfers — pays crowdfunder from escrow
  const coinTransfers = criteria.coinTransfers ?? [];
  if (coinTransfers.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 coin transfer, got ${coinTransfers.length}`);
  } else {
    const ct = coinTransfers[0];
    if (ct.overrideFromWithApproverAddress !== true) {
      errors.push(`${prefix}: coinTransfer overrideFromWithApproverAddress must be true (escrow pays out)`);
    }
    if (expectedDenom && ct.coins?.[0]?.denom !== expectedDenom) {
      errors.push(`${prefix}: coinTransfer denom "${ct.coins?.[0]?.denom}" does not match deposit denom "${expectedDenom}"`);
    }
    // Success payout should go to crowdfunder
    if (expectedCrowdfunder && ct.to && ct.to !== expectedCrowdfunder && ct.overrideToWithInitiator !== true) {
      errors.push(`${prefix}: coinTransfer "to" should be the crowdfunder address or use overrideToWithInitiator`);
    }
  }

  // Transfer times must start after deadline
  const transferTimes = approval.transferTimes ?? [];
  if (transferTimes.length !== 1) {
    warnings.push(`${prefix}: expected exactly 1 transfer time window`);
  } else if (expectedDeadline) {
    const start = n(transferTimes[0].start);
    const expectedStart = (BigInt(expectedDeadline) + 1n).toString();
    if (start !== expectedStart) {
      errors.push(`${prefix}: transfer time must start after deadline (expected start=${expectedStart}, got ${start})`);
    }
  }

  // mustOwnTokens — must check crowdfunder owns >= goalAmount of Token 2
  const mustOwn = criteria.mustOwnTokens ?? [];
  if (mustOwn.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 mustOwnTokens entry, got ${mustOwn.length}`);
  } else {
    const mot = mustOwn[0];
    const collId = n(mot.collectionId);
    if (collId !== '0' && collId !== n(collection?.collectionId)) {
      errors.push(`${prefix}: mustOwnTokens collectionId must be "0" (self-reference) or the collection's own ID, got "${collId}"`);
    }
    if (!isExactRange(mot.tokenIds, '2', '2')) {
      errors.push(`${prefix}: mustOwnTokens must reference token ID 2 (progress token)`);
    }
    result.goalAmount = n(mot.amountRange?.start);
    if (BigInt(result.goalAmount) <= 0n) {
      errors.push(`${prefix}: mustOwnTokens amountRange.start (goal) must be > 0`);
    }
    if (n(mot.amountRange?.end) !== MAX_UINT.toString()) {
      warnings.push(`${prefix}: mustOwnTokens amountRange.end should be MAX_UINT for "at least goal" semantics`);
    }
    if (expectedCrowdfunder && mot.ownershipCheckParty !== expectedCrowdfunder) {
      errors.push(`${prefix}: mustOwnTokens ownershipCheckParty must be the crowdfunder "${expectedCrowdfunder}", got "${mot.ownershipCheckParty}"`);
    }
  }

  // Predetermined balances
  const startBalances = criteria.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  if (startBalances.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 start balance entry, got ${startBalances.length}`);
  }

  // Manual balances must be empty
  if ((criteria.predeterminedBalances?.manualBalances?.length ?? 0) > 0) {
    errors.push(`${prefix}: manualBalances must be empty`);
  }

  // allowAmountScaling must be true (withdraw scales with total raised)
  const incBal = criteria.predeterminedBalances?.incrementedBalances;
  if (incBal && incBal.allowAmountScaling !== true) {
    errors.push(`${prefix}: allowAmountScaling must be true (withdraw amount scales)`);
  }
  validateIncrementedBalancesDefaults(incBal, prefix, errors, warnings);

  // require* flags
  if (criteria.requireToEqualsInitiatedBy === true) {
    errors.push(`${prefix}: requireToEqualsInitiatedBy must be false`);
  }
  if (criteria.requireFromEqualsInitiatedBy === true) {
    errors.push(`${prefix}: requireFromEqualsInitiatedBy must be false`);
  }
  if (criteria.requireToDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireToDoesNotEqualInitiatedBy must be false`);
  }
  if (criteria.requireFromDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireFromDoesNotEqualInitiatedBy must be false`);
  }

  if (criteria.overridesFromOutgoingApprovals !== true) {
    errors.push(`${prefix}: overridesFromOutgoingApprovals must be true`);
  }
  if (criteria.overridesToIncomingApprovals !== true) {
    errors.push(`${prefix}: overridesToIncomingApprovals must be true`);
  }

  // No challenges
  validateNoChallenges(criteria, prefix, errors);

  if (criteria.allowBackedMinting === true) {
    errors.push(`${prefix}: allowBackedMinting must be false`);
  }
  if (criteria.allowSpecialWrapping === true) {
    errors.push(`${prefix}: allowSpecialWrapping must be false`);
  }
  // mustPrioritize is acceptable (ensures this approval is checked first)

  validateDefaultAddressChecks(criteria, prefix, errors);
  validateNoAutoDeletion(criteria, prefix, errors);

  return result;
}

function validateRefundApproval(
  approval: any, errors: string[], warnings: string[],
  expectedCrowdfunder?: string, expectedDenom?: string, expectedDeadline?: string, expectedGoal?: string,
  collection?: any
): void {
  const prefix = 'Refund approval';

  if (approval.fromListId !== '!Mint') {
    errors.push(`${prefix}: fromListId must be "!Mint", got "${approval.fromListId}"`);
  }
  if (approval.toListId !== BURN_ADDRESS) {
    errors.push(`${prefix}: toListId must be the burn address, got "${approval.toListId}"`);
  }

  // Token IDs must be Token 1 (refund token)
  if (!isExactRange(approval.tokenIds, '1', '1')) {
    errors.push(`${prefix}: tokenIds must be exactly [{start: 1, end: 1}] (refund token)`);
  }

  const criteria = approval.approvalCriteria;
  if (!criteria) {
    errors.push(`${prefix}: missing approvalCriteria`);
    return;
  }

  // coinTransfers — escrow pays contributor
  const coinTransfers = criteria.coinTransfers ?? [];
  if (coinTransfers.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 coin transfer, got ${coinTransfers.length}`);
  } else {
    const ct = coinTransfers[0];
    if (ct.overrideFromWithApproverAddress !== true) {
      errors.push(`${prefix}: coinTransfer overrideFromWithApproverAddress must be true (escrow pays back)`);
    }
    if (ct.overrideToWithInitiator !== true) {
      errors.push(`${prefix}: coinTransfer overrideToWithInitiator must be true (contributor receives refund)`);
    }
    if (expectedDenom && ct.coins?.[0]?.denom !== expectedDenom) {
      errors.push(`${prefix}: coinTransfer denom "${ct.coins?.[0]?.denom}" does not match deposit denom "${expectedDenom}"`);
    }
  }

  // Transfer times must start after deadline
  const transferTimes = approval.transferTimes ?? [];
  if (transferTimes.length !== 1) {
    warnings.push(`${prefix}: expected exactly 1 transfer time window`);
  } else if (expectedDeadline) {
    const start = n(transferTimes[0].start);
    const expectedStart = (BigInt(expectedDeadline) + 1n).toString();
    if (start !== expectedStart) {
      errors.push(`${prefix}: transfer time must start after deadline (expected start=${expectedStart}, got ${start})`);
    }
  }

  // mustOwnTokens — must check crowdfunder has LESS than goal of Token 2
  const mustOwn = criteria.mustOwnTokens ?? [];
  if (mustOwn.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 mustOwnTokens entry (goal-not-met check), got ${mustOwn.length}`);
  } else {
    const mot = mustOwn[0];
    const collId = n(mot.collectionId);
    if (collId !== '0' && collId !== n(collection?.collectionId)) {
      errors.push(`${prefix}: mustOwnTokens collectionId must be "0" (self-reference) or the collection's own ID, got "${collId}"`);
    }
    if (!isExactRange(mot.tokenIds, '2', '2')) {
      errors.push(`${prefix}: mustOwnTokens must reference token ID 2 (progress token)`);
    }
    if (expectedCrowdfunder && mot.ownershipCheckParty !== expectedCrowdfunder) {
      errors.push(`${prefix}: mustOwnTokens ownershipCheckParty must be the crowdfunder "${expectedCrowdfunder}", got "${mot.ownershipCheckParty}"`);
    }
    if (expectedGoal) {
      const expectedEnd = (BigInt(expectedGoal) > 0n ? BigInt(expectedGoal) - 1n : 0n).toString();
      if (n(mot.amountRange?.end) !== expectedEnd) {
        errors.push(`${prefix}: mustOwnTokens amountRange.end must be goal-1 (${expectedEnd}) for "less than goal" check, got ${n(mot.amountRange?.end)}`);
      }
    }
    if (n(mot.amountRange?.start) !== '0') {
      errors.push(`${prefix}: mustOwnTokens amountRange.start must be 0, got ${n(mot.amountRange?.start)}`);
    }
  }

  // maxNumTransfers should be non-zero (overrideFromWithApproverAddress requires it)
  if (n(criteria.maxNumTransfers?.overallMaxNumTransfers) === '0') {
    errors.push(`${prefix}: overallMaxNumTransfers must be > 0 when using overrideFromWithApproverAddress`);
  }

  // allowAmountScaling must be true (refund scales with contribution)
  const incBal = criteria.predeterminedBalances?.incrementedBalances;
  if (incBal && incBal.allowAmountScaling !== true) {
    errors.push(`${prefix}: allowAmountScaling must be true (refund amount scales with contribution)`);
  }
  validateIncrementedBalancesDefaults(incBal, prefix, errors, warnings);

  // Predetermined balances must target Token 1
  const startBalances = criteria.predeterminedBalances?.incrementedBalances?.startBalances ?? [];
  if (startBalances.length !== 1) {
    errors.push(`${prefix}: must have exactly 1 start balance entry, got ${startBalances.length}`);
  } else {
    if (!isExactRange(startBalances[0].tokenIds, '1', '1')) {
      errors.push(`${prefix}: start balance must target token ID 1 (refund token)`);
    }
  }

  // Manual balances must be empty
  if ((criteria.predeterminedBalances?.manualBalances?.length ?? 0) > 0) {
    errors.push(`${prefix}: manualBalances must be empty`);
  }

  // require* flags
  if (criteria.requireToEqualsInitiatedBy === true) {
    errors.push(`${prefix}: requireToEqualsInitiatedBy must be false`);
  }
  if (criteria.requireFromEqualsInitiatedBy === true) {
    errors.push(`${prefix}: requireFromEqualsInitiatedBy must be false`);
  }
  if (criteria.requireToDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireToDoesNotEqualInitiatedBy must be false`);
  }
  if (criteria.requireFromDoesNotEqualInitiatedBy === true) {
    errors.push(`${prefix}: requireFromDoesNotEqualInitiatedBy must be false`);
  }

  if (criteria.overridesFromOutgoingApprovals !== true) {
    errors.push(`${prefix}: overridesFromOutgoingApprovals must be true`);
  }
  if (criteria.overridesToIncomingApprovals !== true) {
    errors.push(`${prefix}: overridesToIncomingApprovals must be true`);
  }

  // No challenges
  validateNoChallenges(criteria, prefix, errors);

  if (criteria.allowBackedMinting === true) {
    errors.push(`${prefix}: allowBackedMinting must be false`);
  }
  if (criteria.allowSpecialWrapping === true) {
    errors.push(`${prefix}: allowSpecialWrapping must be false`);
  }
  // mustPrioritize is acceptable (ensures this approval is checked first)

  validateDefaultAddressChecks(criteria, prefix, errors);
  validateNoAutoDeletion(criteria, prefix, errors);
}

// ---------------------------------------------------------------------------
// validateCrowdfundCollection
// ---------------------------------------------------------------------------

/**
 * Strict structural validation for crowdfund collections.
 *
 * Validates every field that matters for correctness and safety:
 * - Standards include "Crowdfund"
 * - Valid token IDs are exactly [{start: 1, end: 2}]
 * - All permissions are frozen
 * - 4 approvals: deposit-refund, deposit-progress, success, refund
 * - Cross-approval consistency (same denom, deadline alignment, goal amounts)
 * - mustOwnTokens references correct token and amounts
 * - Transfer time gates align with deadline
 * - allowAmountScaling set correctly
 * - Token metadata exists
 */
export function validateCrowdfundCollection(collection: any): CrowdfundValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: CrowdfundValidationResult['details'] = {
    hasDepositRefundApproval: false,
    hasDepositProgressApproval: false,
    hasSuccessApproval: false,
    hasRefundApproval: false
  };

  if (!collection) {
    errors.push('Collection is missing or undefined');
    return { valid: false, errors, warnings, details };
  }

  // 1. Standards
  const standards: string[] = collection.standards ?? [];
  if (!standards.includes('Crowdfund')) {
    errors.push('Collection standards must include "Crowdfund"');
  }

  // 2. Valid token IDs — exactly Token 1 (refund) and Token 2 (progress)
  const validTokenIds = collection.validTokenIds ?? [];
  if (!isExactRange(validTokenIds, '1', '2')) {
    errors.push('Valid token IDs must be exactly [{start: 1, end: 2}] (token 1 = refund, token 2 = progress)');
  }

  // 3. Token metadata should exist
  const tokenMetadata = collection.tokenMetadata ?? [];
  if (!collection.collectionMetadata?.metadata?.name) {
    warnings.push('Collection metadata is missing a name');
  }
  if (tokenMetadata.length === 0 && (!collection.defaultBalances?.balances || collection.defaultBalances.balances.length === 0)) {
    warnings.push('No token metadata found — tokens may display without names/images');
  }

  // 4. Permissions — critical ones are errors, others are warnings
  const perms = collection.collectionPermissions;
  if (!perms) {
    errors.push('Collection permissions are missing');
  } else {
    // Critical permissions that MUST be frozen — changing these would break the crowdfund
    const criticalPerms: [string, string][] = [
      ['canDeleteCollection', 'Delete collection'],
      ['canUpdateCollectionApprovals', 'Update collection approvals'],
      ['canUpdateValidTokenIds', 'Update valid token IDs'],
      ['canUpdateStandards', 'Update standards']
    ];
    for (const [key, label] of criticalPerms) {
      if (!isFrozen(perms[key])) {
        errors.push(`Permission "${label}" must be frozen (permanently forbidden) — changing this would compromise the crowdfund`);
      }
    }

    // Non-critical permissions that should be frozen for defense in depth
    const advisoryPerms: [string, string][] = [
      ['canArchiveCollection', 'Archive collection'],
      ['canUpdateCustomData', 'Update custom data'],
      ['canUpdateManager', 'Update manager'],
      ['canUpdateCollectionMetadata', 'Update collection metadata'],
      ['canUpdateTokenMetadata', 'Update token metadata'],
      ['canAddMoreAliasPaths', 'Add more alias paths'],
      ['canAddMoreCosmosCoinWrapperPaths', 'Add more Cosmos coin wrapper paths']
    ];
    for (const [key, label] of advisoryPerms) {
      if (!isFrozen(perms[key])) {
        warnings.push(`Permission "${label}" should be frozen (permanently forbidden)`);
      }
    }
  }

  // 5. Approvals — must have exactly 4
  const approvals: any[] = collection.collectionApprovals ?? [];
  if (approvals.length < 4 || approvals.length > 5) {
    errors.push(`Expected 4-5 collection approvals, got ${approvals.length}`);
  }

  // Identify each approval by structural pattern
  const depositRefund = approvals.find((a: any) =>
    a.fromListId === 'Mint' && a.toListId === 'All' &&
    (a.approvalCriteria?.coinTransfers?.length ?? 0) > 0
  );
  const depositProgress = approvals.find((a: any) =>
    a.fromListId === 'Mint' && a.toListId !== 'All' && a.toListId !== BURN_ADDRESS &&
    (a.approvalCriteria?.coinTransfers?.length ?? 0) === 0
  );
  const success = approvals.find((a: any) =>
    a.fromListId === 'Mint' && a.toListId === BURN_ADDRESS &&
    (a.approvalCriteria?.mustOwnTokens?.length ?? 0) > 0
  );
  const refund = approvals.find((a: any) =>
    a.fromListId === '!Mint' && a.toListId === BURN_ADDRESS &&
    a.approvalCriteria?.coinTransfers?.[0]?.overrideToWithInitiator === true
  );

  // Validate deposit-refund
  let depositDenom: string | undefined;
  let deadlineTime: string | undefined;
  if (!depositRefund) {
    errors.push('Missing deposit-refund approval (Mint -> All, with coinTransfer)');
  } else {
    details.hasDepositRefundApproval = true;
    const res = validateDepositRefundApproval(depositRefund, errors, warnings);
    depositDenom = res.depositDenom;
    deadlineTime = res.deadlineTime;
    details.depositDenom = depositDenom;
    details.deadlineTime = deadlineTime;
  }

  // Validate deposit-progress
  if (!depositProgress) {
    errors.push('Missing deposit-progress approval (Mint -> crowdfunder, no coinTransfer)');
  } else {
    details.hasDepositProgressApproval = true;
    const res = validateDepositProgressApproval(depositProgress, errors, warnings, deadlineTime);
    details.crowdfunderAddress = res.crowdfunderAddress;
  }

  // Validate success (withdraw)
  let goalAmount: string | undefined;
  if (!success) {
    errors.push('Missing success (withdraw) approval (Mint -> burn, with mustOwnTokens)');
  } else {
    details.hasSuccessApproval = true;
    const res = validateSuccessApproval(success, errors, warnings, details.crowdfunderAddress, depositDenom, deadlineTime, collection);
    goalAmount = res.goalAmount;
    details.goalAmount = goalAmount;
  }

  // Validate refund
  if (!refund) {
    errors.push('Missing refund approval (!Mint -> burn, with overrideToWithInitiator)');
  } else {
    details.hasRefundApproval = true;
    validateRefundApproval(refund, errors, warnings, details.crowdfunderAddress, depositDenom, deadlineTime, goalAmount, collection);
  }

  // 6. Cross-approval consistency — all coinTransfer denoms must match
  const allWithCoinTransfers = [depositRefund, success, refund].filter(Boolean);
  const denoms = new Set(
    allWithCoinTransfers
      .map((a: any) => a?.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom)
      .filter(Boolean)
  );
  if (denoms.size > 1) {
    errors.push(`All coinTransfers must use the same denom, found: ${[...denoms].join(', ')}`);
  }

  // 7. Cross-validate refund and success transfer time windows align
  if (refund && success) {
    const refundStart = n(refund.transferTimes?.[0]?.start);
    const successStart = n(success.transferTimes?.[0]?.start);
    if (refundStart !== successStart) {
      errors.push(`Refund transfer time start (${refundStart}) must match success transfer time start (${successStart}) — both unlock after deadline`);
    }
  }

  // 8. Cross-validate coinTransfer amounts are consistent (all should be 1:1 with scaling)
  for (const appr of allWithCoinTransfers) {
    const ct = appr?.approvalCriteria?.coinTransfers?.[0];
    const sb = appr?.approvalCriteria?.predeterminedBalances?.incrementedBalances?.startBalances?.[0];
    if (ct?.coins?.[0] && sb) {
      const coinAmount = n(ct.coins[0].amount);
      const tokenAmount = n(sb.amount);
      if (coinAmount !== tokenAmount) {
        const apprId = appr.approvalId ?? 'unknown';
        warnings.push(`Approval "${apprId}": coinTransfer amount (${coinAmount}) differs from startBalance amount (${tokenAmount}) — verify scaling ratio is intentional`);
      }
    }
  }

  // 9. Verify no extra approvals beyond the expected ones
  const burnApproval = approvals.find((a: any) =>
    a.fromListId === '!Mint' && a.toListId === BURN_ADDRESS && (a.approvalCriteria?.coinTransfers?.length ?? 0) === 0
  );
  const recognizedApprovals = [depositRefund, depositProgress, success, refund, burnApproval].filter(Boolean);
  const unrecognized = approvals.filter((a: any) => !recognizedApprovals.includes(a));
  if (unrecognized.length > 0) {
    errors.push(`Found ${unrecognized.length} unrecognized approval(s)`);
  }

  // 10. Default balances should not grant any initial balances
  const defaultBals = collection.defaultBalances?.balances ?? [];
  if (defaultBals.length > 0) {
    const hasNonZero = defaultBals.some((b: any) => BigInt(b.amount ?? 0) > 0n);
    if (hasNonZero) {
      errors.push('Default balances must not grant initial token balances — all tokens should come through approvals');
    }
  }

  return { valid: errors.length === 0, errors, warnings, details };
}

/**
 * Quick boolean check — returns true if the collection passes structural validation
 * (no errors). Warnings are acceptable.
 */
export function doesCollectionFollowCrowdfundProtocol(collection: any): boolean {
  const result = validateCrowdfundCollection(collection);
  if (!result.valid) {
    console.log('[CrowdfundValidator] errors:', result.errors);
  }
  return result.valid;
}

export class CrowdfundRegistry {
  /** Deposit-Refund: contributor pays USDC → gets Token ID 1 (refund receipt) */
  static depositRefundApproval(params: CrowdfundParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Deposit', description: 'Contribute USDC and receive a refund token', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.AllAddresses(),
      toListId: 'All',
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: params.deadlineTime }],
      tokenIds: TOKEN_REFUND,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `crowdfund-deposit-refund-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [{
          to: 'Mint',
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false,
          coins: [{ denom: params.depositDenom, amount: 1n }]
        }],
        predeterminedBalances: {
          manualBalances: [],
          orderCalculationMethod: defaultOrderCalc(),
          incrementedBalances: {
            startBalances: [{ amount: 1n, tokenIds: TOKEN_REFUND, ownershipTimes: UintRangeArray.FullRanges() }],
            incrementTokenIdsBy: 0n, incrementOwnershipTimesBy: 0n, durationFromTimestamp: 0n,
            allowOverrideTimestamp: false, allowOverrideWithAnyValidToken: false,
            allowAmountScaling: true, maxScalingMultiplier: MAX_UINT,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: unlimitedTransfers(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        mustOwnTokens: [],
        votingChallenges: [],
        requireToEqualsInitiatedBy: true,
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

  /** Deposit-Progress: mints Token ID 2 to crowdfunder (paired with deposit-refund, no coinTransfer) */
  static depositProgressApproval(params: CrowdfundParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Progress Tracker', description: 'Tracks cumulative contributions to crowdfunder', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.Reserved(params.crowdfunderAddress),
      toListId: params.crowdfunderAddress,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: [{ start: 1n, end: params.deadlineTime }],
      tokenIds: TOKEN_PROGRESS,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `crowdfund-deposit-progress-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [],
        predeterminedBalances: {
          manualBalances: [],
          orderCalculationMethod: defaultOrderCalc(),
          incrementedBalances: {
            startBalances: [{ amount: 1n, tokenIds: TOKEN_PROGRESS, ownershipTimes: UintRangeArray.FullRanges() }],
            incrementTokenIdsBy: 0n, incrementOwnershipTimesBy: 0n, durationFromTimestamp: 0n,
            allowOverrideTimestamp: false, allowOverrideWithAnyValidToken: false,
            allowAmountScaling: true, maxScalingMultiplier: MAX_UINT,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: unlimitedTransfers(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        mustOwnTokens: [],
        votingChallenges: [],
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

  /** Success: crowdfunder withdraws when mustOwnTokens(Token 2) >= goalAmount. No verifier. */
  static successApproval(params: CrowdfundParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Withdraw', description: 'Crowdfunder withdraws funds when goal is met', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('Mint'),
      fromListId: 'Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.Reserved(params.crowdfunderAddress),
      initiatedByListId: params.crowdfunderAddress,
      transferTimes: [{ start: params.deadlineTime + 1n, end: MAX_UINT }],
      tokenIds: TOKEN_REFUND,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `crowdfund-success-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [{
          to: params.crowdfunderAddress,
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: false,
          coins: [{ denom: params.depositDenom, amount: 1n }]
        }],
        predeterminedBalances: {
          manualBalances: [],
          orderCalculationMethod: defaultOrderCalc(),
          incrementedBalances: {
            startBalances: [{ amount: 1n, tokenIds: TOKEN_REFUND, ownershipTimes: UintRangeArray.FullRanges() }],
            incrementTokenIdsBy: 0n, incrementOwnershipTimesBy: 0n, durationFromTimestamp: 0n,
            allowOverrideTimestamp: false, allowOverrideWithAnyValidToken: false,
            allowAmountScaling: true, maxScalingMultiplier: MAX_UINT,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: maxOneTransfer(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        mustOwnTokens: [{
          collectionId: '0',
          amountRange: { start: params.goalAmount, end: MAX_UINT },
          ownershipTimes: UintRangeArray.FullRanges(),
          tokenIds: TOKEN_PROGRESS,
          overrideWithCurrentTime: true,
          mustSatisfyForAllAssets: true,
          ownershipCheckParty: params.crowdfunderAddress
        }],
        votingChallenges: [],
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

  /** Refund: after deadline + goal NOT met, contributors burn Token 1 → get USDC back
   *  mustOwnTokens checks crowdfunder has < goal of Token 2 (amountRange: 0 to goal-1) */
  static refundApproval(params: CrowdfundParams): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    const refundMustOwnTokens = [{
      collectionId: '0',
      amountRange: { start: 0n, end: params.goalAmount > 0n ? params.goalAmount - 1n : 0n },
      ownershipTimes: UintRangeArray.FullRanges(),
      tokenIds: TOKEN_PROGRESS,
      overrideWithCurrentTime: true,
      mustSatisfyForAllAssets: true,
      ownershipCheckParty: params.crowdfunderAddress
    }];
    return {
      details: { name: 'Refund', description: 'After deadline, burn refund token to reclaim deposit', image: '' },
      version: 0n,
      fromList: AddressList.AllAddresses(),
      fromListId: '!Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: [{ start: params.deadlineTime + 1n, end: MAX_UINT }],
      tokenIds: TOKEN_REFUND,
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `crowdfund-refund-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [{
          to: '',
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true,
          coins: [{ denom: params.depositDenom, amount: 1n }]
        }],
        predeterminedBalances: {
          manualBalances: [],
          orderCalculationMethod: defaultOrderCalc(),
          incrementedBalances: {
            startBalances: [{ amount: 1n, tokenIds: TOKEN_REFUND, ownershipTimes: UintRangeArray.FullRanges() }],
            incrementTokenIdsBy: 0n, incrementOwnershipTimesBy: 0n, durationFromTimestamp: 0n,
            allowOverrideTimestamp: false, allowOverrideWithAnyValidToken: false,
            allowAmountScaling: true, maxScalingMultiplier: MAX_UINT,
            recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
          }
        },
        maxNumTransfers: { overallMaxNumTransfers: MAX_UINT, perToAddressMaxNumTransfers: 0n, perFromAddressMaxNumTransfers: 0n, perInitiatedByAddressMaxNumTransfers: 0n, amountTrackerId: id, resetTimeIntervals: zeroResetIntervals },
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        mustOwnTokens: refundMustOwnTokens,
        votingChallenges: [],
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

  /** Burn: anyone can burn refund tokens (Token ID 1) to the burn address — cleanup after success */
  static burnApproval(): RequiredApprovalProps {
    const id = crypto.randomBytes(16).toString('hex');
    return {
      details: { name: 'Burn', description: 'Burn leftover refund tokens', image: '' },
      version: 0n,
      fromList: AddressList.Reserved('!Mint'),
      fromListId: '!Mint',
      toList: AddressList.Reserved(BURN_ADDRESS),
      toListId: BURN_ADDRESS,
      initiatedByList: AddressList.AllAddresses(),
      initiatedByListId: 'All',
      transferTimes: FOREVER,
      tokenIds: [{ start: 1n, end: 2n }],
      ownershipTimes: UintRangeArray.FullRanges(),
      approvalId: `crowdfund-burn-${id}`,
      approvalCriteria: {
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        senderChecks: defaultChecks,
        recipientChecks: defaultChecks,
        initiatorChecks: defaultChecks,
        coinTransfers: [],
        predeterminedBalances: {
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
        },
        maxNumTransfers: unlimitedTransfers(id),
        approvalAmounts: defaultApprovalAmounts(id),
        ...emptyArrayFields,
        mustOwnTokens: [],
        votingChallenges: [],
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

  static allApprovals(params: CrowdfundParams): RequiredApprovalProps[] {
    return [
      this.depositRefundApproval(params),
      this.depositProgressApproval(params),
      this.successApproval(params),
      this.refundApproval(params),
      this.burnApproval()
    ];
  }

  static frozenPermissions() {
    const frozen = [{ permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const frozenTokens = [{ tokenIds: FOREVER, permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER }];
    const allList = AddressList.AllAddresses();
    const frozenApprovals = [{
      approvalId: 'All', fromListId: 'All', fromList: allList, toListId: 'All', toList: allList,
      initiatedByListId: 'All', initiatedByList: allList, transferTimes: FOREVER, tokenIds: FOREVER,
      ownershipTimes: FOREVER, permanentlyPermittedTimes: [], permanentlyForbiddenTimes: FOREVER
    }];
    return {
      canDeleteCollection: frozen, canArchiveCollection: frozen, canUpdateStandards: frozen,
      canUpdateCustomData: frozen, canUpdateManager: frozen, canUpdateCollectionMetadata: frozen,
      canUpdateValidTokenIds: frozenTokens, canUpdateTokenMetadata: frozenTokens,
      canUpdateCollectionApprovals: frozenApprovals, canAddMoreAliasPaths: frozen,
      canAddMoreCosmosCoinWrapperPaths: frozen
    };
  }
}
