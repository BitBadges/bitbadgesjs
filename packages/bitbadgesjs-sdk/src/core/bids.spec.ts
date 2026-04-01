/**
 * Tests for bids.ts
 *
 * Covers: isBidOrListingApproval, isOrderbookBidOrListingApproval, isCollectionBid
 */

import { isBidOrListingApproval, isOrderbookBidOrListingApproval, isCollectionBid } from './bids.js';
import type { iCollectionApproval } from '@/interfaces/types/approvals.js';
import { GO_MAX_UINT_64 } from '@/common/math.js';

BigInt.prototype.toJSON = function () {
  return this.toString();
};

function makeValidBidApproval(overrides?: Partial<iCollectionApproval<bigint>>): iCollectionApproval<bigint> {
  return {
    fromListId: 'All',
    toListId: 'All',
    initiatedByListId: 'All',
    approvalId: 'test-bid',
    transferTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    tokenIds: [{ start: 1n, end: 1n }],
    ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }],
    version: 0n,
    approvalCriteria: {
      coinTransfers: [
        {
          to: 'All',
          coins: [{ amount: 100n, denom: 'ubadge' }],
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
              ownershipTimes: [{ start: 1n, end: GO_MAX_UINT_64 }]
            }
          ],
          incrementTokenIdsBy: 0n,
          incrementOwnershipTimesBy: 0n,
          durationFromTimestamp: 0n,
          allowOverrideTimestamp: false,
          allowOverrideWithAnyValidToken: false,
          allowAmountScaling: false,
          maxScalingMultiplier: 0n,
          recurringOwnershipTimes: { startTime: 0n, intervalLength: 0n, chargePeriodLength: 0n }
        },
        manualBalances: [],
        orderCalculationMethod: {}
      },
      maxNumTransfers: {
        overallMaxNumTransfers: 1n,
        perFromAddressMaxNumTransfers: 0n,
        perToAddressMaxNumTransfers: 0n,
        perInitiatedByAddressMaxNumTransfers: 0n,
        resetTimeIntervals: { startTime: 0n, intervalLength: 0n }
      },
      requireFromEqualsInitiatedBy: false,
      requireToEqualsInitiatedBy: false,
      overridesToIncomingApprovals: false,
      merkleChallenges: [],
      mustOwnTokens: []
    },
    ...overrides
  } as any;
}

describe('isBidOrListingApproval', () => {
  it('should return true for a valid incoming bid approval', () => {
    const approval = makeValidBidApproval();
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(true);
  });

  it('should return false when coinTransfers length is not 1', () => {
    const approval = makeValidBidApproval();
    approval.approvalCriteria!.coinTransfers = [];
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when transferTimes length is not 1', () => {
    const approval = makeValidBidApproval();
    approval.transferTimes = [
      { start: 1n, end: 50n },
      { start: 51n, end: 100n }
    ];
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when coin count is not 1', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).coinTransfers[0].coins = [];
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false for incoming when overrideFromWithApproverAddress is false', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).coinTransfers[0].overrideFromWithApproverAddress = false;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false for incoming when overrideToWithInitiator is false', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).coinTransfers[0].overrideToWithInitiator = false;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false for outgoing when overrideFromWithApproverAddress is true', () => {
    const approval = makeValidBidApproval();
    expect(isBidOrListingApproval(approval, 'outgoing')).toBe(false);
  });

  it('should return true for valid outgoing listing', () => {
    const approval = makeValidBidApproval();
    const ct = (approval.approvalCriteria as any).coinTransfers[0];
    ct.overrideFromWithApproverAddress = false;
    ct.overrideToWithInitiator = false;
    ct.to = approval.fromListId;
    expect(isBidOrListingApproval(approval, 'outgoing')).toBe(true);
  });

  it('should return false for outgoing when coin.to does not match fromListId', () => {
    const approval = makeValidBidApproval();
    const ct = (approval.approvalCriteria as any).coinTransfers[0];
    ct.overrideFromWithApproverAddress = false;
    ct.overrideToWithInitiator = false;
    ct.to = 'SomeOtherList';
    expect(isBidOrListingApproval(approval, 'outgoing')).toBe(false);
  });

  it('should return false when no predeterminedBalances', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances = undefined;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when startBalances length is not 1', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.startBalances = [];
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when incrementTokenIdsBy is non-zero', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.incrementTokenIdsBy = 1n;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when allowOverrideTimestamp is true', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.allowOverrideTimestamp = true;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when overridesToIncomingApprovals is true', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).overridesToIncomingApprovals = true;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when merkleChallenges is non-empty', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).merkleChallenges = [{ root: 'abc' }];
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when mustOwnTokens is non-empty', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).mustOwnTokens = [{ collectionId: 1n }];
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when overallMaxNumTransfers is 0', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).maxNumTransfers.overallMaxNumTransfers = 0n;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should allow fungible amounts when isFungibleCheck is true', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.startBalances[0].amount = 100n;
    expect(isBidOrListingApproval(approval, 'incoming', { isFungibleCheck: true })).toBe(true);
  });

  it('should reject non-1 amounts when no fungible options set', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.startBalances[0].amount = 100n;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should allow allowOverrideWithAnyValidToken for collection bids', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.allowOverrideWithAnyValidToken = true;
    expect(isBidOrListingApproval(approval, 'incoming', { isCollectionBid: true })).toBe(true);
  });

  it('should reject allowOverrideWithAnyValidToken for non-collection bids', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.allowOverrideWithAnyValidToken = true;
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });

  it('should return false when ownershipTimes are not full range', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.startBalances[0].ownershipTimes = [
      { start: 1n, end: 100n }
    ];
    expect(isBidOrListingApproval(approval, 'incoming')).toBe(false);
  });
});

describe('isOrderbookBidOrListingApproval', () => {
  it('should call isBidOrListingApproval with isFungibleCheck and fungibleOrNonFungibleAllowed', () => {
    const approval = makeValidBidApproval();
    // With fungible options, amount > 1 should be allowed
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.startBalances[0].amount = 50n;
    expect(isOrderbookBidOrListingApproval(approval, 'incoming')).toBe(true);
  });
});

describe('isCollectionBid', () => {
  it('should return true for a valid collection bid', () => {
    const approval = makeValidBidApproval();
    (approval.approvalCriteria as any).predeterminedBalances.incrementedBalances.allowOverrideWithAnyValidToken = true;
    expect(isCollectionBid(approval)).toBe(true);
  });

  it('should return false when allowOverrideWithAnyValidToken is false', () => {
    const approval = makeValidBidApproval();
    expect(isCollectionBid(approval)).toBe(false);
  });
});
