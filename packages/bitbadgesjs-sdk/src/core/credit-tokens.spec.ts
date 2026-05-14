import {
  doesCollectionFollowCreditTokenProtocol,
  extractCreditTokenTiers,
  buildPurchaseCreditTokenMsg
} from './credit-tokens.js';

const SELLER = 'bb1seller';
const BUYER = 'bb1buyer';

const scaledTier = () => ({
  approvalId: 'credit-scaled',
  fromListId: 'Mint',
  toListId: 'All',
  initiatedByListId: 'All',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    coinTransfers: [{ to: SELLER, coins: [{ denom: 'uusdc', amount: '1000000' }], overrideFromWithApproverAddress: false }],
    predeterminedBalances: {
      incrementedBalances: {
        startBalances: [{ amount: '100', tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: [] }],
        allowAmountScaling: true,
        maxScalingMultiplier: '0'
      }
    }
  }
});

const legacyTier = (n: number) => ({
  approvalId: `credit-${n}`,
  fromListId: 'Mint',
  toListId: 'All',
  initiatedByListId: 'All',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    coinTransfers: [{ to: SELLER, coins: [{ denom: 'uusdc', amount: String(n * 1000000) }], overrideFromWithApproverAddress: false }],
    predeterminedBalances: {
      incrementedBalances: {
        startBalances: [{ amount: String(n * 100), tokenIds: [{ start: 1n, end: 1n }], ownershipTimes: [] }],
        allowAmountScaling: false
      }
    }
  }
});

const validCollection = (approvals: any[]): any => ({
  standards: ['Credit Token'],
  validTokenIds: [{ start: 1n, end: 1n }],
  collectionApprovals: approvals
});

describe('doesCollectionFollowCreditTokenProtocol', () => {
  it('accepts a collection with the "Credit Token" standard tag', () => {
    expect(doesCollectionFollowCreditTokenProtocol(validCollection([scaledTier()]))).toBe(true);
  });
  it('accepts a collection with any credit-* approval even without the standard tag', () => {
    expect(
      doesCollectionFollowCreditTokenProtocol({ ...validCollection([scaledTier()]), standards: [] } as any)
    ).toBe(true);
  });
  it('rejects a collection with no credit-* approvals', () => {
    expect(
      doesCollectionFollowCreditTokenProtocol({
        ...validCollection([{ approvalId: 'other', approvalCriteria: {} } as any]),
        standards: []
      } as any)
    ).toBe(false);
  });
});

describe('extractCreditTokenTiers', () => {
  it('extracts the scaled tier with maxMultiplier', () => {
    const tiers = extractCreditTokenTiers([scaledTier() as any]);
    expect(tiers).toHaveLength(1);
    expect(tiers[0].isScaled).toBe(true);
    expect(tiers[0].approvalId).toBe('credit-scaled');
    expect(tiers[0].paymentDenom).toBe('uusdc');
    expect(tiers[0].mintAmount).toBe(100n);
  });

  it('extracts legacy tiers with parsed value', () => {
    const tiers = extractCreditTokenTiers([legacyTier(5) as any, legacyTier(10) as any]);
    expect(tiers.map((t) => t.value).sort((a, b) => a - b)).toEqual([5, 10]);
    expect(tiers.every((t) => !t.isScaled)).toBe(true);
  });

  it('ignores non-credit-* approvals', () => {
    const tiers = extractCreditTokenTiers([
      { approvalId: 'noise', approvalCriteria: { coinTransfers: [] } } as any,
      scaledTier() as any
    ]);
    expect(tiers).toHaveLength(1);
  });
});

describe('buildPurchaseCreditTokenMsg', () => {
  it('emits scaled MsgTransferTokens with balances × multiplier', () => {
    const tier = extractCreditTokenTiers([scaledTier() as any])[0];
    const msg = buildPurchaseCreditTokenMsg(BUYER, '42', tier, 3n);
    const transfer = (msg.value as any).transfers[0];
    expect(transfer.balances[0].amount).toBe('300'); // 100 × 3
    expect(transfer.prioritizedApprovals[0].approvalId).toBe('credit-scaled');
    expect(() => JSON.stringify(msg)).not.toThrow();
  });

  it('emits legacy MsgTransferTokens with precalculateBalancesFromApproval', () => {
    const tier = extractCreditTokenTiers([legacyTier(5) as any])[0];
    const msg = buildPurchaseCreditTokenMsg(BUYER, '42', tier, 1n);
    const transfer = (msg.value as any).transfers[0];
    expect(transfer.balances).toEqual([]);
    expect(transfer.precalculateBalancesFromApproval.approvalId).toBe('credit-5');
  });

  it('clamps to maxScalingMultiplier when set', () => {
    const tierData: any = scaledTier();
    tierData.approvalCriteria.predeterminedBalances.incrementedBalances.maxScalingMultiplier = '5';
    const tier = extractCreditTokenTiers([tierData])[0];
    const msg = buildPurchaseCreditTokenMsg(BUYER, '42', tier, 100n);
    const transfer = (msg.value as any).transfers[0];
    expect(transfer.balances[0].amount).toBe('500'); // 100 × min(100, 5)
  });

  it('throws on zero or negative units', () => {
    const tier = extractCreditTokenTiers([scaledTier() as any])[0];
    expect(() => buildPurchaseCreditTokenMsg(BUYER, '42', tier, 0n)).toThrow();
    expect(() => buildPurchaseCreditTokenMsg(BUYER, '42', tier, -1n)).toThrow();
  });
});
