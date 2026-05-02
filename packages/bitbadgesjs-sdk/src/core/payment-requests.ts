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
 * Approval shape (2 approvals):
 *   - pay: initiatedByListId scoped to payer; coinTransfer to recipient with
 *     overrideFromWithApproverAddress=false so the chain defaults the
 *     coin-transfer "from" to the initiator (the payer).
 *   - deny: initiatedByListId scoped to payer; no coinTransfers — just
 *     records the denial via the mint-to-burn token vehicle.
 *
 * Both share `transferTimes: [{ start: 1, end: expirationMs }]`. After the
 * deadline neither can fire — expiration is implicit, no separate "expire"
 * approval needed (we don't have escrow to refund, so an expire branch
 * would be a no-op that just creates an on-chain marker).
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

  // 3. Exactly 2 collection approvals (pay + deny)
  const approvals = collection.collectionApprovals;
  if (approvals.length !== 2) {
    errors.push(`Expected exactly 2 approvals (pay, deny), found ${approvals.length}`);
    return { valid: false, errors, warnings };
  }

  // 4. Both: fromListId="Mint", toListId=burn address
  for (const a of approvals) {
    if (a.fromListId !== 'Mint') errors.push(`Approval "${a.approvalId}": fromListId must be "Mint"`);
    if (a.toListId !== BURN_ADDRESS) errors.push(`Approval "${a.approvalId}": toListId must be burn address`);
  }

  // 5. Both: maxNumTransfers.overallMaxNumTransfers = 1
  for (const a of approvals) {
    const mnt = a.approvalCriteria?.maxNumTransfers;
    if (!mnt || mnt.overallMaxNumTransfers !== 1n) {
      errors.push(`Approval "${a.approvalId}": overallMaxNumTransfers must be 1`);
    }
  }

  // 6. Both: overridesFromOutgoingApprovals=true, overridesToIncomingApprovals=true
  for (const a of approvals) {
    const ac = a.approvalCriteria;
    if (!ac?.overridesFromOutgoingApprovals) errors.push(`Approval "${a.approvalId}": overridesFromOutgoingApprovals must be true`);
    if (!ac?.overridesToIncomingApprovals) errors.push(`Approval "${a.approvalId}": overridesToIncomingApprovals must be true`);
  }

  // 7. Exactly 1 approval carries a coinTransfer (pay); the other has none.
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
    // Payer (the initiator scoped via initiatedByListId) MUST NOT be the
    // recipient — a PaymentRequest is a payment FROM payer TO recipient,
    // and a self-payment is a no-op that bypasses the entire intent of
    // the standard. Compare against the pay approval's initiator scope.
    const payerListId = withCoinTransfer[0].initiatedByListId;
    if (ct.to && payerListId && ct.to === payerListId) {
      errors.push('Pay approval recipient must not equal the payer (initiatedByListId)');
    }
  }

  // 8. Neither approval may use votingChallenges. Approval gating happens
  //    via initiatedByListId scoped to the payer — voting is a Bounty
  //    construct, not a PaymentRequest one.
  for (const a of approvals) {
    if (a.approvalCriteria?.votingChallenges && a.approvalCriteria.votingChallenges.length > 0) {
      errors.push(`Approval "${a.approvalId}": PaymentRequest must not use votingChallenges`);
    }
  }

  // 9. Pay and deny must share the same initiatedByListId (the payer) and
  //    the same transferTimes window.
  if (approvals.length === 2) {
    if (approvals[0].initiatedByListId !== approvals[1].initiatedByListId) {
      errors.push('Pay and deny approvals must share the same initiatedByListId (the payer)');
    }
    const start0 = approvals[0].transferTimes?.[0]?.start;
    const start1 = approvals[1].transferTimes?.[0]?.start;
    const end0 = approvals[0].transferTimes?.[0]?.end;
    const end1 = approvals[1].transferTimes?.[0]?.end;
    if (start0 !== 1n || start1 !== 1n) {
      errors.push('Pay and deny transferTimes must start at 1 (active immediately)');
    }
    if (end0 !== end1) errors.push('Pay and deny must have the same expiration time');
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowPaymentRequestProtocol = (
  collection: Readonly<iCollectionDoc<bigint>>
): boolean => {
  return validatePaymentRequestCollection(collection).valid;
};
