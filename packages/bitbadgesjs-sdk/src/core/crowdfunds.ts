import { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';

const BURN_ADDRESS = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const MAX_UINT64 = '18446744073709551615';

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
  // overridesFromOutgoingApprovals is required by the Mint approval standard.
  // overridesToIncomingApprovals is NOT required — the recipient
  // auto-approves via defaultBalances.autoApproveAllIncomingTransfers and/or
  // autoApproveSelfInitiatedIncomingTransfers, so the collection-level
  // incoming override would be redundant. Setting it to true is allowed
  // but not required; setting it to false is the preferred default.
  const drCriteria = depositRefund.approvalCriteria;
  if (!drCriteria?.overridesFromOutgoingApprovals) errors.push('Deposit-refund: overridesFromOutgoingApprovals must be true');
  if (!drCriteria?.requireToEqualsInitiatedBy) errors.push('Deposit-refund: requireToEqualsInitiatedBy must be true');
  const drIb = drCriteria?.predeterminedBalances?.incrementedBalances;
  if (!drIb?.allowAmountScaling) errors.push('Deposit-refund: allowAmountScaling must be true');
  if (!drCriteria?.coinTransfers?.length) errors.push('Deposit-refund: must have coinTransfers');

  // Validate deposit-progress
  // Same incoming-override rationale as deposit-refund.
  const dpCriteria = depositProgress.approvalCriteria;
  if (!dpCriteria?.overridesFromOutgoingApprovals) errors.push('Deposit-progress: overridesFromOutgoingApprovals must be true');
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

// ── End-user helpers (lifted from FE CrowdfundView) ───────────────────────

export type CrowdfundStatus = 'active' | 'funded' | 'goal-met-pending-settle' | 'expired-refunding';

export interface CrowdfundDetails {
  depositRefundApproval: iCollectionApproval<bigint>;
  depositProgressApproval: iCollectionApproval<bigint>;
  successApproval: iCollectionApproval<bigint>;
  refundApproval: iCollectionApproval<bigint>;
  crowdfunderAddress: string;
  goalAmount: bigint;
  depositDenom: string;
  deadlineTime: bigint;
}

/**
 * Split a crowdfund's 4 approvals into deposit-refund / deposit-progress /
 * success / refund + extract config. Returns null on shape mismatch.
 * Lifted from FE `CrowdfundView.extractDetails`.
 */
export function extractCrowdfundDetails(
  approvals: ReadonlyArray<iCollectionApproval<bigint>>
): CrowdfundDetails | null {
  const depositRefund = approvals.find(
    (a) => a.fromListId === 'Mint' && a.toListId === 'All' && (a.approvalCriteria?.coinTransfers?.length ?? 0) > 0
  );
  const depositProgress = approvals.find(
    (a) =>
      a.fromListId === 'Mint' &&
      a.toListId !== 'All' &&
      a.toListId !== BURN_ADDRESS &&
      (a.approvalCriteria?.coinTransfers?.length ?? 0) === 0
  );
  const success = approvals.find(
    (a) =>
      a.fromListId === 'Mint' &&
      a.toListId === BURN_ADDRESS &&
      (a.approvalCriteria?.mustOwnTokens?.length ?? 0) > 0
  );
  const refund = approvals.find(
    (a) =>
      a.fromListId === '!Mint' &&
      a.toListId === BURN_ADDRESS &&
      (a.approvalCriteria?.coinTransfers?.length ?? 0) > 0
  );
  if (!depositRefund || !depositProgress || !success || !refund) return null;

  return {
    depositRefundApproval: depositRefund,
    depositProgressApproval: depositProgress,
    successApproval: success,
    refundApproval: refund,
    crowdfunderAddress: depositProgress.toListId ?? '',
    goalAmount: BigInt(success.approvalCriteria?.mustOwnTokens?.[0]?.amountRange?.start ?? 0),
    depositDenom: String(depositRefund.approvalCriteria?.coinTransfers?.[0]?.coins?.[0]?.denom ?? ''),
    deadlineTime: BigInt(depositRefund.transferTimes?.[0]?.end ?? 0)
  };
}

/** Compute status from indexer/standardsInfo if available, else from on-chain state + clock. */
export function deriveCrowdfundStatus(deadlineMs: bigint, raised: bigint, goal: bigint): CrowdfundStatus {
  const now = BigInt(Date.now());
  if (raised >= goal) return now > deadlineMs ? 'funded' : 'goal-met-pending-settle';
  if (now > deadlineMs) return 'expired-refunding';
  return 'active';
}

// ── Msg builders ──────────────────────────────────────────────────────────

interface MsgEnvelope {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

const fullOwnershipTimes = [{ start: '1', end: MAX_UINT64 }];

/**
 * Build the 2-msg contribute tx. Pipe to `bb deploy` — single tx, two
 * transfers inside it (mint token-1 to contributor + mint token-2 to
 * crowdfunder), each fired via its own deposit approval.
 */
export function buildContributeCrowdfundTx(
  creator: string,
  collectionId: string,
  details: CrowdfundDetails,
  amount: bigint
): { messages: [MsgEnvelope] } {
  if (amount <= 0n) throw new Error('buildContributeCrowdfundTx: --amount must be > 0');
  return {
    messages: [
      {
        typeUrl: '/tokenization.MsgTransferTokens',
        value: {
          creator,
          collectionId: String(collectionId),
          transfers: [
            {
              from: 'Mint',
              toAddresses: [creator],
              balances: [
                {
                  amount: amount.toString(),
                  tokenIds: [{ start: '1', end: '1' }],
                  ownershipTimes: fullOwnershipTimes
                }
              ],
              prioritizedApprovals: [
                {
                  approvalId: details.depositRefundApproval.approvalId,
                  approvalLevel: 'collection',
                  approverAddress: '',
                  version: '0'
                }
              ],
              onlyCheckPrioritizedCollectionApprovals: true,
              onlyCheckPrioritizedOutgoingApprovals: false,
              onlyCheckPrioritizedIncomingApprovals: false,
              memo: ''
            },
            {
              from: 'Mint',
              toAddresses: [details.crowdfunderAddress],
              balances: [
                {
                  amount: amount.toString(),
                  tokenIds: [{ start: '2', end: '2' }],
                  ownershipTimes: fullOwnershipTimes
                }
              ],
              prioritizedApprovals: [
                {
                  approvalId: details.depositProgressApproval.approvalId,
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
      }
    ]
  };
}

/**
 * Build the crowdfunder-side withdraw tx (only callable when goal met).
 * Fires the success approval to drain escrow + burns the crowdfunder's
 * accumulated progress tokens. 2-msg.
 */
export function buildWithdrawCrowdfundTx(
  creator: string,
  collectionId: string,
  details: CrowdfundDetails,
  raised: bigint,
  burnApprovalId?: string
): { messages: MsgEnvelope[] } {
  const messages: MsgEnvelope[] = [
    {
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
                amount: raised.toString(),
                tokenIds: [{ start: '1', end: '1' }],
                ownershipTimes: fullOwnershipTimes
              }
            ],
            prioritizedApprovals: [
              {
                approvalId: details.successApproval.approvalId,
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
    },
    {
      typeUrl: '/tokenization.MsgTransferTokens',
      value: {
        creator,
        collectionId: String(collectionId),
        transfers: [
          {
            from: creator,
            toAddresses: [BURN_ADDRESS],
            balances: [
              {
                amount: raised.toString(),
                tokenIds: [{ start: '2', end: '2' }],
                ownershipTimes: fullOwnershipTimes
              }
            ],
            prioritizedApprovals: burnApprovalId
              ? [
                  {
                    approvalId: burnApprovalId,
                    approvalLevel: 'collection',
                    approverAddress: '',
                    version: '0'
                  }
                ]
              : [],
            onlyCheckPrioritizedCollectionApprovals: !!burnApprovalId,
            onlyCheckPrioritizedOutgoingApprovals: false,
            onlyCheckPrioritizedIncomingApprovals: false,
            memo: ''
          }
        ]
      }
    }
  ];
  return { messages };
}

/**
 * Build the contributor-side refund tx — fires the refund approval to
 * pull funds back out of escrow. Single MsgTransferTokens.
 */
export function buildRefundCrowdfundMsg(
  creator: string,
  collectionId: string,
  details: CrowdfundDetails,
  amount: bigint
): MsgEnvelope {
  if (amount <= 0n) throw new Error('buildRefundCrowdfundMsg: --amount must be > 0');
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: creator,
          toAddresses: [BURN_ADDRESS],
          balances: [
            {
              amount: amount.toString(),
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: fullOwnershipTimes
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: details.refundApproval.approvalId,
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

void GO_MAX_UINT_64; // keep import; future use for timeline bounds
