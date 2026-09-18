import { GO_MAX_UINT_64 } from '../common/math.js';
import { quoteSubscriptionUpgrade } from './subscriptionUpgrade.js';

const source = { tokenId: 1n, price: 10_000_000n, duration: 30_000n, denom: 'uusdc' };
const target = { ...source, tokenId: 2n, price: 20_000_000n };
const period = { periodId: 'purchase:1:0', tokenId: 1n, start: 1000n, end: 30_999n, paidAmount: source.price };
const args = { source, target, periods: [period], now: 16_000n, expiresAt: 16_100n };

it('charges the full tier difference and preserves the purchased period identity', () => {
  const result = quoteSubscriptionUpgrade(args);
  expect(result.paymentAmount).toBe(10_000_000n);
  expect(result.ownershipTimes).toEqual([{ start: 16_000n, end: 30_999n }]);
  expect(result.periods).toEqual([{ ...period, tokenId: 2n, paidAmount: target.price }]);
  expect(period.tokenId).toBe(1n);
});

it('does not discount a one-second upgrade or extend its billing period', () => {
  const result = quoteSubscriptionUpgrade({ ...args, now: 30_000n, expiresAt: 40_000n });
  expect(result.paymentAmount).toBe(10_000_000n);
  expect(result.expiresAt).toBe(period.end);
  expect(result.periods[0].end).toBe(period.end);
});

it('carries the paid basis across repeated upgrades without issuing a fresh period', () => {
  const first = quoteSubscriptionUpgrade(args);
  const next = quoteSubscriptionUpgrade({
    ...args,
    source: target,
    target: { ...target, tokenId: 3n, price: 30_000_000n },
    periods: first.periods
  });
  expect(next.paymentAmount).toBe(10_000_000n);
  expect(next.periods[0].periodId).toBe(period.periodId);
  expect(next.periods[0].start).toBe(period.start);
});

it('itemizes prepaid periods and preserves gaps instead of granting continuous access', () => {
  const future = { ...period, periodId: 'purchase:2:0', start: 50_000n, end: 79_999n };
  const result = quoteSubscriptionUpgrade({ ...args, periods: [future, period] });
  expect(result.paymentAmount).toBe(20_000_000n);
  expect(result.ownershipTimes).toEqual([
    { start: args.now, end: period.end },
    { start: future.start, end: future.end }
  ]);
  expect(result.periods.map((p) => p.periodId)).toEqual([period.periodId, future.periodId]);
});

it('does not start future-only access early', () => {
  const result = quoteSubscriptionUpgrade({ ...args, now: 500n, expiresAt: 600n });
  expect(result.ownershipTimes).toEqual([{ start: period.start, end: period.end }]);
});

it.each([
  ['expired', { ...args, now: period.end + 1n, expiresAt: period.end + 100n }],
  ['empty', { ...args, periods: [] }],
  ['duplicate identity', { ...args, periods: [period, { ...period, start: 31_000n, end: 60_999n }] }],
  ['overlap', { ...args, periods: [period, { ...period, periodId: 'other', start: 30_999n, end: 60_998n }] }],
  ['short period', { ...args, periods: [{ ...period, end: 1001n }] }],
  ['discounted basis', { ...args, periods: [{ ...period, paidAmount: 1n }] }],
  ['wrong tier', { ...args, periods: [{ ...period, tokenId: 2n }] }],
  ['different denomination', { ...args, target: { ...target, denom: 'ubadge' } }],
  ['different duration', { ...args, target: { ...target, duration: 1000n } }],
  ['same tier', { ...args, target: source }],
  ['downgrade', { ...args, target: { ...target, price: 1n } }],
  ['expired quote', { ...args, expiresAt: args.now }],
  ['invalid time', { ...args, now: 0n }],
  ['overflow', { ...args, target: { ...target, price: GO_MAX_UINT_64 + 1n } }]
])('rejects %s without fabricating a quote', (_, input) => {
  expect(() => quoteSubscriptionUpgrade(input)).toThrow();
});

it('rejects a total payment that overflows even when each period price is valid', () => {
  const high = { ...target, price: GO_MAX_UINT_64 };
  const future = { ...period, periodId: 'purchase:2:0', start: 31_000n, end: 60_999n };
  expect(() => quoteSubscriptionUpgrade({ ...args, target: high, periods: [period, future] })).toThrow();
});
