/**
 * Issuer-Controlled Tokens standard inspection, validation, and lifecycle message builders.
 *
 * Mirrors the frontend Issuer-Controlled Tokens flow (`pages/mint/issuer-controlled.tsx`):
 *   - Standard tag: `"Issuer-Controlled Tokens"`
 *   - Manager-initiated mint (`from: Mint`) and transfer/revoke controls (`from: !Mint`)
 *   - Optional permanent freeze (`manager: ''`, cleared approvals, frozen permissions)
 */

import type { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import { BURN_ADDRESS, FOREVER, frozenPermissions } from './builders/shared.js';

const PERMISSION_KEYS = [
  'canDeleteCollection',
  'canArchiveCollection',
  'canUpdateStandards',
  'canUpdateCustomData',
  'canUpdateManager',
  'canUpdateCollectionMetadata',
  'canUpdateValidTokenIds',
  'canUpdateTokenMetadata',
  'canUpdateCollectionApprovals',
  'canAddMoreAliasPaths',
  'canAddMoreCosmosCoinWrapperPaths'
] as const;

const MAX_UINT64 = '18446744073709551615';

export interface IssuerControlledValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IssuerControlledInspection {
  recognized: boolean;
  configurationSupported: boolean;
  manager: string;
  isFrozen: boolean;
  validTokenIds: { start: string; end: string }[];
  actions: Record<'mint' | 'transfer' | 'revoke' | 'freeze', { approvalIds: string[]; requiresSelection: boolean; available: boolean }>;
  mutablePermissions: string[];
  issues: string[];
  warnings: string[];
  eligibility: 'not-checked';
  authority: { manager: string; approvalUpdates: 'not-evaluated'; overrideApprovalIds: string[] };
}

export interface IssuerControlledMsg {
  typeUrl: '/tokenization.MsgTransferTokens' | '/tokenization.MsgUniversalUpdateCollection';
  value: Record<string, unknown>;
}

function isPermanentlyForbidden(entries: unknown): boolean {
  if (!Array.isArray(entries) || entries.length === 0) return false;
  return entries.some(
    (entry: any) =>
      Array.isArray(entry?.permanentlyForbiddenTimes) &&
      entry.permanentlyForbiddenTimes.some((r: any) => String(r?.start) === '1' && String(r?.end) === MAX_UINT64)
  );
}

function listIncludesManager(listId: string | undefined, manager: string): boolean {
  if (!listId || !manager) return false;
  return listId === manager || listId.split(':').includes(manager);
}

/** Inspect an Issuer-Controlled Tokens collection without evaluating live balances or execution eligibility. */
export function inspectIssuerControlledCollection(collection: Readonly<iCollectionDoc<bigint>>): IssuerControlledInspection {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recognized = !!collection.standards?.includes('Issuer-Controlled Tokens');
  if (collection.isArchived) issues.push('Collection is archived');
  if (!recognized) issues.push('Missing "Issuer-Controlled Tokens" standard');

  const manager = String(collection.manager ?? '');
  const approvals = collection.collectionApprovals ?? [];
  const ids = approvals.map((a) => a.approvalId);
  if (new Set(ids).size !== ids.length) issues.push('Duplicate approval identities are unsupported');

  const permissions = (collection.collectionPermissions ?? {}) as unknown as Record<string, unknown>;
  const mutablePermissions = PERMISSION_KEYS.filter((key) => !isPermanentlyForbidden(permissions[key]));
  const isFrozen = !manager && approvals.length === 0;

  const mintApprovalIds: string[] = [];
  const transferApprovalIds: string[] = [];
  const revokeApprovalIds: string[] = [];

  if (manager) {
    for (const approval of approvals) {
      if (!listIncludesManager(approval.initiatedByListId, manager)) continue;
      if (approval.fromListId === 'Mint') {
        mintApprovalIds.push(approval.approvalId);
      } else {
        if (approval.toListId === BURN_ADDRESS || approval.toListId === 'All' || approval.toListId === '!Mint') {
          revokeApprovalIds.push(approval.approvalId);
        }
        if (approval.toListId !== BURN_ADDRESS) {
          transferApprovalIds.push(approval.approvalId);
        }
      }
    }
  }

  const overrideApprovalIds = approvals
    .filter((a) => a.approvalCriteria?.overridesFromOutgoingApprovals || a.approvalCriteria?.overridesToIncomingApprovals)
    .map((a) => a.approvalId);

  if (overrideApprovalIds.length > 0) {
    warnings.push('Issuer approvals include forceful user-approval overrides; inspect authority before accepting custody.');
  }
  if (mutablePermissions.length > 0) {
    warnings.push(`Mutable collection permissions remain open: ${mutablePermissions.join(', ')}.`);
  }
  if (isFrozen) {
    warnings.push('Collection has no active manager or collection approvals (frozen).');
  }

  const validTokenIds = Array.isArray(collection.validTokenIds)
    ? collection.validTokenIds.map((r: any) => ({ start: String(r.start), end: String(r.end) }))
    : [];

  const supported = issues.length === 0;
  const actions: IssuerControlledInspection['actions'] = {
    mint: {
      approvalIds: supported ? mintApprovalIds : [],
      requiresSelection: supported && mintApprovalIds.length > 1,
      available: supported && Boolean(manager) && mintApprovalIds.length > 0
    },
    transfer: {
      approvalIds: supported ? transferApprovalIds : [],
      requiresSelection: supported && transferApprovalIds.length > 1,
      available: supported && Boolean(manager) && transferApprovalIds.length > 0
    },
    revoke: {
      approvalIds: supported ? revokeApprovalIds : [],
      requiresSelection: supported && revokeApprovalIds.length > 1,
      available: supported && Boolean(manager) && revokeApprovalIds.length > 0
    },
    freeze: {
      approvalIds: [],
      requiresSelection: false,
      available: supported && Boolean(manager) && !isFrozen
    }
  };

  return {
    recognized,
    configurationSupported: supported,
    manager,
    isFrozen,
    validTokenIds,
    actions,
    mutablePermissions,
    issues,
    warnings,
    eligibility: 'not-checked',
    authority: {
      manager,
      approvalUpdates: 'not-evaluated',
      overrideApprovalIds
    }
  };
}

export function validateIssuerControlledCollection(collection: Readonly<iCollectionDoc<bigint>>): IssuerControlledValidationResult {
  const result = inspectIssuerControlledCollection(collection);
  return { valid: result.configurationSupported, errors: result.issues, warnings: result.warnings };
}

export function doesCollectionFollowIssuerControlledProtocol(collection: Readonly<iCollectionDoc<bigint>>): boolean {
  return validateIssuerControlledCollection(collection).valid;
}

export function selectIssuerControlledApproval(
  collection: Readonly<iCollectionDoc<bigint>>,
  action: 'mint' | 'transfer' | 'revoke',
  approvalId?: string
): iCollectionApproval<bigint> {
  const inspection = inspectIssuerControlledCollection(collection);
  const candidates = inspection.actions[action].approvalIds;
  if (candidates.length === 0) {
    throw new Error(`No manager ${action} approval found on this Issuer-Controlled collection.`);
  }
  const selected = approvalId ?? (candidates.length === 1 ? candidates[0] : undefined);
  if (!selected) {
    throw new Error(`Choose --approval-id explicitly. Available ${action} approvals: ${candidates.join(', ')}`);
  }
  if (!candidates.includes(selected)) {
    throw new Error(`Approval "${selected}" is not a supported ${action} approval. Available: ${candidates.join(', ')}`);
  }
  return collection.collectionApprovals.find((a) => a.approvalId === selected)!;
}

function assertPositiveInt(raw: string, label: string): string {
  if (!/^[1-9][0-9]*$/.test(raw)) throw new Error(`${label} must be a positive integer`);
  return raw;
}

function assertManager(creator: string, manager: string): void {
  if (!manager) throw new Error('Collection has no manager (it may already be frozen).');
  if (creator !== manager) {
    throw new Error(`Action must be initiated by the collection manager (${manager}).`);
  }
}

export function buildIssuerControlledMintMsg(args: {
  creator: string;
  manager: string;
  collectionId: string;
  recipients: string[];
  tokenId?: string;
  amount?: string;
  approval: Pick<iCollectionApproval<bigint>, 'approvalId' | 'version'>;
}): IssuerControlledMsg {
  assertManager(args.creator, args.manager);
  if (!args.recipients.length) throw new Error('At least one recipient address is required');
  const tokenId = assertPositiveInt(args.tokenId ?? '1', '--token-id');
  const amount = assertPositiveInt(args.amount ?? '1', '--amount');
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: args.creator,
      collectionId: String(args.collectionId),
      transfers: [
        {
          from: 'Mint',
          toAddresses: args.recipients,
          balances: [{ amount, tokenIds: [{ start: tokenId, end: tokenId }], ownershipTimes: FOREVER }],
          prioritizedApprovals: [
            {
              approvalId: args.approval.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: String(args.approval.version ?? '0')
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

export function buildIssuerControlledTransferMsg(args: {
  creator: string;
  manager: string;
  collectionId: string;
  from: string;
  recipients: string[];
  tokenId?: string;
  amount?: string;
  approval: Pick<iCollectionApproval<bigint>, 'approvalId' | 'version'>;
}): IssuerControlledMsg {
  assertManager(args.creator, args.manager);
  if (!args.recipients.length) throw new Error('At least one recipient address is required');
  const tokenId = assertPositiveInt(args.tokenId ?? '1', '--token-id');
  const amount = assertPositiveInt(args.amount ?? '1', '--amount');
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator: args.creator,
      collectionId: String(args.collectionId),
      transfers: [
        {
          from: args.from,
          toAddresses: args.recipients,
          balances: [{ amount, tokenIds: [{ start: tokenId, end: tokenId }], ownershipTimes: FOREVER }],
          prioritizedApprovals: [
            {
              approvalId: args.approval.approvalId,
              approvalLevel: 'collection',
              approverAddress: '',
              version: String(args.approval.version ?? '0')
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

export function buildIssuerControlledRevokeMsg(args: {
  creator: string;
  manager: string;
  collectionId: string;
  from: string;
  tokenId?: string;
  amount?: string;
  approval: Pick<iCollectionApproval<bigint>, 'approvalId' | 'version'>;
}): IssuerControlledMsg {
  return buildIssuerControlledTransferMsg({
    ...args,
    recipients: [BURN_ADDRESS]
  });
}

/**
 * Permanently freeze an Issuer-Controlled collection: clears manager, removes
 * collection approvals, and locks collection permissions.
 */
export function buildIssuerControlledFreezeMsg(args: {
  creator: string;
  manager: string;
  collectionId: string;
}): IssuerControlledMsg {
  assertManager(args.creator, args.manager);
  return {
    typeUrl: '/tokenization.MsgUniversalUpdateCollection',
    value: {
      creator: args.creator,
      collectionId: String(args.collectionId),
      updateValidTokenIds: false,
      validTokenIds: [],
      updateCollectionPermissions: true,
      collectionPermissions: frozenPermissions(),
      updateManager: true,
      manager: '',
      updateCollectionMetadata: false,
      updateTokenMetadata: false,
      tokenMetadata: [],
      updateCustomData: false,
      customData: '',
      updateCollectionApprovals: true,
      collectionApprovals: [],
      updateStandards: false,
      standards: [],
      updateIsArchived: false,
      isArchived: false,
      mintEscrowCoinsToTransfer: [],
      aliasPathsToAdd: [],
      cosmosCoinWrapperPathsToAdd: []
    }
  };
}
