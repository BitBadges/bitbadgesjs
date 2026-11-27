/**
 * IBC Token Factory inspection, validation, and wrap/unwrap message builders.
 *
 * IBC Token Factory collections expose Cosmos Coin wrapper paths
 * (`cosmosCoinWrapperPaths`) backed by collection tokens and approvals with
 * `allowSpecialWrapping: true`.
 */

import type { iCollectionDoc } from '@/api-indexer/docs-types/interfaces.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import { generateAliasAddressForDenom } from './aliases.js';

const IBC_MAX_UINT64 = '18446744073709551615';

export interface IbcDenomUnitSummary {
  symbol: string;
  decimals: string;
  isDefaultDisplay: boolean;
}

export interface IbcWrapperPathSummary {
  denom: string;
  fullDenom: string;
  symbol: string;
  address: string;
  defaultDecimals: number;
  defaultSymbol: string;
  denomUnits: IbcDenomUnitSummary[];
  sideAAmount: string;
  sideBAmount: string;
  tokenIds: { start: string; end: string }[];
  allowOverrideWithAnyValidToken: boolean;
}

export interface IbcTokenValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface IbcTokenInspection {
  recognized: boolean;
  configurationSupported: boolean;
  wrapperPaths: IbcWrapperPathSummary[];
  aliasPaths: { denom: string; symbol: string }[];
  backingDenom: string | null;
  actions: Record<'wrap' | 'unwrap', { approvalIds: string[]; requiresSelection: boolean }>;
  issues: string[];
  warnings: string[];
  eligibility: 'not-checked';
  authority: { manager: string; approvalUpdates: 'not-evaluated'; overrideApprovalIds: string[] };
}

export interface IbcTokenTransferMsg {
  typeUrl: '/tokenization.MsgTransferTokens';
  value: Record<string, unknown>;
}

function listAllowsAddress(listId: string | undefined, address: string): boolean {
  if (!listId) return false;
  if (listId === 'All' || listId === 'AllWithoutMint' || listId === '!Mint') return true;
  if (listId === address) return true;
  if (listId.startsWith('!')) {
    const excluded = listId.slice(1).split(':');
    return !excluded.includes(address);
  }
  return listId.split(':').includes(address);
}

/** Inspect an IBC Token Factory collection without evaluating live balances or eligibility. */
export function inspectIbcTokenCollection(collection: Readonly<iCollectionDoc<bigint>>): IbcTokenInspection {
  const issues: string[] = [];
  const warnings: string[] = [];
  const recognized = !!collection.standards?.includes('IBC Token Factory');
  if (collection.isArchived) issues.push('Collection is archived');
  if (!recognized) issues.push('Missing "IBC Token Factory" standard');

  const rawWrapperPaths: any[] =
    (collection as any).cosmosCoinWrapperPaths ?? (collection as any).cosmosCoinWrapperPathsToAdd ?? [];
  const rawAliasPaths: any[] = (collection as any).aliasPaths ?? (collection as any).aliasPathsToAdd ?? [];
  const collectionIdStr = String(collection.collectionId ?? (collection as any)._docId ?? '0');

  const wrapperPaths: IbcWrapperPathSummary[] = [];
  for (const raw of rawWrapperPaths) {
    const denom = String(raw?.denom ?? '');
    if (!denom) {
      issues.push('Wrapper path is missing denom');
      continue;
    }
    let derivedAddress = '';
    try {
      derivedAddress = generateAliasAddressForDenom(denom);
    } catch {
      issues.push(`Wrapper path "${denom}" address cannot be derived`);
    }
    const address = String(raw?.address || derivedAddress);
    if (raw?.address && derivedAddress && raw.address !== derivedAddress) {
      issues.push(`Wrapper path "${denom}" address disagrees with its denomination`);
    }
    const denomUnits: IbcDenomUnitSummary[] = Array.isArray(raw?.denomUnits)
      ? raw.denomUnits.map((u: any) => ({
          symbol: String(u?.symbol ?? ''),
          decimals: String(u?.decimals ?? '0'),
          isDefaultDisplay: Boolean(u?.isDefaultDisplay)
        }))
      : [];
    const defaultUnit = denomUnits.find((u) => u.isDefaultDisplay) ?? denomUnits[0];
    const defaultDecimals = defaultUnit && /^\d+$/.test(defaultUnit.decimals) ? Number(defaultUnit.decimals) : 0;
    const defaultSymbol = defaultUnit?.symbol || String(raw?.symbol ?? '') || denom;
    const sideB = Array.isArray(raw?.conversion?.sideB) ? raw.conversion.sideB : [];
    const tokenIds = Array.isArray(sideB[0]?.tokenIds)
      ? sideB[0].tokenIds.map((r: any) => ({ start: String(r.start), end: String(r.end) }))
      : [{ start: '1', end: '1' }];
    wrapperPaths.push({
      denom,
      fullDenom: `badges:${collectionIdStr}:${denom}`,
      symbol: String(raw?.symbol ?? ''),
      address,
      defaultDecimals,
      defaultSymbol,
      denomUnits,
      sideAAmount: String(raw?.conversion?.sideA?.amount ?? '1'),
      sideBAmount: String(sideB[0]?.amount ?? '1'),
      tokenIds,
      allowOverrideWithAnyValidToken: Boolean(raw?.allowOverrideWithAnyValidToken)
    });
  }

  if (wrapperPaths.length === 0) {
    issues.push('Missing cosmosCoinWrapperPaths on IBC Token Factory collection');
  }

  const approvals = collection.collectionApprovals ?? [];
  const ids = approvals.map((a) => a.approvalId);
  if (new Set(ids).size !== ids.length) issues.push('Duplicate approval identities are unsupported');

  const wrapIds = new Set<string>();
  const unwrapIds = new Set<string>();
  for (const approval of approvals) {
    const criteria = approval.approvalCriteria;
    if (criteria?.allowSpecialWrapping) {
      for (const path of wrapperPaths) {
        if (listAllowsAddress(approval.toListId, path.address)) wrapIds.add(approval.approvalId);
        if (listAllowsAddress(approval.fromListId, path.address)) unwrapIds.add(approval.approvalId);
      }
      if (criteria.autoDeletionOptions?.afterOneUse) {
        warnings.push(`Wrapping approval ${approval.approvalId} has autoDeletionOptions.afterOneUse enabled`);
      }
    }
  }

  const actions: IbcTokenInspection['actions'] = {
    wrap: { approvalIds: [...wrapIds], requiresSelection: wrapIds.size > 1 },
    unwrap: { approvalIds: [...unwrapIds], requiresSelection: unwrapIds.size > 1 }
  };

  if (issues.length > 0) {
    actions.wrap = { approvalIds: [], requiresSelection: false };
    actions.unwrap = { approvalIds: [], requiresSelection: false };
  }

  if (wrapperPaths.length > 1) {
    warnings.push('Collection defines multiple wrapper paths; specify --denom explicitly when wrapping or unwrapping.');
  }
  warnings.push('IBC denominations, channels, live balances, and approval trackers require independent review before execution.');

  const aliasPaths = rawAliasPaths.map((p: any) => ({
    denom: String(p?.denom ?? ''),
    symbol: String(p?.symbol ?? p?.denomUnits?.[0]?.symbol ?? '')
  }));
  const backingDenom = collection.invariants?.cosmosCoinBackedPath?.conversion?.sideA?.denom
    ? String(collection.invariants.cosmosCoinBackedPath.conversion.sideA.denom)
    : null;

  return {
    recognized,
    configurationSupported: issues.length === 0,
    wrapperPaths,
    aliasPaths,
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

export function validateIbcTokenCollection(collection: Readonly<iCollectionDoc<bigint>>): IbcTokenValidationResult {
  const result = inspectIbcTokenCollection(collection);
  return { valid: result.configurationSupported, errors: result.issues, warnings: result.warnings };
}

export function doesCollectionFollowIbcTokenProtocol(collection: Readonly<iCollectionDoc<bigint>>): boolean {
  return validateIbcTokenCollection(collection).valid;
}

/** Select one wrapper path by denom, fullDenom, or symbol (or automatically when only one exists). */
export function selectIbcWrapperPath(
  collection: Readonly<iCollectionDoc<bigint>>,
  denomOrSymbol?: string
): IbcWrapperPathSummary {
  const inspection = inspectIbcTokenCollection(collection);
  if (inspection.wrapperPaths.length === 0) {
    throw new Error('Collection defines no cosmosCoinWrapperPaths.');
  }
  if (!denomOrSymbol) {
    if (inspection.wrapperPaths.length === 1) return inspection.wrapperPaths[0];
    throw new Error(
      `Multiple wrapper paths found; specify --denom explicitly. Available: ${inspection.wrapperPaths.map((p) => p.denom).join(', ')}`
    );
  }
  const needle = denomOrSymbol.trim();
  const match = inspection.wrapperPaths.find(
    (p) =>
      p.denom === needle ||
      p.fullDenom === needle ||
      p.symbol.toLowerCase() === needle.toLowerCase() ||
      p.defaultSymbol.toLowerCase() === needle.toLowerCase()
  );
  if (!match) {
    throw new Error(
      `Wrapper path "${needle}" not found. Available: ${inspection.wrapperPaths.map((p) => p.denom).join(', ')}`
    );
  }
  return match;
}

/** Select a wrapping/unwrapping approval explicitly, or automatically when unambiguous. */
export function selectIbcWrapperApproval(
  collection: Readonly<iCollectionDoc<bigint>>,
  direction: 'wrap' | 'unwrap',
  approvalId?: string
): iCollectionApproval<bigint> | undefined {
  const inspection = inspectIbcTokenCollection(collection);
  const candidates = inspection.actions[direction].approvalIds;
  if (approvalId) {
    if (!candidates.includes(approvalId)) {
      throw new Error(
        `Approval "${approvalId}" does not match a supported ${direction} approval. Available: ${candidates.join(', ') || 'none'}`
      );
    }
    return collection.collectionApprovals.find((a) => a.approvalId === approvalId);
  }
  if (candidates.length === 1) {
    return collection.collectionApprovals.find((a) => a.approvalId === candidates[0]);
  }
  if (candidates.length > 1) {
    throw new Error(`Choose --approval-id explicitly. Available ${direction} approvals: ${candidates.join(', ')}`);
  }
  return undefined;
}

/** Resolve display or base units into a positive base-unit integer string. */
export function resolveIbcTokenAmount(rawAmount: string, baseUnits: boolean, decimals: number): string {
  if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(rawAmount)) {
    throw new Error('--amount must be a positive decimal string');
  }
  const scale = baseUnits ? 0 : decimals;
  const [whole, fraction = ''] = rawAmount.split('.');
  if (fraction.length > scale) {
    throw new Error(`--amount has more decimal places (${fraction.length}) than the wrapper path supports (${scale})`);
  }
  const amount = BigInt(whole) * 10n ** BigInt(scale) + BigInt(fraction.padEnd(scale, '0') || '0');
  if (amount <= 0n) throw new Error('--amount must be positive');
  return amount.toString();
}

export interface IbcTokenWrapArgs {
  creator: string;
  collectionId: string;
  amount: string;
  path: IbcWrapperPathSummary;
  tokenId?: string;
  approval?: Pick<iCollectionApproval<bigint>, 'approvalId' | 'version'>;
}

/** Build MsgTransferTokens sending collection tokens to the wrapper path alias to mint wrapped Cosmos coins. */
export function buildIbcTokenWrapMsg(args: IbcTokenWrapArgs): IbcTokenTransferMsg {
  const { creator, collectionId, amount, path, approval } = args;
  if (!/^[1-9][0-9]*$/.test(amount)) throw new Error('Amount must be a positive base-unit integer');
  const tokenId = args.tokenId ?? path.tokenIds[0]?.start ?? '1';
  if (!/^[1-9][0-9]*$/.test(tokenId)) throw new Error('--token-id must be a positive integer');
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: creator,
          toAddresses: [path.address],
          balances: [
            {
              amount: String(amount),
              tokenIds: [{ start: tokenId, end: tokenId }],
              ownershipTimes: [{ start: '1', end: IBC_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: approval
            ? [
                {
                  approvalId: approval.approvalId,
                  approvalLevel: 'collection',
                  approverAddress: '',
                  version: String(approval.version ?? '0')
                }
              ]
            : [],
          onlyCheckPrioritizedCollectionApprovals: Boolean(approval),
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  };
}

/** Build MsgTransferTokens pulling collection tokens from the wrapper path alias to burn wrapped Cosmos coins. */
export function buildIbcTokenUnwrapMsg(args: IbcTokenWrapArgs): IbcTokenTransferMsg {
  const { creator, collectionId, amount, path, approval } = args;
  if (!/^[1-9][0-9]*$/.test(amount)) throw new Error('Amount must be a positive base-unit integer');
  const tokenId = args.tokenId ?? path.tokenIds[0]?.start ?? '1';
  if (!/^[1-9][0-9]*$/.test(tokenId)) throw new Error('--token-id must be a positive integer');
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId: String(collectionId),
      transfers: [
        {
          from: path.address,
          toAddresses: [creator],
          balances: [
            {
              amount: String(amount),
              tokenIds: [{ start: tokenId, end: tokenId }],
              ownershipTimes: [{ start: '1', end: IBC_MAX_UINT64 }]
            }
          ],
          prioritizedApprovals: approval
            ? [
                {
                  approvalId: approval.approvalId,
                  approvalLevel: 'collection',
                  approverAddress: '',
                  version: String(approval.version ?? '0')
                }
              ]
            : [],
          onlyCheckPrioritizedCollectionApprovals: Boolean(approval),
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  };
}
