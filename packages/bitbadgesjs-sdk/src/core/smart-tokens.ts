/**
 * Smart Token helpers — consumer-side validator + extractor + deposit/withdraw msg builders.
 *
 * A Smart Token collection is the unified primitive behind:
 *   - Vault-style wrappers (1:1 IBC-backed tokens)
 *   - AI agent vaults
 *   - Tradable Smart Tokens (with Liquidity Pools standard)
 *
 * It has at minimum two collection approvals (deposit + withdraw)
 * routing through an alias address derived from the backing IBC denom.
 * Users deposit by sending the IBC coin to that alias (chain auto-mints
 * the corresponding token to them); users withdraw by transferring the
 * token back to the alias (chain releases the IBC coin).
 *
 * Source of truth for the shape is `core/builders/smart-token.ts`.
 * FE uses pattern-matching (substring "deposit"|"back" / "withdraw"|"unback")
 * to find these approvals, so we match the same way for backwards
 * compatibility with collections built before the rename.
 */

import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import type { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';

export interface SmartTokenValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SmartTokenDetails {
  /** Backing-address bb1... alias derived from the IBC denom. */
  backingAddress: string;
  /** Full IBC denom string the collection wraps (`ibc/...` or `ubadge`). */
  backingDenom: string;
  depositApproval: iCollectionApproval<bigint>;
  withdrawApproval: iCollectionApproval<bigint>;
  /** True if `standards` includes "Liquidity Pools". */
  tradable: boolean;
  /** True if `standards` includes "AI Agent Vault". */
  aiAgentVault: boolean;
}

export const validateSmartTokenCollection = (
  collection: Readonly<iCollectionDoc<bigint>>
): SmartTokenValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Standard includes "Smart Token"
  if (!collection.standards?.includes('Smart Token')) {
    errors.push('Missing "Smart Token" standard');
  }

  // 2. cosmosCoinBackedPath invariant must be present — this is what
  //    distinguishes a Smart Token from a plain collection.
  const backed = (collection.invariants as any)?.cosmosCoinBackedPath;
  if (!backed) {
    errors.push('Missing invariants.cosmosCoinBackedPath — Smart Tokens require an IBC backing path');
  }

  // 3. validTokenIds = [{1,1}]
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || BigInt(vt[0].start) !== 1n || BigInt(vt[0].end) !== 1n) {
    errors.push('validTokenIds must be exactly [{start: 1, end: 1}]');
  }

  // 4. At least one deposit approval and one withdraw approval.
  //    Match by substring (same heuristic as FE).
  const approvals = collection.collectionApprovals ?? [];
  const deposit = findDepositApproval(approvals);
  const withdraw = findWithdrawApproval(approvals);
  if (!deposit) errors.push('Missing deposit approval (approvalId must contain "deposit" or "back")');
  if (!withdraw) errors.push('Missing withdraw approval (approvalId must contain "withdraw" or "unback")');

  // 5. Soft check: noForcefulPostMintTransfers should be true for
  //    wallet-like Smart Tokens. The new builder sets this; legacy
  //    collections may not. Warning, not error — caller can choose to
  //    upgrade.
  if (collection.invariants && (collection.invariants as any).noForcefulPostMintTransfers === false) {
    warnings.push('noForcefulPostMintTransfers is false; forceful transfers may be possible if a future approval enables them');
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowSmartTokenProtocol = (
  collection: Readonly<iCollectionDoc<bigint>>
): boolean => {
  return validateSmartTokenCollection(collection).valid;
};

/**
 * Find the deposit approval in a collection. Uses substring match
 * (deposit | back) to handle both the new naming (`smart-token-deposit`)
 * and legacy collections (`smart-account-backing`, `smart-token-backing`).
 *
 * Order matters: we check 'deposit' first (most specific) before falling
 * back to 'back' to avoid matching 'unbacking' (which contains 'back').
 */
export function findDepositApproval(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): iCollectionApproval<bigint> | undefined {
  // First pass: prefer the explicit "deposit" naming.
  const explicit = approvals.find((a) => a.approvalId?.toLowerCase().includes('deposit'));
  if (explicit) return explicit;
  // Fallback: legacy "*-backing" approvals. Skip anything that contains
  // "unback" so withdraw approvals don't match deposit.
  return approvals.find(
    (a) => a.approvalId?.toLowerCase().includes('back') && !a.approvalId?.toLowerCase().includes('unback')
  );
}

/**
 * Find the withdraw approval in a collection. Mirrors findDepositApproval
 * — checks 'withdraw' first, then falls back to 'unback'.
 */
export function findWithdrawApproval(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): iCollectionApproval<bigint> | undefined {
  const explicit = approvals.find((a) => a.approvalId?.toLowerCase().includes('withdraw'));
  if (explicit) return explicit;
  return approvals.find((a) => a.approvalId?.toLowerCase().includes('unback'));
}

/**
 * Extract the deposit/withdraw approvals + backing metadata from a
 * Smart Token collection. Returns null on shape mismatch; caller should
 * treat that as non-conformant.
 */
export function extractSmartTokenDetails(
  collection: Readonly<iCollectionDoc<bigint>>
): SmartTokenDetails | null {
  const backed = (collection.invariants as any)?.cosmosCoinBackedPath;
  if (!backed) return null;
  const approvals = collection.collectionApprovals ?? [];
  const depositApproval = findDepositApproval(approvals);
  const withdrawApproval = findWithdrawApproval(approvals);
  if (!depositApproval || !withdrawApproval) return null;

  // Backing address can come from invariants.cosmosCoinBackedPath.address
  // when the indexer populates it, OR from the deposit approval's
  // fromListId (which is exactly the backing address by construction).
  const backingAddress =
    String(backed?.address ?? '') || String(depositApproval.fromListId ?? '');
  const backingDenom = String(backed?.conversion?.sideA?.denom ?? '');

  return {
    backingAddress,
    backingDenom,
    depositApproval,
    withdrawApproval,
    tradable: !!collection.standards?.includes('Liquidity Pools'),
    aiAgentVault: !!collection.standards?.includes('AI Agent Vault')
  };
}

// ── Msg builders ───────────────────────────────────────────────────────────

const SMART_TOKEN_MAX_UINT64 = '18446744073709551615';

export interface SmartTokenTransferMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

export interface SmartTokenDepositArgs {
  /** Caller (bb1...) — the user receiving Smart Token units. */
  creator: string;
  /** Collection ID to deposit into. */
  collectionId: string;
  /** Smart Token units to mint to the caller (equal to backing-coin units sent). */
  amount: string;
  /** Resolved from `extractSmartTokenDetails`. */
  details: SmartTokenDetails;
}

/**
 * Build the deposit msg: a MsgTransferTokens with from=backingAddress,
 * to=caller, prioritizing the deposit approval. The chain auto-routes
 * the backing IBC coin from the caller's account into the backing
 * alias as part of executing the deposit approval — caller must have
 * the backing coin available.
 */
export function buildSmartTokenDepositMsg(args: SmartTokenDepositArgs): SmartTokenTransferMsg {
  const { creator, collectionId, amount, details } = args;
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: details.backingAddress,
          toAddresses: [creator],
          balances: [
            {
              amount: String(amount),
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: SMART_TOKEN_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: details.depositApproval.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: String(details.depositApproval.version ?? '0')
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

export interface SmartTokenWithdrawArgs {
  /** Caller (bb1...) — the user burning Smart Token units. */
  creator: string;
  /** Collection ID to withdraw from. */
  collectionId: string;
  /** Smart Token units to burn (equal to backing-coin units released). */
  amount: string;
  /** Resolved from `extractSmartTokenDetails`. */
  details: SmartTokenDetails;
}

/**
 * Build the withdraw msg: a MsgTransferTokens with from=caller,
 * to=backingAddress, prioritizing the withdraw approval. The chain
 * auto-routes the backing IBC coin out of the backing alias into the
 * caller's account.
 */
export function buildSmartTokenWithdrawMsg(args: SmartTokenWithdrawArgs): SmartTokenTransferMsg {
  const { creator, collectionId, amount, details } = args;
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: creator,
          toAddresses: [details.backingAddress],
          balances: [
            {
              amount: String(amount),
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: SMART_TOKEN_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: details.withdrawApproval.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: String(details.withdrawApproval.version ?? '0')
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
