import { isAddressValid } from '../address-converter/converter.js';
import { AGENT_VAULT_IDS, agentVaultApprovals, agentVaultPolicySchema, type AgentVaultPolicy } from './builders/agent-vault.js';
import {
  FOREVER,
  MAX_UINT64,
  BURN_ADDRESS,
  frozenPermissions,
  ibcBackedInvariants,
  generateAliasAddressForIBCBackedDenom
} from './builders/shared.js';

type Collection = {
  collectionId?: unknown;
  customData?: string;
  manager?: unknown;
  standards?: string[];
  collectionApprovals?: unknown[];
  collectionPermissions?: unknown;
  validTokenIds?: unknown;
  invariants?: unknown;
  isArchived?: boolean;
  aliasPaths?: unknown[];
  aliasPathsToAdd?: unknown[];
  cosmosCoinWrapperPaths?: unknown[];
  cosmosCoinWrapperPathsToAdd?: unknown[];
};
export type AgentVaultValidationResult = { valid: boolean; errors: string[]; policy?: AgentVaultPolicy };

// Protobuf readers materialize empty/default fields; those do not change policy.
function normalized(value: any): any {
  if (value === undefined || value === null || value === false || value === '' || value === '0' || value === 0 || value === 0n) return undefined;
  if (typeof value === 'bigint' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.length ? value.map(normalized) : undefined;
  if (typeof value !== 'object') return value;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const entry = normalized(value[key]);
    if (entry !== undefined) result[key] = entry;
  }
  return Object.keys(result).length ? result : undefined;
}
const same = (a: unknown, b: unknown) => JSON.stringify(normalized(a)) === JSON.stringify(normalized(b));
const onChainApproval = (value: any) => {
  const approval = { ...value };
  for (const key of ['uri', 'customData', 'details', 'fromList', 'toList', 'initiatedByList']) delete approval[key];
  return approval;
};

export function validateAgentVaultCollection(collection: Collection): AgentVaultValidationResult {
  const errors: string[] = [];
  try {
    const policy = agentVaultPolicySchema.parse(JSON.parse(collection.customData ?? '{}').agentVault);
    if (!same([...(collection.standards ?? [])].sort(), ['Agent Vault', 'Smart Token'])) errors.push('Unexpected standards');
    if (collection.manager !== policy.manager) errors.push('Manager differs from policy');
    if (!same(collection.validTokenIds, [{ start: '1', end: '1' }])) errors.push('Invalid receipt token IDs');
    const paths = collection.aliasPaths ?? collection.aliasPathsToAdd ?? [];
    if (
      paths.length !== 1 ||
      !same((paths[0] as any)?.conversion, {
        sideA: { amount: '1' },
        sideB: [{ amount: '1', tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }]
      })
    )
      errors.push('Invalid receipt alias conversion');
    if ((collection.cosmosCoinWrapperPaths?.length ?? 0) > 0 || (collection.cosmosCoinWrapperPathsToAdd?.length ?? 0) > 0)
      errors.push('Additional coin wrapper paths are unsupported');
    const expected = agentVaultApprovals(policy);
    const actual = (collection.collectionApprovals ?? []).map(onChainApproval);
    const approvals = expected.map(onChainApproval);
    if (!same(actual, approvals)) errors.push('Approvals differ from the supported policy');
    const permissions = { ...(collection.collectionPermissions as any) };
    const frozen = frozenPermissions();
    const mintRestriction = { ...frozen.canUpdateCollectionApprovals[0], fromListId: 'Mint' };
    permissions.canUpdateCollectionApprovals = permissions.canUpdateCollectionApprovals?.map(onChainApproval);
    if (same(permissions.canUpdateCollectionApprovals?.[0], mintRestriction))
      permissions.canUpdateCollectionApprovals = permissions.canUpdateCollectionApprovals.slice(1);
    if (!same(permissions, frozen)) errors.push('Policy permissions are not frozen');
    const { cosmosCoinBackedPath, ...invariants } = (collection.invariants ?? {}) as any;
    const { address, ...path } = cosmosCoinBackedPath ?? {};
    const backing = generateAliasAddressForIBCBackedDenom(policy.backingDenom);
    if (address && address !== backing) errors.push('Backing alias differs from denomination');
    if (
      !same(
        { ...invariants, cosmosCoinBackedPath: path },
        {
          ...ibcBackedInvariants(policy.backingDenom),
          disablePoolCreation: true,
          noForcefulPostMintTransfers: !policy.recovery
        }
      )
    )
      errors.push('Unsupported backing invariants');
    return { valid: errors.length === 0, errors, ...(errors.length ? {} : { policy }) };
  } catch {
    return { valid: false, errors: ['Invalid or unsupported Agent Vault v1 policy'] };
  }
}

export function extractAgentVaultDetails(collection: Collection): AgentVaultPolicy | null {
  return validateAgentVaultCollection(collection).policy ?? null;
}

export const doesCollectionFollowAgentVaultProtocol = (collection: Collection) => validateAgentVaultCollection(collection).valid;

function integer(value: string, label: string, positive = false): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]*)$/.test(value)) throw new Error(`${label} must be an unsigned base-unit integer string`);
  const n = BigInt(value);
  if (n >= 1n << 256n || (positive && n === 0n)) throw new Error(`Invalid ${label}`);
  return n;
}

function account(value: string) {
  if (!value?.startsWith('bb1') || value === BURN_ADDRESS || !isAddressValid(value)) throw new Error('Invalid account address');
}

export type AgentVaultAction = 'deposit' | 'withdraw' | 'pay' | 'vote' | 'recover';
export type AgentVaultTransactionArgs = {
  action: AgentVaultAction;
  collection: Collection;
  creator: string;
  amount?: string;
  to?: string;
  yesWeight?: string;
};
export type AgentVaultTransaction = { messages: { typeUrl: string; value: any }[] };

export function buildAgentVaultTransaction(args: AgentVaultTransactionArgs): AgentVaultTransaction {
  const { action, collection, creator } = args;
  const policy = extractAgentVaultDetails(collection);
  if (!policy) throw new Error('Collection is not a verified Agent Vault v1');
  if (collection.isArchived) throw new Error('Vault is archived');
  account(creator);
  const collectionId = String(collection.collectionId ?? '');
  if (integer(collectionId, 'collection ID', true) > BigInt(MAX_UINT64)) throw new Error('Invalid collection ID');
  const backing = generateAliasAddressForIBCBackedDenom(policy.backingDenom);
  if (action === 'vote') {
    if (!policy.activation?.voters.some((v) => v.address === creator)) throw new Error('Creator is not an activation voter');
    const yesWeight = args.yesWeight ?? '100';
    if (integer(yesWeight, 'yesWeight') > 100n) throw new Error('yesWeight must be between 0 and 100');
    const challenge = agentVaultApprovals(policy)[1].approvalCriteria.votingChallenges[0];
    return {
      messages: [
        {
          typeUrl: '/tokenization.MsgCastVote',
          value: {
            creator,
            collectionId,
            approvalLevel: 'collection',
            approverAddress: '',
            approvalId: AGENT_VAULT_IDS.withdraw,
            proposalId: challenge.proposalId,
            yesWeight
          }
        }
      ]
    };
  }
  const amount = args.amount ?? '';
  integer(amount, 'amount', true);
  const transfer = (id: string, from: string, to: string) => ({
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId,
      transfers: [
        {
          from,
          toAddresses: [to],
          balances: [{ amount, tokenIds: [{ start: '1', end: '1' }], ownershipTimes: FOREVER }],
          prioritizedApprovals: [{ approvalId: id, approvalLevel: 'collection', approverAddress: '', version: '0' }],
          onlyCheckPrioritizedCollectionApprovals: true,
          onlyCheckPrioritizedOutgoingApprovals: false,
          onlyCheckPrioritizedIncomingApprovals: false,
          memo: ''
        }
      ]
    }
  });
  if (action === 'deposit') return { messages: [transfer(AGENT_VAULT_IDS.deposit, backing, policy.agent)] };
  if (action === 'recover') {
    if (!policy.recovery || creator !== policy.recovery) throw new Error('Creator is not the recovery account');
    return { messages: [transfer(AGENT_VAULT_IDS.recover, policy.agent, creator), transfer(AGENT_VAULT_IDS.exit, creator, backing)] };
  }
  if (creator !== policy.agent) throw new Error('Only the designated agent may withdraw');
  const withdraw = transfer(AGENT_VAULT_IDS.withdraw, creator, backing);
  if (action === 'withdraw') return { messages: [withdraw] };
  if (action !== 'pay') throw new Error('Unsupported Agent Vault action');
  account(args.to ?? '');
  if (args.to === backing) throw new Error('Payment recipient cannot be the backing alias');
  return {
    messages: [
      withdraw,
      {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: creator,
          toAddress: args.to,
          amount: [{ denom: policy.backingDenom, amount }]
        }
      }
    ]
  };
}

export type AgentVaultStatusInput = {
  now: string;
  balance?: string;
  spent?: string;
  trackerWindowStart?: string;
  activationMet?: boolean;
};
export type AgentVaultStatus = {
  status: 'unknown' | 'blocked' | 'available';
  reasons: string[];
  withdrawable?: string;
  nextReset?: string;
  estimated: true;
};

export function getAgentVaultStatus(collection: Collection, input: AgentVaultStatusInput): AgentVaultStatus {
  const policy = extractAgentVaultDetails(collection);
  const reasons: string[] = [];
  if (!policy) return { status: 'unknown', reasons: ['unsupported-policy'], estimated: true };
  const now = integer(input.now, 'now');
  let available = input.balance === undefined ? undefined : integer(input.balance, 'balance');
  if (available === undefined) reasons.push('balance-unknown');
  if (collection.isArchived) reasons.push('archived');
  if (policy.window && (now < BigInt(policy.window.start) || now > BigInt(policy.window.end))) reasons.push('outside-window');
  if (policy.activation && input.activationMet !== true)
    reasons.push(input.activationMet === undefined ? 'activation-unknown' : 'activation-required');
  let nextReset: string | undefined;
  if (policy.cap) {
    const start = BigInt(policy.cap.startTime);
    const interval = BigInt(policy.cap.intervalLength);
    const windowStart = now < start ? start : start + ((now - start) / interval) * interval;
    nextReset = String(now < start ? start : windowStart + interval);
    if (input.spent === undefined || input.trackerWindowStart === undefined) reasons.push('budget-unknown');
    else {
      const tracked = integer(input.trackerWindowStart, 'trackerWindowStart');
      if (tracked > windowStart) reasons.push('budget-unknown');
      else {
        const spent = integer(input.spent, 'spent');
        const currentSpent = now >= start && tracked < windowStart ? 0n : spent;
        const cap = BigInt(policy.cap.amount);
        const remaining = currentSpent >= cap ? 0n : cap - currentSpent;
        if (available !== undefined && remaining < available) available = remaining;
      }
    }
  }
  if (available === 0n) reasons.push('no-available-budget');
  const unknown = reasons.some((r) => r.endsWith('-unknown'));
  const blocked = reasons.some((r) => !r.endsWith('-unknown'));
  return {
    status: unknown ? 'unknown' : blocked ? 'blocked' : 'available',
    reasons,
    ...(!unknown ? { withdrawable: blocked ? '0' : String(available) } : {}),
    ...(nextReset ? { nextReset } : {}),
    estimated: true
  };
}
