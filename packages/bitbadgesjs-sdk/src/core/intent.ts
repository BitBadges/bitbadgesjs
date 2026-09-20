import { z } from 'zod';
import { sha256, toUtf8Bytes } from 'ethers';

const uint = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/)
  .max(78);
const identity = { id: z.string().min(1).max(100), source: z.enum(['user', 'agent']), approvalId: z.string().min(1).max(256).optional() };
const requirement = z.discriminatedUnion('kind', [
  z
    .object({
      ...identity,
      kind: z.literal('payment'),
      value: z
        .object({ recipient: z.string().min(1), denom: z.string().min(1), amount: uint })
        .strict()
        .nullable()
    })
    .strict(),
  z.object({ ...identity, kind: z.literal('duration'), value: z.object({ milliseconds: uint }).strict().nullable() }).strict(),
  z.object({ ...identity, kind: z.literal('transferability'), value: z.boolean().nullable() }).strict(),
  z.object({ ...identity, kind: z.literal('supply'), value: z.object({ maxSupplyPerId: uint }).strict().nullable() }).strict(),
  z.object({ ...identity, kind: z.literal('managerPowers'), value: z.object({ canUpdateApprovals: z.boolean() }).strict().nullable() }).strict(),
  z
    .object({
      ...identity,
      kind: z.literal('asset'),
      value: z
        .object({ collectionId: uint, tokenIds: z.array(z.object({ start: uint, end: uint }).strict()).min(1) })
        .strict()
        .nullable()
    })
    .strict(),
  z
    .object({
      ...identity,
      kind: z.literal('unsupported'),
      value: z
        .object({ description: z.string().min(1).max(2000) })
        .strict()
        .nullable()
    })
    .strict()
]);
export const intentSchema = z
  .object({
    version: z.literal(1),
    requirements: z.array(requirement).max(100),
    unresolvedDecisions: z.array(z.object({ id: z.string().min(1), question: z.string().min(1).max(2000) }).strict()).max(100)
  })
  .strict();
export type BuilderIntent = z.infer<typeof intentSchema>;
export type IntentStatus = 'satisfied' | 'violated' | 'unverified';
export type RequirementEvidence = {
  requirementId: string;
  status: IntentStatus;
  source: 'static' | 'lifecycle' | 'none';
  paths: string[];
  reason: string;
};
export type IntentEvidence = {
  maturity: 'experimental';
  scope: 'initial-artifact-configuration';
  version: 1;
  artifactId: string;
  checkedAt: string;
  intentId: string;
  status: IntentStatus;
  requirements: RequirementEvidence[];
  coverage: { executed: string[]; unverified: string[] };
};

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isSafeInteger(value)) return JSON.stringify(value);
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) if (!Object.hasOwn(value, i)) throw new Error('Artifact arrays must not contain holes.');
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((key) => JSON.stringify(key) + ':' + canonicalJson((value as Record<string, unknown>)[key]))
        .join(',') +
      '}'
    );
  }
  throw new Error('Artifact must contain only exact JSON values (no undefined, bigint, nonfinite or unsafe numbers)');
}
export function artifactIdentity(value: unknown): string {
  return sha256(toUtf8Bytes(canonicalJson(value))).slice(2);
}

export function parseIntent(input: unknown): BuilderIntent {
  const intent = intentSchema.parse(input);
  const ids = new Set<string>();
  const constraints = new Map<string, string>();
  for (const item of intent.requirements) {
    if (ids.has(item.id)) throw new Error('Duplicate requirement ID: ' + item.id);
    ids.add(item.id);
    const scope = item.kind + ':' + (item.approvalId ?? 'all');
    const value = canonicalJson(item.value);
    if (constraints.has(scope) && constraints.get(scope) !== value) throw new Error('Contradictory requirements for ' + scope);
    constraints.set(scope, value);
    if (item.kind === 'asset' && item.value?.tokenIds.some((range) => BigInt(range.start) > BigInt(range.end)))
      throw new Error('Inverted token range');
  }
  return intent;
}

export function verifyIntent(artifact: unknown, input: unknown): IntentEvidence {
  const intent = parseIntent(input);
  const tx = artifact as any;
  const messages = Array.isArray(tx?.messages) ? tx.messages : tx?.typeUrl ? [tx] : [];
  const collections = messages
    .map((msg: any, index: number) => ({ msg, index }))
    .filter(({ msg }: any) => msg?.typeUrl === '/tokenization.MsgUniversalUpdateCollection' || msg?.typeUrl === '/tokenization.MsgCreateCollection');
  const requirements = intent.requirements.map((req): RequirementEvidence => {
    const base = {
      requirementId: req.id,
      status: 'unverified' as IntentStatus,
      source: 'none' as RequirementEvidence['source'],
      paths: [] as string[]
    };
    if (req.value === null) return { ...base, reason: 'Value is unknown; ask the user before building.' };
    if (req.kind === 'unsupported') return { ...base, reason: 'No installed verifier for this requirement.' };
    if (collections.length !== 1 || messages.length !== 1)
      return { ...base, reason: 'Exactly one collection message is supported; multi-message effects require separate inspection.' };
    const { msg, index } = collections[0];
    const value = msg.value;
    const creating = msg.typeUrl === '/tokenization.MsgCreateCollection';
    if (!value || typeof value !== 'object') return { ...base, reason: 'Missing collection value.' };
    const path = `messages[${index}].value`;
    const result = (
      matches: boolean,
      field: string,
      reason = 'Exact initial artifact configuration; lifecycle execution and future updates are separate checks.'
    ): RequirementEvidence => ({ ...base, status: matches ? 'satisfied' : 'violated', source: 'static', paths: [path + '.' + field], reason });
    const approvals: any[] = Array.isArray(value.collectionApprovals) ? value.collectionApprovals : [];
    const selected = req.approvalId ? approvals.filter((a) => a.approvalId === req.approvalId) : approvals.filter((a) => a.fromListId === 'Mint');
    if (req.kind === 'payment' || req.kind === 'duration') {
      if (!creating && value.updateCollectionApprovals !== true)
        return { ...base, reason: 'Approval updates are disabled; current chain state is required.' };
      if (!selected.length) return result(false, 'collectionApprovals', 'Required mint approval is absent.');
      if (!req.approvalId && approvals.some((a) => !['Mint', '!Mint'].includes(a.fromListId)))
        return { ...base, reason: 'Custom sender lists may bypass the selected mint approvals; resolve list state and execute lifecycle scenarios.' };
      if (req.kind === 'duration')
        return result(
          selected.every((a) => a.approvalCriteria?.predeterminedBalances?.incrementedBalances?.durationFromTimestamp === req.value!.milliseconds),
          'collectionApprovals'
        );
      const expected = req.value;
      return result(
        selected.every((a) => {
          const transfers = a.approvalCriteria?.coinTransfers;
          return (
            Array.isArray(transfers) &&
            transfers.length === 1 &&
            transfers[0].to === expected.recipient &&
            transfers[0].overrideToWithInitiator === false &&
            transfers[0].overrideFromWithApproverAddress === false &&
            Array.isArray(transfers[0].coins) &&
            transfers[0].coins.length === 1 &&
            transfers[0].coins[0].amount === expected.amount &&
            transfers[0].coins[0].denom === expected.denom
          );
        }),
        'collectionApprovals'
      );
    }
    if (req.kind === 'supply') {
      if (!creating && value.collectionId !== '0') return { ...base, reason: 'Invariants on existing collections require current chain state.' };
      return result(
        value.invariants?.maxSupplyPerId === req.value.maxSupplyPerId,
        'invariants.maxSupplyPerId',
        'Immutable collection supply invariant; zero means unlimited.'
      );
    }
    if (req.kind === 'asset')
      return result(
        (creating ? '0' : value.collectionId) === req.value.collectionId &&
          (creating || value.updateValidTokenIds === true) &&
          canonicalJson(value.validTokenIds ?? []) === canonicalJson(req.value.tokenIds),
        'validTokenIds'
      );
    if (req.kind === 'transferability') {
      if (!creating && value.updateCollectionApprovals !== true) return { ...base, reason: 'Current approval state is required.' };
      const holderApprovals = approvals.filter((a) => a.fromListId !== 'Mint');
      if (req.value === false)
        return result(
          holderApprovals.length === 0,
          'collectionApprovals',
          'No initial holder transfer approval. Manager changes, incoming approvals and later updates require separate checks.'
        );
      return { ...base, reason: 'A collection approval alone cannot establish transfer eligibility; execute sender/recipient lifecycle scenarios.' };
    }
    if (req.kind === 'managerPowers') {
      if (!creating && value.updateCollectionPermissions !== true) return { ...base, reason: 'Current collection permissions are required.' };
      const permissions = value.collectionPermissions?.canUpdateCollectionApprovals;
      if (!Array.isArray(permissions)) return { ...base, reason: 'Missing approval permissions.' };
      if (permissions.length === 0)
        return result(
          req.value.canUpdateApprovals,
          'collectionPermissions.canUpdateCollectionApprovals',
          'Empty permission list retains manager update powers.'
        );
      return {
        ...base,
        source: 'static',
        paths: [path + '.collectionPermissions.canUpdateCollectionApprovals'],
        reason: 'Scoped permissions are not a universal lock. Run manager-bypass scenarios across the full permission domain.'
      };
    }
    return { ...base, reason: 'Unsupported requirement.' };
  });
  const status: IntentStatus = requirements.some((r) => r.status === 'violated')
    ? 'violated'
    : !requirements.length || intent.unresolvedDecisions.length > 0 || requirements.some((r) => r.status === 'unverified')
      ? 'unverified'
      : 'satisfied';
  return {
    version: 1,
    maturity: 'experimental',
    scope: 'initial-artifact-configuration',
    artifactId: artifactIdentity(artifact),
    intentId: artifactIdentity(intent),
    checkedAt: String(Date.now()),
    status,
    requirements,
    coverage: {
      executed: ['static-artifact'],
      unverified: ['lifecycle', 'signatures', 'fees', 'sequences', 'IBC', 'claims', 'plugins', 'indexer', 'external-services']
    }
  };
}

export function repairArtifact(input: { intent: unknown; original: unknown; candidates: unknown[] }) {
  if (input.candidates.length > 3) throw new Error('At most three repair candidates are allowed.');
  const intent = parseIntent(input.intent);
  const originalIntentId = artifactIdentity(intent);
  const history: { revision: number; artifactId: string; evidence: IntentEvidence }[] = [];
  for (const artifact of [input.original, ...input.candidates]) {
    const evidence = verifyIntent(artifact, intent);
    history.push({ revision: history.length, artifactId: evidence.artifactId, evidence });
    if (evidence.status === 'satisfied') break;
    if (evidence.requirements.some((item) => item.status === 'unverified')) break;
  }
  const evidence = history[history.length - 1].evidence;
  return {
    version: 1,
    intentId: originalIntentId,
    status: evidence.status,
    history,
    nextAction:
      evidence.status === 'satisfied'
        ? 'Run lifecycle checks and browser review.'
        : evidence.status === 'unverified'
          ? 'Stop and clarify unsupported requirements; do not weaken intent.'
          : 'Repair failed constraints without changing original intent.',
    failures: evidence.requirements
      .filter((item) => item.status !== 'satisfied')
      .map((item) => ({ ...item, schema: 'bb dev capabilities verify_intent', docs: 'https://docs.bitbadges.io/start/first-collection' }))
  };
}
