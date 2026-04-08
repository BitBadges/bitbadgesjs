import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

export interface CrowdfundValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  details?: {
    depositDenom?: string;
    deadlineTime?: bigint;
    crowdfunderAddress?: string;
    goalAmount?: bigint;
  };
}

export const validateCrowdfundCollection = (collection: Readonly<iCollectionDoc<bigint>>): CrowdfundValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const details: CrowdfundValidationResult['details'] = {};

  // 1. Standard
  if (!collection.standards?.includes('Crowdfund')) errors.push('Missing "Crowdfund" standard');

  // 2. validTokenIds = [{1,2}]
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || vt[0].start !== 1n || vt[0].end !== 2n) {
    errors.push('validTokenIds must be [{start: 1, end: 2}] (refund + progress tokens)');
  }

  // 3. Permissions frozen
  const perms = collection.collectionPermissions;
  const checkFrozen = (field: string, perm: any[]) => {
    if (!perm || perm.length === 0) {
      warnings.push(`Permission ${field} is not frozen (should be for crowdfunds)`);
    }
  };
  checkFrozen('canDeleteCollection', perms.canDeleteCollection);
  checkFrozen('canUpdateCollectionApprovals', perms.canUpdateCollectionApprovals);
  checkFrozen('canUpdateValidTokenIds', perms.canUpdateValidTokenIds);
  checkFrozen('canUpdateStandards', perms.canUpdateStandards);

  // 4. Need 4-5 approvals
  const approvals = collection.collectionApprovals;
  if (approvals.length < 4) {
    errors.push(`Expected at least 4 approvals (deposit-refund, deposit-progress, success, refund), found ${approvals.length}`);
    return { valid: false, errors, warnings, details };
  }

  // Find each approval type
  const depositRefund = approvals.find(
    (a) => a.fromListId === 'Mint' && a.toListId === 'All' && a.tokenIds?.[0]?.start === 1n && a.tokenIds?.[0]?.end === 1n
  );
  const depositProgress = approvals.find(
    (a) => a.fromListId === 'Mint' && a.toListId !== 'All' && a.toListId !== BURN_ADDRESS && a.tokenIds?.[0]?.start === 2n
  );
  const success = approvals.find(
    (a) => a.fromListId === 'Mint' && a.toListId === BURN_ADDRESS && a.approvalCriteria?.mustOwnTokens?.length
  );
  // Refund: !Mint -> burn, with mustOwnTokens
  const refund = approvals.find(
    (a) =>
      a.fromListId !== 'Mint' && a.toListId === BURN_ADDRESS && a.approvalCriteria?.mustOwnTokens?.length && a.tokenIds?.[0]?.start === 1n
  );

  if (!depositRefund) errors.push('Missing deposit-refund approval (Mint->All, token 1)');
  if (!depositProgress) errors.push('Missing deposit-progress approval (Mint->crowdfunder, token 2)');
  if (!success) errors.push('Missing success approval (Mint->burn, with mustOwnTokens)');
  if (!refund) errors.push('Missing refund approval (!Mint->burn, token 1, with mustOwnTokens)');

  if (!depositRefund || !depositProgress || !success || !refund) {
    return { valid: false, errors, warnings, details };
  }

  // Extract details
  details.crowdfunderAddress = depositProgress.toListId;
  details.depositDenom = depositRefund.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom
    ? String(depositRefund.approvalCriteria.coinTransfers[0].coins[0].denom)
    : undefined;
  details.deadlineTime = depositRefund.transferTimes?.[0]?.end;
  details.goalAmount = success.approvalCriteria?.mustOwnTokens?.[0]?.amountRange?.start;

  // Validate deposit-refund
  const drCriteria = depositRefund.approvalCriteria;
  if (!drCriteria?.overridesFromOutgoingApprovals) errors.push('Deposit-refund: overridesFromOutgoingApprovals must be true');
  if (!drCriteria?.overridesToIncomingApprovals) errors.push('Deposit-refund: overridesToIncomingApprovals must be true');
  if (!drCriteria?.requireToEqualsInitiatedBy) errors.push('Deposit-refund: requireToEqualsInitiatedBy must be true');
  const drIb = drCriteria?.predeterminedBalances?.incrementedBalances;
  if (!drIb?.allowAmountScaling) errors.push('Deposit-refund: allowAmountScaling must be true');
  if (!drCriteria?.coinTransfers?.length) errors.push('Deposit-refund: must have coinTransfers');

  // Validate deposit-progress
  const dpCriteria = depositProgress.approvalCriteria;
  if (!dpCriteria?.overridesFromOutgoingApprovals) errors.push('Deposit-progress: overridesFromOutgoingApprovals must be true');
  if (!dpCriteria?.overridesToIncomingApprovals) errors.push('Deposit-progress: overridesToIncomingApprovals must be true');
  const dpIb = dpCriteria?.predeterminedBalances?.incrementedBalances;
  if (!dpIb?.allowAmountScaling) errors.push('Deposit-progress: allowAmountScaling must be true');

  // Validate success
  const sCriteria = success.approvalCriteria;
  if (success.initiatedByListId !== details.crowdfunderAddress) {
    errors.push('Success: initiatedByListId must be crowdfunder address');
  }
  if (!sCriteria?.coinTransfers?.[0]?.overrideFromWithApproverAddress) {
    errors.push('Success: coinTransfer must use overrideFromWithApproverAddress=true (escrow payout)');
  }
  const sMot = sCriteria?.mustOwnTokens?.[0];
  if (sMot && sMot.tokenIds?.[0]?.start !== 2n) {
    errors.push('Success: mustOwnTokens must check token 2 (progress token)');
  }
  if (sMot && (sMot.amountRange?.start ?? 0n) <= 0n) {
    errors.push('Success: mustOwnTokens amountRange.start must be > 0 (goal amount)');
  }

  // Validate refund
  const rCriteria = refund.approvalCriteria;
  if (!rCriteria?.coinTransfers?.[0]?.overrideFromWithApproverAddress) {
    errors.push('Refund: coinTransfer must use overrideFromWithApproverAddress=true');
  }
  if (!rCriteria?.coinTransfers?.[0]?.overrideToWithInitiator) {
    errors.push('Refund: coinTransfer must use overrideToWithInitiator=true (pay back contributor)');
  }
  const rMot = rCriteria?.mustOwnTokens?.[0];
  if (rMot && rMot.tokenIds?.[0]?.start !== 2n) {
    errors.push('Refund: mustOwnTokens must check token 2 (progress token)');
  }

  // Cross-check: denoms match
  const successDenom = sCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom;
  const refundDenom = rCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom;
  if (details.depositDenom && successDenom && String(successDenom) !== details.depositDenom) {
    errors.push('Success denom must match deposit denom');
  }
  if (details.depositDenom && refundDenom && String(refundDenom) !== details.depositDenom) {
    errors.push('Refund denom must match deposit denom');
  }

  return { valid: errors.length === 0, errors, warnings, details };
};

export const doesCollectionFollowCrowdfundProtocol = (collection: Readonly<iCollectionDoc<bigint>>): boolean => {
  return validateCrowdfundCollection(collection).valid;
};
