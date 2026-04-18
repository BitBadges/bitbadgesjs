/**
 * Tests for scheduled-payments.ts — Scheduled Payment approval shape check.
 *
 * Scheduled payments are one-shot (maxNumTransfers=1) approvals that can
 * contain 1 OR 2 coin transfers (payment + optional tip). Unlike invoices,
 * scheduled payments MUST override from with approver address (pay from
 * escrow on approval settle). They also do not restrict the override-to
 * direction, so only overridesFromOutgoingApprovals is mandatory.
 */

import { isScheduledPaymentApproval } from './scheduled-payments.js';

const makeValid = (): any => ({
  fromListId: 'Mint',
  approvalCriteria: {
    maxNumTransfers: { overallMaxNumTransfers: 1n },
    coinTransfers: [{ coins: [{ denom: 'ubadge', amount: 1000n }] }],
    predeterminedBalances: {
      incrementedBalances: {
        startBalances: [{ tokenIds: [{ start: 1n, end: 1n }], amount: 1n }],
        incrementTokenIdsBy: 0n,
        incrementOwnershipTimesBy: 0n,
        durationFromTimestamp: 0n,
        allowOverrideTimestamp: false,
        allowAmountScaling: false,
        recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
      }
    },
    overridesFromOutgoingApprovals: true,
    requireToEqualsInitiatedBy: false
  }
});

describe('isScheduledPaymentApproval — happy path', () => {
  it('accepts a canonical single-coin-transfer scheduled payment', () => {
    expect(isScheduledPaymentApproval(makeValid())).toBe(true);
  });

  it('accepts a scheduled payment with 2 coinTransfers (payment + tip)', () => {
    const a = makeValid();
    a.approvalCriteria.coinTransfers = [
      { coins: [{ denom: 'ubadge', amount: 1000n }] },
      { coins: [{ denom: 'ubadge', amount: 50n }] }
    ];
    expect(isScheduledPaymentApproval(a)).toBe(true);
  });

  it('accepts with optional merkleChallenge satisfying constraints', () => {
    const a = makeValid();
    a.approvalCriteria.merkleChallenges = [{ maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false }];
    expect(isScheduledPaymentApproval(a)).toBe(true);
  });
});

describe('isScheduledPaymentApproval — structural rejections', () => {
  it('rejects when approvalCriteria is missing', () => {
    const a = makeValid();
    a.approvalCriteria = undefined;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects when fromListId != Mint', () => {
    const a = makeValid();
    a.fromListId = '!Mint';
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });
});

describe('isScheduledPaymentApproval — merkleChallenges', () => {
  it('rejects when merkleChallenges.length > 1', () => {
    const a = makeValid();
    a.approvalCriteria.merkleChallenges = [
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false },
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false }
    ];
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects merkleChallenge with maxUsesPerLeaf != 1', () => {
    const a = makeValid();
    a.approvalCriteria.merkleChallenges = [{ maxUsesPerLeaf: 2n, useCreatorAddressAsLeaf: false }];
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects merkleChallenge with useCreatorAddressAsLeaf=true', () => {
    const a = makeValid();
    a.approvalCriteria.merkleChallenges = [{ maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: true }];
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });
});

describe('isScheduledPaymentApproval — maxNumTransfers', () => {
  it('rejects when overallMaxNumTransfers is missing/0', () => {
    const a = makeValid();
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 0n;
    expect(isScheduledPaymentApproval(a)).toBe(false);

    const b = makeValid();
    b.approvalCriteria.maxNumTransfers = undefined;
    expect(isScheduledPaymentApproval(b)).toBe(false);
  });

  it('rejects when overallMaxNumTransfers > 1 (scheduled payments are one-time)', () => {
    const a = makeValid();
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 2n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });
});

describe('isScheduledPaymentApproval — coinTransfers', () => {
  it('rejects zero coinTransfers (at least payment required)', () => {
    const a = makeValid();
    a.approvalCriteria.coinTransfers = [];
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('accepts 3+ coinTransfers (function does not cap upper bound)', () => {
    // Note the spec in the source comment says 1-2 (payment + tip) but the
    // code has no upper-bound check. Pinning current behavior. If the
    // intent was to cap at 2, the function should be updated.
    const a = makeValid();
    a.approvalCriteria.coinTransfers = [
      { coins: [{ denom: 'u', amount: 1n }] },
      { coins: [{ denom: 'u', amount: 1n }] },
      { coins: [{ denom: 'u', amount: 1n }] }
    ];
    expect(isScheduledPaymentApproval(a)).toBe(true);
  });
});

describe('isScheduledPaymentApproval — incrementedBalances', () => {
  it('rejects when missing', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances = { incrementedBalances: undefined };
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects when allowAmountScaling=true', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling = true;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects when startBalances.length != 1', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [];
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects when startBalance tokenIds != [{1,1}]', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 2n, end: 2n }
    ];
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects when startBalance tokenIds span more than 1', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 1n, end: 3n }
    ];
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects when startBalance amount != 1', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = 2n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects any incrementTokenIdsBy != 0', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementTokenIdsBy = 1n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects any incrementOwnershipTimesBy != 0', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy = 1n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects any durationFromTimestamp != 0', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp = 1n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects allowOverrideTimestamp=true', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideTimestamp = true;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects recurringOwnershipTimes.startTime != 0', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.startTime = 1n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects recurringOwnershipTimes.intervalLength != 0', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength = 1n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects recurringOwnershipTimes.chargePeriodLength != 0', () => {
    const a = makeValid();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.chargePeriodLength = 1n;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });
});

describe('isScheduledPaymentApproval — override/require', () => {
  it('rejects when overridesFromOutgoingApprovals is false', () => {
    const a = makeValid();
    a.approvalCriteria.overridesFromOutgoingApprovals = false;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });

  it('rejects when requireToEqualsInitiatedBy is true', () => {
    const a = makeValid();
    a.approvalCriteria.requireToEqualsInitiatedBy = true;
    expect(isScheduledPaymentApproval(a)).toBe(false);
  });
});
