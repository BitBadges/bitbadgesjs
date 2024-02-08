//TODO: This file should probably be refactored a lot, but it currently works.
//			It is also not user-facing or dev-facing, so I am okay with how it is now

import { AddressList, UintRange } from "bitbadgesjs-proto";
import { getReservedAddressList, getReservedTrackerList, isAddressListEmpty, removeAddressListFromAddressList } from "./addressLists";
import { deepCopy } from "./types/utils";
import { removeUintRangeFromUintRange, removeUintRangesFromUintRanges, sortUintRangesAndMergeIfNecessary } from "./uintRanges";

//For permissions, we have many types of permissions that are all very similar to each other
//Here, we abstract all those permissions to a UniversalPermission struct in order to reuse code.
//When casting to a UniversalPermission, we use fake dummy values for the unused values to avoid messing up the logic
//
//This file implements certain logic using UniversalPermissions such as overlaps and getting first match only
//This is used in many places around the codebase

//TODO: This file was created with AI from the Go equivalent in github.com/bitbadges/bitbadgeschain. It should be cleaned up to be more idiomatic TypeScript.


export interface UniversalPermission {
  badgeIds: UintRange<bigint>[];
  timelineTimes: UintRange<bigint>[];
  transferTimes: UintRange<bigint>[];
  ownershipTimes: UintRange<bigint>[];
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  approvalIdList: AddressList;
  amountTrackerIdList: AddressList;
  challengeTrackerIdList: AddressList;

  permanentlyPermittedTimes: UintRange<bigint>[];
  permanentlyForbiddenTimes: UintRange<bigint>[];

  usesBadgeIds: boolean;
  usesTimelineTimes: boolean;
  usesTransferTimes: boolean;
  usesToList: boolean;
  usesFromList: boolean;
  usesInitiatedByList: boolean;
  usesOwnershipTimes: boolean;
  usesApprovalIdList: boolean;
  usesAmountTrackerIdList: boolean;
  usesChallengeTrackerIdList: boolean;

  arbitraryValue: any;
}


export interface UniversalPermissionDetails {
  badgeId: UintRange<bigint>;
  timelineTime: UintRange<bigint>;
  transferTime: UintRange<bigint>;
  ownershipTime: UintRange<bigint>;
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  approvalIdList: AddressList;
  amountTrackerIdList: AddressList;
  challengeTrackerIdList: AddressList;

  permanentlyPermittedTimes: UintRange<bigint>[];
  permanentlyForbiddenTimes: UintRange<bigint>[];

  arbitraryValue: any;
}

export interface Overlap {
  overlap: UniversalPermissionDetails;
  firstDetails: UniversalPermissionDetails;
  secondDetails: UniversalPermissionDetails;
}

export function getOverlapsAndNonOverlaps(firstDetails: UniversalPermissionDetails[], secondDetails: UniversalPermissionDetails[]): [Overlap[], UniversalPermissionDetails[], UniversalPermissionDetails[]] {
  // Deep copy
  let inOldButNotNew = deepCopy(firstDetails);
  let inNewButNotOld = deepCopy(secondDetails);

  let allOverlaps: Overlap[] = [];

  for (let oldPermission of firstDetails) {
    for (let newPermission of secondDetails) {
      let [_, overlaps] = universalRemoveOverlaps(newPermission, oldPermission);
      for (let overlap of overlaps) {
        allOverlaps.push({
          overlap,
          firstDetails: oldPermission,
          secondDetails: newPermission
        });

        [inOldButNotNew, _] = universalRemoveOverlapFromValues(overlap, inOldButNotNew);
        [inNewButNotOld, _] = universalRemoveOverlapFromValues(overlap, inNewButNotOld);
      }
    }
  }

  return [allOverlaps, inOldButNotNew, inNewButNotOld];
}

export function universalRemoveOverlapFromValues(handled: UniversalPermissionDetails, valuesToCheck: UniversalPermissionDetails[]): [UniversalPermissionDetails[], UniversalPermissionDetails[]] {
  let newValuesToCheck = [];
  let removed = [];
  for (let valueToCheck of valuesToCheck) {
    let [remaining, overlaps] = universalRemoveOverlaps(handled, valueToCheck);
    newValuesToCheck.push(...remaining);
    removed.push(...overlaps);
  }

  return [newValuesToCheck, removed];
}


export function universalRemoveOverlaps(handled: UniversalPermissionDetails, valueToCheck: UniversalPermissionDetails): [UniversalPermissionDetails[], UniversalPermissionDetails[]] {
  let [timelineTimesAfterRemoval, removedTimelineTimes] = removeUintRangeFromUintRange(handled.timelineTime, valueToCheck.timelineTime);
  let [badgesAfterRemoval, removedBadges] = removeUintRangeFromUintRange(handled.badgeId, valueToCheck.badgeId);
  let [transferTimesAfterRemoval, removedTransferTimes] = removeUintRangeFromUintRange(handled.transferTime, valueToCheck.transferTime);
  let [ownershipTimesAfterRemoval, removedOwnershipTimes] = removeUintRangeFromUintRange(handled.ownershipTime, valueToCheck.ownershipTime);
  let [toListAfterRemoval, removedToList] = removeAddressListFromAddressList(handled.toList, valueToCheck.toList);
  let [fromListAfterRemoval, removedFromList] = removeAddressListFromAddressList(handled.fromList, valueToCheck.fromList);
  let [initiatedByListAfterRemoval, removedInitiatedByList] = removeAddressListFromAddressList(handled.initiatedByList, valueToCheck.initiatedByList);
  let [approvalIdListAfterRemoval, removedApprovalIdList] = removeAddressListFromAddressList(handled.approvalIdList, valueToCheck.approvalIdList);
  let [amountTrackerIdListAfterRemoval, removedAmountTrackerIdList] = removeAddressListFromAddressList(handled.amountTrackerIdList, valueToCheck.amountTrackerIdList);
  let [challengeTrackerIdListAfterRemoval, removedChallengeTrackerIdList] = removeAddressListFromAddressList(handled.challengeTrackerIdList, valueToCheck.challengeTrackerIdList);

  let removedToListIsEmpty = isAddressListEmpty(removedToList);
  let removedFromListIsEmpty = isAddressListEmpty(removedFromList);
  let removedInitiatedByListIsEmpty = isAddressListEmpty(removedInitiatedByList);
  let removedApprovalIdListIsEmpty = isAddressListEmpty(removedApprovalIdList);
  let removedAmountTrackerIdListIsEmpty = isAddressListEmpty(removedAmountTrackerIdList);
  let removedChallengeTrackerIdListIsEmpty = isAddressListEmpty(removedChallengeTrackerIdList);

  const remaining: UniversalPermissionDetails[] = [];
  //If we didn't remove anything at all
  if (removedTimelineTimes.length === 0 || removedBadges.length === 0 || removedTransferTimes.length === 0 || removedOwnershipTimes.length === 0 || removedToListIsEmpty || removedFromListIsEmpty || removedInitiatedByListIsEmpty || removedApprovalIdListIsEmpty || removedAmountTrackerIdListIsEmpty || removedChallengeTrackerIdListIsEmpty) {
    remaining.push(valueToCheck);
    return [remaining, []];
  }

  for (let timelineTimeAfterRemoval of timelineTimesAfterRemoval) {
    remaining.push({
      timelineTime: timelineTimeAfterRemoval,
      badgeId: valueToCheck.badgeId,
      transferTime: valueToCheck.transferTime,
      ownershipTime: valueToCheck.ownershipTime,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      approvalIdList: valueToCheck.approvalIdList,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      arbitraryValue: valueToCheck.arbitraryValue,

      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    });
  }

  for (let badgeAfterRemoval of badgesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: badgeAfterRemoval,
      transferTime: valueToCheck.transferTime,
      ownershipTime: valueToCheck.ownershipTime,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      arbitraryValue: valueToCheck.arbitraryValue,
      approvalIdList: valueToCheck.approvalIdList,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    });
  }

  for (let transferTimeAfterRemoval of transferTimesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: transferTimeAfterRemoval,
      ownershipTime: valueToCheck.ownershipTime,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      arbitraryValue: valueToCheck.arbitraryValue,
      approvalIdList: valueToCheck.approvalIdList,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    });
  }

  for (let ownershipTimeAfterRemoval of ownershipTimesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: ownershipTimeAfterRemoval,
      toList: valueToCheck.toList,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      arbitraryValue: valueToCheck.arbitraryValue,
      approvalIdList: valueToCheck.approvalIdList,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    });
  }

  if (!isAddressListEmpty(toListAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: toListAfterRemoval,
      fromList: valueToCheck.fromList,
      initiatedByList: valueToCheck.initiatedByList,
      approvalIdList: valueToCheck.approvalIdList,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    })
  }
  if (!isAddressListEmpty(fromListAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: fromListAfterRemoval,
      initiatedByList: valueToCheck.initiatedByList,
      approvalIdList: valueToCheck.approvalIdList,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    })
  }

  if (!isAddressListEmpty(initiatedByListAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: removedFromList,
      initiatedByList: initiatedByListAfterRemoval,
      approvalIdList: valueToCheck.approvalIdList,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    })
  }

  if (!isAddressListEmpty(approvalIdListAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: removedFromList,
      initiatedByList: removedInitiatedByList,
      approvalIdList: approvalIdListAfterRemoval,
      amountTrackerIdList: valueToCheck.amountTrackerIdList,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    })
  }

  if (!isAddressListEmpty(amountTrackerIdListAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: removedFromList,
      initiatedByList: removedInitiatedByList,
      approvalIdList: removedApprovalIdList,
      amountTrackerIdList: amountTrackerIdListAfterRemoval,
      challengeTrackerIdList: valueToCheck.challengeTrackerIdList,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    })
  }

  if (!isAddressListEmpty(challengeTrackerIdListAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toList: removedToList,
      fromList: removedFromList,
      initiatedByList: removedInitiatedByList,
      approvalIdList: removedApprovalIdList,
      amountTrackerIdList: removedAmountTrackerIdList,
      challengeTrackerIdList: challengeTrackerIdListAfterRemoval,

      arbitraryValue: valueToCheck.arbitraryValue,
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
    })
  }

  const removed: UniversalPermissionDetails[] = [];
  for (let removedTimelineTime of removedTimelineTimes) {
    for (let removedBadge of removedBadges) {
      for (let removedTransferTime of removedTransferTimes) {
        for (let removedOwnershipTime of removedOwnershipTimes) {
          removed.push({
            timelineTime: removedTimelineTime,
            badgeId: removedBadge,
            transferTime: removedTransferTime,
            ownershipTime: removedOwnershipTime,
            toList: removedToList,
            fromList: removedFromList,
            initiatedByList: removedInitiatedByList,
            approvalIdList: removedApprovalIdList,
            amountTrackerIdList: removedAmountTrackerIdList,
            challengeTrackerIdList: removedChallengeTrackerIdList,

            arbitraryValue: valueToCheck.arbitraryValue,

            permanentlyPermittedTimes: [],
            permanentlyForbiddenTimes: [],
          });
        }
      }
    }
  }

  return [remaining, removed]
}

export function GetUintRangesWithOptions(_ranges: UintRange<bigint>[], uses: boolean): UintRange<bigint>[] {
  let ranges = deepCopy(_ranges);

  if (!uses) {
    ranges = [{ start: BigInt(1), end: BigInt(1) }]; // dummy range
    return ranges;
  }

  return ranges;
}

export function GetListIdWithOptions(listId: string, uses?: boolean): string {
  if (!uses) {
    listId = "All";
  }

  return listId;
}

export function GetListWithOptions(_list: AddressList, uses: boolean): AddressList {
  const list = deepCopy(_list);


  if (!uses) {
    list.addresses = []
    list.whitelist = false;
  }

  return list;
}

//TODO: This is a mess and is not needed but requires some refactoring.

export interface UsedFlags {
  usesBadgeIds: boolean;
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
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: false,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false,
}

export const TimedUpdatePermissionUsedFlags: UsedFlags = {
  usesBadgeIds: false,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: false,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false,
}

export const TimedUpdateWithBadgeIdsPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: false,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false,
}


export const BalancesActionPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToList: false,
  usesFromList: false,
  usesInitiatedByList: false,
  usesOwnershipTimes: true,
  usesApprovalIdList: false,
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false,
}


export const ApprovalPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: true,
  usesToList: true,
  usesFromList: true,
  usesInitiatedByList: true,
  usesOwnershipTimes: true,
  usesApprovalIdList: true,
  usesAmountTrackerIdList: true,
  usesChallengeTrackerIdList: true,
}


export function GetFirstMatchOnly(
  permissions: UniversalPermission[],
  handleAllPossibleCombinations?: boolean,
  usesFlags?: UsedFlags, //TODO: get a better system for this
): UniversalPermissionDetails[] {
  const handled: UniversalPermissionDetails[] = [];

  if (handleAllPossibleCombinations && !usesFlags) throw new Error("handleAllPossibleCombinations is true but usesFlags is null");

  if (handleAllPossibleCombinations && usesFlags) {
    //Littel hack but we append a permission with empty permitted, forbidden times but ALL criteria to the end of the array.
    //This is to ensure we always handle all values when we call GetFirstMatchOnly.
    permissions.push({
      timelineTimes: [{ start: 1n, end: 18446744073709551615n }],
      fromList: getReservedAddressList("All") as AddressList,
      toList: getReservedAddressList("All") as AddressList,
      initiatedByList: getReservedAddressList("All") as AddressList,
      approvalIdList: getReservedTrackerList("All") as AddressList,
      amountTrackerIdList: getReservedTrackerList("All") as AddressList,
      challengeTrackerIdList: getReservedTrackerList("All") as AddressList,
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],

      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],

      ...usesFlags,

      arbitraryValue: {},
    })
  }


  for (const permission of permissions) {
    const badgeIds = GetUintRangesWithOptions(permission.badgeIds, permission.usesBadgeIds);
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
    const amountTrackerIdList = GetListWithOptions(permission.amountTrackerIdList, permission.usesAmountTrackerIdList);
    const challengeTrackerIdList = GetListWithOptions(permission.challengeTrackerIdList, permission.usesChallengeTrackerIdList);


    for (const badgeId of badgeIds) {
      for (const timelineTime of timelineTimes) {
        for (const transferTime of transferTimes) {
          for (const ownershipTime of ownershipTimes) {
            const brokenDown: UniversalPermissionDetails[] = [{
              badgeId: badgeId,
              timelineTime: timelineTime,
              transferTime: transferTime,
              ownershipTime: ownershipTime,
              toList: toList,
              fromList: fromList,
              initiatedByList: initiatedByList,
              approvalIdList: approvalIdList,
              amountTrackerIdList: amountTrackerIdList,
              challengeTrackerIdList: challengeTrackerIdList,

              permanentlyPermittedTimes: permanentlyPermittedTimes,
              permanentlyForbiddenTimes: permanentlyForbiddenTimes,

              arbitraryValue,
            }];

            const [, remainingAfterHandledIsRemoved] = getOverlapsAndNonOverlaps(brokenDown, handled);
            for (const remaining of remainingAfterHandledIsRemoved) {
              handled.push({
                timelineTime: remaining.timelineTime,
                badgeId: remaining.badgeId,
                transferTime: remaining.transferTime,
                ownershipTime: remaining.ownershipTime,
                toList: remaining.toList,
                fromList: remaining.fromList,
                initiatedByList: remaining.initiatedByList,
                approvalIdList: remaining.approvalIdList,
                amountTrackerIdList: remaining.amountTrackerIdList,
                challengeTrackerIdList: remaining.challengeTrackerIdList,
                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,
                arbitraryValue: arbitraryValue,
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
  badgeIds: UintRange<bigint>[];
  timelineTimes: UintRange<bigint>[];
  transferTimes: UintRange<bigint>[];
  ownershipTimes: UintRange<bigint>[];
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  approvalIdList: AddressList;
  amountTrackerIdList: AddressList;
  challengeTrackerIdList: AddressList;

  permanentlyPermittedTimes: UintRange<bigint>[];
  permanentlyForbiddenTimes: UintRange<bigint>[];

  arbitraryValue: any;
}

export function MergeUniversalPermissionDetails(permissions: UniversalPermissionDetails[], doNotMerge?: boolean): MergedUniversalPermissionDetails[] {
  //We can merge two values if N - 1 fields are the same (note currently we only merge uint ranges)
  let merged: MergedUniversalPermissionDetails[] = permissions.map((permission) => {
    return {
      badgeIds: [permission.badgeId],
      timelineTimes: [permission.timelineTime],
      transferTimes: [permission.transferTime],
      ownershipTimes: [permission.ownershipTime],
      toList: permission.toList,
      fromList: permission.fromList,
      initiatedByList: permission.initiatedByList,
      approvalIdList: permission.approvalIdList,
      amountTrackerIdList: permission.amountTrackerIdList,
      challengeTrackerIdList: permission.challengeTrackerIdList,

      permanentlyPermittedTimes: permission.permanentlyPermittedTimes,
      permanentlyForbiddenTimes: permission.permanentlyForbiddenTimes,

      arbitraryValue: permission.arbitraryValue,
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

        const badgeIdsAreSame = JSON.stringify(first.badgeIds) === JSON.stringify(second.badgeIds);
        const timelineTimesAreSame = JSON.stringify(first.timelineTimes) === JSON.stringify(second.timelineTimes);
        const transferTimesAreSame = JSON.stringify(first.transferTimes) === JSON.stringify(second.transferTimes);
        const ownershipTimesAreSame = JSON.stringify(first.ownershipTimes) === JSON.stringify(second.ownershipTimes);
        const toListsAreSame = first.toList.whitelist === second.toList.whitelist && JSON.stringify(first.toList.addresses) === JSON.stringify(second.toList.addresses);
        const fromListsAreSame = first.fromList.whitelist === second.fromList.whitelist && JSON.stringify(first.fromList.addresses) === JSON.stringify(second.fromList.addresses);
        const initiatedByListsAreSame = first.initiatedByList.whitelist === second.initiatedByList.whitelist && JSON.stringify(first.initiatedByList.addresses) === JSON.stringify(second.initiatedByList.addresses);
        const approvalIdListsAreSame = first.approvalIdList.whitelist === second.approvalIdList.whitelist && JSON.stringify(first.approvalIdList.addresses) === JSON.stringify(second.approvalIdList.addresses);
        const amountTrackerIdListsAreSame = first.amountTrackerIdList.whitelist === second.amountTrackerIdList.whitelist && JSON.stringify(first.amountTrackerIdList.addresses) === JSON.stringify(second.amountTrackerIdList.addresses);
        const challengeTrackerIdListsAreSame = first.challengeTrackerIdList.whitelist === second.challengeTrackerIdList.whitelist && JSON.stringify(first.challengeTrackerIdList.addresses) === JSON.stringify(second.challengeTrackerIdList.addresses);

        const permittedTimesAreSame = JSON.stringify(first.permanentlyPermittedTimes) === JSON.stringify(second.permanentlyPermittedTimes);
        const forbiddenTimesAreSame = JSON.stringify(first.permanentlyForbiddenTimes) === JSON.stringify(second.permanentlyForbiddenTimes);
        const arbitraryValuesAreSame = JSON.stringify(first.arbitraryValue) === JSON.stringify(second.arbitraryValue);

        const newBadgeIds = badgeIdsAreSame ? first.badgeIds : sortUintRangesAndMergeIfNecessary(deepCopy([...first.badgeIds, ...second.badgeIds]), true);
        const newTimelineTimes = timelineTimesAreSame ? first.timelineTimes : sortUintRangesAndMergeIfNecessary(deepCopy([...first.timelineTimes, ...second.timelineTimes]), true);
        const newTransferTimes = transferTimesAreSame ? first.transferTimes : sortUintRangesAndMergeIfNecessary(deepCopy([...first.transferTimes, ...second.transferTimes]), true);
        const newOwnershipTimes = ownershipTimesAreSame ? first.ownershipTimes : sortUintRangesAndMergeIfNecessary(deepCopy([...first.ownershipTimes, ...second.ownershipTimes]), true);

        let sameCount = 0;
        if (badgeIdsAreSame) sameCount++;
        if (timelineTimesAreSame) sameCount++;
        if (transferTimesAreSame) sameCount++;
        if (ownershipTimesAreSame) sameCount++;

        let addressSameCount = 0;
        if (toListsAreSame) addressSameCount++;
        if (fromListsAreSame) addressSameCount++;
        if (initiatedByListsAreSame) addressSameCount++;
        if (approvalIdListsAreSame) addressSameCount++;
        if (amountTrackerIdListsAreSame) addressSameCount++;
        if (challengeTrackerIdListsAreSame) addressSameCount++;


        if (sameCount === 3 &&
          approvalIdListsAreSame && amountTrackerIdListsAreSame && challengeTrackerIdListsAreSame &&
          toListsAreSame && fromListsAreSame && initiatedByListsAreSame && permittedTimesAreSame && forbiddenTimesAreSame && arbitraryValuesAreSame) {
          merged.push({
            badgeIds: newBadgeIds,
            timelineTimes: newTimelineTimes,
            transferTimes: newTransferTimes,
            ownershipTimes: newOwnershipTimes,
            toList: first.toList,
            fromList: first.fromList,
            initiatedByList: first.initiatedByList,
            approvalIdList: first.approvalIdList,
            amountTrackerIdList: first.amountTrackerIdList,
            challengeTrackerIdList: first.challengeTrackerIdList,
            permanentlyPermittedTimes: first.permanentlyPermittedTimes,
            permanentlyForbiddenTimes: first.permanentlyForbiddenTimes,
            arbitraryValue: first.arbitraryValue,
          });

          merged = merged.filter((_, idx) => idx !== i && idx !== j);

          unhandledLeft = true;
          i = Number.MAX_SAFE_INTEGER;
          j = Number.MAX_SAFE_INTEGER;
        } else if (sameCount === 4 && addressSameCount == 5 && permittedTimesAreSame && forbiddenTimesAreSame && arbitraryValuesAreSame) {
          //TODO: Merge address lists if whitelist is not the same
          merged.push({
            badgeIds: newBadgeIds,
            timelineTimes: newTimelineTimes,
            transferTimes: newTransferTimes,
            ownershipTimes: newOwnershipTimes,
            toList: !toListsAreSame && first.toList.whitelist === second.toList.whitelist ? {
              ...first.toList,
              addresses: [...new Set([...first.toList.addresses, ...second.toList.addresses])]
            } : first.toList,
            fromList: !fromListsAreSame && first.fromList.whitelist === second.fromList.whitelist ? {
              ...first.fromList,
              addresses: [...new Set([...first.fromList.addresses, ...second.fromList.addresses])]
            } : first.fromList,
            initiatedByList: !initiatedByListsAreSame && first.initiatedByList.whitelist === second.initiatedByList.whitelist ? {
              ...first.initiatedByList,
              addresses: [...new Set([...first.initiatedByList.addresses, ...second.initiatedByList.addresses])]
            } : first.initiatedByList,
            approvalIdList: !approvalIdListsAreSame && first.approvalIdList.whitelist === second.approvalIdList.whitelist ? {
              ...first.approvalIdList,
              addresses: [...new Set([...first.approvalIdList.addresses, ...second.approvalIdList.addresses])]
            } : first.approvalIdList,
            amountTrackerIdList: !amountTrackerIdListsAreSame && first.amountTrackerIdList.whitelist === second.amountTrackerIdList.whitelist ? {
              ...first.amountTrackerIdList,
              addresses: [...new Set([...first.amountTrackerIdList.addresses, ...second.amountTrackerIdList.addresses])]
            } : first.amountTrackerIdList,
            challengeTrackerIdList: !challengeTrackerIdListsAreSame && first.challengeTrackerIdList.whitelist === second.challengeTrackerIdList.whitelist ? {
              ...first.challengeTrackerIdList,
              addresses: [...new Set([...first.challengeTrackerIdList.addresses, ...second.challengeTrackerIdList.addresses])]
            } : first.challengeTrackerIdList,
            permanentlyPermittedTimes: first.permanentlyPermittedTimes,
            permanentlyForbiddenTimes: first.permanentlyForbiddenTimes,
            arbitraryValue: first.arbitraryValue,
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
  let str = "(";
  if (permission.badgeId.start === BigInt("18446744073709551615") || permission.badgeId.end === BigInt("18446744073709551615")) {
    str += "badgeId: " + permission.badgeId.start.toString() + " ";
  }

  if (permission.timelineTime.start === BigInt("18446744073709551615") || permission.timelineTime.end === BigInt("18446744073709551615")) {
    str += "timelineTime: " + permission.timelineTime.start.toString() + " ";
  }

  if (permission.transferTime.start === BigInt("18446744073709551615") || permission.transferTime.end === BigInt("18446744073709551615")) {
    str += "transferTime: " + permission.transferTime.start.toString() + " ";
  }

  if (permission.ownershipTime.start === BigInt("18446744073709551615") || permission.ownershipTime.end === BigInt("18446744073709551615")) {
    str += "ownershipTime: " + permission.ownershipTime.start.toString() + " ";
  }

  if (permission.toList !== null) {
    str += "toList: ";
    if (!permission.toList.whitelist) {
      str += permission.toList.addresses.length.toString() + " addresses ";
    } else {
      str += "all except " + permission.toList.addresses.length.toString() + " addresses ";
    }

    if (permission.toList.addresses.length > 0 && permission.toList.addresses.length <= 5) {
      str += "(";
      for (const address of permission.toList.addresses) {
        str += address + " ";
      }
      str += ")";
    }
  }

  if (permission.fromList !== null) {
    str += "fromList: ";
    if (!permission.fromList.whitelist) {
      str += permission.fromList.addresses.length.toString() + " addresses ";
    } else {
      str += "all except " + permission.fromList.addresses.length.toString() + " addresses ";
    }

    if (permission.fromList.addresses.length > 0 && permission.fromList.addresses.length <= 5) {
      str += "(";
      for (const address of permission.fromList.addresses) {
        str += address + " ";
      }
      str += ")";
    }
  }

  if (permission.initiatedByList !== null) {
    str += "initiatedByList: ";
    if (!permission.initiatedByList.whitelist) {
      str += permission.initiatedByList.addresses.length.toString() + " addresses ";
    } else {
      str += "all except " + permission.initiatedByList.addresses.length.toString() + " addresses ";
    }

    if (permission.initiatedByList.addresses.length > 0 && permission.initiatedByList.addresses.length <= 5) {
      str += "(";
      for (const address of permission.initiatedByList.addresses) {
        str += address + " ";
      }
      str += ")";
    }
  }

  str += ") ";

  return str;
}

// IMPORTANT PRECONDITION: Must be first match only
export function ValidateUniversalPermissionUpdate(oldPermissions: UniversalPermissionDetails[], newPermissions: UniversalPermissionDetails[]): Error | null {
  const [allOverlaps, inOldButNotNew, _] = getOverlapsAndNonOverlaps(oldPermissions, newPermissions);

  if (inOldButNotNew.length > 0) {
    let errMsg = "permission ";
    errMsg += GetPermissionString(inOldButNotNew[0]);
    errMsg += "found in old permissions but not in new permissions";
    if (inOldButNotNew.length > 1) {
      errMsg += " (along with " + (inOldButNotNew.length - 1) + " more)";
    }

    return new Error(errMsg);
  }

  // For everywhere we detected an overlap, we need to check if the new permissions are valid
  // (i.e. they only explicitly define more permitted or forbidden times and do not remove any)
  for (const overlapObj of allOverlaps) {
    const oldPermission = overlapObj.firstDetails;
    const newPermission = overlapObj.secondDetails;

    const [leftoverPermittedTimes, _x] = removeUintRangesFromUintRanges(newPermission.permanentlyPermittedTimes, oldPermission.permanentlyPermittedTimes);
    const [leftoverForbiddenTimes, _y] = removeUintRangesFromUintRanges(newPermission.permanentlyForbiddenTimes, oldPermission.permanentlyForbiddenTimes);

    if (leftoverPermittedTimes.length > 0 || leftoverForbiddenTimes.length > 0) {
      let errMsg = "permission ";
      errMsg += GetPermissionString(oldPermission);
      errMsg += "found in both new and old permissions but ";
      if (leftoverPermittedTimes.length > 0) {
        errMsg += "previously explicitly allowed the times ( ";
        for (const oldPermittedTime of leftoverPermittedTimes) {
          errMsg += oldPermittedTime.start.toString() + "-" + oldPermittedTime.end.toString() + " ";
        }
        errMsg += ") which are now set to disApproved";
      }
      if (leftoverForbiddenTimes.length > 0 && leftoverPermittedTimes.length > 0) {
        errMsg += " and";
      }
      if (leftoverForbiddenTimes.length > 0) {
        errMsg += " previously explicitly disApproved the times ( ";
        for (const oldForbiddenTime of leftoverForbiddenTimes) {
          errMsg += oldForbiddenTime.start.toString() + "-" + oldForbiddenTime.end.toString() + " ";
        }
        errMsg += ") which are now set to allowed.";
      }

      return new Error(errMsg);
    }
  }

  // Note we do not care about inNewButNotOld because it is fine to add new permissions that were not explicitly allowed/disApproved before

  return null;
}
