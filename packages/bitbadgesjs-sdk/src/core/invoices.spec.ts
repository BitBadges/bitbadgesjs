/**
 * Tests for invoices.ts — Invoice protocol shape checks.
 *
 * Covers:
 *   - doesCollectionFollowInvoiceProtocol
 *   - isInvoiceApproval
 *
 * Invoices are payments from an initiator to a fixed recipient — the
 * opposite coinTransfer direction from Quests. overrideFromWithApproverAddress
 * and overrideToWithInitiator MUST BE false because the payer is the
 * initiator and the recipient is the approval's target address.
 */

import {
  doesCollectionFollowInvoiceProtocol,
  isInvoiceApproval
} from './invoices.js';

// ---------------------------------------------------------------------------
// doesCollectionFollowInvoiceProtocol
// ---------------------------------------------------------------------------

describe('doesCollectionFollowInvoiceProtocol', () => {
  it('returns false if "Invoices" standard missing', () => {
    expect(
      doesCollectionFollowInvoiceProtocol({ standards: [], validTokenIds: [{ start: 1n, end: 1n }] } as any)
    ).toBe(false);
  });

  it('returns true for Invoices + [{1,1}]', () => {
    expect(
      doesCollectionFollowInvoiceProtocol({
        standards: ['Invoices'],
        validTokenIds: [{ start: 1n, end: 1n }]
      } as any)
    ).toBe(true);
  });

  it('rejects when validTokenIds != [{1,1}]', () => {
    expect(
      doesCollectionFollowInvoiceProtocol({
        standards: ['Invoices'],
        validTokenIds: [{ start: 1n, end: 2n }]
      } as any)
    ).toBe(false);
    expect(
      doesCollectionFollowInvoiceProtocol({ standards: ['Invoices'], validTokenIds: [] } as any)
    ).toBe(false);
    expect(
      doesCollectionFollowInvoiceProtocol({
        standards: ['Invoices'],
        validTokenIds: [
          { start: 1n, end: 1n },
          { start: 2n, end: 2n }
        ]
      } as any)
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isInvoiceApproval
// ---------------------------------------------------------------------------

const makeValidInvoiceApproval = (): any => ({
  fromListId: 'Mint',
  approvalCriteria: {
    maxNumTransfers: { overallMaxNumTransfers: 10n },
    coinTransfers: [
      {
        // Invoices send INITIATOR -> RECIPIENT. No override.
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false,
        coins: [{ denom: 'ubadge', amount: 1000n }]
      }
    ],
    predeterminedBalances: {
      incrementedBalances: {
        startBalances: [{ tokenIds: [{ start: 1n, end: 1n }], amount: 1n }],
        incrementTokenIdsBy: 0n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n,
        allowOverrideTimestamp: false,
        allowAmountScaling: false,
        recurringOwnershipTimes: {
          startTime: 0n,
          intervalLength: 0n,
          chargePeriodLength: 0n
        }
      }
    },
    requireToEqualsInitiatedBy: false
  }
});

describe('isInvoiceApproval — happy path', () => {
  it('accepts a canonical invoice approval', () => {
    expect(isInvoiceApproval(makeValidInvoiceApproval())).toBe(true);
  });

  it('accepts invoice with no merkleChallenges', () => {
    // merkleChallenges is optional for invoices
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.merkleChallenges = undefined;
    expect(isInvoiceApproval(a)).toBe(true);
  });

  it('accepts invoice WITH one valid merkleChallenge', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.merkleChallenges = [{ maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false }];
    expect(isInvoiceApproval(a)).toBe(true);
  });

  it('accepts invoice with zero coinTransfers (optional)', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.coinTransfers = [];
    expect(isInvoiceApproval(a)).toBe(true);
  });
});

describe('isInvoiceApproval — core rejections', () => {
  it('rejects when approvalCriteria is missing', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria = undefined;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when fromListId != "Mint"', () => {
    const a = makeValidInvoiceApproval();
    a.fromListId = 'bb1anything';
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when overallMaxNumTransfers is 0 or missing', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 0n;
    expect(isInvoiceApproval(a)).toBe(false);

    const b = makeValidInvoiceApproval();
    b.approvalCriteria.maxNumTransfers = undefined;
    expect(isInvoiceApproval(b)).toBe(false);
  });

  it('accepts any positive overallMaxNumTransfers (no upper bound enforced)', () => {
    // Note invoices allow any positive n — unlike scheduled-payments which is 1-only
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 1n;
    expect(isInvoiceApproval(a)).toBe(true);

    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 9999n;
    expect(isInvoiceApproval(a)).toBe(true);
  });
});

describe('isInvoiceApproval — merkleChallenges', () => {
  it('rejects when there are >1 merkleChallenges', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.merkleChallenges = [
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false },
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false }
    ];
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when maxUsesPerLeaf is not 1', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.merkleChallenges = [{ maxUsesPerLeaf: 5n, useCreatorAddressAsLeaf: false }];
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when useCreatorAddressAsLeaf=true', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.merkleChallenges = [{ maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: true }];
    expect(isInvoiceApproval(a)).toBe(false);
  });
});

describe('isInvoiceApproval — coinTransfers direction', () => {
  it('rejects when there are more than 1 coinTransfers', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.coinTransfers = [
      { overrideFromWithApproverAddress: false, overrideToWithInitiator: false, coins: [{ denom: 'u', amount: 1n }] },
      { overrideFromWithApproverAddress: false, overrideToWithInitiator: false, coins: [{ denom: 'u', amount: 1n }] }
    ];
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when coinTransfer.coins.length != 1', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.coinTransfers[0].coins = [
      { denom: 'ubadge', amount: 1n },
      { denom: 'uusdc', amount: 1n }
    ];
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects overrideFromWithApproverAddress=true (invoice direction is initiator→addr)', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = true;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects overrideToWithInitiator=true (invoice direction is initiator→addr)', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.coinTransfers[0].overrideToWithInitiator = true;
    expect(isInvoiceApproval(a)).toBe(false);
  });
});

describe('isInvoiceApproval — incrementedBalances shape', () => {
  it('rejects when incrementedBalances is missing', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances = { incrementedBalances: undefined };
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when startBalances.length != 1', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [];
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when startBalance tokenIds != [{1,1}]', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 2n, end: 2n }
    ];
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when startBalance tokenIds span more than 1', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 1n, end: 5n }
    ];
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when startBalance amount != 1', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = 2n;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when incrementTokenIdsBy != 0', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementTokenIdsBy = 1n;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when incrementOwnershipTimesBy != 0', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy = 1n;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when durationFromTimestamp != 0', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp = 1n;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when allowOverrideTimestamp=true', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideTimestamp = true;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when allowAmountScaling=true (invoice amounts are fixed)', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling = true;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when recurringOwnershipTimes.startTime != 0', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.startTime = 1n;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when recurringOwnershipTimes.intervalLength != 0', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength = 1n;
    expect(isInvoiceApproval(a)).toBe(false);
  });

  it('rejects when recurringOwnershipTimes.chargePeriodLength != 0', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.chargePeriodLength = 1n;
    expect(isInvoiceApproval(a)).toBe(false);
  });
});

describe('isInvoiceApproval — misc', () => {
  it('rejects when requireToEqualsInitiatedBy=true', () => {
    const a = makeValidInvoiceApproval();
    a.approvalCriteria.requireToEqualsInitiatedBy = true;
    expect(isInvoiceApproval(a)).toBe(false);
  });
});
