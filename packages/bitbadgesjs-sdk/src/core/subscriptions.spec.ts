/**
 * Tests for subscriptions.ts — Subscription faucet protocol + helpers.
 *
 * Covers:
 *   - getCurrentInterval
 *   - trackerNeedsReset
 *   - getNextChargeTime
 *   - doesCollectionFollowSubscriptionProtocol
 *   - isSubscriptionFaucetApproval
 *   - isUserRecurringApproval
 */

import {
  getCurrentInterval,
  trackerNeedsReset,
  getNextChargeTime,
  doesCollectionFollowSubscriptionProtocol,
  isSubscriptionFaucetApproval,
  isUserRecurringApproval
} from './subscriptions.js';
import { GO_MAX_UINT_64 } from '../common/math.js';

// ---- fixture helpers -----------------------------------------------------

const INTERVAL = 60_000n; // 1-minute subscription window
const CHARGE = 30_000n;

const makeFaucetApproval = () =>
  ({
    approvalId: 'faucet',
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: [{ start: 1n, end: 1000n }],
    tokenIds: [{ start: 1n, end: 1n }],
    approvalCriteria: {
      coinTransfers: [
        {
          to: 'bb1seller',
          coins: [{ denom: 'ubadge', amount: 100n }],
          overrideFromWithApproverAddress: false,
          overrideToWithInitiator: false
        }
      ],
      predeterminedBalances: {
        incrementedBalances: {
          startBalances: [
            {
              amount: 1n,
              tokenIds: [{ start: 1n, end: 1n }],
              ownershipTimes: [{ start: 1n, end: 10000n }]
            }
          ],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: INTERVAL,
          allowOverrideTimestamp: true,
          allowAmountScaling: false,
          recurringOwnershipTimes: {
            startTime: 0n,
            intervalLength: 0n,
            chargePeriodLength: 0n
          }
        }
      },
      merkleChallenges: [],
      requireFromEqualsInitiatedBy: false,
      requireToEqualsInitiatedBy: false,
      overridesToIncomingApprovals: false
    }
  }) as any;

const makeUserRecurringApproval = () =>
  ({
    approvalId: 'user-recurring',
    fromListId: 'Mint',
    toListId: 'All',
    initiatedByListId: 'All',
    transferTimes: [{ start: 1n, end: 1000n }],
    tokenIds: [{ start: 1n, end: 1n }],
    approvalCriteria: {
      coinTransfers: [
        {
          to: 'bb1seller',
          coins: [{ denom: 'ubadge', amount: 100n }],
          overrideFromWithApproverAddress: true,
          overrideToWithInitiator: true
        }
      ],
      predeterminedBalances: {
        incrementedBalances: {
          startBalances: [
            {
              amount: 1n,
              tokenIds: [{ start: 1n, end: 1n }],
              ownershipTimes: [{ start: 1n, end: 10000n }]
            }
          ],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowAmountScaling: false,
          recurringOwnershipTimes: {
            startTime: 0n,
            intervalLength: INTERVAL,
            chargePeriodLength: INTERVAL < 604800000n ? INTERVAL : 604800000n
          }
        }
      },
      merkleChallenges: [],
      mustOwnTokens: [],
      requireFromEqualsInitiatedBy: false,
      maxNumTransfers: {
        overallMaxNumTransfers: 1n,
        resetTimeIntervals: { startTime: 0n, intervalLength: INTERVAL }
      }
    }
  }) as any;

const makeValidCollection = () => ({
  standards: ['Subscriptions'],
  validTokenIds: [{ start: 1n, end: 1n }],
  collectionApprovals: [makeFaucetApproval()]
});

// ===========================================================================
// getCurrentInterval
// ===========================================================================

describe('getCurrentInterval', () => {
  it('returns [1, max] when resetTimeIntervals is undefined', () => {
    expect(getCurrentInterval(undefined)).toEqual({ start: 1n, end: GO_MAX_UINT_64 });
  });

  it('returns [1, max] when startTime is 0n', () => {
    expect(getCurrentInterval({ startTime: 0n, intervalLength: 60_000n } as any)).toEqual({
      start: 1n,
      end: GO_MAX_UINT_64
    });
  });

  it('returns [1, max] when intervalLength is 0n', () => {
    expect(getCurrentInterval({ startTime: 1n, intervalLength: 0n } as any)).toEqual({
      start: 1n,
      end: GO_MAX_UINT_64
    });
  });

  it('returns pre-start interval [1, startTime-1] when now < startTime', () => {
    // Place startTime far in the future to ensure we're in the pre-start window.
    const future = BigInt(Date.now()) + 10n * 365n * 24n * 60n * 60n * 1000n; // +10 years
    expect(getCurrentInterval({ startTime: future, intervalLength: 60_000n } as any)).toEqual({
      start: 1n,
      end: future - 1n
    });
  });

  it('returns the current interval window when now >= startTime', () => {
    const now = BigInt(Date.now());
    const startTime = now - 90_000n; // 1.5 intervals ago
    const intervalLength = 60_000n;
    const r = getCurrentInterval({ startTime, intervalLength } as any);

    // currInterval = (now - startTime) / intervalLength — integer division.
    const currIntervalIdx = (now - startTime) / intervalLength;
    expect(r.start).toBe(startTime + currIntervalIdx * intervalLength);
    expect(r.end).toBe(r.start + intervalLength);
  });

  it('start+intervalLength == end (interval is exactly intervalLength wide)', () => {
    const now = BigInt(Date.now());
    const startTime = now - 10_000n; // just past startTime
    const intervalLength = 60_000n;
    const r = getCurrentInterval({ startTime, intervalLength } as any);
    expect(r.end - r.start).toBe(intervalLength);
  });
});

// ===========================================================================
// trackerNeedsReset
// ===========================================================================

describe('trackerNeedsReset', () => {
  it('returns true when lastUpdatedAt is earlier than current interval start', () => {
    const now = BigInt(Date.now());
    const startTime = now - 120_000n; // 2 intervals ago
    const intervalLength = 60_000n;
    // lastUpdatedAt was before the interval that contains `now`.
    expect(trackerNeedsReset({ startTime, intervalLength } as any, 1n)).toBe(true);
  });

  it('returns false when lastUpdatedAt is within the current interval', () => {
    const now = BigInt(Date.now());
    const startTime = now - 10_000n;
    const intervalLength = 60_000n;
    expect(trackerNeedsReset({ startTime, intervalLength } as any, now)).toBe(false);
  });

  it('returns false when there are no resets (startTime=0, intervalLength=0) and lastUpdatedAt >= 1n', () => {
    // getCurrentInterval returns { start: 1n, end: max } in this degenerate case.
    expect(trackerNeedsReset({ startTime: 0n, intervalLength: 0n } as any, 1n)).toBe(false);
    expect(trackerNeedsReset({ startTime: 0n, intervalLength: 0n } as any, 100n)).toBe(false);
  });

  it('returns true when lastUpdatedAt is 0n and start is 1n (degenerate interval)', () => {
    expect(trackerNeedsReset({ startTime: 0n, intervalLength: 0n } as any, 0n)).toBe(true);
  });
});

// ===========================================================================
// getNextChargeTime
// ===========================================================================

describe('getNextChargeTime', () => {
  it('returns a deterministic value when predeterminedBalances is undefined', () => {
    // undefined -> getCurrentInterval called with {0n,0n} -> [1, MAX], chargePeriod=0 -> MAX+1
    const r = getNextChargeTime(undefined);
    expect(r).toBe(GO_MAX_UINT_64 + 1n);
  });

  it('handles empty incrementedBalances recurringOwnershipTimes (all zeros)', () => {
    // With all zeros, getCurrentInterval returns [1, MAX]. nextInterval.start = MAX + 1.
    // charge = 0, so nextCharge = MAX + 1 - 0 = MAX + 1.
    const pb = {
      incrementedBalances: {
        recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
      }
    } as any;
    expect(getNextChargeTime(pb)).toBe(GO_MAX_UINT_64 + 1n);
  });

  it('computes next charge time for a real recurring schedule', () => {
    const now = BigInt(Date.now());
    const startTime = now - 30_000n;
    const intervalLength = 60_000n;
    const chargePeriodLength = 10_000n;

    const pb = {
      incrementedBalances: {
        recurringOwnershipTimes: { startTime, intervalLength, chargePeriodLength }
      }
    } as any;

    const currInterval = getCurrentInterval({ startTime, intervalLength } as any);
    const expectedNextStart = currInterval.end + 1n;
    const expectedChargeTime = expectedNextStart - chargePeriodLength;

    expect(getNextChargeTime(pb)).toBe(expectedChargeTime);
  });
});

// ===========================================================================
// isSubscriptionFaucetApproval
// ===========================================================================

describe('isSubscriptionFaucetApproval', () => {
  it('returns true for a valid faucet approval', () => {
    expect(isSubscriptionFaucetApproval(makeFaucetApproval())).toBe(true);
  });

  it('returns false when fromListId != "Mint"', () => {
    const a = makeFaucetApproval();
    a.fromListId = 'bb1other';
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when coinTransfers is undefined', () => {
    const a = makeFaucetApproval();
    delete a.approvalCriteria.coinTransfers;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when coinTransfers has length 0', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.coinTransfers = [];
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when coinTransfers use multiple denoms', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.coinTransfers = [
      {
        to: 'bb1a',
        coins: [{ denom: 'ubadge', amount: 100n }],
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false
      },
      {
        to: 'bb1b',
        coins: [{ denom: 'uusdc', amount: 100n }],
        overrideFromWithApproverAddress: false,
        overrideToWithInitiator: false
      }
    ];
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns true when multiple coinTransfers share a single denom', () => {
    const a = makeFaucetApproval();
    const existing = a.approvalCriteria.coinTransfers[0];
    a.approvalCriteria.coinTransfers = [existing, { ...existing }];
    expect(isSubscriptionFaucetApproval(a)).toBe(true);
  });

  it('returns false when overrideFromWithApproverAddress is true', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = true;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when overrideToWithInitiator is true', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.coinTransfers[0].overrideToWithInitiator = true;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when incrementedBalances is missing', () => {
    const a = makeFaucetApproval();
    delete a.approvalCriteria.predeterminedBalances;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when startBalances.length != 1', () => {
    const a = makeFaucetApproval();
    const sb = a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0];
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [sb, { ...sb }];
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when approval.tokenIds size > 1', () => {
    const a = makeFaucetApproval();
    a.tokenIds = [{ start: 1n, end: 2n }];
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when startBalances tokenIds size > 1', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 1n, end: 2n }
    ];
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when startBalances amount != 1', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = 2n;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when incrementTokenIdsBy != 0', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementTokenIdsBy = 1n;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when incrementOwnershipTimesBy != 0', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy = 1n;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when durationFromTimestamp is 0 (faucet MUST set a duration)', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp = 0n;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when allowOverrideTimestamp is false', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideTimestamp = false;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when allowAmountScaling is true', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowAmountScaling = true;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.startTime != 0', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.startTime = 1n;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.intervalLength != 0', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength = 1n;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.chargePeriodLength != 0', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.chargePeriodLength = 1n;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when requireFromEqualsInitiatedBy is true', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.requireFromEqualsInitiatedBy = true;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when requireToEqualsInitiatedBy is true', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.requireToEqualsInitiatedBy = true;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when overridesToIncomingApprovals is true', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.overridesToIncomingApprovals = true;
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns false when any merkleChallenge is present', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.merkleChallenges = [{ challengeTrackerId: 'x' }];
    expect(isSubscriptionFaucetApproval(a)).toBe(false);
  });

  it('returns true with empty merkleChallenges array', () => {
    const a = makeFaucetApproval();
    a.approvalCriteria.merkleChallenges = [];
    expect(isSubscriptionFaucetApproval(a)).toBe(true);
  });
});

// ===========================================================================
// doesCollectionFollowSubscriptionProtocol
// ===========================================================================

describe('doesCollectionFollowSubscriptionProtocol', () => {
  it('returns false for undefined collection', () => {
    expect(doesCollectionFollowSubscriptionProtocol(undefined)).toBe(false);
  });

  it('returns true for a valid subscription collection', () => {
    expect(doesCollectionFollowSubscriptionProtocol(makeValidCollection() as any)).toBe(true);
  });

  it('returns false when zero subscription faucet approvals are present', () => {
    const c = makeValidCollection();
    c.collectionApprovals = [];
    expect(doesCollectionFollowSubscriptionProtocol(c as any)).toBe(false);
  });

  it('returns false when the "Subscriptions" standard is missing', () => {
    const c = makeValidCollection();
    c.standards = ['Other'];
    expect(doesCollectionFollowSubscriptionProtocol(c as any)).toBe(false);
  });

  it('returns false when validTokenIds has more than one range', () => {
    const c = makeValidCollection();
    c.validTokenIds = [
      { start: 1n, end: 1n },
      { start: 3n, end: 3n }
    ];
    expect(doesCollectionFollowSubscriptionProtocol(c as any)).toBe(false);
  });

  it('returns false when subscription approvals span multiple non-contiguous token ranges', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 3n }];
    const a1 = makeFaucetApproval();
    const a2 = makeFaucetApproval();
    a1.tokenIds = [{ start: 1n, end: 1n }];
    a2.tokenIds = [{ start: 3n, end: 3n }];
    c.collectionApprovals = [a1, a2];
    // Two ranges [1,1] + [3,3] do not merge — returns length != 1.
    expect(doesCollectionFollowSubscriptionProtocol(c as any)).toBe(false);
  });

  it('returns false when validTokenIds range does not match subscription approval coverage', () => {
    const c = makeValidCollection();
    c.validTokenIds = [{ start: 1n, end: 2n }];
    // Single faucet approval only covers token 1 — range mismatch.
    expect(doesCollectionFollowSubscriptionProtocol(c as any)).toBe(false);
  });

  it('accepts multi-standard including Subscriptions', () => {
    const c = makeValidCollection();
    c.standards = ['Subscriptions', 'Other'];
    expect(doesCollectionFollowSubscriptionProtocol(c as any)).toBe(true);
  });
});

// ===========================================================================
// isUserRecurringApproval
// ===========================================================================

describe('isUserRecurringApproval', () => {
  const coreSubscription = makeFaucetApproval();

  it('returns true for a valid user recurring approval', () => {
    expect(isUserRecurringApproval(makeUserRecurringApproval(), coreSubscription)).toBe(true);
  });

  it('returns false when fromListId != "Mint"', () => {
    const a = makeUserRecurringApproval();
    a.fromListId = 'bb1other';
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when approvalAmount < subscriptionAmount', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.coinTransfers[0].coins[0].amount = 50n; // subscription wants 100n
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns true when approvalAmount > subscriptionAmount (user can tip)', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.coinTransfers[0].coins[0].amount = 200n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(true);
  });

  it('returns false when tokenIds do not match subscription tokenIds (length)', () => {
    const a = makeUserRecurringApproval();
    a.tokenIds = [
      { start: 1n, end: 1n },
      { start: 2n, end: 2n }
    ];
    // Length mismatch vs subscription, and early-rejected by the size(>1) check too.
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when tokenIds start differs from subscription', () => {
    const a = makeUserRecurringApproval();
    a.tokenIds = [{ start: 2n, end: 2n }];
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when denom mismatches subscription', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.coinTransfers[0].coins[0].denom = 'uusdc';
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when there are 2 coinTransfers', () => {
    const a = makeUserRecurringApproval();
    const ct = a.approvalCriteria.coinTransfers[0];
    a.approvalCriteria.coinTransfers = [ct, { ...ct }];
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when coinTransfer has 2 coins', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.coinTransfers[0].coins = [
      { denom: 'ubadge', amount: 100n },
      { denom: 'ubadge', amount: 100n }
    ];
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when overrideFromWithApproverAddress is false', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.coinTransfers[0].overrideFromWithApproverAddress = false;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when overrideToWithInitiator is false', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.coinTransfers[0].overrideToWithInitiator = false;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when incrementedBalances is missing', () => {
    const a = makeUserRecurringApproval();
    delete a.approvalCriteria.predeterminedBalances;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when startBalances.length != 1', () => {
    const a = makeUserRecurringApproval();
    const sb = a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0];
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances = [sb, { ...sb }];
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when startBalances amount != 1', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].amount = 2n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when startBalances tokenIds range size > 1', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.startBalances[0].tokenIds = [
      { start: 1n, end: 2n }
    ];
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when incrementTokenIdsBy != 0', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementTokenIdsBy = 1n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when incrementOwnershipTimesBy != 0', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.incrementOwnershipTimesBy = 1n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when durationFromTimestamp != 0', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp = 1n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when allowOverrideTimestamp is true', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.allowOverrideTimestamp = true;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.intervalLength mismatches subscription', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength =
      INTERVAL + 1n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when recurringOwnershipTimes.chargePeriodLength mismatches subscription', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.chargePeriodLength =
      1n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when overallMaxNumTransfers != 1', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.maxNumTransfers.overallMaxNumTransfers = 2n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when maxNumTransfers.resetTimeIntervals.intervalLength mismatches subscription', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.maxNumTransfers.resetTimeIntervals.intervalLength = INTERVAL + 1n;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when requireFromEqualsInitiatedBy is true', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.requireFromEqualsInitiatedBy = true;
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when merkleChallenges is non-empty', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.merkleChallenges = [{ id: 'x' }];
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('returns false when mustOwnTokens is non-empty', () => {
    const a = makeUserRecurringApproval();
    a.approvalCriteria.mustOwnTokens = [
      { collectionId: 1n, tokenIds: [{ start: 1n, end: 1n }] }
    ];
    expect(isUserRecurringApproval(a, coreSubscription)).toBe(false);
  });

  it('caps chargePeriodLength at the 7-day ceiling (604_800_000 ms) for long intervals', () => {
    // Build a subscription with interval > 7 days.
    const longIntervalSubscription = makeFaucetApproval();
    const longInterval = 604_800_001n;
    longIntervalSubscription.approvalCriteria.predeterminedBalances.incrementedBalances.durationFromTimestamp =
      longInterval;

    // User approval matching with chargePeriodLength = 604_800_000 ms.
    const userApproval = makeUserRecurringApproval();
    userApproval.approvalCriteria.coinTransfers[0].coins[0].amount = 100n;
    userApproval.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.intervalLength =
      longInterval;
    userApproval.approvalCriteria.predeterminedBalances.incrementedBalances.recurringOwnershipTimes.chargePeriodLength =
      604_800_000n;
    userApproval.approvalCriteria.maxNumTransfers.resetTimeIntervals.intervalLength = longInterval;

    expect(isUserRecurringApproval(userApproval, longIntervalSubscription)).toBe(true);
  });
});
