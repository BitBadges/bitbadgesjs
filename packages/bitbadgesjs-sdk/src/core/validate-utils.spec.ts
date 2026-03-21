/**
 * Tests for validate-utils.ts
 *
 * Covers: getPotentialUpdatesForTimelineValues, getUpdateCombinationsToCheck, AllDefaultValues
 */

import { AddressList } from './addressLists.js';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps.js';
import { GetFirstMatchOnly } from './overlaps.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { AllDefaultValues, getPotentialUpdatesForTimelineValues, getUpdateCombinationsToCheck } from './validate-utils.js';

// Helper to create a UniversalPermissionDetails with sensible defaults
function makeDetail(overrides: Partial<UniversalPermissionDetails> = {}): UniversalPermissionDetails {
  return {
    tokenId: new UintRange({ start: 1n, end: 1n }),
    timelineTime: new UintRange({ start: 1n, end: 1n }),
    transferTime: new UintRange({ start: 1n, end: 1n }),
    ownershipTime: new UintRange({ start: 1n, end: 1n }),
    toList: AddressList.AllAddresses(),
    fromList: AddressList.AllAddresses(),
    initiatedByList: AddressList.AllAddresses(),
    approvalIdList: AddressList.AllAddresses(),
    permanentlyPermittedTimes: UintRangeArray.From([]),
    permanentlyForbiddenTimes: UintRangeArray.From([]),
    arbitraryValue: undefined,
    ...overrides
  };
}

describe('AllDefaultValues', () => {
  it('should have all uses flags set to false', () => {
    expect(AllDefaultValues.usesTokenIds).toBe(false);
    expect(AllDefaultValues.usesTimelineTimes).toBe(false);
    expect(AllDefaultValues.usesTransferTimes).toBe(false);
    expect(AllDefaultValues.usesToList).toBe(false);
    expect(AllDefaultValues.usesFromList).toBe(false);
    expect(AllDefaultValues.usesInitiatedByList).toBe(false);
    expect(AllDefaultValues.usesOwnershipTimes).toBe(false);
    expect(AllDefaultValues.usesApprovalIdList).toBe(false);
  });

  it('should have empty UintRange arrays', () => {
    expect(AllDefaultValues.tokenIds.length).toBe(0);
    expect(AllDefaultValues.timelineTimes.length).toBe(0);
    expect(AllDefaultValues.transferTimes.length).toBe(0);
    expect(AllDefaultValues.ownershipTimes.length).toBe(0);
    expect(AllDefaultValues.permanentlyPermittedTimes.length).toBe(0);
    expect(AllDefaultValues.permanentlyForbiddenTimes.length).toBe(0);
  });

  it('should have AllAddresses for address lists', () => {
    expect(AllDefaultValues.fromList.whitelist).toBe(false);
    expect(AllDefaultValues.toList.whitelist).toBe(false);
    expect(AllDefaultValues.initiatedByList.whitelist).toBe(false);
    expect(AllDefaultValues.approvalIdList.whitelist).toBe(false);
  });

  it('should have undefined arbitraryValue', () => {
    expect(AllDefaultValues.arbitraryValue).toBeUndefined();
  });
});

describe('getPotentialUpdatesForTimelineValues', () => {
  it('should return first-match-only for a single timeline value', () => {
    const times = [UintRangeArray.From<bigint>([{ start: 1n, end: 100n }])];
    const values = [{ metadata: 'v1' }];

    const result = getPotentialUpdatesForTimelineValues(times, values);

    expect(result.length).toBe(1);
    expect(result[0].timelineTime.start).toBe(1n);
    expect(result[0].timelineTime.end).toBe(100n);
    expect(result[0].arbitraryValue).toEqual({ metadata: 'v1' });
  });

  it('should handle multiple non-overlapping timeline values', () => {
    const times = [
      UintRangeArray.From<bigint>([{ start: 1n, end: 50n }]),
      UintRangeArray.From<bigint>([{ start: 51n, end: 100n }])
    ];
    const values = [{ metadata: 'v1' }, { metadata: 'v2' }];

    const result = getPotentialUpdatesForTimelineValues(times, values);

    expect(result.length).toBe(2);
  });

  it('should apply first-match-only for overlapping timeline values', () => {
    const times = [
      UintRangeArray.From<bigint>([{ start: 1n, end: 100n }]),
      UintRangeArray.From<bigint>([{ start: 50n, end: 150n }])
    ];
    const values = [{ metadata: 'v1' }, { metadata: 'v2' }];

    const result = getPotentialUpdatesForTimelineValues(times, values);

    // First claim 1-100, second claims only 101-150
    expect(result.length).toBe(2);
    const firstMatch = result.find((r) => r.timelineTime.start === 1n);
    expect(firstMatch).toBeDefined();
    expect(firstMatch!.arbitraryValue).toEqual({ metadata: 'v1' });

    const secondMatch = result.find((r) => r.timelineTime.start === 101n);
    expect(secondMatch).toBeDefined();
    expect(secondMatch!.arbitraryValue).toEqual({ metadata: 'v2' });
  });

  it('should handle empty input', () => {
    const result = getPotentialUpdatesForTimelineValues([], []);
    expect(result.length).toBe(0);
  });

  it('should handle single-point timeline ranges', () => {
    const times = [UintRangeArray.From<bigint>([{ start: 5n, end: 5n }])];
    const values = ['single'];

    const result = getPotentialUpdatesForTimelineValues(times, values);

    expect(result.length).toBe(1);
    expect(result[0].timelineTime.start).toBe(5n);
    expect(result[0].timelineTime.end).toBe(5n);
    expect(result[0].arbitraryValue).toBe('single');
  });
});

describe('getUpdateCombinationsToCheck', () => {
  // Simple compare function that returns a detail for any change
  const simpleCompare = (oldVal: unknown, newVal: unknown): UniversalPermissionDetails[] => {
    if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return [];
    return [makeDetail()];
  };

  it('should return empty array when old and new are identical', () => {
    const details = [makeDetail({ arbitraryValue: 'same' })];
    const result = getUpdateCombinationsToCheck(details, details, undefined, simpleCompare);
    expect(result.length).toBe(0);
  });

  it('should detect changes in inOldButNotNew', () => {
    const oldDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: 'old-value'
      })
    ];
    const newDetails: UniversalPermissionDetails[] = [];

    const result = getUpdateCombinationsToCheck(oldDetails, newDetails, undefined, simpleCompare);
    expect(result.length).toBeGreaterThan(0);
    // The timelineTime should come from the old detail
    expect(result[0].timelineTime.start).toBe(1n);
    expect(result[0].timelineTime.end).toBe(10n);
  });

  it('should detect changes in inNewButNotOld', () => {
    const oldDetails: UniversalPermissionDetails[] = [];
    const newDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: 'new-value'
      })
    ];

    const result = getUpdateCombinationsToCheck(oldDetails, newDetails, undefined, simpleCompare);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should detect changes in overlapping values with different arbitrary values', () => {
    const oldDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: 'old'
      })
    ];
    const newDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: 'new'
      })
    ];

    const result = getUpdateCombinationsToCheck(oldDetails, newDetails, undefined, simpleCompare);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should not report changes when overlap values are identical', () => {
    const oldDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: { x: 1 }
      })
    ];
    const newDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: { x: 1 }
      })
    ];

    const result = getUpdateCombinationsToCheck(oldDetails, newDetails, undefined, simpleCompare);
    expect(result.length).toBe(0);
  });

  it('should handle partial overlap with different values', () => {
    const oldDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: 'old'
      })
    ];
    const newDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 5n, end: 15n }),
        arbitraryValue: 'new'
      })
    ];

    const result = getUpdateCombinationsToCheck(oldDetails, newDetails, undefined, simpleCompare);
    // Should have entries for: old-but-not-new (1-4), new-but-not-old (11-15), and overlap (5-10) if values differ
    expect(result.length).toBeGreaterThan(0);
  });

  it('should use emptyValue when comparing removed or added entries', () => {
    let comparedWithEmpty = false;
    const trackingCompare = (oldVal: unknown, newVal: unknown): UniversalPermissionDetails[] => {
      if (oldVal === undefined || newVal === undefined) {
        comparedWithEmpty = true;
      }
      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return [];
      return [makeDetail()];
    };

    const oldDetails = [
      makeDetail({
        timelineTime: new UintRange({ start: 1n, end: 10n }),
        arbitraryValue: 'value'
      })
    ];

    getUpdateCombinationsToCheck(oldDetails, [], undefined, trackingCompare);
    expect(comparedWithEmpty).toBe(true);
  });
});
