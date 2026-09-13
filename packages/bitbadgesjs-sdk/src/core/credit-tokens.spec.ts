import {
  doesCollectionFollowCreditTokenProtocol,
  extractCreditTokenTiers,
  buildPurchaseCreditTokenMsg,
  quoteCreditTokenPurchase,
  bitbadgesApiCreditsCollectionId,
  BITBADGES_API_CREDITS_COLLECTION_IDS
} from './credit-tokens.js';

describe('bitbadgesApiCreditsCollectionId (BitBadges-own convenience id)', () => {
  test('resolves mainnet + local; mirrors FE constants', () => {
    expect(bitbadgesApiCreditsCollectionId('mainnet')).toBe('84');
    expect(bitbadgesApiCreditsCollectionId('local')).toBe('23');
    expect(BITBADGES_API_CREDITS_COLLECTION_IDS.mainnet).toBe('84');
  });
  test('testnet is not deployed — throws a clear error', () => {
    expect(BITBADGES_API_CREDITS_COLLECTION_IDS.testnet).toBeNull();
    expect(() => bitbadgesApiCreditsCollectionId('testnet')).toThrow(/not deployed on testnet/);
  });
});

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

  it('does not quote only the first payout of an unsupported tier', () => {
    const approval = scaledTier();
    approval.approvalCriteria.coinTransfers.push({ ...approval.approvalCriteria.coinTransfers[0] });
    expect(extractCreditTokenTiers([approval as any])).toEqual([]);
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

  it('uses the observed approval version', () => {
    const tier = extractCreditTokenTiers([{ ...scaledTier(), version: 3n } as any])[0];
    const transfer = (buildPurchaseCreditTokenMsg(BUYER, '42', tier, 1n).value as any).transfers[0];
    expect(transfer.prioritizedApprovals[0].version).toBe('3');
  });

  it('emits legacy MsgTransferTokens with precalculateBalancesFromApproval', () => {
    const tier = extractCreditTokenTiers([legacyTier(5) as any])[0];
    const msg = buildPurchaseCreditTokenMsg(BUYER, '42', tier, 1n);
    const transfer = (msg.value as any).transfers[0];
    expect(transfer.balances).toEqual([]);
    expect(transfer.precalculateBalancesFromApproval.approvalId).toBe('credit-5');
  });

  it('rejects over-limit purchases without silently reducing quantity', () => {
    const tierData: any = scaledTier();
    tierData.approvalCriteria.predeterminedBalances.incrementedBalances.maxScalingMultiplier = '5';
    const tier = extractCreditTokenTiers([tierData])[0];
    expect(() => buildPurchaseCreditTokenMsg(BUYER, '42', tier, 100n)).toThrow(/maximum.*5/i);
    expect((buildPurchaseCreditTokenMsg(BUYER, '42', tier, 5n).value as any).transfers[0].balances[0].amount).toBe('500');
  });

  it('throws on zero or negative units', () => {
    const tier = extractCreditTokenTiers([scaledTier() as any])[0];
    expect(() => buildPurchaseCreditTokenMsg(BUYER, '42', tier, 0n)).toThrow();
    expect(() => buildPurchaseCreditTokenMsg(BUYER, '42', tier, -1n)).toThrow();
  });
});

describe('quoteCreditTokenPurchase', () => {
  const tier = () => extractCreditTokenTiers([scaledTier() as any])[0];

  it('quotes exact base and display amounts without floating point loss', () => {
    const quantity = 9007199254740993n;
    const quote = quoteCreditTokenPurchase(tier(), quantity, { paymentDecimals: 6, creditDecimals: 2 });
    expect(quote.requestedMultiplier).toBe(quantity);
    expect(quote.actualMultiplier).toBe(quantity);
    expect(quote.payment.baseAmount).toBe(quantity * 1000000n);
    expect(quote.payment.displayAmount).toBe('9007199254740993');
    expect(quote.minted.baseAmount).toBe(quantity * 100n);
    expect(quote.minted.displayAmount).toBe('9007199254740993');
  });

  it('keeps unknown decimal metadata unknown', () => {
    const quote = quoteCreditTokenPurchase(tier(), 1n);
    expect(quote.payment.displayAmount).toBeNull();
    expect(quote.minted.displayAmount).toBeNull();
    expect(quote.remainingCredits).toBeNull();
  });

  it('supports fractional display units and differing asset precisions', () => {
    const quote = quoteCreditTokenPurchase({ ...tier(), paymentAmount: 1n, mintAmount: 123n }, 3n, { paymentDecimals: 6, creditDecimals: 4 });
    expect(quote.payment.displayAmount).toBe('0.000003');
    expect(quote.minted.displayAmount).toBe('0.0369');
    expect(quote.ratio).toEqual({ paymentBaseAmount: 1n, mintedBaseAmount: 123n });
  });

  it('rejects multi-unit legacy purchases in the SDK too', () => {
    const legacy = extractCreditTokenTiers([legacyTier(5) as any])[0];
    expect(quoteCreditTokenPurchase(legacy, 1n).minted.baseAmount).toBe(500n);
    expect(() => quoteCreditTokenPurchase(legacy, 2n)).toThrow(/legacy/i);
    expect(() => buildPurchaseCreditTokenMsg(BUYER, '42', legacy, 2n)).toThrow(/legacy/i);
  });

  it('rejects invalid economics and invalid display precision', () => {
    expect(() => quoteCreditTokenPurchase({ ...tier(), paymentAmount: 0n }, 1n)).toThrow();
    expect(() => quoteCreditTokenPurchase({ ...tier(), mintAmount: 0n }, 1n)).toThrow();
    expect(() => quoteCreditTokenPurchase(tier(), 1n, { paymentDecimals: -1 })).toThrow();
    expect(() => quoteCreditTokenPurchase(tier(), 0n)).toThrow();
  });
});
