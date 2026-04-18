/**
 * Tests for blankCriteria.ts — factory for a default/empty
 * iApprovalCriteriaWithDetails<bigint>.
 *
 * The function is small but it's widely used to seed new approvals in
 * builders. It must:
 *   - Produce fresh objects every call (no shared references)
 *   - Thread the passed id into both amountTrackerId fields
 *   - Keep the structural shape required by downstream validators
 *     (i.e. `Required<iApprovalCriteriaWithDetails<bigint>>`).
 */

import { blankCriteria } from './blankCriteria.js';

describe('blankCriteria', () => {
  it('threads the id into amountTrackerId fields', () => {
    const c = blankCriteria('my-tracker');
    expect(c.maxNumTransfers.amountTrackerId).toBe('my-tracker');
    expect(c.approvalAmounts.amountTrackerId).toBe('my-tracker');
  });

  it('threads an empty id string (defensive)', () => {
    const c = blankCriteria('');
    expect(c.maxNumTransfers.amountTrackerId).toBe('');
    expect(c.approvalAmounts.amountTrackerId).toBe('');
  });

  it('returns fresh objects per call (no shared state)', () => {
    const a = blankCriteria('x');
    const b = blankCriteria('y');
    expect(a).not.toBe(b);
    expect(a.maxNumTransfers).not.toBe(b.maxNumTransfers);
    expect(a.senderChecks).not.toBe(b.senderChecks);
    expect(a.predeterminedBalances).not.toBe(b.predeterminedBalances);
    expect(a.predeterminedBalances.incrementedBalances).not.toBe(b.predeterminedBalances.incrementedBalances);
  });

  it('mutations on one instance do not leak to another', () => {
    const a = blankCriteria('a');
    const b = blankCriteria('b');
    a.mustOwnTokens.push({} as any);
    a.predeterminedBalances.manualBalances.push({} as any);
    a.merkleChallenges.push({} as any);
    expect(b.mustOwnTokens).toEqual([]);
    expect(b.predeterminedBalances.manualBalances).toEqual([]);
    expect(b.merkleChallenges).toEqual([]);
  });

  it('has all four *Checks blocks with all flags false', () => {
    const c = blankCriteria('t');
    for (const block of ['senderChecks', 'recipientChecks', 'initiatorChecks'] as const) {
      const b = c[block];
      expect(b.mustBeEvmContract).toBe(false);
      expect(b.mustNotBeEvmContract).toBe(false);
      expect(b.mustBeLiquidityPool).toBe(false);
      expect(b.mustNotBeLiquidityPool).toBe(false);
    }
  });

  it('autoDeletionOptions are all false by default', () => {
    const c = blankCriteria('t');
    expect(c.autoDeletionOptions).toEqual({
      afterOneUse: false,
      afterOverallMaxNumTransfers: false,
      allowCounterpartyPurge: false,
      allowPurgeIfExpired: false
    });
  });

  it('predetermined balances: empty manualBalances and zeroed counters', () => {
    const c = blankCriteria('t');
    expect(c.predeterminedBalances.manualBalances).toEqual([]);
    expect(c.predeterminedBalances.orderCalculationMethod).toEqual({
      useOverallNumTransfers: false,
      usePerToAddressNumTransfers: false,
      usePerFromAddressNumTransfers: false,
      usePerInitiatedByAddressNumTransfers: false,
      useMerkleChallengeLeafIndex: false,
      challengeTrackerId: ''
    });

    const ib = c.predeterminedBalances.incrementedBalances;
    expect(ib.startBalances).toEqual([]);
    expect(ib.incrementTokenIdsBy).toBe(0n);
    expect(ib.incrementOwnershipTimesBy).toBe(0n);
    expect(ib.durationFromTimestamp).toBe(0n);
    expect(ib.allowOverrideTimestamp).toBe(false);
    expect(ib.allowOverrideWithAnyValidToken).toBe(false);
    expect(ib.allowAmountScaling).toBe(false);
    expect(ib.maxScalingMultiplier).toBe(0n);
    expect(ib.recurringOwnershipTimes).toEqual({
      startTime: 0n,
      intervalLength: 0n,
      chargePeriodLength: 0n
    });
  });

  it('maxNumTransfers and approvalAmounts have zeroed counters', () => {
    const c = blankCriteria('zz');
    expect(c.maxNumTransfers.overallMaxNumTransfers).toBe(0n);
    expect(c.maxNumTransfers.perToAddressMaxNumTransfers).toBe(0n);
    expect(c.maxNumTransfers.perFromAddressMaxNumTransfers).toBe(0n);
    expect(c.maxNumTransfers.perInitiatedByAddressMaxNumTransfers).toBe(0n);
    expect(c.maxNumTransfers.resetTimeIntervals).toEqual({ startTime: 0n, intervalLength: 0n });

    expect(c.approvalAmounts.overallApprovalAmount).toBe(0n);
    expect(c.approvalAmounts.perFromAddressApprovalAmount).toBe(0n);
    expect(c.approvalAmounts.perToAddressApprovalAmount).toBe(0n);
    expect(c.approvalAmounts.perInitiatedByAddressApprovalAmount).toBe(0n);
    expect(c.approvalAmounts.resetTimeIntervals).toEqual({ startTime: 0n, intervalLength: 0n });
  });

  it('challenge / token arrays are empty', () => {
    const c = blankCriteria('x');
    expect(c.merkleChallenges).toEqual([]);
    expect(c.mustOwnTokens).toEqual([]);
    expect(c.dynamicStoreChallenges).toEqual([]);
    expect(c.ethSignatureChallenges).toEqual([]);
    expect(c.votingChallenges).toEqual([]);
    expect(c.evmQueryChallenges).toEqual([]);
    expect(c.coinTransfers).toEqual([]);
  });

  it('boolean require/override/allow flags are all false', () => {
    const c = blankCriteria('x');
    expect(c.requireToDoesNotEqualInitiatedBy).toBe(false);
    expect(c.requireFromDoesNotEqualInitiatedBy).toBe(false);
    expect(c.requireToEqualsInitiatedBy).toBe(false);
    expect(c.requireFromEqualsInitiatedBy).toBe(false);
    expect(c.overridesFromOutgoingApprovals).toBe(false);
    expect(c.overridesToIncomingApprovals).toBe(false);
    expect(c.mustPrioritize).toBe(false);
    expect(c.allowBackedMinting).toBe(false);
    expect(c.allowSpecialWrapping).toBe(false);
  });

  it('userApprovalSettings has zero royalty and empty denoms', () => {
    const c = blankCriteria('t');
    expect(c.userApprovalSettings.allowedDenoms).toEqual([]);
    expect(c.userApprovalSettings.disableUserCoinTransfers).toBe(false);
    expect(c.userApprovalSettings.userRoyalties).toEqual({ percentage: 0n, payoutAddress: '' });
  });

  it('altTimeChecks has empty offline arrays', () => {
    const c = blankCriteria('t');
    expect(c.altTimeChecks).toEqual({ offlineHours: [], offlineDays: [] });
  });

  it('handles unicode and special-char id', () => {
    const c = blankCriteria('тест-💥');
    expect(c.maxNumTransfers.amountTrackerId).toBe('тест-💥');
    expect(c.approvalAmounts.amountTrackerId).toBe('тест-💥');
  });
});
