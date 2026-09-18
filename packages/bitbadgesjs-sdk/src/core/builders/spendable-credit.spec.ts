import { buildSpendableCredit } from './spendable-credit.js';
import { BURN_ADDRESS, MAX_UINT64 } from './shared.js';

const params = {
  paymentDenom: 'USDC',
  provider: BURN_ADDRESS,
  serviceId: 'image-generation',
  pricePerPack: '1000000',
  creditsPerPack: '10',
  name: 'Image credits',
  description: 'One credit per image.',
  image: 'ipfs://image'
};

describe('spendable credits', () => {
  test('permits only paid mint and holder-initiated consumption, with immutable terms', () => {
    const value = buildSpendableCredit(params).value;
    expect(value.standards).toEqual(['Spendable Credit']);
    expect(value.collectionApprovals).toHaveLength(2);
    const [mint, consume] = value.collectionApprovals;
    expect(mint.fromListId).toBe('Mint');
    expect(mint.approvalCriteria.coinTransfers[0].coins[0].amount).toBe('1000000');
    expect(consume.toListId).toBe(BURN_ADDRESS);
    expect(consume.approvalCriteria.requireFromEqualsInitiatedBy).toBe(true);
    expect(consume.approvalCriteria.overridesFromOutgoingApprovals).not.toBe(true);
    expect(value.invariants.noForcefulPostMintTransfers).toBe(true);
    expect(value.aliasPathsToAdd).toEqual([]);
    expect(value.cosmosCoinWrapperPathsToAdd).toEqual([]);
    expect(value.collectionPermissions.canUpdateCollectionApprovals[0].permanentlyForbiddenTimes[0].end).toBe(MAX_UINT64);
  });

  test('expiry limits both purchase and consumption while retaining whole units', () => {
    const value = buildSpendableCredit({ ...params, expiresAt: '2000000000000' }).value;
    for (const approval of value.collectionApprovals) {
      expect(approval.transferTimes).toEqual([{ start: '1', end: '2000000000000' }]);
    }
    expect(value.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount).toBe('10');
  });

  test.each(['0', '-1', '1.5', '1e3', '18446744073709551616'])('rejects non-uint64 price %s', (pricePerPack) => {
    expect(() => buildSpendableCredit({ ...params, pricePerPack })).toThrow();
  });
  test('rejects ambiguous service identifiers and invalid providers', () => {
    expect(() => buildSpendableCredit({ ...params, serviceId: '' })).toThrow();
    expect(() => buildSpendableCredit({ ...params, provider: 'bb1invalid' })).toThrow();
  });
  test('scaling maximum fits both credit and payment uint64 totals', () => {
    const value = buildSpendableCredit({ ...params, pricePerPack: MAX_UINT64 }).value;
    expect(value.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.maxScalingMultiplier).toBe('1');
  });
});

test('multiple purchase options bind exact packs and capped scaling independently', () => {
  const { pricePerPack, creditsPerPack, ...base } = params;
  const value = buildSpendableCredit({
    ...base,
    purchaseOptions: [
      { pricePerPack: '10', creditsPerPack: '3', purchaseType: 'fixed' },
      { pricePerPack: '20', creditsPerPack: '8', purchaseType: 'scaled', maxPacks: '4' }
    ]
  }).value;
  expect(value.collectionApprovals).toHaveLength(3);
  const [fixed, scaled, consume] = value.collectionApprovals;
  expect(fixed.approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling).toBe(false);
  expect(scaled.approvalCriteria.predeterminedBalances.incrementedBalances.maxScalingMultiplier).toBe('4');
  expect(scaled.approvalId).toBe('spendable-purchase-2');
  expect(consume.approvalId).toBe('spendable-consume');
});

test('rejects ambiguous, empty, fractional and overflowing purchase options', () => {
  const { pricePerPack, creditsPerPack, ...base } = params;
  const option = { pricePerPack: '10', creditsPerPack: '3', purchaseType: 'scaled' as const };
  for (const purchaseOptions of [
    [],
    [{ ...option, maxPacks: '0' }],
    [{ ...option, maxPacks: '1.5' }],
    [{ ...option, maxPacks: MAX_UINT64 }],
    [{ ...option, purchaseType: 'fixed', maxPacks: '2' }]
  ]) {
    expect(() => buildSpendableCredit({ ...base, purchaseOptions } as any)).toThrow();
  }
  expect(() => buildSpendableCredit({ ...params, purchaseOptions: [option] })).toThrow();
});
