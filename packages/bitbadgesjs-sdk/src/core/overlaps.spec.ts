/**
 * Tests for overlaps.ts - Universal Permission Overlap Logic
 *
 * These tests are ported from the Go equivalents in:
 * bitbadgeschain/x/tokenization/types/universal_permissions_test.go
 */
import { AddressList } from './addressLists.js';
import {
  ActionPermissionUsedFlags,
  ApprovalPermissionUsedFlags,
  GetFirstMatchOnly,
  GetListWithOptions,
  GetUintRangesWithOptions,
  MergeUniversalPermissionDetails,
  TimedUpdatePermissionUsedFlags,
  UniversalPermission,
  UniversalPermissionDetails,
  ValidateUniversalPermissionUpdate,
  getOverlapsAndNonOverlaps,
  universalRemoveOverlapFromValues,
  universalRemoveOverlaps
} from './overlaps.js';
import { UintRange, UintRangeArray } from './uintRanges.js';

// Test addresses (matching Go tests)
const alice = 'bb1e0w5t53nrq7p66fye6c8p0ynyhf6y24lke5430';
const bob = 'bb1jmjfq0tplp9tmx4v9uemw72y4d2wa5nrjmmk3q';
const charlie = 'bb1xyxs3skf3f4jfqeuv89yyaqvjc6lffav9altme';

// Helper to create a UniversalPermissionDetails object
function createPermissionDetails(
  tokenIdRange: { start: bigint; end: bigint },
  timelineTimeRange: { start: bigint; end: bigint },
  transferTimeRange: { start: bigint; end: bigint },
  ownershipTimeRange: { start: bigint; end: bigint },
  toList: { addresses: string[]; whitelist: boolean },
  fromList: { addresses: string[]; whitelist: boolean },
  initiatedByList: { addresses: string[]; whitelist: boolean },
  approvalIdList: { addresses: string[]; whitelist: boolean } = { addresses: [], whitelist: false }
): UniversalPermissionDetails {
  return {
    tokenId: new UintRange<bigint>(tokenIdRange),
    timelineTime: new UintRange<bigint>(timelineTimeRange),
    transferTime: new UintRange<bigint>(transferTimeRange),
    ownershipTime: new UintRange<bigint>(ownershipTimeRange),
    toList: new AddressList({
      listId: '',
      addresses: toList.addresses,
      whitelist: toList.whitelist,
      uri: '',
      customData: ''
    }),
    fromList: new AddressList({
      listId: '',
      addresses: fromList.addresses,
      whitelist: fromList.whitelist,
      uri: '',
      customData: ''
    }),
    initiatedByList: new AddressList({
      listId: '',
      addresses: initiatedByList.addresses,
      whitelist: initiatedByList.whitelist,
      uri: '',
      customData: ''
    }),
    approvalIdList: new AddressList({
      listId: '',
      addresses: approvalIdList.addresses,
      whitelist: approvalIdList.whitelist,
      uri: '',
      customData: ''
    }),
    permanentlyPermittedTimes: UintRangeArray.From([]),
    permanentlyForbiddenTimes: UintRangeArray.From([]),
    arbitraryValue: {}
  };
}

describe('overlaps', () => {
  describe('universalRemoveOverlaps', () => {
    test('should remove exact overlap (single point from range)', () => {
      // Ported from TestRemoveOverlaps in Go
      // Remove point (5,5,5,5) from range (1-10, 1-10, 1-10, 1-10)
      const handled = createPermissionDetails(
        { start: 5n, end: 5n },
        { start: 5n, end: 5n },
        { start: 5n, end: 5n },
        { start: 5n, end: 5n },
        { addresses: [alice, bob, charlie], whitelist: true },
        { addresses: [alice, bob, charlie], whitelist: true },
        { addresses: [alice, bob, charlie], whitelist: true }
      );

      const valueToCheck = createPermissionDetails(
        { start: 1n, end: 10n },
        { start: 1n, end: 10n },
        { start: 1n, end: 10n },
        { start: 1n, end: 10n },
        { addresses: [alice, bob, charlie], whitelist: true },
        { addresses: [alice, bob, charlie], whitelist: true },
        { addresses: [alice, bob, charlie], whitelist: true }
      );

      const [remaining, removed] = universalRemoveOverlaps(handled, valueToCheck);

      // Should have 8 remaining pieces (the original range minus the center point)
      expect(remaining.length).toBe(8);
      // Should have 1 removed piece (the center point)
      expect(removed.length).toBe(1);

      // First remaining: timelineTime 1-4, everything else full
      expect(remaining[0].timelineTime.start).toBe(1n);
      expect(remaining[0].timelineTime.end).toBe(4n);
      expect(remaining[0].tokenId.start).toBe(1n);
      expect(remaining[0].tokenId.end).toBe(10n);

      // Second remaining: timelineTime 6-10, everything else full
      expect(remaining[1].timelineTime.start).toBe(6n);
      expect(remaining[1].timelineTime.end).toBe(10n);

      // Check removed piece
      expect(removed[0].timelineTime.start).toBe(5n);
      expect(removed[0].timelineTime.end).toBe(5n);
      expect(removed[0].tokenId.start).toBe(5n);
      expect(removed[0].tokenId.end).toBe(5n);
    });

    test('should handle no overlap (disjoint ranges)', () => {
      const handled = createPermissionDetails(
        { start: 100n, end: 200n },
        { start: 1n, end: 1n },
        { start: 1n, end: 1n },
        { start: 1n, end: 1n },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false }
      );

      const valueToCheck = createPermissionDetails(
        { start: 1n, end: 10n },
        { start: 1n, end: 1n },
        { start: 1n, end: 1n },
        { start: 1n, end: 1n },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false }
      );

      const [remaining, removed] = universalRemoveOverlaps(handled, valueToCheck);

      // No overlap - original value should remain, nothing removed
      expect(remaining.length).toBe(1);
      expect(removed.length).toBe(0);
      expect(remaining[0].tokenId.start).toBe(1n);
      expect(remaining[0].tokenId.end).toBe(10n);
    });

    test('should handle full overlap (handled contains entire valueToCheck)', () => {
      const handled = createPermissionDetails(
        { start: 1n, end: 100n },
        { start: 1n, end: 100n },
        { start: 1n, end: 100n },
        { start: 1n, end: 100n },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false }
      );

      const valueToCheck = createPermissionDetails(
        { start: 10n, end: 20n },
        { start: 10n, end: 20n },
        { start: 10n, end: 20n },
        { start: 10n, end: 20n },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false }
      );

      const [remaining, removed] = universalRemoveOverlaps(handled, valueToCheck);

      // Full overlap - nothing remaining, everything removed
      expect(remaining.length).toBe(0);
      expect(removed.length).toBe(1);
      expect(removed[0].tokenId.start).toBe(10n);
      expect(removed[0].tokenId.end).toBe(20n);
    });

    test('should handle address list overlap removal', () => {
      // Ported from TestRemoveAddresses in Go
      // Remove permission for alice only from permission for alice, bob, charlie
      const handled = createPermissionDetails(
        { start: 5n, end: 5n },
        { start: 5n, end: 5n },
        { start: 5n, end: 5n },
        { start: 5n, end: 5n },
        { addresses: [alice], whitelist: true },
        { addresses: [alice], whitelist: true },
        { addresses: [alice], whitelist: true }
      );

      const valueToCheck = createPermissionDetails(
        { start: 1n, end: 10n },
        { start: 1n, end: 10n },
        { start: 1n, end: 10n },
        { start: 1n, end: 10n },
        { addresses: [alice, bob, charlie], whitelist: true },
        { addresses: [alice, bob, charlie], whitelist: true },
        { addresses: [alice, bob, charlie], whitelist: true }
      );

      const [remaining, removed] = universalRemoveOverlaps(handled, valueToCheck);

      // Should have remaining pieces for bob and charlie after alice is handled
      expect(remaining.length).toBeGreaterThan(0);
      expect(removed.length).toBeGreaterThan(0);
    });
  });

  describe('universalRemoveOverlapFromValues', () => {
    test('should remove overlap from array of values', () => {
      const handled = createPermissionDetails(
        { start: 5n, end: 5n },
        { start: 1n, end: 1n },
        { start: 1n, end: 1n },
        { start: 1n, end: 1n },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false },
        { addresses: [], whitelist: false }
      );

      const valuesToCheck = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        ),
        createPermissionDetails(
          { start: 20n, end: 30n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const [newValues, removed] = universalRemoveOverlapFromValues(handled, valuesToCheck);

      // First value should be split, second should remain unchanged
      expect(newValues.length).toBeGreaterThan(1);
      expect(removed.length).toBe(1);

      // The second value (20-30) should be in newValues unchanged
      const hasSecondValue = newValues.some((v) => v.tokenId.start === 20n && v.tokenId.end === 30n);
      expect(hasSecondValue).toBe(true);
    });
  });

  describe('getOverlapsAndNonOverlaps', () => {
    test('should correctly identify overlaps between two permission sets', () => {
      const firstDetails = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const secondDetails = [
        createPermissionDetails(
          { start: 5n, end: 15n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const [allOverlaps, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(firstDetails, secondDetails);

      // Should have overlap in range 5-10
      expect(allOverlaps.length).toBe(1);
      expect(allOverlaps[0].overlap.tokenId.start).toBe(5n);
      expect(allOverlaps[0].overlap.tokenId.end).toBe(10n);

      // Old but not new: 1-4
      expect(inOldButNotNew.length).toBe(1);
      expect(inOldButNotNew[0].tokenId.start).toBe(1n);
      expect(inOldButNotNew[0].tokenId.end).toBe(4n);

      // New but not old: 11-15
      expect(inNewButNotOld.length).toBe(1);
      expect(inNewButNotOld[0].tokenId.start).toBe(11n);
      expect(inNewButNotOld[0].tokenId.end).toBe(15n);
    });

    test('should handle identical permission sets', () => {
      const details = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const [allOverlaps, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(details, details);

      // Everything overlaps, nothing unique
      expect(allOverlaps.length).toBe(1);
      expect(inOldButNotNew.length).toBe(0);
      expect(inNewButNotOld.length).toBe(0);
    });

    test('should handle disjoint permission sets', () => {
      const firstDetails = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const secondDetails = [
        createPermissionDetails(
          { start: 20n, end: 30n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const [allOverlaps, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(firstDetails, secondDetails);

      // No overlaps
      expect(allOverlaps.length).toBe(0);
      expect(inOldButNotNew.length).toBe(1);
      expect(inNewButNotOld.length).toBe(1);
    });

    test('should handle empty input arrays', () => {
      const [allOverlaps1, inOldButNotNew1, inNewButNotOld1] = getOverlapsAndNonOverlaps([], []);
      expect(allOverlaps1.length).toBe(0);
      expect(inOldButNotNew1.length).toBe(0);
      expect(inNewButNotOld1.length).toBe(0);

      const nonEmpty = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const [allOverlaps2, inOldButNotNew2, inNewButNotOld2] = getOverlapsAndNonOverlaps(nonEmpty, []);
      expect(allOverlaps2.length).toBe(0);
      expect(inOldButNotNew2.length).toBe(1);
      expect(inNewButNotOld2.length).toBe(0);
    });
  });

  describe('GetUintRangesWithOptions', () => {
    test('should return original ranges when uses is true', () => {
      const ranges = UintRangeArray.From<bigint>([
        { start: 1n, end: 10n },
        { start: 20n, end: 30n }
      ]);

      const result = GetUintRangesWithOptions(ranges, true);

      expect(result.length).toBe(2);
      expect(result[0].start).toBe(1n);
      expect(result[0].end).toBe(10n);
      expect(result[1].start).toBe(20n);
      expect(result[1].end).toBe(30n);
    });

    test('should return dummy range when uses is false', () => {
      const ranges = UintRangeArray.From<bigint>([
        { start: 1n, end: 10n },
        { start: 20n, end: 30n }
      ]);

      const result = GetUintRangesWithOptions(ranges, false);

      expect(result.length).toBe(1);
      expect(result[0].start).toBe(1n);
      expect(result[0].end).toBe(1n);
    });
  });

  describe('GetListWithOptions', () => {
    test('should return original list when uses is true', () => {
      const list = new AddressList({
        listId: 'test',
        addresses: [alice, bob],
        whitelist: true,
        uri: '',
        customData: ''
      });

      const result = GetListWithOptions(list, true);

      expect(result.addresses).toEqual([alice, bob]);
      expect(result.whitelist).toBe(true);
    });

    test('should return empty non-whitelist when uses is false', () => {
      const list = new AddressList({
        listId: 'test',
        addresses: [alice, bob],
        whitelist: true,
        uri: '',
        customData: ''
      });

      const result = GetListWithOptions(list, false);

      expect(result.addresses).toEqual([]);
      expect(result.whitelist).toBe(false);
    });
  });

  describe('GetFirstMatchOnly', () => {
    test('should return first match for each unique combination', () => {
      const permission1: UniversalPermission = {
        tokenIds: UintRangeArray.From([{ start: 1n, end: 10n }]),
        timelineTimes: UintRangeArray.From([{ start: 1n, end: 1n }]),
        transferTimes: UintRangeArray.From([{ start: 1n, end: 1n }]),
        ownershipTimes: UintRangeArray.From([{ start: 1n, end: 1n }]),
        toList: AddressList.AllAddresses(),
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        approvalIdList: new AddressList({ listId: '', addresses: [], whitelist: false, uri: '', customData: '' }),
        permanentlyPermittedTimes: UintRangeArray.From([{ start: 1n, end: 100n }]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        usesTokenIds: true,
        usesTimelineTimes: false,
        usesTransferTimes: false,
        usesToList: false,
        usesFromList: false,
        usesInitiatedByList: false,
        usesOwnershipTimes: false,
        usesApprovalIdList: false,
        arbitraryValue: { id: 'first' }
      };

      const permission2: UniversalPermission = {
        ...permission1,
        tokenIds: UintRangeArray.From([{ start: 5n, end: 15n }]),
        permanentlyPermittedTimes: UintRangeArray.From([{ start: 200n, end: 300n }]),
        arbitraryValue: { id: 'second' }
      };

      const result = GetFirstMatchOnly([permission1, permission2]);

      // Token IDs 1-10 should use permission1's times
      // Token IDs 11-15 should use permission2's times
      expect(result.length).toBe(2);

      // First match (1-10) should have permission1's permitted times
      const first = result.find((r) => r.tokenId.start === 1n && r.tokenId.end === 10n);
      expect(first).toBeDefined();
      expect(first!.permanentlyPermittedTimes[0].start).toBe(1n);
      expect(first!.permanentlyPermittedTimes[0].end).toBe(100n);

      // Second match (11-15) should have permission2's permitted times
      const second = result.find((r) => r.tokenId.start === 11n && r.tokenId.end === 15n);
      expect(second).toBeDefined();
      expect(second!.permanentlyPermittedTimes[0].start).toBe(200n);
      expect(second!.permanentlyPermittedTimes[0].end).toBe(300n);
    });

    test('should handle empty permissions array', () => {
      const result = GetFirstMatchOnly([]);
      expect(result.length).toBe(0);
    });

    test('should work with handleAllPossibleCombinations flag', () => {
      const permission: UniversalPermission = {
        tokenIds: UintRangeArray.From([{ start: 1n, end: 10n }]),
        timelineTimes: UintRangeArray.From([{ start: 1n, end: 1n }]),
        transferTimes: UintRangeArray.From([{ start: 1n, end: 1n }]),
        ownershipTimes: UintRangeArray.From([{ start: 1n, end: 1n }]),
        toList: AddressList.AllAddresses(),
        fromList: AddressList.AllAddresses(),
        initiatedByList: AddressList.AllAddresses(),
        approvalIdList: new AddressList({ listId: '', addresses: [], whitelist: false, uri: '', customData: '' }),
        permanentlyPermittedTimes: UintRangeArray.From([{ start: 1n, end: 100n }]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        usesTokenIds: true,
        usesTimelineTimes: false,
        usesTransferTimes: false,
        usesToList: false,
        usesFromList: false,
        usesInitiatedByList: false,
        usesOwnershipTimes: false,
        usesApprovalIdList: false,
        arbitraryValue: {}
      };

      // With handleAllPossibleCombinations, should cover all possible token IDs
      // ActionPermissionUsedFlags has usesTokenIds=false, so tokens are treated as dummy
      // The "all" catch-all permission is appended, resulting in just the single entry
      const result = GetFirstMatchOnly([permission], true, ActionPermissionUsedFlags);

      // Since ActionPermissionUsedFlags doesn't use token IDs, we only get one result
      // (the tokens are collapsed to a dummy range)
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('should throw when handleAllPossibleCombinations is true but usesFlags is undefined', () => {
      expect(() => {
        GetFirstMatchOnly([], true, undefined);
      }).toThrow('handleAllPossibleCombinations is true but usesFlags is null');
    });
  });

  describe('MergeUniversalPermissionDetails', () => {
    test('should convert permissions to merged format', () => {
      // MergeUniversalPermissionDetails converts UniversalPermissionDetails[] to
      // MergedUniversalPermissionDetails[] format, potentially merging when N-1 fields match
      const permissions = [
        createPermissionDetails(
          { start: 1n, end: 5n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        ),
        createPermissionDetails(
          { start: 6n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const result = MergeUniversalPermissionDetails(permissions);

      // Should return merged format with tokenIds as arrays
      expect(result.length).toBeGreaterThanOrEqual(1);
      // Each result should have tokenIds as an array
      expect(Array.isArray(result[0].tokenIds)).toBe(true);
      expect(result[0].tokenIds.length).toBeGreaterThanOrEqual(1);
    });

    test('should not merge when doNotMerge is true', () => {
      const permissions = [
        createPermissionDetails(
          { start: 1n, end: 5n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        ),
        createPermissionDetails(
          { start: 6n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const result = MergeUniversalPermissionDetails(permissions, true);

      // Should remain as 2 separate entries
      expect(result.length).toBe(2);
    });

    test('should handle empty input', () => {
      const result = MergeUniversalPermissionDetails([]);
      expect(result.length).toBe(0);
    });

    test('should not merge permissions with different properties', () => {
      const permissions = [
        createPermissionDetails(
          { start: 1n, end: 5n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [alice], whitelist: true },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        ),
        createPermissionDetails(
          { start: 6n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [bob], whitelist: true },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const result = MergeUniversalPermissionDetails(permissions);

      // Should remain as 2 separate entries due to different toList
      expect(result.length).toBe(2);
    });
  });

  describe('ValidateUniversalPermissionUpdate', () => {
    test('should return null for valid update (adding new permissions)', () => {
      const oldPermissions = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];
      oldPermissions[0].permanentlyPermittedTimes = UintRangeArray.From([{ start: 1n, end: 100n }]);

      const newPermissions = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];
      // New permissions include the old permitted times plus more
      newPermissions[0].permanentlyPermittedTimes = UintRangeArray.From([
        { start: 1n, end: 100n },
        { start: 200n, end: 300n }
      ]);

      const error = ValidateUniversalPermissionUpdate(oldPermissions, newPermissions);
      expect(error).toBeNull();
    });

    test('should return error when removing old permissions', () => {
      const oldPermissions = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const newPermissions = [
        createPermissionDetails(
          { start: 1n, end: 5n }, // Reduced range - missing 6-10
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];

      const error = ValidateUniversalPermissionUpdate(oldPermissions, newPermissions);
      expect(error).not.toBeNull();
      expect(error!.message).toContain('found in old permissions but not in new permissions');
    });

    test('should return error when revoking previously permitted times', () => {
      const oldPermissions = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];
      oldPermissions[0].permanentlyPermittedTimes = UintRangeArray.From([{ start: 1n, end: 100n }]);

      const newPermissions = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];
      // New permissions have LESS permitted times (50-100 removed)
      newPermissions[0].permanentlyPermittedTimes = UintRangeArray.From([{ start: 1n, end: 49n }]);

      const error = ValidateUniversalPermissionUpdate(oldPermissions, newPermissions);
      expect(error).not.toBeNull();
      expect(error!.message).toContain('previously explicitly allowed');
    });

    test('should return null for identical permissions', () => {
      const permissions = [
        createPermissionDetails(
          { start: 1n, end: 10n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { start: 1n, end: 1n },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false },
          { addresses: [], whitelist: false }
        )
      ];
      permissions[0].permanentlyPermittedTimes = UintRangeArray.From([{ start: 1n, end: 100n }]);

      const error = ValidateUniversalPermissionUpdate(permissions, permissions);
      expect(error).toBeNull();
    });

    test('should handle empty permission arrays', () => {
      const error = ValidateUniversalPermissionUpdate([], []);
      expect(error).toBeNull();
    });
  });

  describe('UsedFlags constants', () => {
    test('ActionPermissionUsedFlags should have all flags false', () => {
      expect(ActionPermissionUsedFlags.usesTokenIds).toBe(false);
      expect(ActionPermissionUsedFlags.usesTimelineTimes).toBe(false);
      expect(ActionPermissionUsedFlags.usesTransferTimes).toBe(false);
      expect(ActionPermissionUsedFlags.usesToList).toBe(false);
      expect(ActionPermissionUsedFlags.usesFromList).toBe(false);
      expect(ActionPermissionUsedFlags.usesInitiatedByList).toBe(false);
      expect(ActionPermissionUsedFlags.usesOwnershipTimes).toBe(false);
      expect(ActionPermissionUsedFlags.usesApprovalIdList).toBe(false);
    });

    test('TimedUpdatePermissionUsedFlags should only have usesTimelineTimes true', () => {
      expect(TimedUpdatePermissionUsedFlags.usesTokenIds).toBe(false);
      expect(TimedUpdatePermissionUsedFlags.usesTimelineTimes).toBe(true);
      expect(TimedUpdatePermissionUsedFlags.usesTransferTimes).toBe(false);
    });

    test('ApprovalPermissionUsedFlags should have approval-related flags true', () => {
      expect(ApprovalPermissionUsedFlags.usesTokenIds).toBe(true);
      expect(ApprovalPermissionUsedFlags.usesTransferTimes).toBe(true);
      expect(ApprovalPermissionUsedFlags.usesToList).toBe(true);
      expect(ApprovalPermissionUsedFlags.usesFromList).toBe(true);
      expect(ApprovalPermissionUsedFlags.usesInitiatedByList).toBe(true);
      expect(ApprovalPermissionUsedFlags.usesOwnershipTimes).toBe(true);
      expect(ApprovalPermissionUsedFlags.usesApprovalIdList).toBe(true);
    });
  });
});
