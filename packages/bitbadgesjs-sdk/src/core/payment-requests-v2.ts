import { z } from 'zod';
import { convertToBitBadgesAddress, isAddressValid } from '../address-converter/converter.js';
import {
  FOREVER,
  BURN_ADDRESS,
  buildMsg,
  frozenPermissions,
  defaultBalances,
  mintToBurnBalances,
  zeroMaxTransfers,
  metadataFromFlat,
  tokenMetadataEntry
} from './builders/shared.js';

const MAX_UINT64 = (1n << 64n) - 1n;
const integer = z
  .string()
  .regex(/^[1-9][0-9]*$/, 'Expected a positive base-unit integer string')
  .refine((v) => BigInt(v) <= MAX_UINT64, 'Integer exceeds uint64');
const coinAmount = z
  .string()
  .regex(/^[1-9][0-9]*$/, 'Expected a positive base-unit integer string')
  .refine((v) => BigInt(v) < 1n << 255n, 'Coin amount exceeds supported range');
const address = z
  .string()
  .refine((v) => isAddressValid(v) && convertToBitBadgesAddress(v) === v && v !== BURN_ADDRESS, 'Expected a canonical spendable BitBadges address');

export const paymentObligationSchema = z
  .object({
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/),
    payer: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('anyone') }).strict(),
      z
        .object({
          kind: z.literal('addresses'),
          addresses: z
            .array(address)
            .min(1)
            .max(100)
            .refine((a) => new Set(a).size === a.length, 'Duplicate payers')
        })
        .strict()
    ]),
    payouts: z
      .array(z.object({ recipient: address, denom: z.string().regex(/^[a-zA-Z][a-zA-Z0-9/:._-]{2,127}$/), amount: coinAmount }).strict())
      .min(1)
      .max(50),
    startTime: integer,
    endTime: integer,
    dueAt: integer.optional(),
    requiredPayments: integer.optional(),
    distinctPayers: z.boolean().optional(),
    partial: z.object({ targetUnits: integer }).strict().optional()
  })
  .strict();

export const paymentRequestV2TermsSchema = z
  .object({
    version: z.literal(2),
    kind: z.enum(['invoice', 'payment-link']),
    obligations: z.array(paymentObligationSchema).min(1).max(100)
  })
  .strict()
  .superRefine((terms, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });
    if (new Set(terms.obligations.map((o) => o.id)).size !== terms.obligations.length) fail('Duplicate obligation IDs');
    for (const o of terms.obligations) {
      if (BigInt(o.startTime) > BigInt(o.endTime)) fail(`Invalid payment window for ${o.id}`);
      if (o.dueAt && (BigInt(o.dueAt) < BigInt(o.startTime) || BigInt(o.dueAt) > BigInt(o.endTime)))
        fail(`Due date outside payment window for ${o.id}`);
      if (o.partial && (o.requiredPayments !== undefined || o.distinctPayers)) fail('Partial payments cannot also require a distinct payment count');
      if (terms.kind === 'payment-link' && (o.requiredPayments !== undefined || o.partial || o.distinctPayers))
        fail('Reusable links must have unlimited fixed payments');
      if (o.distinctPayers && o.payer.kind === 'addresses' && BigInt(o.requiredPayments ?? '1') > BigInt(o.payer.addresses.length))
        fail('Required distinct payers exceed eligible roster');
      if (new Set(o.payouts.map((p) => `${p.recipient}:${p.denom}`)).size !== o.payouts.length) fail('Duplicate payout recipient and denomination');
      if (o.payer.kind === 'addresses' && o.payer.addresses.some((payer) => o.payouts.some((p) => p.recipient === payer)))
        fail('Eligible payers cannot also receive a payout');
      for (const p of o.payouts)
        if (BigInt(p.amount) * BigInt(o.partial?.targetUnits ?? o.requiredPayments ?? '1') >= 1n << 255n)
          fail('Total payout exceeds supported coin range');
    }
  });

export type PaymentObligation = z.infer<typeof paymentObligationSchema>;
export type PaymentRequestV2Terms = z.infer<typeof paymentRequestV2TermsSchema>;
export type PaymentRequestV2Params = PaymentRequestV2Terms & { uri?: string; name?: string; image?: string; description?: string };
export type PaymentRequestV2Validation = { valid: boolean; errors: string[]; warnings: string[]; terms?: PaymentRequestV2Terms };
export type PaymentRequestV2Collection = {
  customData?: string;
  standards?: readonly string[];
  collectionApprovals?: readonly unknown[];
  collectionPermissions?: unknown;
  validTokenIds?: unknown;
  invariants?: unknown;
  aliasPaths?: readonly unknown[];
  aliasPathsToAdd?: readonly unknown[];
  cosmosCoinWrapperPaths?: readonly unknown[];
  cosmosCoinWrapperPathsToAdd?: readonly unknown[];
};

export function paymentRequestV2Approvals(terms: PaymentRequestV2Terms) {
  return terms.obligations.map((o, i) => {
    const approvalId = `payment-v2-${o.id}`;
    const tokenIds = [{ start: String(i + 1), end: String(i + 1) }];
    const predeterminedBalances = mintToBurnBalances();
    predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = tokenIds;
    if (o.partial) {
      predeterminedBalances.incrementedBalances.allowAmountScaling = true;
      predeterminedBalances.incrementedBalances.maxScalingMultiplier = o.partial.targetUnits;
    }
    return {
      fromListId: 'Mint',
      toListId: BURN_ADDRESS,
      initiatedByListId: o.payer.kind === 'anyone' ? `!(${[...new Set(o.payouts.map((p) => p.recipient))].join(':')})` : o.payer.addresses.join(':'),
      approvalId,
      uri: '',
      customData: '',
      version: '0',
      transferTimes: [{ start: o.startTime, end: o.endTime }],
      tokenIds,
      ownershipTimes: FOREVER,
      approvalCriteria: {
        predeterminedBalances,
        maxNumTransfers: {
          ...zeroMaxTransfers(approvalId),
          overallMaxNumTransfers: o.partial || terms.kind === 'payment-link' ? '0' : (o.requiredPayments ?? '1'),
          perInitiatedByAddressMaxNumTransfers: o.distinctPayers ? '1' : '0'
        },
        approvalAmounts: {
          overallApprovalAmount: o.partial?.targetUnits ?? '0',
          perToAddressApprovalAmount: '0',
          perFromAddressApprovalAmount: '0',
          perInitiatedByAddressApprovalAmount: '0',
          amountTrackerId: approvalId,
          resetTimeIntervals: { startTime: '0', intervalLength: '0' }
        },
        coinTransfers: o.payouts.map((p) => ({
          to: p.recipient,
          coins: [{ denom: p.denom, amount: p.amount }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        })),
        overridesFromOutgoingApprovals: true,
        overridesToIncomingApprovals: true,
        mustPrioritize: true
      }
    };
  });
}

const invariants = { noCustomOwnershipTimes: true, maxSupplyPerId: '0', noForcefulPostMintTransfers: true, disablePoolCreation: true };

export function buildPaymentRequestV2(params: PaymentRequestV2Params) {
  const { uri, name, image, description, ...input } = params;
  const terms = paymentRequestV2TermsSchema.parse(input);
  const metadata = metadataFromFlat({ uri, name, image, description });
  if (!metadata) throw new Error('Payment request metadata requires uri or name, image and description');
  const validTokenIds = [{ start: '1', end: String(terms.obligations.length) }];
  return buildMsg({
    collectionApprovals: paymentRequestV2Approvals(terms),
    standards: [terms.kind === 'invoice' ? 'PaymentRequestV2' : 'PaymentLinkV1'],
    customData: JSON.stringify({ paymentRequest: terms }),
    validTokenIds,
    collectionPermissions: frozenPermissions(),
    defaultBalances: defaultBalances(),
    invariants,
    collectionMetadata: metadata,
    tokenMetadata: [tokenMetadataEntry(validTokenIds, metadata, 'payment receipt')]
  });
}

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
  for (const key of ['details', 'fromList', 'toList', 'initiatedByList']) delete approval[key];
  return approval;
};

export function validatePaymentRequestV2Collection(collection: PaymentRequestV2Collection): PaymentRequestV2Validation {
  const errors: string[] = [];
  try {
    const envelope = z
      .object({ paymentRequest: paymentRequestV2TermsSchema })
      .strict()
      .parse(JSON.parse(collection.customData ?? '{}'));
    const terms = envelope.paymentRequest;
    if (!same(collection.standards, [terms.kind === 'invoice' ? 'PaymentRequestV2' : 'PaymentLinkV1'])) errors.push('Unexpected payment standard');
    if (!same(collection.validTokenIds, [{ start: '1', end: String(terms.obligations.length) }])) errors.push('Invalid obligation token IDs');
    if (!same(collection.invariants, invariants)) errors.push('Unsupported payment invariants');
    if (!same((collection.collectionApprovals ?? []).map(onChainApproval), paymentRequestV2Approvals(terms)))
      errors.push('Approvals differ from payment terms');
    const permissions = { ...(collection.collectionPermissions as any) };
    permissions.canUpdateCollectionApprovals = permissions.canUpdateCollectionApprovals?.map(onChainApproval);
    if (!same(permissions, frozenPermissions())) errors.push('Payment terms are not frozen');
    if (
      [collection.aliasPaths, collection.aliasPathsToAdd, collection.cosmosCoinWrapperPaths, collection.cosmosCoinWrapperPathsToAdd].some(
        (paths) => (paths?.length ?? 0) > 0
      )
    )
      errors.push('Payment receipts cannot have conversion paths');
    return { valid: errors.length === 0, errors, warnings: [], ...(errors.length ? {} : { terms }) };
  } catch (e) {
    return { valid: false, errors: [`Invalid payment terms: ${e instanceof Error ? e.message : String(e)}`], warnings: [] };
  }
}

export function extractPaymentRequestV2Details(collection: PaymentRequestV2Collection): PaymentRequestV2Terms | null {
  return validatePaymentRequestV2Collection(collection).terms ?? null;
}

export function buildPaymentRequestV2PayMsg(
  creator: string,
  collectionId: string,
  collection: PaymentRequestV2Collection,
  obligationId: string,
  units = '1'
) {
  const terms = extractPaymentRequestV2Details(collection);
  if (!terms) throw new Error('Invalid payment collection');
  address.parse(creator);
  integer.parse(collectionId);
  integer.parse(units);
  const index = terms.obligations.findIndex((o) => o.id === obligationId);
  if (index < 0) throw new Error('Unknown payment obligation');
  const o = terms.obligations[index];
  if (o.payer.kind === 'addresses' && !o.payer.addresses.includes(creator)) throw new Error('Payer is not eligible for this obligation');
  if (o.payouts.some((p) => p.recipient === creator)) throw new Error('Payer cannot also receive a payout');
  if ((!o.partial && units !== '1') || (o.partial && BigInt(units) > BigInt(o.partial.targetUnits)))
    throw new Error('Payment units exceed obligation terms');
  const approval = paymentRequestV2Approvals(terms)[index];
  return {
    typeUrl: '/tokenization.MsgTransferTokens',
    value: {
      creator,
      collectionId,
      transfers: [
        {
          from: 'Mint',
          toAddresses: [BURN_ADDRESS],
          balances: [{ amount: units, tokenIds: approval.tokenIds, ownershipTimes: FOREVER }],
          prioritizedApprovals: [{ approvalId: approval.approvalId, approvalLevel: 'collection', approverAddress: '', version: '0' }],
          onlyCheckPrioritizedCollectionApprovals: true
        }
      ]
    }
  };
}
