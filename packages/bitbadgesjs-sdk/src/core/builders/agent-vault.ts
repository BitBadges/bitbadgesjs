import { z } from 'zod';
import { isAddressValid } from '../../address-converter/converter.js';
import {
  FOREVER,
  MAX_UINT64,
  BURN_ADDRESS,
  resolveCoin,
  buildMsg,
  ibcBackedInvariants,
  generateAliasAddressForIBCBackedDenom,
  frozenPermissions,
  tokenMetadataEntry,
  metadataFromFlat,
  MetadataMissingError,
  approvalMetadata,
  stableHashId,
  buildAliasPath,
  sanitizeCosmosPathName
} from './shared.js';

const uint = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/)
  .refine((v) => BigInt(v) <= BigInt(MAX_UINT64));
const positive = uint.refine((v) => BigInt(v) > 0n);
const amount = z
  .string()
  .regex(/^[1-9][0-9]*$/)
  .refine((v) => BigInt(v) < 1n << 256n);
const address = z.string().refine((v) => v.startsWith('bb1') && v !== BURN_ADDRESS && isAddressValid(v));

export const agentVaultPolicySchema = z
  .object({
    version: z.literal(1),
    agent: address,
    manager: address,
    backingDenom: z.string().min(1),
    cap: z.object({ amount, startTime: positive, intervalLength: positive }).strict().optional(),
    window: z.object({ start: positive, end: positive }).strict().optional(),
    activation: z
      .object({
        voters: z
          .array(z.object({ address, weight: z.number().int().positive().max(100) }).strict())
          .min(1)
          .max(100),
        threshold: z.number().int().positive().max(100)
      })
      .strict()
      .optional(),
    recovery: address.optional()
  })
  .strict()
  .superRefine((p, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (p.agent === p.manager || p.agent === p.recovery) fail('Agent must differ from manager and recovery');
    const backing = generateAliasAddressForIBCBackedDenom(p.backingDenom);
    if ([p.agent, p.manager, p.recovery].includes(backing)) fail('A role cannot be the backing alias');
    if (p.window && BigInt(p.window.start) > BigInt(p.window.end)) fail('Invalid withdrawal window');
    if (p.activation) {
      const voters = p.activation.voters;
      const total = voters.reduce((n, v) => n + v.weight, 0);
      if (new Set(voters.map((v) => v.address)).size !== voters.length) fail('Duplicate activation voters');
      if (voters.some((v) => v.address === p.agent)) fail('Agent cannot authorize itself');
      if (total > 100 || p.activation.threshold > total) fail('Activation requires total weight <= 100 and threshold <= total');
    }
  });

export type AgentVaultPolicy = z.infer<typeof agentVaultPolicySchema>;
export type AgentVaultParams = Omit<AgentVaultPolicy, 'version' | 'backingDenom'> & {
  backingCoin: string;
  symbol?: string;
  uri?: string;
  name?: string;
  image?: string;
  description?: string;
};

export const AGENT_VAULT_IDS = {
  deposit: 'agent-vault-deposit',
  withdraw: 'agent-vault-withdraw',
  recover: 'agent-vault-recover',
  exit: 'agent-vault-recovery-exit'
} as const;

export function agentVaultApprovals(policy: AgentVaultPolicy): any[] {
  const p = agentVaultPolicySchema.parse(policy);
  const backing = generateAliasAddressForIBCBackedDenom(p.backingDenom);
  const make = (id: string, from: string, to: string, initiator: string, criteria: any, times = FOREVER) => ({
    approvalId: id,
    fromListId: from,
    toListId: to,
    initiatedByListId: initiator,
    version: '0',
    transferTimes: times,
    tokenIds: [{ start: '1', end: '1' }],
    ownershipTimes: FOREVER,
    approvalCriteria: criteria,
    ...approvalMetadata(id, 'Agent Vault v1 on-chain policy')
  });
  const backingCriteria = { mustPrioritize: true, allowBackedMinting: true };
  const withdrawCriteria: any = { ...backingCriteria };
  if (p.cap)
    withdrawCriteria.approvalAmounts = {
      overallApprovalAmount: '0',
      perToAddressApprovalAmount: '0',
      perFromAddressApprovalAmount: '0',
      perInitiatedByAddressApprovalAmount: p.cap.amount,
      amountTrackerId: 'agent-vault-budget',
      resetTimeIntervals: { startTime: p.cap.startTime, intervalLength: p.cap.intervalLength }
    };
  if (p.activation) {
    const total = p.activation.voters.reduce((n, v) => n + v.weight, 0);
    withdrawCriteria.votingChallenges = [
      {
        proposalId: stableHashId('agent-vault-activation', p),
        quorumThreshold: String(Math.floor((p.activation.threshold * 100) / total)),
        voters: p.activation.voters.map((v) => ({ address: v.address, weight: String(v.weight) })),
        resetAfterExecution: false,
        delayAfterQuorum: '0',
        uri: '',
        customData: ''
      }
    ];
  }
  const approvals = [
    make(AGENT_VAULT_IDS.deposit, backing, p.agent, 'All', backingCriteria),
    make(AGENT_VAULT_IDS.withdraw, p.agent, backing, p.agent, withdrawCriteria, p.window ? [p.window] : FOREVER)
  ];
  if (p.recovery)
    approvals.push(
      make(AGENT_VAULT_IDS.recover, p.agent, p.recovery, p.recovery, {
        mustPrioritize: true,
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true
      }),
      make(AGENT_VAULT_IDS.exit, p.recovery, backing, p.recovery, backingCriteria)
    );
  return approvals;
}

export function buildAgentVault(params: AgentVaultParams): any {
  const { backingCoin, symbol = 'AV', uri, name, image, description, ...input } = params;
  const coin = resolveCoin(backingCoin);
  const policy = agentVaultPolicySchema.parse({ ...input, version: 1, backingDenom: coin.denom });
  const metadata = metadataFromFlat({ uri, name, image, description });
  if (!metadata) throw new MetadataMissingError('agent-vault', ['name', 'image', 'description']);
  return buildMsg({
    creator: policy.manager,
    manager: policy.manager,
    customData: JSON.stringify({ agentVault: policy }),
    collectionApprovals: agentVaultApprovals(policy),
    standards: ['Smart Token', 'Agent Vault'],
    invariants: { ...ibcBackedInvariants(coin.denom), disablePoolCreation: true, noForcefulPostMintTransfers: !policy.recovery },
    collectionPermissions: frozenPermissions(),
    collectionMetadata: metadata,
    aliasPathsToAdd: [
      buildAliasPath({
        denom: 'u' + sanitizeCosmosPathName(symbol, 'symbol').toLowerCase(),
        symbol,
        decimals: coin.decimals,
        pathMetadata: metadata,
        unitMetadata: metadata
      })
    ],
    tokenMetadata: [tokenMetadataEntry([{ start: '1', end: '1' }], metadata, 'agent-vault')]
  });
}
