import { GO_MAX_UINT_64 } from '../common/math.js';

export type SubscriptionBillingPeriod = {
  periodId: string;
  tokenId: bigint;
  start: bigint;
  end: bigint;
  paidAmount: bigint;
};

export type SubscriptionUpgradeTier = {
  tokenId: bigint;
  price: bigint;
  duration: bigint;
  denom: string;
};

function uint(value: bigint, positive = false): void {
  if (typeof value !== 'bigint' || value < (positive ? 1n : 0n) || value > GO_MAX_UINT_64) {
    throw new Error('Subscription upgrade value is outside the supported range.');
  }
}

/** Prices receipt-verified periods; callers must verify provenance and current ownership separately. */
export function quoteSubscriptionUpgrade({
  source,
  target,
  periods,
  now,
  expiresAt
}: {
  source: SubscriptionUpgradeTier;
  target: SubscriptionUpgradeTier;
  periods: readonly SubscriptionBillingPeriod[];
  now: bigint;
  expiresAt: bigint;
}) {
  uint(now, true);
  uint(expiresAt, true);
  for (const tier of [source, target]) {
    uint(tier.tokenId, true);
    uint(tier.price);
    uint(tier.duration, true);
    if (!tier.denom) throw new Error('Subscription upgrade requires a payment denomination.');
  }
  if (source.tokenId === target.tokenId || target.price <= source.price) {
    throw new Error('Choose a higher-priced subscription tier.');
  }
  if (source.denom !== target.denom || source.duration !== target.duration) {
    throw new Error('Subscription upgrades require the same denomination and billing duration.');
  }
  if (!periods.length) throw new Error('No purchased periods are available to upgrade.');

  const ordered = [...periods].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0));
  const identities = new Set<string>();
  let previousEnd = 0n;
  for (const period of ordered) {
    uint(period.start, true);
    uint(period.end, true);
    uint(period.tokenId, true);
    uint(period.paidAmount);
    if (!period.periodId || identities.has(period.periodId)) throw new Error('Purchased period identities must be unique.');
    identities.add(period.periodId);
    if (period.end < now || period.start <= previousEnd || period.end - period.start + 1n !== source.duration) {
      throw new Error('Purchased periods must be unexpired, nonoverlapping full billing periods.');
    }
    if (period.tokenId !== source.tokenId || period.paidAmount !== source.price) {
      throw new Error('Purchased period price or tier does not match the verified source terms.');
    }
    previousEnd = period.end;
  }

  const quoteEnd = expiresAt < ordered[0].end ? expiresAt : ordered[0].end;
  if (quoteEnd <= now) throw new Error('Subscription upgrade quote has expired.');
  const paymentAmount = (target.price - source.price) * BigInt(ordered.length);
  uint(paymentAmount, true);
  return {
    policy: 'full-period-difference' as const,
    denom: source.denom,
    paymentAmount,
    expiresAt: quoteEnd,
    ownershipTimes: ordered.map((period) => ({ start: period.start > now ? period.start : now, end: period.end })),
    periods: ordered.map((period) => ({ ...period, tokenId: target.tokenId, paidAmount: target.price }))
  };
}
