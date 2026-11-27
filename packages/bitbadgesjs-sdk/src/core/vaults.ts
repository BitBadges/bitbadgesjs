/**
 * Vault standard inspection, validation, and transaction message builders.
 *
 * Vaults build on Smart Token 1:1 IBC backing (`cosmosCoinBackedPath`) with the
 * `"Vault"` standard tag, optional withdrawal limits / 2FA gating, and optional
 * emergency migration recovery.
 */

import type { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import { isAddressValid } from '../address-converter/converter.js';
import {
  inspectSmartTokenCollection,
  selectSmartTokenApproval,
  buildSmartTokenDepositMsg,
  buildSmartTokenWithdrawMsg,
  type SmartTokenInspection,
  type SmartTokenTransferMsg
} from './smart-tokens.js';

const VAULT_MAX_UINT64 = '18446744073709551615';

export interface VaultWithdrawTier {
  approvalId: string;
  dailyLimitBaseUnits: string | null;
  resetIntervalMs: string | null;
  requires2faCollectionIds: string[];
}

export interface VaultEmergencyRecovery {
  approvalId: string;
  recoveryAddress: string;
  version: string;
}

export interface VaultValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export type VaultInspection = SmartTokenInspection & {
  isVaultTag: boolean;
  depositApprovalId: string | null;
  withdrawApprovalId: string | null;
  withdrawTiers: VaultWithdrawTier[];
  emergencyRecovery: VaultEmergencyRecovery | null;
};

/** Inspect a Vault collection without evaluating live balances or execution eligibility. */
export function inspectVaultCollection(collection: Readonly<iCollectionDoc<bigint>>): VaultInspection {
  const base = inspectSmartTokenCollection(collection);
  const isVaultTag = !!collection.standards?.includes('Vault');
  const issues = [...base.issues];
  const warnings = [...base.warnings];
  if (!isVaultTag) issues.push('Missing "Vault" standard');

  const approvals = collection.collectionApprovals ?? [];
  const actions: VaultInspection['actions'] = {
    deposit: { ...base.actions.deposit, approvalIds: [...base.actions.deposit.approvalIds] },
    withdraw: { ...base.actions.withdraw, approvalIds: [...base.actions.withdraw.approvalIds] }
  };

  if (issues.length > 0) {
    actions.deposit = { approvalIds: [], requiresSelection: false };
    actions.withdraw = { approvalIds: [], requiresSelection: false };
  }

  const withdrawTiers: VaultWithdrawTier[] = actions.withdraw.approvalIds.map((approvalId) => {
    const approval = approvals.find((a) => a.approvalId === approvalId);
    const amounts = approval?.approvalCriteria?.approvalAmounts;
    const perInitiated = amounts?.perInitiatedByAddressApprovalAmount;
    const dailyLimitBaseUnits = perInitiated !== undefined && BigInt(perInitiated) > 0n ? String(perInitiated) : null;
    const interval = amounts?.resetTimeIntervals?.intervalLength;
    const resetIntervalMs = interval !== undefined && BigInt(interval) > 0n ? String(interval) : null;
    const requires2faCollectionIds = (approval?.approvalCriteria?.mustOwnTokens ?? [])
      .map((entry: any) => String(entry?.collectionId ?? ''))
      .filter((id: string) => id.length > 0);
    return {
      approvalId,
      dailyLimitBaseUnits,
      resetIntervalMs,
      requires2faCollectionIds
    };
  });

  const migrationApproval = approvals.find((a) => {
    const id = String(a.approvalId ?? '');
    return (
      (id === 'vault-emergency-migration' || id.startsWith('vault-emergency')) &&
      isAddressValid(a.toListId) &&
      a.initiatedByListId === a.toListId
    );
  });

  const emergencyRecovery: VaultEmergencyRecovery | null = migrationApproval
    ? {
        approvalId: migrationApproval.approvalId,
        recoveryAddress: migrationApproval.toListId,
        version: String(migrationApproval.version ?? '0')
      }
    : null;

  return {
    ...base,
    recognized: isVaultTag && base.recognized,
    configurationSupported: issues.length === 0,
    actions,
    issues,
    warnings,
    isVaultTag,
    depositApprovalId: actions.deposit.approvalIds.length === 1 ? actions.deposit.approvalIds[0] : null,
    withdrawApprovalId: actions.withdraw.approvalIds.length === 1 ? actions.withdraw.approvalIds[0] : null,
    withdrawTiers,
    emergencyRecovery
  };
}

export function validateVaultCollection(collection: Readonly<iCollectionDoc<bigint>>): VaultValidationResult {
  const result = inspectVaultCollection(collection);
  return { valid: result.configurationSupported, errors: result.issues, warnings: result.warnings };
}

export function doesCollectionFollowVaultProtocol(collection: Readonly<iCollectionDoc<bigint>>): boolean {
  return validateVaultCollection(collection).valid;
}

export function selectVaultApproval(
  collection: Readonly<iCollectionDoc<bigint>>,
  direction: 'deposit' | 'withdraw',
  approvalId?: string
) {
  if (!inspectVaultCollection(collection).configurationSupported) return undefined;
  return selectSmartTokenApproval(collection, direction, approvalId);
}

export interface VaultEmergencyMigrateArgs {
  /** Recovery address initiating the migration (must match configured recoveryAddress). */
  creator: string;
  /** Holder address whose vault tokens are migrated to the recovery address. */
  from: string;
  /** Vault collection ID. */
  collectionId: string;
  /** Positive base-unit integer amount of vault tokens to migrate. */
  amount: string;
  /** Extracted emergency recovery approval details. */
  recovery: VaultEmergencyRecovery;
}

/** Build MsgTransferTokens for a vault's configured emergency migration approval. */
export function buildVaultEmergencyMigrateMsg(args: VaultEmergencyMigrateArgs): SmartTokenTransferMsg {
  const { creator, from, collectionId, amount, recovery } = args;
  if (!/^[1-9][0-9]*$/.test(amount)) throw new Error('Amount must be a positive base-unit integer');
  if (creator !== recovery.recoveryAddress) {
    throw new Error(`Emergency migration must be initiated by the configured recovery address (${recovery.recoveryAddress}).`);
  }
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from,
          toAddresses: [recovery.recoveryAddress],
          balances: [
            {
              amount: String(amount),
              tokenIds: [{ start: '1', end: '1' }],
              ownershipTimes: [{ start: '1', end: VAULT_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: [
            {
              approvalId: recovery.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: String(recovery.version ?? '0')
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

export { buildSmartTokenDepositMsg as buildVaultDepositMsg, buildSmartTokenWithdrawMsg as buildVaultWithdrawMsg };
