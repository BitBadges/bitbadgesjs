import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';

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
  // Coerce via BigInt() since the indexer's HTTP responses ship uint64 as
  // strings (`"1"`) but the SDK's internal types are bigint. Without
  // coercion these validators silently reject indexer-shaped collections.
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || BigInt(vt[0].start) !== 1n || BigInt(vt[0].end) !== 1n) {
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
    if (!mnt || BigInt(mnt.overallMaxNumTransfers) !== 1n) {
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
    if (start0 == null || start1 == null || BigInt(start0) !== 1n || BigInt(start1) !== 1n) {
      errors.push('Pay and deny transferTimes must start at 1 (active immediately)');
    }
    if (end0 == null || end1 == null || BigInt(end0) !== BigInt(end1)) {
      errors.push('Pay and deny must have the same expiration time');
    }
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowPaymentRequestProtocol = (
  collection: Readonly<iCollectionDoc<bigint>>
): boolean => {
  return validatePaymentRequestCollection(collection).valid;
};

// ── End-user helpers (lifted from frontend PaymentRequestView) ─────────────
//
// These let an off-FE caller (CLI, agent, integration script) inspect a
// PaymentRequest collection's split + status + build the pay/deny msgs
// without re-implementing the same logic. Source of truth for the shape
// is the FE's PaymentRequestView, which has been the canonical
// implementation since the standard shipped.

/** Lifecycle states for a PaymentRequest. Mirrors `iPaymentRequestInfo.status` from the indexer. */
export type PaymentRequestStatus = 'pending' | 'paid' | 'denied' | 'expired';

export interface PaymentRequestDetails {
  payApproval: iCollectionApproval<bigint>;
  denyApproval: iCollectionApproval<bigint>;
  payerAddress: string;
  recipientAddress: string;
  paymentCoins: { denom: string; amount: bigint }[];
  expirationTime: bigint;
}

/**
 * Split a PaymentRequest collection's 2 approvals into pay (has coinTransfer)
 * and deny (no coinTransfer, matched by transferTimes window). Returns null
 * if the shape doesn't match — caller should treat that as a non-conformant
 * collection (same outcome as `validatePaymentRequestCollection` failing).
 */
export function extractPaymentRequestDetails(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): PaymentRequestDetails | null {
  const payApproval = approvals.find((a) => (a.approvalCriteria?.coinTransfers?.length ?? 0) > 0);
  if (!payApproval) return null;

  const payEnd = BigInt(payApproval.transferTimes?.[0]?.end ?? 0);
  const denyApproval = approvals.find(
    (a) =>
      a !== payApproval &&
      BigInt(a.transferTimes?.[0]?.start ?? 0) === 1n &&
      BigInt(a.transferTimes?.[0]?.end ?? 0) === payEnd
  );
  if (!denyApproval) return null;

  const payerAddress = payApproval.initiatedByListId ?? '';
  const recipientAddress = payApproval.approvalCriteria?.coinTransfers?.[0]?.to ?? '';
  const paymentCoins = (payApproval.approvalCriteria?.coinTransfers?.[0]?.coins ?? []).map((c: any) => ({
    denom: String(c.denom),
    amount: BigInt(c.amount)
  }));
  return { payApproval, denyApproval, payerAddress, recipientAddress, paymentCoins, expirationTime: payEnd };
}

/**
 * Fallback status when the indexer hasn't enriched `collection.standardsInfo.PaymentRequest`
 * (preview / freshly-broadcast collections). Returns 'expired' past the deadline, 'pending'
 * otherwise — we don't try to derive 'paid'/'denied' from trackers here; that's the indexer's job.
 */
export function derivePaymentRequestStatusFallback(expirationMs: bigint): PaymentRequestStatus {
  if (expirationMs > 0n && BigInt(Date.now()) > expirationMs) return 'expired';
  return 'pending';
}

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const MAX_UINT64 = '18446744073709551615';

/** Single Msg envelope as the CLI emits it — JSON-ready, uint64s as strings. */
export interface PaymentRequestActionMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

/**
 * Build the `MsgTransferTokens` that fires either the pay or deny approval.
 * Gating is via `initiatedByListId` (scoped to the payer) — there's no
 * vote step. The pay approval's coinTransfer side-effect debits the
 * payer's wallet at execution time (no escrow); the deny approval has
 * no coinTransfer, just records the denial on-chain.
 */
function buildPaymentRequestSingleApprovalMsg(
  creator: string,
  collectionId: string,
  approval: iCollectionApproval<bigint>
): PaymentRequestActionMsg {
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: 'Mint',
          toAddresses: [BURN_ADDRESS],
          balances: [
            {
              amount: '1',
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: approval.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: '0'
            }
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

export function buildPaymentRequestPayMsg(
  creator: string,
  collectionId: string,
  payApproval: iCollectionApproval<bigint>
): PaymentRequestActionMsg {
  return buildPaymentRequestSingleApprovalMsg(creator, collectionId, payApproval);
}

export function buildPaymentRequestDenyMsg(
  creator: string,
  collectionId: string,
  denyApproval: iCollectionApproval<bigint>
): PaymentRequestActionMsg {
  return buildPaymentRequestSingleApprovalMsg(creator, collectionId, denyApproval);
}
