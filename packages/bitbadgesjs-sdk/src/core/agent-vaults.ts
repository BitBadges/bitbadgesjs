/**
 * Agent Vault helpers — consumer-side validator + extractor + lifecycle msg
 * builders (deposit / withdraw / pay / vote).
 *
 * An Agent Vault is a Smart Token (`standards: ['Smart Token','Agent Vault']`)
 * with a gated withdrawal approval: a per-period spend cap, an optional time
 * window, and/or a one-time multisig "unlock" vote. The human is the manager;
 * the agent holds the vault tokens and withdraws within the gating.
 *
 * Source of truth for the shape is `core/builders/agent-vault.ts`. Deposit/
 * withdraw detection reuses the Smart Token substring matchers.
 */

import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import type { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { findDepositApproval, findWithdrawApproval } from './smart-tokens.js';
import { AGENT_VAULT_WITHDRAW_PROPOSAL_ID } from './builders/agent-vault.js';

const AV_MAX_UINT64 = '18446744073709551615';

export interface AgentVaultGating {
  /** Per-period withdrawal cap (base units of the backing coin) + the period. */
  cap?: { perPeriodBaseUnits: string; period: string };
  /** Restricted withdraw window (epoch-ms strings). */
  timeWindow?: { unlockAt: string; expiresAt: string };
  /** Multisig unlock challenge. */
  multisig?: {
    proposalId: string;
    quorumThreshold: string;
    voters: { address: string; weight: string }[];
  };
}

export interface AgentVaultDetails {
  /** Backing-address bb1... alias derived from the IBC denom. */
  backingAddress: string;
  /** Full IBC denom string the vault wraps (`ibc/...` or `ubadge`). */
  backingDenom: string;
  depositApproval: iCollectionApproval<bigint>;
  withdrawApproval: iCollectionApproval<bigint>;
  /** Gating parsed from the withdraw approval's criteria. */
  gating: AgentVaultGating;
}

export interface AgentVaultValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateAgentVaultCollection = (
  collection: Readonly<iCollectionDoc<bigint>>
): AgentVaultValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!collection.standards?.includes('Smart Token')) {
    errors.push('Missing "Smart Token" standard');
  }
  if (!collection.standards?.includes('Agent Vault')) {
    errors.push('Missing "Agent Vault" standard');
  }
  const backed = (collection.invariants as any)?.cosmosCoinBackedPath;
  if (!backed) {
    errors.push('Missing invariants.cosmosCoinBackedPath — Agent Vaults require an IBC backing path');
  }
  const vt = collection.validTokenIds;
  if (!vt || vt.length !== 1 || BigInt(vt[0].start) !== 1n || BigInt(vt[0].end) !== 1n) {
    errors.push('validTokenIds must be exactly [{start: 1, end: 1}]');
  }
  const approvals = collection.collectionApprovals ?? [];
  if (!findDepositApproval(approvals)) {
    errors.push('Missing deposit approval (approvalId must contain "deposit" or "back")');
  }
  if (!findWithdrawApproval(approvals)) {
    errors.push('Missing withdraw approval (approvalId must contain "withdraw" or "unback")');
  }

  return { valid: errors.length === 0, errors, warnings };
};

export const doesCollectionFollowAgentVaultProtocol = (
  collection: Readonly<iCollectionDoc<bigint>>
): boolean => {
  return validateAgentVaultCollection(collection).valid;
};

/** Parse the gating out of the withdraw approval's criteria + transferTimes. */
function parseGating(withdrawApproval: iCollectionApproval<bigint>): AgentVaultGating {
  const gating: AgentVaultGating = {};
  const crit: any = withdrawApproval.approvalCriteria;
  if (crit?.approvalAmounts) {
    gating.cap = {
      perPeriodBaseUnits: String(crit.approvalAmounts.perInitiatedByAddressApprovalAmount ?? '0'),
      period: String(crit.approvalAmounts.amountTrackerId ?? '').replace('withdrawal-', '')
    };
  }
  const tt: any = (withdrawApproval.transferTimes ?? [])[0];
  if (tt && !(String(tt.start) === '1' && String(tt.end) === AV_MAX_UINT64)) {
    gating.timeWindow = { unlockAt: String(tt.start), expiresAt: String(tt.end) };
  }
  const vc: any = crit?.votingChallenges?.[0];
  if (vc) {
    gating.multisig = {
      proposalId: String(vc.proposalId ?? ''),
      quorumThreshold: String(vc.quorumThreshold ?? '0'),
      voters: (vc.voters ?? []).map((v: any) => ({ address: String(v.address), weight: String(v.weight) }))
    };
  }
  return gating;
}

/** Extract backing metadata + approvals + gating. Returns null on shape mismatch. */
export function extractAgentVaultDetails(
  collection: Readonly<iCollectionDoc<bigint>>
): AgentVaultDetails | null {
  const backed = (collection.invariants as any)?.cosmosCoinBackedPath;
  if (!backed) return null;
  const approvals = collection.collectionApprovals ?? [];
  const depositApproval = findDepositApproval(approvals);
  const withdrawApproval = findWithdrawApproval(approvals);
  if (!depositApproval || !withdrawApproval) return null;

  const backingAddress = String(backed?.address ?? '') || String(depositApproval.fromListId ?? '');
  const backingDenom = String(backed?.conversion?.sideA?.denom ?? '');

  return {
    backingAddress,
    backingDenom,
    depositApproval,
    withdrawApproval,
    gating: parseGating(withdrawApproval)
  };
}

// ── Msg builders ───────────────────────────────────────────────────────────

export interface AgentVaultTransferMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}
export interface AgentVaultVoteMsg {
  typeUrl: '/tokenization.MsgCastVote';
  value: Record<string, unknown>;
}
export interface BankSendMsg {
  typeUrl: '/cosmos.bank.v1beta1.MsgSend';
  value: Record<string, unknown>;
}

function transfer(
  creator: string,
  collectionId: string,
  from: string,
  to: string,
  amount: string,
  approval: iCollectionApproval<bigint>
): AgentVaultTransferMsg {
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from,
          toAddresses: [to],
          balances: [
            {
              amount: String(amount),
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: AV_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: approval.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: String(approval.version ?? '0')
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

export interface AgentVaultLifecycleArgs {
  creator: string;
  collectionId: string;
  amount: string;
  details: AgentVaultDetails;
}

/** Deposit: fund the backing alias → mint agent-vault tokens to the caller. */
export function buildAgentVaultDepositMsg(args: AgentVaultLifecycleArgs): AgentVaultTransferMsg {
  const { creator, collectionId, amount, details } = args;
  return transfer(creator, collectionId, details.backingAddress, creator, amount, details.depositApproval);
}

/** Withdraw: burn agent-vault tokens → release backing coin to the caller (gated). */
export function buildAgentVaultWithdrawMsg(args: AgentVaultLifecycleArgs): AgentVaultTransferMsg {
  const { creator, collectionId, amount, details } = args;
  return transfer(creator, collectionId, creator, details.backingAddress, amount, details.withdrawApproval);
}

/**
 * Pay: atomically withdraw (gated unback) then bank-send the released backing
 * coin to a recipient. Two msgs in one tx — if the gated leg fails, the send
 * never executes. The recipient is never named in any approval; the gating
 * constrains the spend rate, not the destination.
 */
export function buildAgentVaultPayMsgs(
  args: AgentVaultLifecycleArgs & { to: string }
): [AgentVaultTransferMsg, BankSendMsg] {
  const { creator, collectionId, amount, details, to } = args;
  const withdraw = buildAgentVaultWithdrawMsg({ creator, collectionId, amount, details });
  const send: BankSendMsg = {
    typeUrl: '/cosmos.bank.v1beta1.MsgSend',
    value: {
      fromAddress: creator,
      toAddress: to,
      amount: [{ denom: details.backingDenom, amount: String(amount) }]
    }
  };
  return [withdraw, send];
}

/**
 * Vote: cast a weighted yes toward the withdraw approval's multisig unlock.
 * Mirrors the SDK's MsgCastVote shape — camelCase fields, exactly as the
 * `MsgCastVote` wrapper class (transactions/.../msgCastVote.ts) and the
 * deposit/withdraw transfer builders above expect. (Earlier this emitted
 * snake_case, which the `new MsgCastVote(v)` encoder in `bb deploy` drops,
 * leaving every field but `creator` undefined and crashing on broadcast.)
 * `yesWeight` is a 0–100 percent of this voter's assigned weight (default 100).
 */
export function buildAgentVaultVoteMsg(args: {
  creator: string;
  collectionId: string;
  details: AgentVaultDetails;
  yesWeight?: string;
}): AgentVaultVoteMsg {
  const { creator, collectionId, details, yesWeight = '100' } = args;
  const proposalId =
    details.withdrawApproval.approvalCriteria?.votingChallenges?.[0]?.proposalId ??
    AGENT_VAULT_WITHDRAW_PROPOSAL_ID;
  return {
    typeUrl: '/tokenization.MsgCastVote',
    value: {
      creator,
      collectionId: String(collectionId),
      approvalLevel: 'collection',
      approverAddress: '',
      approvalId: details.withdrawApproval.approvalId,
      proposalId,
      yesWeight: String(yesWeight)
    }
  };
}
