//TODO: This file should probably be refactored a lot, but it currently works.
//			It is also not user-facing or dev-facing, so I am okay with how it is now
import { BigIntify } from '../common/string-numbers.js';
import { AddressList } from './addressLists.js';
import { UintRange, UintRangeArray } from './uintRanges.js';

const { getReservedTrackerList } = AddressList;

//For permissions, we have many types of permissions that are all very similar to each other
//Here, we abstract all those permissions to a UniversalPermission struct in order to reuse code.
//When casting to a UniversalPermission, we use fake dummy values for the unused values to avoid messing up the logic
//
//This file implements certain logic using UniversalPermissions such as overlaps and getting first match only
//This is used in many places around the codebase

//TODO: This file was created with AI from the Go equivalent in github.com/bitbadges/bitbadgeschain. It should be cleaned up to be more idiomatic TypeScript.

export interface UniversalPermission {
  tokenIds: UintRangeArray<bigint>;
  timelineTimes: UintRangeArray<bigint>;
  transferTimes: UintRangeArray<bigint>;
  ownershipTimes: UintRangeArray<bigint>;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  approvalIdList: AddressList;
  permanentlyPermittedTimes: UintRangeArray<bigint>;
  permanentlyForbiddenTimes: UintRangeArray<bigint>;

  usesTokenIds: boolean;
  usesTimelineTimes: boolean;
  usesTransferTimes: boolean;
  usesToList: boolean;
  usesFromList: boolean;
  usesInitiatedByList: boolean;
  usesOwnershipTimes: boolean;
  usesApprovalIdList: boolean;

  arbitraryValue: any;
}

export interface UniversalPermissionDetails {
  tokenId: UintRange<bigint>;
  timelineTime: UintRange<bigint>;
  transferTime: UintRange<bigint>;
  ownershipTime: UintRange<bigint>;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  approvalIdList: AddressList;

  permanentlyPermittedTimes: UintRangeArray<bigint>;
  permanentlyForbiddenTimes: UintRangeArray<bigint>;

  arbitraryValue: any;
}

export interface Overlap {
  overlap: UniversalPermissionDetails;
  firstDetails: UniversalPermissionDetails;
  secondDetails: UniversalPermissionDetails;
}

export function getOverlapsAndNonOverlaps(
  firstDetails: UniversalPermissionDetails[],
  secondDetails: UniversalPermissionDetails[]
): [Overlap[], UniversalPermissionDetails[], UniversalPermissionDetails[]] {
  // Deep copy
  let inOldButNotNew = firstDetails;
  let inNewButNotOld = secondDetails;

  const allOverlaps: Overlap[] = [];

  for (const oldPermission of firstDetails) {
    for (const newPermission of secondDetails) {
      const [, overlaps] = universalRemoveOverlaps(newPermission, oldPermission);
      for (const overlap of overlaps) {
        allOverlaps.push({
          overlap,
          firstDetails: oldPermission,
          secondDetails: newPermission
        });
      }
    }
  }

  for (const overlap of allOverlaps) {
    [inOldButNotNew] = universalRemoveOverlapFromValues(overlap.overlap, inOldButNotNew);
    [inNewButNotOld] = universalRemoveOverlapFromValues(overlap.overlap, inNewButNotOld);
  }

  return [allOverlaps, inOldButNotNew, inNewButNotOld];
}

export function universalRemoveOverlapFromValues(
  handled: UniversalPermissionDetails,
  valuesToCheck: UniversalPermissionDetails[]
): [UniversalPermissionDetails[], UniversalPermissionDetails[]] {
  const newValuesToCheck = [];
  const removed = [];
  for (const valueToCheck of valuesToCheck) {
    const [remaining, overlaps] = universalRemoveOverlaps(handled, valueToCheck);
    newValuesToCheck.push(...remaining);
    removed.push(...overlaps);
  }

  return [newValuesToCheck, removed];
}

export function universalRemoveOverlaps(
  handled: UniversalPermissionDetails,
  valueToCheck: UniversalPermissionDetails
): [UniversalPermissionDetails[], UniversalPermissionDetails[]] {
  const [timelineTimesAfterRemoval, removedTimelineTimes] = valueToCheck.timelineTime.getOverlapDetails(handled.timelineTime);
  const [badgesAfterRemoval, removedBadges] = valueToCheck.tokenId.getOverlapDetails(handled.tokenId);
  const [transferTimesAfterRemoval, removedTransferTimes] = valueToCheck.transferTime.getOverlapDetails(handled.transferTime);
  const [ownershipTimesAfterRemoval, removedOwnershipTimes] = valueToCheck.ownershipTime.getOverlapDetails(handled.ownershipTime);

  const [toListAfterRemoval, removedToList] = valueToCheck.toList.getOverlapDetails(handled.toList);
  const [fromListAfterRemoval, removedFromList] = valueToCheck.fromList.getOverlapDetails(handled.fromList);
  const [initiatedByListAfterRemoval, removedInitiatedByList] = valueToCheck.initiatedByList.getOverlapDetails(handled.initiatedByList);
  const [approvalIdListAfterRemoval, removedApprovalIdList] = valueToCheck.approvalIdList.getOverlapDetails(handled.approvalIdList);

  const removedToListIsEmpty = removedToList.isEmpty();
  const removedFromListIsEmpty = removedFromList.isEmpty();
  const removedInitiatedByListIsEmpty = removedInitiatedByList.isEmpty();
  const removedApprovalIdListIsEmpty = removedApprovalIdList.isEmpty();

  const remaining: UniversalPermissionDetails[] = [];

  //If we didn't remove anything at all
  if (
    removedTimelineTimes.length === 0 ||
    removedBadges.length === 0 ||
    removedTransferTimes.length === 0 ||
    removedOwnershipTimes.length === 0 ||
    removedToListIsEmpty ||
    removedFromListIsEmpty ||
    removedInitiatedByListIsEmpty ||
    removedApprovalIdListIsEmpty
  ) {
    remaining.push(valueToCheck);
    return [remaining, []];
  }
  for (const timelineTimeAfterRemoval of timelineTimesAfterRemoval) {
    remaining.push({
      timelineTime: timelineTimeAfterRemoval,
      tokenId: valueToCheck.tokenId,
      transferTime: valueToCheck.transferTime,
      ownershipTime: valueToCheck.ownershipTime,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      approvalIdList: valueToCheck.approvalIdList,

      arbitraryValue: valueToCheck.arbitraryValue,

      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }

  for (const badgeAfterRemoval of badgesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      tokenId: badgeAfterRemoval,
      transferTime: valueToCheck.transferTime,
      ownershipTime: valueToCheck.ownershipTime,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      arbitraryValue: valueToCheck.arbitraryValue,
      approvalIdList: valueToCheck.approvalIdList,

      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }

  for (const transferTimeAfterRemoval of transferTimesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      tokenId: removedBadges[0],
      transferTime: transferTimeAfterRemoval,
      ownershipTime: valueToCheck.ownershipTime,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      arbitraryValue: valueToCheck.arbitraryValue,
      approvalIdList: valueToCheck.approvalIdList,

      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }

  for (const ownershipTimeAfterRemoval of ownershipTimesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      tokenId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: ownershipTimeAfterRemoval,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      arbitraryValue: valueToCheck.arbitraryValue,
      approvalIdList: valueToCheck.approvalIdList,

      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }

  if (!toListAfterRemoval.isEmpty()) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      tokenId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: toListAfterRemoval,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      approvalIdList: valueToCheck.approvalIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }
  if (!fromListAfterRemoval.isEmpty()) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      tokenId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: fromListAfterRemoval,
      initiatedByList: valueToCheck.initiatedByList,
      approvalIdList: valueToCheck.approvalIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }

  if (!initiatedByListAfterRemoval.isEmpty()) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      tokenId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: removedFromList,
      initiatedByList: initiatedByListAfterRemoval,
      approvalIdList: valueToCheck.approvalIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }

  if (!approvalIdListAfterRemoval.isEmpty()) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      tokenId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: removedFromList,
      initiatedByList: removedInitiatedByList,
      approvalIdList: approvalIdListAfterRemoval,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([])
    });
  }

  const removed: UniversalPermissionDetails[] = [];
  for (const removedTimelineTime of removedTimelineTimes) {
    for (const removedBadge of removedBadges) {
      for (const removedTransferTime of removedTransferTimes) {
        for (const removedOwnershipTime of removedOwnershipTimes) {
          removed.push({
            timelineTime: removedTimelineTime,
            tokenId: removedBadge,
            transferTime: removedTransferTime,
            ownershipTime: removedOwnershipTime,
            toList: removedToList,
            fromList: removedFromList,
            initiatedByList: removedInitiatedByList,
            approvalIdList: removedApprovalIdList,

            arbitraryValue: valueToCheck.arbitraryValue,

            permanentlyForbiddenTimes: UintRangeArray.From([]),
            permanentlyPermittedTimes: UintRangeArray.From([])
          });
        }
      }
    }
  }

  return [remaining, removed];
}

export function GetUintRangesWithOptions(_ranges: UintRangeArray<bigint>, uses: boolean): UintRangeArray<bigint> {
  let ranges = _ranges.map((x) => x.convert(BigIntify));

  if (!uses) {
    ranges = [new UintRange({ start: BigInt(1), end: BigInt(1) })]; // dummy range
    return UintRangeArray.From(ranges);
  }

  return UintRangeArray.From(ranges);
}

export function GetListIdWithOptions(listId: string, uses?: boolean): string {
  if (!uses) {
    listId = 'All';
  }

  return listId;
}

export function GetListWithOptions(_list: AddressList, uses: boolean): AddressList {
  const list = new AddressList(_list);

  if (!uses) {
    list.addresses = [];
    list.whitelist = false;
  }

  return list;
}

//TODO: This is a mess and is not needed but requires some refactoring.

export interface UsedFlags {
  usesTokenIds: boolean;
  usesTimelineTimes: boolean;
  usesTransferTimes: boolean;
  usesToList: boolean;
  usesFromList: boolean;
  usesInitiatedByList: boolean;
  usesOwnershipTimes: boolean;
  usesApprovalIdList: boolean;
  usesAmountTrackerIdList: boolean;
  usesChallengeTrackerIdList: boolean;
}
export const ActionPermissionUsedFlags: UsedFlags = {
  usesTokenIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: false,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false
};

export const TimedUpdatePermissionUsedFlags: UsedFlags = {
  usesTokenIds: false,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: false,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false
};

export const TimedUpdateWithTokenIdsPermissionUsedFlags: UsedFlags = {
  usesTokenIds: true,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: false,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false
};

export const TokenIdsActionPermissionUsedFlags: UsedFlags = {
  usesTokenIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: false,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false
};

export const ApprovalPermissionUsedFlags: UsedFlags = {
  usesTokenIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: true,
  usesToList: true,
  usesFromList: true,
  usesInitiatedByList: true,
  usesOwnershipTimes: true,
  usesApprovalIdList: true,
  usesAmountTrackerIdList: true,
  usesChallengeTrackerIdList: true
};

export function GetFirstMatchOnly(
  permissions: UniversalPermission[],
  handleAllPossibleCombinations?: boolean,
  usesFlags?: UsedFlags //TODO: get a better system for this
): UniversalPermissionDetails[] {
  const handled: UniversalPermissionDetails[] = [];

  if (handleAllPossibleCombinations && !usesFlags) throw new Error('handleAllPossibleCombinations is true but usesFlags is null');

  if (handleAllPossibleCombinations && usesFlags) {
    //Littel hack but we append a permission with empty permitted, forbidden times but ALL criteria to the end of the array.
    //This is to ensure we always handle all values when we call GetFirstMatchOnly.
    permissions.push({
      timelineTimes: UintRangeArray.FullRanges(),
      fromList: AddressList.AllAddresses(),
      toList: AddressList.AllAddresses(),
      initiatedByList: AddressList.AllAddresses(),
      approvalIdList: getReservedTrackerList('All') as AddressList,
      transferTimes: UintRangeArray.FullRanges(),
      tokenIds: UintRangeArray.FullRanges(),
      ownershipTimes: UintRangeArray.FullRanges(),

      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([]),

      ...usesFlags,

      arbitraryValue: {}
    });
  }

  for (const permission of permissions) {
    const tokenIds = GetUintRangesWithOptions(permission.tokenIds, permission.usesTokenIds);
    const timelineTimes = GetUintRangesWithOptions(permission.timelineTimes, permission.usesTimelineTimes);
    const transferTimes = GetUintRangesWithOptions(permission.transferTimes, permission.usesTransferTimes);
    const ownershipTimes = GetUintRangesWithOptions(permission.ownershipTimes, permission.usesOwnershipTimes);
    const permanentlyPermittedTimes = GetUintRangesWithOptions(permission.permanentlyPermittedTimes, true);
    const permanentlyForbiddenTimes = GetUintRangesWithOptions(permission.permanentlyForbiddenTimes, true);
    const arbitraryValue = permission.arbitraryValue;

    const toList = GetListWithOptions(permission.toList, permission.usesToList);
    const fromList = GetListWithOptions(permission.fromList, permission.usesFromList);
    const initiatedByList = GetListWithOptions(permission.initiatedByList, permission.usesInitiatedByList);
    const approvalIdList = GetListWithOptions(permission.approvalIdList, permission.usesApprovalIdList);

    for (const tokenId of tokenIds) {
      for (const timelineTime of timelineTimes) {
        for (const transferTime of transferTimes) {
          for (const ownershipTime of ownershipTimes) {
            const brokenDown: UniversalPermissionDetails[] = [
              {
                tokenId: tokenId,
                timelineTime: timelineTime,
                transferTime: transferTime,
                ownershipTime: ownershipTime,
                toList: toList,
                fromList: fromList,
                initiatedByList: initiatedByList,
                approvalIdList: approvalIdList,

                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,

                arbitraryValue
              }
            ];

            const [, remainingAfterHandledIsRemoved] = getOverlapsAndNonOverlaps(brokenDown, handled);
            for (const remaining of remainingAfterHandledIsRemoved) {
              handled.push({
                timelineTime: remaining.timelineTime,
                tokenId: remaining.tokenId,
                transferTime: remaining.transferTime,
                ownershipTime: remaining.ownershipTime,
                toList: remaining.toList,
                fromList: remaining.fromList,
                initiatedByList: remaining.initiatedByList,
                approvalIdList: remaining.approvalIdList,
                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,
                arbitraryValue: arbitraryValue
              });
            }
          }
        }
      }
    }
  }

  return handled;
}

export interface MergedUniversalPermissionDetails {
  tokenIds: UintRangeArray<bigint>;
  timelineTimes: UintRangeArray<bigint>;
  transferTimes: UintRangeArray<bigint>;
  ownershipTimes: UintRangeArray<bigint>;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  approvalIdList: AddressList;

  permanentlyPermittedTimes: UintRangeArray<bigint>;
  permanentlyForbiddenTimes: UintRangeArray<bigint>;

  arbitraryValue: any;
}

export function MergeUniversalPermissionDetails(permissions: UniversalPermissionDetails[], doNotMerge?: boolean): MergedUniversalPermissionDetails[] {
  //We can merge two values if N - 1 fields are the same (note currently we only merge uint ranges)
  let merged: MergedUniversalPermissionDetails[] = permissions.map((permission) => {
    return {
      tokenIds: UintRangeArray.From([permission.tokenId]),
      timelineTimes: UintRangeArray.From([permission.timelineTime]),
      transferTimes: UintRangeArray.From([permission.transferTime]),
      ownershipTimes: UintRangeArray.From([permission.ownershipTime]),
      toList: permission.toList,
      fromList: permission.fromList,
      initiatedByList: permission.initiatedByList,
      approvalIdList: permission.approvalIdList,

      permanentlyPermittedTimes: permission.permanentlyPermittedTimes,
      permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes,

      arbitraryValue: permission.arbitraryValue
    };
  });

  if (doNotMerge) {
    return merged;
  }

  let unhandledLeft = true;

  while (unhandledLeft) {
    unhandledLeft = false;

    for (let i = 0; i < merged.length; i++) {
      for (let j = i + 1; j < merged.length; j++) {
        const first = merged[i];
        const second = merged[j];

        const tokenIdsAreSame = JSON.stringify(first.tokenIds) === JSON.stringify(second.tokenIds);
        const timelineTimesAreSame = JSON.stringify(first.timelineTimes) === JSON.stringify(second.timelineTimes);
        const transferTimesAreSame = JSON.stringify(first.transferTimes) === JSON.stringify(second.transferTimes);
        const ownershipTimesAreSame = JSON.stringify(first.ownershipTimes) === JSON.stringify(second.ownershipTimes);
        const toListsAreSame =
          first.toList.whitelist === second.toList.whitelist && JSON.stringify(first.toList.addresses) === JSON.stringify(second.toList.addresses);
        const fromListsAreSame =
          first.fromList.whitelist === second.fromList.whitelist &&
          JSON.stringify(first.fromList.addresses) === JSON.stringify(second.fromList.addresses);
        const initiatedByListsAreSame =
          first.initiatedByList.whitelist === second.initiatedByList.whitelist &&
          JSON.stringify(first.initiatedByList.addresses) === JSON.stringify(second.initiatedByList.addresses);
        const approvalIdListsAreSame =
          first.approvalIdList.whitelist === second.approvalIdList.whitelist &&
          JSON.stringify(first.approvalIdList.addresses) === JSON.stringify(second.approvalIdList.addresses);

        const permittedTimesAreSame = JSON.stringify(first.permanentlyPermittedTimes) === JSON.stringify(second.permanentlyPermittedTimes);
        const forbiddenTimesAreSame = JSON.stringify(first.permanentlyForbiddenTimes) === JSON.stringify(second.permanentlyForbiddenTimes);
        const arbitraryValuesAreSame = JSON.stringify(first.arbitraryValue) === JSON.stringify(second.arbitraryValue);

        if (tokenIdsAreSame) first.tokenIds.push(...second.tokenIds);
        if (timelineTimesAreSame) first.timelineTimes.push(...second.timelineTimes);
        if (transferTimesAreSame) first.transferTimes.push(...second.transferTimes);
        if (ownershipTimesAreSame) first.ownershipTimes.push(...second.ownershipTimes);

        first.tokenIds.sortAndMerge();
        first.timelineTimes.sortAndMerge();
        first.transferTimes.sortAndMerge();
        first.ownershipTimes.sortAndMerge();

        const newTokenIds = first.tokenIds;
        const newTimelineTimes = first.timelineTimes;
        const newTransferTimes = first.transferTimes;
        const newOwnershipTimes = first.ownershipTimes;

        let sameCount = 0;
        if (tokenIdsAreSame) sameCount++;
        if (timelineTimesAreSame) sameCount++;
        if (transferTimesAreSame) sameCount++;
        if (ownershipTimesAreSame) sameCount++;

        let addressSameCount = 0;
        if (toListsAreSame) addressSameCount++;
        if (fromListsAreSame) addressSameCount++;
        if (initiatedByListsAreSame) addressSameCount++;
        if (approvalIdListsAreSame) addressSameCount++;

        if (
          sameCount === 3 &&
          approvalIdListsAreSame &&
          toListsAreSame &&
          fromListsAreSame &&
          initiatedByListsAreSame &&
          permittedTimesAreSame &&
          forbiddenTimesAreSame &&
          arbitraryValuesAreSame
        ) {
          merged.push({
            tokenIds: newTokenIds,
            timelineTimes: newTimelineTimes,
            transferTimes: newTransferTimes,
            ownershipTimes: newOwnershipTimes,
            toList: first.toList,
            fromList: first.fromList,
            initiatedByList: first.initiatedByList,
            approvalIdList: first.approvalIdList,
            permanentlyPermittedTimes: first.permanentlyPermittedTimes,
            permanentlyForbiddenTimes: first.permanentlyForbiddenTimes,
            arbitraryValue: first.arbitraryValue
          });

          merged = merged.filter((_, idx) => idx !== i && idx !== j);

          unhandledLeft = true;
          i = Number.MAX_SAFE_INTEGER;
          j = Number.MAX_SAFE_INTEGER;
        } else if (sameCount === 4 && addressSameCount == 3 && permittedTimesAreSame && forbiddenTimesAreSame && arbitraryValuesAreSame) {
          //TODO: Merge address lists if whitelist is not the same
          merged.push({
            tokenIds: newTokenIds,
            timelineTimes: newTimelineTimes,
            transferTimes: newTransferTimes,
            ownershipTimes: newOwnershipTimes,
            toList:
              !toListsAreSame && first.toList.whitelist === second.toList.whitelist
                ? new AddressList({
                    ...first.toList,
                    addresses: [...new Set([...first.toList.addresses, ...second.toList.addresses])]
                  })
                : first.toList,
            fromList:
              !fromListsAreSame && first.fromList.whitelist === second.fromList.whitelist
                ? new AddressList({
                    ...first.fromList,
                    addresses: [...new Set([...first.fromList.addresses, ...second.fromList.addresses])]
                  })
                : first.fromList,
            initiatedByList:
              !initiatedByListsAreSame && first.initiatedByList.whitelist === second.initiatedByList.whitelist
                ? new AddressList({
                    ...first.initiatedByList,
                    addresses: [...new Set([...first.initiatedByList.addresses, ...second.initiatedByList.addresses])]
                  })
                : first.initiatedByList,
            approvalIdList:
              !approvalIdListsAreSame && first.approvalIdList.whitelist === second.approvalIdList.whitelist
                ? new AddressList({
                    ...first.approvalIdList,
                    addresses: [...new Set([...first.approvalIdList.addresses, ...second.approvalIdList.addresses])]
                  })
                : first.approvalIdList,
            permanentlyPermittedTimes: first.permanentlyPermittedTimes,
            permanentlyForbiddenTimes: first.permanentlyForbiddenTimes,
            arbitraryValue: first.arbitraryValue
          });

          merged = merged.filter((_, idx) => idx !== i && idx !== j);

          unhandledLeft = true;
          i = Number.MAX_SAFE_INTEGER;
          j = Number.MAX_SAFE_INTEGER;
        }
      }
    }
  }
  return merged;
}

function GetPermissionString(permission: UniversalPermissionDetails): string {
  let str = '(';
  if (permission.tokenId.start === BigInt('18446744073709551615') || permission.tokenId.end === BigInt('18446744073709551615')) {
    str += 'tokenId: ' + permission.tokenId.start.toString() + ' ';
  }

  if (permission.timelineTime.start === BigInt('18446744073709551615') || permission.timelineTime.end === BigInt('18446744073709551615')) {
    str += 'timelineTime: ' + permission.timelineTime.start.toString() + ' ';
  }

  if (permission.transferTime.start === BigInt('18446744073709551615') || permission.transferTime.end === BigInt('18446744073709551615')) {
    str += 'transferTime: ' + permission.transferTime.start.toString() + ' ';
  }

  if (permission.ownershipTime.start === BigInt('18446744073709551615') || permission.ownershipTime.end === BigInt('18446744073709551615')) {
    str += 'ownershipTime: ' + permission.ownershipTime.start.toString() + ' ';
  }

  if (permission.toList !== null) {
    str += 'toList: ';
    if (!permission.toList.whitelist) {
      str += permission.toList.addresses.length.toString() + ' addresses ';
    } else {
      str += 'all except ' + permission.toList.addresses.length.toString() + ' addresses ';
    }

    if (permission.toList.addresses.length > 0 && permission.toList.addresses.length <= 5) {
      str += '(';
      for (const address of permission.toList.addresses) {
        str += address + ' ';
      }
      str += ')';
    }
  }

  if (permission.fromList !== null) {
    str += 'fromList: ';
    if (!permission.fromList.whitelist) {
      str += permission.fromList.addresses.length.toString() + ' addresses ';
    } else {
      str += 'all except ' + permission.fromList.addresses.length.toString() + ' addresses ';
    }

    if (permission.fromList.addresses.length > 0 && permission.fromList.addresses.length <= 5) {
      str += '(';
      for (const address of permission.fromList.addresses) {
        str += address + ' ';
      }
      str += ')';
    }
  }

  if (permission.initiatedByList !== null) {
    str += 'initiatedByList: ';
    if (!permission.initiatedByList.whitelist) {
      str += permission.initiatedByList.addresses.length.toString() + ' addresses ';
    } else {
      str += 'all except ' + permission.initiatedByList.addresses.length.toString() + ' addresses ';
    }

    if (permission.initiatedByList.addresses.length > 0 && permission.initiatedByList.addresses.length <= 5) {
      str += '(';
      for (const address of permission.initiatedByList.addresses) {
        str += address + ' ';
      }
      str += ')';
    }
  }

  str += ') ';

  return str;
}

// IMPORTANT PRECONDITION: Must be first match only
export function ValidateUniversalPermissionUpdate(
  oldPermissions: UniversalPermissionDetails[],
  newPermissions: UniversalPermissionDetails[]
): Error | null {
  const [allOverlaps, inOldButNotNew] = getOverlapsAndNonOverlaps(oldPermissions, newPermissions);

  if (inOldButNotNew.length > 0) {
    let errMsg = 'permission ';
    errMsg += GetPermissionString(inOldButNotNew[0]);
    errMsg += 'found in old permissions but not in new permissions';
    if (inOldButNotNew.length > 1) {
      errMsg += ' (along with ' + (inOldButNotNew.length - 1) + ' more)';
    }

    return new Error(errMsg);
  }

  // For everywhere we detected an overlap, we need to check if the new permissions are valid
  // (i.e. they only explicitly define more permitted or forbidden times and do not remove any)
  for (const overlapObj of allOverlaps) {
    const oldPermission = overlapObj.firstDetails;
    const newPermission = overlapObj.secondDetails;

    const [leftoverPermittedTimes] = oldPermission.permanentlyPermittedTimes.getOverlapDetails(newPermission.permanentlyPermittedTimes);
    const [leftoverForbiddenTimes] = oldPermission.permanentlyForbiddenTimes.getOverlapDetails(newPermission.permanentlyForbiddenTimes);

    if (leftoverPermittedTimes.length > 0 || leftoverForbiddenTimes.length > 0) {
      let errMsg = 'permission ';
      errMsg += GetPermissionString(oldPermission);
      errMsg += 'found in both new and old permissions but ';
      if (leftoverPermittedTimes.length > 0) {
        errMsg += 'previously explicitly allowed the times ( ';
        for (const oldPermittedTime of leftoverPermittedTimes) {
          errMsg += oldPermittedTime.start.toString() + '-' + oldPermittedTime.end.toString() + ' ';
        }
        errMsg += ') which are now set to disApproved';
      }
      if (leftoverForbiddenTimes.length > 0 && leftoverPermittedTimes.length > 0) {
        errMsg += ' and';
      }
      if (leftoverForbiddenTimes.length > 0) {
        errMsg += ' previously explicitly disApproved the times ( ';
        for (const oldForbiddenTime of leftoverForbiddenTimes) {
          errMsg += oldForbiddenTime.start.toString() + '-' + oldForbiddenTime.end.toString() + ' ';
        }
        errMsg += ') which are now set to allowed.';
      }

      return new Error(errMsg);
    }
  }

  // Note we do not care about inNewButNotOld because it is fine to add new permissions that were not explicitly allowed/disApproved before

  return null;
}
