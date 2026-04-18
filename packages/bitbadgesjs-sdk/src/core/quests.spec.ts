/**
 * Tests for quests.ts — Quest protocol shape checks.
 *
 * Covers:
 *   - doesCollectionFollowProtocol (generic "standard exists" check)
 *   - doesCollectionFollowQuestProtocol (Quest standard + [{1,1}] tokens)
 *   - isQuestApproval (per-approval shape check)
 */

import {
  doesCollectionFollowProtocol,
  doesCollectionFollowQuestProtocol,
  isQuestApproval
} from './quests.js';

// ---------------------------------------------------------------------------
// doesCollectionFollowProtocol
// ---------------------------------------------------------------------------

describe('doesCollectionFollowProtocol', () => {
  it('returns false for null / undefined collection', () => {
    expect(doesCollectionFollowProtocol(null as any, 'Quests')).toBe(false);
    expect(doesCollectionFollowProtocol(undefined as any, 'Quests')).toBe(false);
  });

  it('returns false when standards does not include the protocol', () => {
    expect(doesCollectionFollowProtocol({ standards: [] } as any, 'Quests')).toBe(false);
    expect(doesCollectionFollowProtocol({ standards: ['Other'] } as any, 'Quests')).toBe(false);
  });

  it('returns true when standards includes the protocol exactly', () => {
    expect(doesCollectionFollowProtocol({ standards: ['Quests'] } as any, 'Quests')).toBe(true);
  });

  it('is case-sensitive', () => {
    expect(doesCollectionFollowProtocol({ standards: ['quests'] } as any, 'Quests')).toBe(false);
    expect(doesCollectionFollowProtocol({ standards: ['QUESTS'] } as any, 'Quests')).toBe(false);
  });

  it('accepts multi-standard collection', () => {
    expect(doesCollectionFollowProtocol({ standards: ['Other', 'Quests', 'Extra'] } as any, 'Quests')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// doesCollectionFollowQuestProtocol
// ---------------------------------------------------------------------------

describe('doesCollectionFollowQuestProtocol', () => {
  it('returns false if standard missing', () => {
    expect(
      doesCollectionFollowQuestProtocol({ standards: [], validTokenIds: [{ start: 1n, end: 1n }] } as any)
    ).toBe(false);
  });

  it('returns true when standard=Quests and validTokenIds=[{1,1}]', () => {
    expect(
      doesCollectionFollowQuestProtocol({ standards: ['Quests'], validTokenIds: [{ start: 1n, end: 1n }] } as any)
    ).toBe(true);
  });

  it('returns false when validTokenIds has more than 1 range', () => {
    expect(
      doesCollectionFollowQuestProtocol({
        standards: ['Quests'],
        validTokenIds: [
          { start: 1n, end: 1n },
          { start: 3n, end: 3n }
        ]
      } as any)
    ).toBe(false);
  });

  it('returns false when validTokenIds spans more than 1 token', () => {
    expect(
      doesCollectionFollowQuestProtocol({ standards: ['Quests'], validTokenIds: [{ start: 1n, end: 2n }] } as any)
    ).toBe(false);
  });

  it('returns false when validTokenIds is not [1..1]', () => {
    expect(
      doesCollectionFollowQuestProtocol({ standards: ['Quests'], validTokenIds: [{ start: 2n, end: 2n }] } as any)
    ).toBe(false);
  });

  it('returns false when validTokenIds is empty', () => {
    expect(doesCollectionFollowQuestProtocol({ standards: ['Quests'], validTokenIds: [] } as any)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isQuestApproval
// ---------------------------------------------------------------------------

const makeValidQuestApproval = (): any => ({
  fromListId: 'Mint',
  approvalCriteria: {
    merkleChallenges: [{ maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false }],
    maxNumTransfers: { overallMaxNumTransfers: 100n },
    coinTransfers: [
      {
        overrideFromWithApproverAddress: true,
        overrideToWithInitiator: true,
        coins: [{ denom: 'ubadge', amount: 1n }]
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

describe('isQuestApproval — happy path', () => {
  it('accepts a canonical quest approval', () => {
    expect(isQuestApproval(makeValidQuestApproval())).toBe(true);
  });

  it('accepts approval with zero coinTransfers', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.coinTransfers = [];
    expect(isQuestApproval(a)).toBe(true);
  });
});

describe('isQuestApproval — rejections', () => {
  it('rejects when approvalCriteria is missing', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria = undefined;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when fromListId is not "Mint"', () => {
    const a = makeValidQuestApproval();
    a.fromListId = '!Mint';
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when merkleChallenges is missing', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.merkleChallenges = undefined;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when merkleChallenges.length != 1', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.merkleChallenges = [
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false },
      { maxUsesPerLeaf: 1n, useCreatorAddressAsLeaf: false }
    ];
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when maxUsesPerLeaf is not 1', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.merkleChallenges[0].maxUsesPerLeaf = 2n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when useCreatorAddressAsLeaf is true', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.merkleChallenges[0].useCreatorAddressAsLeaf = true;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when mustOwnTokens is non-empty', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.mustOwnTokens = [{}];
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when overallMaxNumTransfers is 0 or missing', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 0n;
    expect(isQuestApproval(a)).toBe(false);

    const b = makeValidQuestApproval();
    b.approvalCriteria.maxNumTransfers = undefined;
    expect(isQuestApproval(b)).toBe(false);
  });

  it('rejects when overallMaxNumTransfers < 0 (defensive)', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = -1n;
    // -1n passes `!n` but hits `n <= 0n`
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when there are more than 1 coinTransfers', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.coinTransfers = [
      { overrideFromWithApproverAddress: true, overrideToWithInitiator: true, coins: [{ denom: 'u', amount: 1n }] },
      { overrideFromWithApproverAddress: true, overrideToWithInitiator: true, coins: [{ denom: 'u', amount: 1n }] }
    ];
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when coinTransfer.coins.length != 1', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.coinTransfers[0].coins = [
      { denom: 'ubadge', amount: 1n },
      { denom: 'uusdc', amount: 1n }
    ];
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when overrideFromWithApproverAddress=false', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = false;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when overrideToWithInitiator=false', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.coinTransfers[0].overrideToWithInitiator = false;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when incrementedBalances is missing', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances = { incrementedBalances: undefined };
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when startBalances.length != 1', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [];
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when startBalance tokenIds span more than 1', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 1n, end: 2n }
    ];
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when startBalance tokenIds != [{1,1}]', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 2n, end: 2n }
    ];
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when startBalance amount != 1', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = 2n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when incrementTokenIdsBy != 0', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementTokenIdsBy = 1n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when incrementOwnershipTimesBy != 0', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy = 1n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when durationFromTimestamp != 0', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp = 1n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when allowOverrideTimestamp is true', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideTimestamp = true;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when allowAmountScaling is true (incompatible with quests)', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling = true;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when recurringOwnershipTimes.startTime != 0', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.startTime = 1n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when recurringOwnershipTimes.intervalLength != 0', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength = 1n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when recurringOwnershipTimes.chargePeriodLength != 0', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.chargePeriodLength = 1n;
    expect(isQuestApproval(a)).toBe(false);
  });

  it('rejects when requireToEqualsInitiatedBy is true', () => {
    const a = makeValidQuestApproval();
    a.approvalCriteria.requireToEqualsInitiatedBy = true;
    expect(isQuestApproval(a)).toBe(false);
  });
});
