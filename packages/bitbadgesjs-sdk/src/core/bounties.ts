import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';

export interface BountyValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateBountyCollection = (collection: Readonly<iCollectionDoc<bigint>>): BountyValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

  // 1. Standard includes "Bounty"
  if (!collection.standards?.includes('Bounty')) errors.push('Missing "Bounty" standard');

  // 2. validTokenIds = exactly [{1,1}]
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || vt[0].start !== 1n || vt[0].end !== 1n) {
    errors.push('validTokenIds must be exactly [{start: 1, end: 1}]');
  }

  // 3. Exactly 3 collection approvals
  const approvals = collection.collectionApprovals;
  if (approvals.length !== 3) {
    errors.push(`Expected exactly 3 approvals (accept, deny, expire), found ${approvals.length}`);
    return { valid: false, errors, warnings };
  }

  // 4. All 3: fromListId="Mint", toListId=burn address
  for (const a of approvals) {
    if (a.fromListId !== 'Mint') errors.push(`Approval "${a.approvalId}": fromListId must be "Mint"`);
    if (a.toListId !== BURN_ADDRESS) errors.push(`Approval "${a.approvalId}": toListId must be burn address`);
  }

  // 5. All 3: maxNumTransfers.overallMaxNumTransfers = 1
  for (const a of approvals) {
    const mnt = a.approvalCriteria?.maxNumTransfers;
    if (!mnt || mnt.overallMaxNumTransfers !== 1n) {
      errors.push(`Approval "${a.approvalId}": overallMaxNumTransfers must be 1`);
    }
  }

  // 6. All 3: overridesFromOutgoingApprovals=true, overridesToIncomingApprovals=true
  for (const a of approvals) {
    const ac = a.approvalCriteria;
    if (!ac?.overridesFromOutgoingApprovals) errors.push(`Approval "${a.approvalId}": overridesFromOutgoingApprovals must be true`);
    if (!ac?.overridesToIncomingApprovals) errors.push(`Approval "${a.approvalId}": overridesToIncomingApprovals must be true`);
  }

  // 7. All 3: coinTransfers.length=1, overrideFromWithApproverAddress=true
  for (const a of approvals) {
    const ct = a.approvalCriteria?.coinTransfers;
    if (!ct || ct.length !== 1) {
      errors.push(`Approval "${a.approvalId}": must have exactly 1 coinTransfer`);
    } else if (!ct[0].overrideFromWithApproverAddress) {
      errors.push(`Approval "${a.approvalId}": coinTransfer must have overrideFromWithApproverAddress=true`);
    }
  }

  // 8. Exactly 2 approvals have votingChallenges, 1 has none
  const withVoting = approvals.filter((a) => a.approvalCriteria?.votingChallenges && a.approvalCriteria.votingChallenges.length > 0);
  const withoutVoting = approvals.filter((a) => !a.approvalCriteria?.votingChallenges || a.approvalCriteria.votingChallenges.length === 0);
  if (withVoting.length !== 2) errors.push(`Expected 2 approvals with votingChallenges (accept+deny), found ${withVoting.length}`);
  if (withoutVoting.length !== 1) errors.push(`Expected 1 approval without votingChallenges (expire), found ${withoutVoting.length}`);

  // 9. Accept+deny have same verifier and pay to different addresses
  if (withVoting.length === 2) {
    const v0 = withVoting[0].approvalCriteria?.votingChallenges?.[0]?.voters?.[0]?.address;
    const v1 = withVoting[1].approvalCriteria?.votingChallenges?.[0]?.voters?.[0]?.address;
    if (v0 !== v1) errors.push('Accept and deny must have the same verifier address');

    // Accept and deny must pay to different addresses (recipient vs submitter)
    const payout0 = withVoting[0].approvalCriteria?.coinTransfers?.[0]?.to;
    const payout1 = withVoting[1].approvalCriteria?.coinTransfers?.[0]?.to;
    if (payout0 && payout1 && payout0 === payout1) {
      errors.push('Accept and deny must pay out to different addresses (recipient vs submitter)');
    }

    // Same transferTimes end
    const end0 = withVoting[0].transferTimes?.[0]?.end;
    const end1 = withVoting[1].transferTimes?.[0]?.end;
    if (end0 !== end1) errors.push('Accept and deny must have the same expiration time');
  }

  // 10. Expire transferTimes starts after accept/deny
  if (withVoting.length >= 1 && withoutVoting.length === 1) {
    const votingEnd = withVoting[0].transferTimes?.[0]?.end ?? 0n;
    const expireStart = withoutVoting[0].transferTimes?.[0]?.start ?? 0n;
    if (expireStart <= votingEnd) errors.push('Expire approval must start after accept/deny expiration');
  }

  // 11. All coinTransfers use same denom and amount
  const denoms = new Set(approvals.map((a) => a.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom).filter(Boolean));
  if (denoms.size > 1) errors.push('All approvals must use the same coin denom');
  const amounts = new Set(
    approvals.map((a) => String(a.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.amount)).filter((a) => a !== 'undefined')
  );
  if (amounts.size > 1) errors.push('All approvals must transfer the same amount');

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowBountyProtocol = (collection: Readonly<iCollectionDoc<bigint>>): boolean => {
  return validateBountyCollection(collection).valid;
};
