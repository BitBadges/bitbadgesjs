import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';

export interface PaymentRequestValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * PaymentRequest is the inverse of Bounty: an agent (or any address) creates
 * the collection requesting payment, the targeted payer approves and pays
 * from their own wallet in a single action — no escrow up front.
 *
 * Approval shape (3 approvals, mirrors Bounty's accept/deny/expire):
 *   - pay: initiatedByListId scoped to payer; coinTransfer to recipient with
 *     overrideFromWithApproverAddress=false so the chain defaults the
 *     coin-transfer "from" to the initiator (the payer).
 *   - deny: initiatedByListId scoped to payer; no coinTransfers — just
 *     records the denial via the mint-to-burn token vehicle.
 *   - expire: initiatedByListId="All"; transferTimes starts after pay/deny
 *     end; no coinTransfers.
 *
 * NO mintEscrowCoinsToTransfer at the top level — that's the key
 * inversion vs. Bounty.
 */
export const validatePaymentRequestCollection = (
  collection: Readonly<iCollectionDoc<bigint>>
): PaymentRequestValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';

  // 1. Standard includes "PaymentRequest"
  if (!collection.standards?.includes('PaymentRequest')) errors.push('Missing "PaymentRequest" standard');

  // 2. validTokenIds = exactly [{1,1}]
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || vt[0].start !== 1n || vt[0].end !== 1n) {
    errors.push('validTokenIds must be exactly [{start: 1, end: 1}]');
  }

  // 3. Exactly 3 collection approvals
  const approvals = collection.collectionApprovals;
  if (approvals.length !== 3) {
    errors.push(`Expected exactly 3 approvals (pay, deny, expire), found ${approvals.length}`);
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

  // 7. Exactly 1 approval has a coinTransfer (pay); the other 2 have none.
  //    The pay approval must NOT use overrideFromWithApproverAddress — the
  //    chain default routes "from" to the initiator (the payer), which is
  //    the whole point of the no-escrow inversion.
  const withCoinTransfer = approvals.filter((a) => a.approvalCriteria?.coinTransfers && a.approvalCriteria.coinTransfers.length > 0);
  if (withCoinTransfer.length !== 1) {
    errors.push(`Expected exactly 1 approval with a coinTransfer (pay), found ${withCoinTransfer.length}`);
  } else {
    const ct = withCoinTransfer[0].approvalCriteria!.coinTransfers![0];
    if (ct.overrideFromWithApproverAddress) {
      errors.push('Pay approval must have overrideFromWithApproverAddress=false (debit initiator/payer, not escrow)');
    }
    if (!ct.to) errors.push('Pay approval coinTransfer must specify recipient address');
  }

  // 8. All approvals must NOT use votingChallenges. Approval gating happens
  //    via initiatedByListId scoped to the payer — voting is a Bounty
  //    construct, not a PaymentRequest one.
  for (const a of approvals) {
    if (a.approvalCriteria?.votingChallenges && a.approvalCriteria.votingChallenges.length > 0) {
      errors.push(`Approval "${a.approvalId}": PaymentRequest must not use votingChallenges`);
    }
  }

  // 9. Identify pay/deny/expire by transferTimes + coinTransfer presence.
  //    Pay and deny share the active window; expire starts after that window.
  const active = approvals.filter((a) => {
    const start = a.transferTimes?.[0]?.start ?? 0n;
    return start === 1n;
  });
  const expire = approvals.filter((a) => {
    const start = a.transferTimes?.[0]?.start ?? 0n;
    return start > 1n;
  });
  if (active.length !== 2) errors.push(`Expected 2 approvals active from start (pay+deny), found ${active.length}`);
  if (expire.length !== 1) errors.push(`Expected 1 expire approval starting after the active window, found ${expire.length}`);

  // 10. Pay and deny must share the same initiatedByListId (the payer).
  if (active.length === 2) {
    if (active[0].initiatedByListId !== active[1].initiatedByListId) {
      errors.push('Pay and deny approvals must share the same initiatedByListId (the payer)');
    }
    const end0 = active[0].transferTimes?.[0]?.end;
    const end1 = active[1].transferTimes?.[0]?.end;
    if (end0 !== end1) errors.push('Pay and deny must have the same expiration time');
  }

  // 11. Expire transferTimes starts after pay/deny end
  if (active.length >= 1 && expire.length === 1) {
    const activeEnd = active[0].transferTimes?.[0]?.end ?? 0n;
    const expireStart = expire[0].transferTimes?.[0]?.start ?? 0n;
    if (expireStart <= activeEnd) errors.push('Expire approval must start after pay/deny expiration');
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowPaymentRequestProtocol = (
  collection: Readonly<iCollectionDoc<bigint>>
): boolean => {
  return validatePaymentRequestCollection(collection).valid;
};
