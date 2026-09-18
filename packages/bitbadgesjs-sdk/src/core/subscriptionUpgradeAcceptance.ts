import type { SubscriptionQuoteResponse, SubscriptionPeriodResponse } from '../api-indexer/subscriptions.js';
import { GO_MAX_UINT_64 as MAX } from '../common/math.js';
import { BalanceArray, getBalancesForIds } from './balances.js';
import { UserIncomingApproval, UserOutgoingApproval } from './approvals.js';
import { UserPermissions } from './permissions.js';
import { quoteSubscriptionUpgrade } from './subscriptionUpgrade.js';
import {
  buildSubscriptionUpgradeEscrow,
  buildSubscriptionUpgradeOffer,
  buildSubscriptionUpgradeTransfers,
  inspectSubscriptionUpgradeCollection,
  SUBSCRIPTION_UPGRADE_APPROVALS,
  type SubscriptionUpgradeNativeOffer
} from './subscriptionUpgradeNative.js';

const json = (v: unknown) =>
  JSON.stringify(v, (_, x) =>
    typeof x === 'bigint'
      ? x.toString()
      : x && typeof x === 'object' && !Array.isArray(x)
        ? Object.fromEntries(Object.entries(x).sort(([a], [b]) => a.localeCompare(b)))
        : x
  );
function requireEqual(a: unknown, b: unknown, label: string) {
  if (json(a) !== json(b)) throw new Error(`Subscription ${label} changed. Refresh the quote.`);
}
function number(value: string) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d*)$/.test(value) || BigInt(value) > MAX) throw new Error('Invalid subscription number.');
  return BigInt(value);
}
const ranges = (values: { start: string; end: string }[]) => values.map((v) => ({ start: number(v.start), end: number(v.end) }));
const period = (v: SubscriptionPeriodResponse) => ({
  periodId: v.periodId,
  tokenId: number(v.tokenId),
  start: number(v.start),
  end: number(v.end),
  paidAmount: number(v.paidAmount)
});

/** Caller supplies fresh, same-height chain reads and the authenticated operator receipt ledger. No server transaction is accepted. */
export function verifySubscriptionQuoteAcceptance(input: {
  quote: SubscriptionQuoteResponse;
  creator: string;
  now: bigint;
  collection: any;
  operatorBalance: any;
  subscriberBalance: any;
  escrowBalance?: any;
  periods: SubscriptionPeriodResponse[];
  outgoingTransfers: bigint;
}) {
  const { quote: q, creator, now, collection, operatorBalance, subscriberBalance, escrowBalance } = input;
  const profile = inspectSubscriptionUpgradeCollection(collection);
  if (!profile) throw new Error('Unsupported subscription profile.');
  if (
    q.state !== 'ready' ||
    !q.versions ||
    q.subscriber !== creator ||
    now < number(q.createdAt) ||
    now > number(q.expiresAt) ||
    input.outgoingTransfers !== 0n
  )
    throw new Error('Subscription quote is not currently available to this wallet.');
  const raw = q.offer;
  const offer: SubscriptionUpgradeNativeOffer = {
    ...raw,
    collectionId: number(raw.collectionId),
    createdAt: number(raw.createdAt),
    expiresAt: number(raw.expiresAt),
    targetTokenId: number(raw.targetTokenId),
    tierCount: number(raw.tierCount),
    ownershipTimes: ranges(raw.ownershipTimes),
    payments: raw.payments.map((p) => ({ ...p, amount: number(p.amount) })),
    source: raw.source ? { ...raw.source, tokenId: number(raw.source.tokenId), ownershipTimes: ranges(raw.source.ownershipTimes) } : undefined
  };
  requireEqual(
    [raw.collectionId, raw.operator, raw.subscriber, raw.initiator, raw.createdAt, raw.expiresAt, raw.tierCount],
    [q.collectionId, profile.operator, creator, creator, q.createdAt, q.expiresAt, String(profile.tiers.length)],
    'identity'
  );
  requireEqual(String(collection.collectionId), q.collectionId, 'collection');
  const target = profile.tiers.find((t) => t.tokenId === offer.targetTokenId);
  if (!target) throw new Error('Unknown subscription tier.');
  let payment = target.price;
  const quotedPeriods = q.periods.map(period);
  if (q.kind === 'purchase') {
    if (offer.source || quotedPeriods.length !== 1 || !quotedPeriods[0].periodId) throw new Error('Invalid initial subscription period.');
    requireEqual(
      quotedPeriods,
      [
        {
          periodId: quotedPeriods[0].periodId,
          tokenId: target.tokenId,
          start: offer.createdAt,
          end: offer.createdAt + profile.duration - 1n,
          paidAmount: target.price
        }
      ],
      'purchase terms'
    );
    requireEqual(offer.ownershipTimes, [{ start: offer.createdAt, end: offer.createdAt + profile.duration - 1n }], 'purchase access');
  } else if (q.kind === 'upgrade') {
    if (!offer.source) throw new Error('Missing source subscription.');
    const source = profile.tiers.find((t) => t.tokenId === offer.source!.tokenId);
    if (!source) throw new Error('Unknown source tier.');
    const calculated = quoteSubscriptionUpgrade({
      source: { ...source, duration: profile.duration, denom: profile.denom },
      target: { ...target, duration: profile.duration, denom: profile.denom },
      periods: input.periods.filter((p) => number(p.end) >= offer.createdAt).map(period),
      now: offer.createdAt,
      expiresAt: offer.expiresAt
    });
    requireEqual(quotedPeriods, calculated.periods, 'billing periods');
    requireEqual(offer.ownershipTimes, calculated.ownershipTimes, 'upgrade access');
    requireEqual(offer.expiresAt, calculated.expiresAt, 'expiry');
    payment = calculated.paymentAmount;
  } else throw new Error('Unsupported quote kind.');
  requireEqual([q.denom, q.paymentAmount], [profile.denom, String(payment)], 'price');
  let allocated = 0n;
  const payouts = profile.payouts
    .map((p, i) => {
      const amount = i === profile.payouts.length - 1 ? payment - allocated : (payment * p.weightBps) / 10000n;
      allocated += amount;
      return { to: p.recipient, amount, denom: profile.denom };
    })
    .filter((p) => p.amount > 0n);
  requireEqual(offer.payments, payouts, 'payouts');
  const versions = {
    surrender: number(q.versions.surrender),
    delivery: number(q.versions.delivery),
    outgoing: number(q.versions.outgoing),
    ...(q.versions.intake !== undefined ? { intake: number(q.versions.intake) } : {})
  };
  for (const key of ['surrender', 'delivery'] as const) {
    const approval = collection.collectionApprovals.find((a: any) => a.approvalId === SUBSCRIPTION_UPGRADE_APPROVALS[key]);
    requireEqual(String(approval?.version ?? 0), String(versions[key]), `${key} approval version`);
  }
  const actual = operatorBalance.outgoingApprovals?.filter((a: any) => a.approvalId === offer.approvalId);
  if (actual?.length !== 1) throw new Error('Missing exact subscription offer.');
  requireEqual(String(actual[0].version ?? 0), String(versions.outgoing), 'offer version');
  const outgoing = (a: any) => new UserOutgoingApproval({ ...a, version: 0n }).toProto().toJson();
  requireEqual(outgoing(actual[0]), outgoing(buildSubscriptionUpgradeOffer(offer).approval), 'offer approval');
  const userBalances = BalanceArray.From(subscriberBalance.balances).convert(BigInt);
  const allIds = [{ start: 1n, end: offer.tierCount }];
  const guardTimes = offer.source ? [{ start: offer.createdAt, end: MAX }] : offer.ownershipTimes;
  const current = getBalancesForIds(allIds, guardTimes, userBalances);
  const expected = offer.source
    ? [{ amount: 1n, tokenIds: [{ start: offer.source.tokenId, end: offer.source.tokenId }], ownershipTimes: offer.source.ownershipTimes }]
    : [];
  if (!current.equalBalances(expected)) throw new Error('Subscription ownership changed or overlaps another tier.');
  const inventory = getBalancesForIds(
    [{ start: target.tokenId, end: target.tokenId }],
    offer.ownershipTimes,
    BalanceArray.From(operatorBalance.balances).convert(BigInt)
  );
  inventory.subtractBalances([{ amount: 1n, tokenIds: [{ start: target.tokenId, end: target.tokenId }], ownershipTimes: offer.ownershipTimes }]);
  if (offer.source) {
    if (!escrowBalance || versions.intake === undefined) throw new Error('Missing subscription escrow state.');
    const expectedEscrow = buildSubscriptionUpgradeEscrow(offer);
    if (
      escrowBalance.autoApproveAllIncomingTransfers ||
      escrowBalance.autoApproveSelfInitiatedIncomingTransfers ||
      escrowBalance.autoApproveSelfInitiatedOutgoingTransfers ||
      escrowBalance.outgoingApprovals?.length ||
      escrowBalance.incomingApprovals?.length !== 1 ||
      escrowBalance.balances?.length
    )
      throw new Error('Subscription escrow is not empty and locked.');
    requireEqual(String(escrowBalance.incomingApprovals[0].version ?? 0), String(versions.intake), 'escrow version');
    const incoming = (a: any) => new UserIncomingApproval({ ...a, version: 0n }).toProto().toJson();
    requireEqual(incoming(escrowBalance.incomingApprovals[0]), incoming(expectedEscrow.incomingApprovals![0]), 'escrow intake');
    requireEqual(
      new UserPermissions(escrowBalance.userPermissions).toProto().toJson(),
      expectedEscrow.userPermissions!.toProto().toJson(),
      'escrow permissions'
    );
  }
  return { profile, offer, periods: quotedPeriods, paymentAmount: payment, message: buildSubscriptionUpgradeTransfers(offer, versions) };
}
