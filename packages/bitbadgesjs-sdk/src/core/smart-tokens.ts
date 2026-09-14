import { isAddressValid } from '../address-converter/converter.js';
/** Supported 1:1 wrapper profiles; see docs/runbooks/standard-inspection.md for limits. */

import { generateAliasAddressForIBCBackedDenom } from './builders/shared.js';
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

export type SmartTokenInspection = {
  recognized: boolean;
  configurationSupported: boolean;
  backingAddress: string;
  backingDenom: string;
  actions: Record<'deposit' | 'withdraw', { approvalIds: string[]; requiresSelection: boolean }>;
  issues: string[];
  warnings: string[];
  eligibility: 'not-checked';
  authority: { manager: string; approvalUpdates: 'not-evaluated'; overrideApprovalIds: string[] };
};

const maximum = '18446744073709551615';
const exactRange = (ranges: any, start: string, end: string) =>
  Array.isArray(ranges) && ranges.length === 1 && String(ranges[0]?.start) === start && String(ranges[0]?.end) === end;
const active = (value: any): boolean => {
  if (value === undefined || value === null || value === false || value === '' || value === '0' || value === 0 || value === 0n) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.values(value).some(active);
  return true;
};
const depositName = (id: string) => id.includes('deposit') || (id.includes('back') && !id.includes('unback'));
const withdrawName = (id: string) => id.includes('withdraw') || id.includes('unback');

/** Checks the supported 1:1 wrapper profile, not balances, tracker capacity or signer eligibility. */
export function inspectSmartTokenCollection(collection: Readonly<iCollectionDoc<bigint>>): SmartTokenInspection {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recognized = !!collection.standards?.includes('Smart Token');
  if (collection.isArchived) issues.push('Collection is archived');
  if (!recognized) issues.push('Missing "Smart Token" standard');
  const path = collection.invariants?.cosmosCoinBackedPath;
  const conversion = path?.conversion;
  const backingDenom = String(conversion?.sideA?.denom ?? '');
  let backingAddress = '';
  if (!path) issues.push('Missing invariants.cosmosCoinBackedPath');
  if (
    !backingDenom ||
    String(conversion?.sideA?.amount) !== '1' ||
    conversion?.sideB?.length !== 1 ||
    String(conversion.sideB[0]?.amount) !== '1' ||
    !exactRange(conversion.sideB[0]?.tokenIds, '1', '1') ||
    !exactRange(conversion.sideB[0]?.ownershipTimes, '1', maximum)
  ) {
    issues.push('Backing conversion must exchange exactly one coin base unit for token 1 with full ownership times');
  }
  if (backingDenom) {
    try {
      backingAddress = generateAliasAddressForIBCBackedDenom(backingDenom);
    } catch {
      issues.push('Backing denomination cannot be resolved');
    }
  }
  if (path?.address && path.address !== backingAddress) issues.push('Backing path address disagrees with its denomination');
  if (!exactRange(collection.validTokenIds, '1', '1')) issues.push('validTokenIds must be exactly [{start: 1, end: 1}]');
  const actions: SmartTokenInspection['actions'] = {
    deposit: { approvalIds: [], requiresSelection: false },
    withdraw: { approvalIds: [], requiresSelection: false }
  };
  const approvals = collection.collectionApprovals ?? [];
  const ids = approvals.map((a) => a.approvalId);
  if (new Set(ids).size !== ids.length) issues.push('Duplicate approval identities are unsupported');
  for (const approval of approvals) {
    const name = String(approval.approvalId ?? '').toLowerCase();
    const direction = depositName(name) ? 'deposit' : withdrawName(name) ? 'withdraw' : undefined;
    const criteria = approval.approvalCriteria;
    if (criteria?.overridesFromOutgoingApprovals || criteria?.overridesToIncomingApprovals) {
      warnings.push(`Approval ${approval.approvalId} can override user approvals`);
    }
    if (!direction) {
      warnings.push(`Additional approval ${approval.approvalId} is outside the deposit/withdraw profile`);
      continue;
    }
    const routeMatches =
      direction === 'deposit'
        ? approval.fromListId === backingAddress &&
          (approval.toListId === `!${backingAddress}` || (isAddressValid(approval.toListId) && approval.toListId !== backingAddress))
        : approval.toListId === backingAddress &&
          (['!Mint', 'AllWithoutMint', `!Mint:${backingAddress}`].includes(approval.fromListId) ||
            (isAddressValid(approval.fromListId) && approval.fromListId !== backingAddress));
    const knownCriteria = new Set([
      'coinTransfers',
      'predeterminedBalances',
      'overridesFromOutgoingApprovals',
      'overridesToIncomingApprovals',
      'merkleChallenges',
      'ethSignatureChallenges',
      'userApprovalSettings',
      'mustPrioritize',
      'allowBackedMinting',
      'allowSpecialWrapping',
      'approvalAmounts',
      'maxNumTransfers',
      'mustOwnTokens',
      'autoDeletionOptions',
      'requireToEqualsInitiatedBy',
      'requireFromEqualsInitiatedBy',
      'requireToDoesNotEqualInitiatedBy',
      'requireFromDoesNotEqualInitiatedBy',
      'dynamicStoreChallenges',
      'senderChecks',
      'recipientChecks',
      'initiatorChecks',
      'altTimeChecks',
      'votingChallenges',
      'evmQueryChallenges'
    ]);
    const unknownCriteria = Object.entries(criteria ?? {}).some(([key, value]) => !knownCriteria.has(key) && active(value));
    const unsupportedEconomics = [
      'coinTransfers',
      'predeterminedBalances',
      'overridesFromOutgoingApprovals',
      'overridesToIncomingApprovals',
      'merkleChallenges',
      'ethSignatureChallenges',
      'userApprovalSettings'
    ].some((key) => active((criteria as any)?.[key]));
    const rangesMatch =
      (exactRange(approval.tokenIds, '1', '1') || exactRange(approval.tokenIds, '1', maximum)) && exactRange(approval.ownershipTimes, '1', maximum);
    if (
      !routeMatches ||
      !rangesMatch ||
      !approval.initiatedByListId ||
      !criteria?.allowBackedMinting ||
      !criteria.mustPrioritize ||
      unsupportedEconomics ||
      unknownCriteria ||
      !approval.approvalId
    ) {
      issues.push(`Approval ${approval.approvalId} has unsupported ${direction} routing, ranges, or economic requirements`);
      continue;
    }
    actions[direction].approvalIds.push(approval.approvalId);
    if (
      !exactRange(approval.transferTimes, '1', maximum) ||
      active(criteria.approvalAmounts) ||
      active(criteria.maxNumTransfers) ||
      active(criteria.mustOwnTokens)
    ) {
      warnings.push(`Approval ${approval.approvalId} has time, ownership, or tracker conditions; eligibility must be checked before execution`);
    }
  }
  for (const direction of ['deposit', 'withdraw'] as const) {
    actions[direction].requiresSelection = actions[direction].approvalIds.length > 1;
    if (!actions[direction].approvalIds.length) issues.push(`Missing ${direction} approval with supported semantics`);
  }
  if (collection.invariants?.noForcefulPostMintTransfers === false)
    warnings.push('noForcefulPostMintTransfers is false; forceful transfers may be possible');
  if (issues.length) for (const action of Object.values(actions)) { action.approvalIds = []; action.requiresSelection = false; }
  return {
    recognized,
    configurationSupported: issues.length === 0,
    backingAddress,
    backingDenom,
    actions,
    issues,
    warnings,
    eligibility: 'not-checked',
    authority: {
      manager: String(collection.manager ?? ''),
      approvalUpdates: 'not-evaluated',
      overrideApprovalIds: approvals
        .filter((a) => a.approvalCriteria?.overridesFromOutgoingApprovals || a.approvalCriteria?.overridesToIncomingApprovals)
        .map((a) => a.approvalId)
    }
  };
}

export const validateSmartTokenCollection = (collection: Readonly<iCollectionDoc<bigint>>): SmartTokenValidationResult => {
  const result = inspectSmartTokenCollection(collection);
  return { valid: result.configurationSupported, errors: result.issues, warnings: result.warnings };
};

export const doesCollectionFollowSmartTokenProtocol = (collection: Readonly<iCollectionDoc<bigint>>): boolean => {
  return validateSmartTokenCollection(collection).valid;
};

/** Legacy name discovery only; ambiguous names do not select an approval. */
export function findDepositApproval(approvals: ReadonlyArray<iCollectionApproval<bigint>>): iCollectionApproval<bigint> | undefined {
  // First pass: prefer the explicit "deposit" naming.
  const candidates = approvals.filter((a) => depositName(String(a.approvalId ?? '').toLowerCase()));
  return candidates.length === 1 ? candidates[0] : undefined;
}

/** Legacy name discovery only; use semantic inspection before proposing actions. */
export function findWithdrawApproval(approvals: ReadonlyArray<iCollectionApproval<bigint>>): iCollectionApproval<bigint> | undefined {
  const candidates = approvals.filter((a) => withdrawName(String(a.approvalId ?? '').toLowerCase()));
  return candidates.length === 1 ? candidates[0] : undefined;
}

/**
 * Extract the deposit/withdraw approvals + backing metadata from a
 * Smart Token collection. Returns null on shape mismatch; caller should
 * treat that as non-conformant.
 */
export function extractSmartTokenDetails(
  collection: Readonly<iCollectionDoc<bigint>>,
  selection: { depositApprovalId?: string; withdrawApprovalId?: string } = {}
): SmartTokenDetails | null {
  const inspection = inspectSmartTokenCollection(collection);
  if (!inspection.configurationSupported) return null;
  const depositApproval = selectSmartTokenApproval(collection, 'deposit', selection.depositApprovalId);
  const withdrawApproval = selectSmartTokenApproval(collection, 'withdraw', selection.withdrawApprovalId);
  if (!depositApproval || !withdrawApproval) return null;
  const { backingAddress, backingDenom } = inspection;
  return {
    backingAddress,
    backingDenom,
    depositApproval,
    withdrawApproval,
    tradable: !!collection.standards?.includes('Liquidity Pools'),
    aiAgentVault: !!collection.standards?.includes('AI Agent Vault')
  };
}

/** Resolves one action without selecting any approval for the opposite action. */
export function selectSmartTokenApproval(
  collection: Readonly<iCollectionDoc<bigint>>,
  direction: 'deposit' | 'withdraw',
  approvalId?: string
): iCollectionApproval<bigint> | undefined {
  const inspection = inspectSmartTokenCollection(collection);
  if (!inspection.configurationSupported) return undefined;
  const candidates = inspection.actions[direction].approvalIds;
  const selected = approvalId ?? (candidates.length === 1 ? candidates[0] : undefined);
  return selected && candidates.includes(selected) ? collection.collectionApprovals.find((a) => a.approvalId === selected) : undefined;
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
  /** Resolved from semantic inspection and explicit approval selection. */
  details: Pick<SmartTokenDetails, 'backingAddress' | 'backingDenom' | 'depositApproval'>;
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
  if (!/^[1-9][0-9]*$/.test(amount)) throw new Error('Amount must be a positive base-unit integer');
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
  /** Resolved from semantic inspection and explicit approval selection. */
  details: Pick<SmartTokenDetails, 'backingAddress' | 'backingDenom' | 'withdrawApproval'>;
}

/**
 * Build the withdraw msg: a MsgTransferTokens with from=caller,
 * to=backingAddress, prioritizing the withdraw approval. The chain
 * auto-routes the backing IBC coin out of the backing alias into the
 * caller's account.
 */
export function buildSmartTokenWithdrawMsg(args: SmartTokenWithdrawArgs): SmartTokenTransferMsg {
  const { creator, collectionId, amount, details } = args;
  if (!/^[1-9][0-9]*$/.test(amount)) throw new Error('Amount must be a positive base-unit integer');
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
