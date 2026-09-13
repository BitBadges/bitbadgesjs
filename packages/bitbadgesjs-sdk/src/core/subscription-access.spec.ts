import { getSubscriptionAccessStatus, getSubscriptionRenewalConsentStatus } from './subscriptions.js';

const balance = (start: bigint, end: bigint, amount = 1n, tokenId = 1n) => ({
  amount, tokenIds: [{ start: tokenId, end: tokenId }], ownershipTimes: [{ start, end }]
});

describe('subscription access status', () => {
  it('keeps unavailable state distinct from confirmed empty ownership', () => {
    expect(getSubscriptionAccessStatus(1n, undefined, 100n)).toMatchObject({ status: 'unavailable', isSubscribed: null, subscribedTimes: null });
    expect(getSubscriptionAccessStatus(1n, [], 100n)).toMatchObject({ status: 'available', isSubscribed: false, subscribedTimes: [] });
  });
  it('finds current access in later balance entries and ignores zero balances and other tokens', () => {
    expect(getSubscriptionAccessStatus(1n, [balance(1n, 20n), balance(90n, 120n), balance(121n, 500n, 0n), balance(1n, 999n, 1n, 2n)], 100n))
      .toMatchObject({ isSubscribed: true, currentAccessEndsAt: 120n, nextAccessStartsAt: null, subscribedTimes: [{ start: 1n, end: 20n }, { start: 90n, end: 120n }] });
  });
  it('merges adjacent prepaid ownership without implying coverage across gaps', () => {
    expect(getSubscriptionAccessStatus(1n, [balance(200n, 299n), balance(90n, 119n), balance(120n, 140n), balance(130n, 150n)], 100n))
      .toMatchObject({ currentAccessEndsAt: 150n, nextAccessStartsAt: 200n, futureAccessTimes: [{ start: 101n, end: 150n }, { start: 200n, end: 299n }] });
  });
  it('reports future ownership without claiming current access', () => {
    expect(getSubscriptionAccessStatus(1n, [balance(200n, 299n)], 100n))
      .toMatchObject({ isSubscribed: false, currentAccessEndsAt: null, nextAccessStartsAt: 200n, futureAccessTimes: [{ start: 200n, end: 299n }] });
  });
  it('uses inclusive ownership boundaries', () => {
    expect(getSubscriptionAccessStatus(1n, [balance(100n, 200n)], 100n).isSubscribed).toBe(true);
    expect(getSubscriptionAccessStatus(1n, [balance(100n, 200n)], 200n).isSubscribed).toBe(true);
    expect(getSubscriptionAccessStatus(1n, [balance(100n, 200n)], 201n).isSubscribed).toBe(false);
  });
  it('distinguishes recorded, expired, and absent renewal consent without promising payment', () => {
    const faucet = { transferTimes: [{ start: 1n, end: 1000n }] } as any;
    expect(getSubscriptionRenewalConsentStatus(faucet, undefined, 100n)).toBe('none');
    expect(getSubscriptionRenewalConsentStatus(faucet, { transferTimes: [{ start: 1n, end: 99n }] } as any, 100n)).toBe('expired');
    expect(getSubscriptionRenewalConsentStatus(faucet, { transferTimes: [{ start: 200n, end: 300n }] } as any, 100n)).toBe('recorded');
    expect(getSubscriptionRenewalConsentStatus({ transferTimes: [{ start: 1n, end: 99n }] } as any, { transferTimes: [{ start: 1n, end: 1000n }] } as any, 100n)).toBe('expired');
  });
});
