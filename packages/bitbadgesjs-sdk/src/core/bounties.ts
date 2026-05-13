import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';

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

// ── End-user helpers (lifted from frontend BountyView) ─────────────────────
//
// These let an off-FE caller (CLI, agent, integration script) inspect a
// Bounty collection's 3 approvals + status + build the accept/deny/refund
// msgs without re-implementing the same logic. Source of truth for the
// shape is the FE's BountyView, which has been the canonical
// implementation since the standard shipped.

/** Lifecycle states for a Bounty. Mirrors `iBountyInfo.status` from the indexer. */
export type BountyStatus = 'pending' | 'accepted' | 'denied' | 'expired';

export interface BountyDetails {
  acceptApproval: iCollectionApproval<bigint>;
  denyApproval: iCollectionApproval<bigint>;
  expireApproval: iCollectionApproval<bigint>;
  verifierAddress: string;
  recipientAddress: string;
  submitterAddress: string;
  depositCoins: { denom: string; amount: bigint }[];
  expirationTime: bigint;
}

/**
 * Split a Bounty collection's 3 approvals into accept / deny / expire.
 * - Accept and deny both carry a votingChallenge.
 * - Expire has no votingChallenge — it's the deadline-fallback refund.
 * - Accept pays recipient; deny pays submitter. They're disambiguated by
 *   whose address the coinTransfer targets (the expire approval's payout
 *   address IS the submitter).
 *
 * Returns null on shape mismatch; caller should treat that as non-conformant.
 */
export function extractBountyDetails(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): BountyDetails | null {
  const withVoting = approvals.filter((a) => (a.approvalCriteria?.votingChallenges?.length ?? 0) > 0);
  const withoutVoting = approvals.filter((a) => (a.approvalCriteria?.votingChallenges?.length ?? 0) === 0);
  if (withVoting.length !== 2 || withoutVoting.length !== 1) return null;

  const expireApproval = withoutVoting[0];
  const submitterAddress = expireApproval.approvalCriteria?.coinTransfers?.[0]?.to ?? '';

  const acceptApproval = withVoting.find((a) => a.approvalCriteria?.coinTransfers?.[0]?.to !== submitterAddress);
  const denyApproval = withVoting.find((a) => a.approvalCriteria?.coinTransfers?.[0]?.to === submitterAddress);
  if (!acceptApproval || !denyApproval) return null;

  const verifierAddress = acceptApproval.approvalCriteria?.votingChallenges?.[0]?.voters?.[0]?.address ?? '';
  const recipientAddress = acceptApproval.approvalCriteria?.coinTransfers?.[0]?.to ?? '';
  const depositCoins = (acceptApproval.approvalCriteria?.coinTransfers?.[0]?.coins ?? []).map((c: any) => ({
    denom: String(c.denom),
    amount: BigInt(c.amount)
  }));
  const expirationTime = BigInt(acceptApproval.transferTimes?.[0]?.end ?? 0);

  return {
    acceptApproval,
    denyApproval,
    expireApproval,
    verifierAddress,
    recipientAddress,
    submitterAddress,
    depositCoins,
    expirationTime
  };
}

/**
 * Distinguishes "window closed but expire not yet fired" from "expire branch executed".
 * The indexer collapses both into `status === 'expired'`, so this finer distinction
 * must come from the local approvalTracker. Used for the expire branch only —
 * accept/deny use the indexer status directly.
 */
export function isExpireApprovalExecuted(
  approval: iCollectionApproval<bigint>,
  collection: Readonly<iCollectionDoc<bigint>>
): boolean {
  const trackers = (collection as any)?.approvalTrackers ?? [];
  const tracker = trackers.find(
    (t: any) => t.approvalId === approval.approvalId && t.trackerType === 'overall'
  );
  return !!tracker && BigInt(tracker.numTransfers ?? 0) > 0n;
}

/**
 * Fallback status when the indexer hasn't enriched `collection.standardsInfo.Bounty`
 * (preview / freshly-broadcast collections). Returns 'expired' past the deadline,
 * 'pending' otherwise. Cannot derive 'accepted'/'denied' from FE state alone.
 */
export function deriveBountyStatusFallback(expirationMs: bigint): BountyStatus {
  if (expirationMs > 0n && BigInt(Date.now()) > expirationMs) return 'expired';
  return 'pending';
}

const BOUNTY_BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const BOUNTY_MAX_UINT64 = '18446744073709551615';

export interface BountyVoteMsg {
  typeUrl: '/tokenization.MsgCastVote';
  value: Record<string, unknown>;
}

export interface BountyTransferMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

/** Multi-msg tx wrapper used by accept/deny — the order is vote → transfer. */
export interface BountyTxWrapper {
  messages: [BountyVoteMsg, BountyTransferMsg];
}

function buildBountyTransferMsg(
  creator: string,
  collectionId: string,
  approval: iCollectionApproval<bigint>
): BountyTransferMsg {
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: 'Mint',
          toAddresses: [BOUNTY_BURN_ADDRESS],
          balances: [
            {
              amount: '1',
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: BOUNTY_MAX_UINT64 }]
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

function buildBountyVoteMsg(
  creator: string,
  collectionId: string,
  approval: iCollectionApproval<bigint>,
  yesWeight: string = '100'
): BountyVoteMsg {
  const proposalId = approval.approvalCriteria?.votingChallenges?.[0]?.proposalId ?? '';
  return {
    typeUrl: '/tokenization.MsgCastVote',
    value: {
      creator,
      collection_id: String(collectionId),
      approval_level: 'collection',
      approver_address: '',
      approval_id: approval.approvalId,
      proposal_id: proposalId,
      yes_weight: yesWeight
    }
  };
}

/**
 * Build the 2-msg tx wrapper the verifier signs to ACCEPT a bounty:
 * MsgCastVote(yes_weight=100) on the accept approval's proposal, then
 * MsgTransferTokens that fires the accept approval (payout to recipient).
 */
export function buildBountyAcceptTx(
  creator: string,
  collectionId: string,
  acceptApproval: iCollectionApproval<bigint>
): BountyTxWrapper {
  return {
    messages: [
      buildBountyVoteMsg(creator, collectionId, acceptApproval),
      buildBountyTransferMsg(creator, collectionId, acceptApproval)
    ]
  };
}

/**
 * Build the 2-msg tx wrapper the verifier signs to DENY a bounty:
 * same shape as accept, but targeting the deny approval (payout to submitter).
 */
export function buildBountyDenyTx(
  creator: string,
  collectionId: string,
  denyApproval: iCollectionApproval<bigint>
): BountyTxWrapper {
  return {
    messages: [
      buildBountyVoteMsg(creator, collectionId, denyApproval),
      buildBountyTransferMsg(creator, collectionId, denyApproval)
    ]
  };
}

/**
 * Build the single MsgTransferTokens that fires the expire approval —
 * available to anyone after the deadline passes; refunds the submitter
 * from escrow.
 */
export function buildBountyRefundMsg(
  creator: string,
  collectionId: string,
  expireApproval: iCollectionApproval<bigint>
): BountyTransferMsg {
  return buildBountyTransferMsg(creator, collectionId, expireApproval);
}
