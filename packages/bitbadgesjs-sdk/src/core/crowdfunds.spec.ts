/**
 * Tests for crowdfunds.ts — Crowdfund protocol validator.
 *
 * A valid Crowdfund needs:
 *   - standards includes "Crowdfund"
 *   - validTokenIds = [{1,2}] (refund + progress tokens)
 *   - 4+ approvals: deposit-refund (Mint->All, token 1),
 *                   deposit-progress (Mint->crowdfunder, token 2),
 *                   success (Mint->burn, mustOwnTokens),
 *                   refund (!Mint->burn, token 1, mustOwnTokens)
 *   - Deposit paths use allowAmountScaling + overridesFromOutgoing
 *   - Success/refund use overrideFromWithApproverAddress
 *   - Same denom across all coinTransfers
 */

import { validateCrowdfundCollection, doesCollectionFollowCrowdfundProtocol } from './crowdfunds.js';

const BURN = 'bb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqs7gvmv';
const CROWDFUNDER = 'bb1crowdfunder';

const makeDepositRefund = () => ({
  approvalId: 'deposit-refund',
  fromListId: 'Mint',
  toListId: 'All',
  initiatedByListId: 'All',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    overridesFromOutgoingApprovals: true,
    requireToEqualsInitiatedBy: true,
    coinTransfers: [{ coins: [{ denom: 'ubadge', amount: 100n }] }],
    predeterminedBalances: {
      incrementedBalances: {
        allowAmountScaling: true
      }
    }
  }
});

const makeDepositProgress = () => ({
  approvalId: 'deposit-progress',
  fromListId: 'Mint',
  toListId: CROWDFUNDER,
  initiatedByListId: 'All',
  transferTimes: [{ start: 1n, end: 1000n }],
  tokenIds: [{ start: 2n, end: 2n }],
  approvalCriteria: {
    overridesFromOutgoingApprovals: true,
    coinTransfers: [{ coins: [{ denom: 'ubadge', amount: 100n }] }],
    predeterminedBalances: {
      incrementedBalances: {
        allowAmountScaling: true
      }
    }
  }
});

const makeSuccess = () => ({
  approvalId: 'success',
  fromListId: 'Mint',
  toListId: BURN,
  initiatedByListId: CROWDFUNDER,
  transferTimes: [{ start: 1001n, end: 2000n }],
  tokenIds: [{ start: 2n, end: 2n }],
  approvalCriteria: {
    coinTransfers: [
      {
        overrideFromWithApproverAddress: true,
        coins: [{ denom: 'ubadge', amount: 1000n }]
      }
    ],
    mustOwnTokens: [
      {
        tokenIds: [{ start: 2n, end: 2n }],
        amountRange: { start: 100n, end: 100n }
      }
    ]
  }
});

const makeRefund = () => ({
  approvalId: 'refund',
  fromListId: '!Mint',
  toListId: BURN,
  initiatedByListId: 'All',
  transferTimes: [{ start: 2001n, end: 3000n }],
  tokenIds: [{ start: 1n, end: 1n }],
  approvalCriteria: {
    coinTransfers: [
      {
        overrideFromWithApproverAddress: true,
        overrideToWithInitiator: true,
        coins: [{ denom: 'ubadge', amount: 1n }]
      }
    ],
    mustOwnTokens: [
      {
        tokenIds: [{ start: 2n, end: 2n }],
        amountRange: { start: 1n, end: 100n }
      }
    ]
  }
});

const makeValidCollection = (): any => ({
  standards: ['Crowdfund'],
  validTokenIds: [{ start: 1n, end: 2n }],
  collectionApprovals: [makeDepositRefund(), makeDepositProgress(), makeSuccess(), makeRefund()],
  collectionPermissions: {
    canDeleteCollection: [{}],
    canUpdateCollectionApprovals: [{}],
    canUpdateValidTokenIds: [{}],
    canUpdateStandards: [{}]
  }
});

describe('validateCrowdfundCollection — happy path', () => {
  it('accepts a fully-formed crowdfund', () => {
    const r = validateCrowdfundCollection(makeValidCollection());
    expect(r.errors).toEqual([]);
    expect(r.valid).toBe(true);
    expect(r.details?.crowdfunderAddress).toBe(CROWDFUNDER);
    expect(r.details?.depositDenom).toBe('ubadge');
    expect(r.details?.deadlineTime).toBe(1000n);
    expect(r.details?.goalAmount).toBe(100n);
  });

  it('doesCollectionFollowCrowdfundProtocol returns true', () => {
    expect(doesCollectionFollowCrowdfundProtocol(makeValidCollection())).toBe(true);
  });
});

describe('validateCrowdfundCollection — standards', () => {
  it('rejects missing Crowdfund standard', () => {
    const c = makeValidCollection();
    c.standards = [];
    expect(validateCrowdfundCollection(c).errors).toContain('Missing "Crowdfund" standard');
  });
});

describe('validateCrowdfundCollection — validTokenIds', () => {
  it('rejects [{1,1}] (missing progress token 2)', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 1n }];
    expect(validateCrowdfundCollection(c).errors).toContain(
      'validTokenIds must be [{start: 1, end: 2}] (refund + progress tokens)'
    );
  });

  it('rejects wrong start', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 0n, end: 2n }];
    expect(validateCrowdfundCollection(c).errors).toContain(
      'validTokenIds must be [{start: 1, end: 2}] (refund + progress tokens)'
    );
  });

  it('rejects empty validTokenIds', () => {
    const c = makeValidCollection();
    c.validTokenIds = [];
    expect(validateCrowdfundCollection(c).errors).toContain(
      'validTokenIds must be [{start: 1, end: 2}] (refund + progress tokens)'
    );
  });
});

describe('validateCrowdfundCollection — permissions warnings', () => {
  it('warns when canDeleteCollection is empty (not frozen)', () => {
    const c = makeValidCollection();
    c.collectionPermissions.canDeleteCollection = [];
    const r = validateCrowdfundCollection(c);
    expect(r.warnings.some((w) => w.includes('canDeleteCollection'))).toBe(true);
  });

  it('warns for all 4 permission fields when missing', () => {
    const c = makeValidCollection();
    c.collectionPermissions = {};
    const r = validateCrowdfundCollection(c);
    expect(r.warnings.length).toBeGreaterThanOrEqual(4);
  });
});

describe('validateCrowdfundCollection — approval count', () => {
  it('rejects when fewer than 4 approvals', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makeDepositRefund()];
    const r = validateCrowdfundCollection(c);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes('Expected at least 4 approvals'))).toBe(true);
  });
});

describe('validateCrowdfundCollection — missing approval types', () => {
  it('rejects when deposit-refund missing', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makeDepositProgress(), makeSuccess(), makeRefund(), makeRefund()];
    const r = validateCrowdfundCollection(c);
    expect(r.errors.some((e) => e.includes('Missing deposit-refund approval'))).toBe(true);
  });

  it('rejects when deposit-progress missing', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [makeDepositRefund(), makeSuccess(), makeRefund(), makeRefund()];
    const r = validateCrowdfundCollection(c);
    expect(r.errors.some((e) => e.includes('Missing deposit-progress approval'))).toBe(true);
  });

  it('rejects when success approval missing (no mustOwnTokens)', () => {
    const c = makeValidCollection();
    c.collectionApprovals[2].approvalCriteria.mustOwnTokens = [];
    const r = validateCrowdfundCollection(c);
    expect(r.errors.some((e) => e.includes('Missing success approval'))).toBe(true);
  });

  it('rejects when refund missing', () => {
    const c = makeValidCollection();
    c.collectionApprovals[3].approvalCriteria.mustOwnTokens = [];
    const r = validateCrowdfundCollection(c);
    expect(r.errors.some((e) => e.includes('Missing refund approval'))).toBe(true);
  });
});

describe('validateCrowdfundCollection — deposit-refund rules', () => {
  it('rejects when overridesFromOutgoingApprovals false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.overridesFromOutgoingApprovals = false;
    expect(
      validateCrowdfundCollection(c).errors
    ).toContain('Deposit-refund: overridesFromOutgoingApprovals must be true');
  });

  it('rejects when requireToEqualsInitiatedBy false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.requireToEqualsInitiatedBy = false;
    expect(
      validateCrowdfundCollection(c).errors
    ).toContain('Deposit-refund: requireToEqualsInitiatedBy must be true');
  });

  it('rejects when allowAmountScaling false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling = false;
    expect(validateCrowdfundCollection(c).errors).toContain('Deposit-refund: allowAmountScaling must be true');
  });

  it('rejects when coinTransfers is missing on deposit-refund', () => {
    const c = makeValidCollection();
    c.collectionApprovals[0].approvalCriteria.coinTransfers = [];
    expect(validateCrowdfundCollection(c).errors).toContain('Deposit-refund: must have coinTransfers');
  });
});

describe('validateCrowdfundCollection — deposit-progress rules', () => {
  it('rejects when overridesFromOutgoingApprovals false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[1].approvalCriteria.overridesFromOutgoingApprovals = false;
    expect(
      validateCrowdfundCollection(c).errors
    ).toContain('Deposit-progress: overridesFromOutgoingApprovals must be true');
  });

  it('rejects when allowAmountScaling false', () => {
    const c = makeValidCollection();
    c.collectionApprovals[1].approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling = false;
    expect(validateCrowdfundCollection(c).errors).toContain('Deposit-progress: allowAmountScaling must be true');
  });
});

describe('validateCrowdfundCollection — success rules', () => {
  it('rejects when initiatedByListId does not match crowdfunder', () => {
    const c = makeValidCollection();
    c.collectionApprovals[2].initiatedByListId = 'bb1someoneelse';
    expect(validateCrowdfundCollection(c).errors).toContain('Success: initiatedByListId must be crowdfunder address');
  });

  it('rejects when overrideFromWithApproverAddress=false on success', () => {
    const c = makeValidCollection();
    c.collectionApprovals[2].approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = false;
    expect(
      validateCrowdfundCollection(c).errors
    ).toContain('Success: coinTransfer must use overrideFromWithApproverAddress=true (escrow payout)');
  });

  it('rejects when mustOwnTokens checks token != 2', () => {
    const c = makeValidCollection();
    c.collectionApprovals[2].approvalCriteria.mustOwnTokens[0].tokenIds = [{ start: 1n, end: 1n }];
    expect(validateCrowdfundCollection(c).errors).toContain(
      'Success: mustOwnTokens must check token 2 (progress token)'
    );
  });

  it('rejects when goal amount is 0', () => {
    const c = makeValidCollection();
    c.collectionApprovals[2].approvalCriteria.mustOwnTokens[0].amountRange.start = 0n;
    expect(
      validateCrowdfundCollection(c).errors
    ).toContain('Success: mustOwnTokens amountRange.start must be > 0 (goal amount)');
  });
});

describe('validateCrowdfundCollection — refund rules', () => {
  it('rejects when overrideFromWithApproverAddress=false on refund', () => {
    const c = makeValidCollection();
    c.collectionApprovals[3].approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = false;
    expect(
      validateCrowdfundCollection(c).errors
    ).toContain('Refund: coinTransfer must use overrideFromWithApproverAddress=true');
  });

  it('rejects when overrideToWithInitiator=false on refund', () => {
    const c = makeValidCollection();
    c.collectionApprovals[3].approvalCriteria.coinTransfers[0].overrideToWithInitiator = false;
    expect(
      validateCrowdfundCollection(c).errors
    ).toContain('Refund: coinTransfer must use overrideToWithInitiator=true (pay back contributor)');
  });

  it('rejects refund.mustOwnTokens checking wrong token', () => {
    const c = makeValidCollection();
    c.collectionApprovals[3].approvalCriteria.mustOwnTokens[0].tokenIds = [{ start: 1n, end: 1n }];
    expect(validateCrowdfundCollection(c).errors).toContain(
      'Refund: mustOwnTokens must check token 2 (progress token)'
    );
  });
});

describe('validateCrowdfundCollection — denom cross-check', () => {
  it('rejects when success denom differs from deposit denom', () => {
    const c = makeValidCollection();
    c.collectionApprovals[2].approvalCriteria.coinTransfers[0].coins[0].denom = 'uusdc';
    expect(validateCrowdfundCollection(c).errors).toContain('Success denom must match deposit denom');
  });

  it('rejects when refund denom differs from deposit denom', () => {
    const c = makeValidCollection();
    c.collectionApprovals[3].approvalCriteria.coinTransfers[0].coins[0].denom = 'uusdc';
    expect(validateCrowdfundCollection(c).errors).toContain('Refund denom must match deposit denom');
  });

  it('accepts when all three denoms match', () => {
    expect(validateCrowdfundCollection(makeValidCollection()).valid).toBe(true);
  });
});

describe('validateCrowdfundCollection — details output', () => {
  it('populates details when valid', () => {
    const r = validateCrowdfundCollection(makeValidCollection());
    expect(r.details).toBeDefined();
    expect(r.details?.crowdfunderAddress).toBe(CROWDFUNDER);
    expect(r.details?.depositDenom).toBe('ubadge');
    expect(r.details?.deadlineTime).toBe(1000n);
    expect(r.details?.goalAmount).toBe(100n);
  });

  it('returns empty details when approvals missing (early-return path)', () => {
    const c = makeValidCollection();
    c.collectionApprovals = c.collectionApprovals.slice(0, 2);
    const r = validateCrowdfundCollection(c);
    expect(r.valid).toBe(false);
    expect(r.details).toEqual({});
  });
});
