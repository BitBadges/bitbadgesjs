//TODO: This file should probably be refactored a lot, but it currently works.
//			It is also not user-facing or dev-facing, so I am okay with how it is now

import { AddressMapping, UintRange } from "bitbadgesjs-proto";
import { getReservedAddressMapping, isAddressMappingEmpty, removeAddressMappingFromAddressMapping } from "./addressMappings";
import { deepCopy } from "./types/utils";
import { removeUintRangeFromUintRange, removeUintsFromUintRange, sortUintRangesAndMergeIfNecessary } from "./uintRanges";

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
  toMapping: AddressMapping;
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;

  amountTrackerIdMapping: AddressMapping;
  challengeTrackerIdMapping: AddressMapping;

  permittedTimes: UintRange<bigint>[];
  forbiddenTimes: UintRange<bigint>[];

  usesBadgeIds: boolean;
  usesTimelineTimes: boolean;
  usesTransferTimes: boolean;
  usesToMapping: boolean;
  usesFromMapping: boolean;
  usesInitiatedByMapping: boolean;
  usesOwnershipTimes: boolean;
  usesAmountTrackerIdMapping: boolean;
  usesChallengeTrackerIdMapping: boolean;

  arbitraryValue: any;
}


export interface UniversalPermissionDetails {
  badgeId: UintRange<bigint>;
  timelineTime: UintRange<bigint>;
  transferTime: UintRange<bigint>;
  ownershipTime: UintRange<bigint>;
  toMapping: AddressMapping;
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;

  amountTrackerIdMapping: AddressMapping;
  challengeTrackerIdMapping: AddressMapping;

  permittedTimes: UintRange<bigint>[];
  forbiddenTimes: UintRange<bigint>[];

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
  let [timelineTimesAfterRemoval, removedTimelineTimes] = removeUintsFromUintRange(handled.timelineTime, valueToCheck.timelineTime);
  let [badgesAfterRemoval, removedBadges] = removeUintsFromUintRange(handled.badgeId, valueToCheck.badgeId);
  let [transferTimesAfterRemoval, removedTransferTimes] = removeUintsFromUintRange(handled.transferTime, valueToCheck.transferTime);
  let [ownershipTimesAfterRemoval, removedOwnershipTimes] = removeUintsFromUintRange(handled.ownershipTime, valueToCheck.ownershipTime);
  let [toMappingAfterRemoval, removedToMapping] = removeAddressMappingFromAddressMapping(handled.toMapping, valueToCheck.toMapping);
  let [fromMappingAfterRemoval, removedFromMapping] = removeAddressMappingFromAddressMapping(handled.fromMapping, valueToCheck.fromMapping);
  let [initiatedByMappingAfterRemoval, removedInitiatedByMapping] = removeAddressMappingFromAddressMapping(handled.initiatedByMapping, valueToCheck.initiatedByMapping);
  let [amountTrackerIdMappingAfterRemoval, removedAmountTrackerIdMapping] = removeAddressMappingFromAddressMapping(handled.amountTrackerIdMapping, valueToCheck.amountTrackerIdMapping);
  let [challengeTrackerIdMappingAfterRemoval, removedChallengeTrackerIdMapping] = removeAddressMappingFromAddressMapping(handled.challengeTrackerIdMapping, valueToCheck.challengeTrackerIdMapping);


  let removedToMappingIsEmpty = isAddressMappingEmpty(removedToMapping);
  let removedFromMappingIsEmpty = isAddressMappingEmpty(removedFromMapping);
  let removedInitiatedByMappingIsEmpty = isAddressMappingEmpty(removedInitiatedByMapping);
  let removedAmountTrackerIdMappingIsEmpty = isAddressMappingEmpty(removedAmountTrackerIdMapping);
  let removedChallengeTrackerIdMappingIsEmpty = isAddressMappingEmpty(removedChallengeTrackerIdMapping);

  const remaining: UniversalPermissionDetails[] = [];
  //If we didn't remove anything at all
  if (removedTimelineTimes.length === 0 || removedBadges.length === 0 || removedTransferTimes.length === 0 || removedOwnershipTimes.length === 0 || removedToMappingIsEmpty || removedFromMappingIsEmpty || removedInitiatedByMappingIsEmpty || removedAmountTrackerIdMappingIsEmpty || removedChallengeTrackerIdMappingIsEmpty) {
    remaining.push(valueToCheck);
    return [remaining, []];
  }

  for (let timelineTimeAfterRemoval of timelineTimesAfterRemoval) {
    remaining.push({
      timelineTime: timelineTimeAfterRemoval,
      badgeId: valueToCheck.badgeId,
      transferTime: valueToCheck.transferTime,
      ownershipTime: valueToCheck.ownershipTime,
      toMapping: valueToCheck.toMapping,
      fromMapping: valueToCheck.fromMapping,
      initiatedByMapping: valueToCheck.initiatedByMapping,
      amountTrackerIdMapping: valueToCheck.amountTrackerIdMapping,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,


      arbitraryValue: valueToCheck.arbitraryValue,

      permittedTimes: [],
      forbiddenTimes: [],
    });
  }

  for (let badgeAfterRemoval of badgesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: badgeAfterRemoval,
      transferTime: valueToCheck.transferTime,
      ownershipTime: valueToCheck.ownershipTime,
      toMapping: valueToCheck.toMapping,
      fromMapping: valueToCheck.fromMapping,
      initiatedByMapping: valueToCheck.initiatedByMapping,
      arbitraryValue: valueToCheck.arbitraryValue,
      amountTrackerIdMapping: valueToCheck.amountTrackerIdMapping,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,

      permittedTimes: [],
      forbiddenTimes: [],
    });
  }

  for (let transferTimeAfterRemoval of transferTimesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: transferTimeAfterRemoval,
      ownershipTime: valueToCheck.ownershipTime,
      toMapping: valueToCheck.toMapping,
      fromMapping: valueToCheck.fromMapping,
      initiatedByMapping: valueToCheck.initiatedByMapping,
      arbitraryValue: valueToCheck.arbitraryValue,
      amountTrackerIdMapping: valueToCheck.amountTrackerIdMapping,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,

      permittedTimes: [],
      forbiddenTimes: [],
    });
  }

  for (let ownershipTimeAfterRemoval of ownershipTimesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: ownershipTimeAfterRemoval,
      toMapping: valueToCheck.toMapping,
      fromMapping: valueToCheck.fromMapping,
      initiatedByMapping: valueToCheck.initiatedByMapping,
      arbitraryValue: valueToCheck.arbitraryValue,
      amountTrackerIdMapping: valueToCheck.amountTrackerIdMapping,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,

      permittedTimes: [],
      forbiddenTimes: [],
    });
  }

  if (!isAddressMappingEmpty(toMappingAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toMapping: toMappingAfterRemoval,
      fromMapping: valueToCheck.fromMapping,
      initiatedByMapping: valueToCheck.initiatedByMapping,
      amountTrackerIdMapping: valueToCheck.amountTrackerIdMapping,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,

      arbitraryValue: valueToCheck.arbitraryValue,
      permittedTimes: [],
      forbiddenTimes: [],
    })
  }
  if (!isAddressMappingEmpty(fromMappingAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toMapping: removedToMapping,
      fromMapping: fromMappingAfterRemoval,
      initiatedByMapping: valueToCheck.initiatedByMapping,
      amountTrackerIdMapping: valueToCheck.amountTrackerIdMapping,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,

      arbitraryValue: valueToCheck.arbitraryValue,
      permittedTimes: [],
      forbiddenTimes: [],
    })
  }

  if (!isAddressMappingEmpty(initiatedByMappingAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toMapping: removedToMapping,
      fromMapping: removedFromMapping,
      initiatedByMapping: initiatedByMappingAfterRemoval,
      amountTrackerIdMapping: valueToCheck.amountTrackerIdMapping,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,

      arbitraryValue: valueToCheck.arbitraryValue,
      permittedTimes: [],
      forbiddenTimes: [],
    })
  }

  if (!isAddressMappingEmpty(amountTrackerIdMappingAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toMapping: removedToMapping,
      fromMapping: removedFromMapping,
      initiatedByMapping: removedInitiatedByMapping,
      amountTrackerIdMapping: amountTrackerIdMappingAfterRemoval,
      challengeTrackerIdMapping: valueToCheck.challengeTrackerIdMapping,

      arbitraryValue: valueToCheck.arbitraryValue,
      permittedTimes: [],
      forbiddenTimes: [],
    })
  }

  if (!isAddressMappingEmpty(challengeTrackerIdMappingAfterRemoval)) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: removedOwnershipTimes[0],
      toMapping: removedToMapping,
      fromMapping: removedFromMapping,
      initiatedByMapping: removedInitiatedByMapping,
      amountTrackerIdMapping: removedAmountTrackerIdMapping,
      challengeTrackerIdMapping: challengeTrackerIdMappingAfterRemoval,

      arbitraryValue: valueToCheck.arbitraryValue,
      permittedTimes: [],
      forbiddenTimes: [],
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
            toMapping: removedToMapping,
            fromMapping: removedFromMapping,
            initiatedByMapping: removedInitiatedByMapping,
            amountTrackerIdMapping: removedAmountTrackerIdMapping,
            challengeTrackerIdMapping: removedChallengeTrackerIdMapping,

            arbitraryValue: valueToCheck.arbitraryValue,

            permittedTimes: [],
            forbiddenTimes: [],
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

export function GetMappingIdWithOptions(mappingId: string, uses?: boolean): string {
  if (!uses) {
    mappingId = "All";
  }

  return mappingId;
}

export function GetMappingWithOptions(_mapping: AddressMapping, uses: boolean): AddressMapping {
  const mapping = deepCopy(_mapping);


  if (!uses) {
    mapping.addresses = []
    mapping.includeAddresses = false;
  }

  return mapping;
}

//TODO: This is a mess and is not needed but requires some refactoring.

export interface UsedFlags {
  usesBadgeIds: boolean;
  usesTimelineTimes: boolean;
  usesTransferTimes: boolean;
  usesToMapping: boolean;
  usesFromMapping: boolean;
  usesInitiatedByMapping: boolean;
  usesOwnershipTimes: boolean;
  usesAmountTrackerIdMapping: boolean;
  usesChallengeTrackerIdMapping: boolean;
}

export const ActionPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: false,
  usesAmountTrackerIdMapping: false,
  usesChallengeTrackerIdMapping: false,
}

export const TimedUpdatePermissionUsedFlags: UsedFlags = {
  usesBadgeIds: false,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: false,
  usesAmountTrackerIdMapping: false,
  usesChallengeTrackerIdMapping: false,
}

export const TimedUpdateWithBadgeIdsPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: false,
  usesAmountTrackerIdMapping: false,
  usesChallengeTrackerIdMapping: false,
}


export const BalancesActionPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: true,
  usesAmountTrackerIdMapping: false,
  usesChallengeTrackerIdMapping: false,
}


export const ApprovalPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: true,
  usesToMapping: true,
  usesFromMapping: true,
  usesInitiatedByMapping: true,
  usesOwnershipTimes: true,
  usesAmountTrackerIdMapping: true,
  usesChallengeTrackerIdMapping: true,
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
      fromMapping: getReservedAddressMapping("All") as AddressMapping,
      toMapping: getReservedAddressMapping("All") as AddressMapping,
      initiatedByMapping: getReservedAddressMapping("All") as AddressMapping,
      amountTrackerIdMapping: getReservedAddressMapping("All") as AddressMapping,
      challengeTrackerIdMapping: getReservedAddressMapping("All") as AddressMapping,
      transferTimes: [{ start: 1n, end: 18446744073709551615n }],
      badgeIds: [{ start: 1n, end: 18446744073709551615n }],
      ownershipTimes: [{ start: 1n, end: 18446744073709551615n }],

      permittedTimes: [],
      forbiddenTimes: [],

      ...usesFlags,

      arbitraryValue: {},
    })
  }


  for (const permission of permissions) {
    const badgeIds = GetUintRangesWithOptions(permission.badgeIds, permission.usesBadgeIds);
    const timelineTimes = GetUintRangesWithOptions(permission.timelineTimes, permission.usesTimelineTimes);
    const transferTimes = GetUintRangesWithOptions(permission.transferTimes, permission.usesTransferTimes);
    const ownershipTimes = GetUintRangesWithOptions(permission.ownershipTimes, permission.usesOwnershipTimes);
    const permittedTimes = GetUintRangesWithOptions(permission.permittedTimes, true);
    const forbiddenTimes = GetUintRangesWithOptions(permission.forbiddenTimes, true);
    const arbitraryValue = permission.arbitraryValue;

    const toMapping = GetMappingWithOptions(permission.toMapping, permission.usesToMapping);
    const fromMapping = GetMappingWithOptions(permission.fromMapping, permission.usesFromMapping);
    const initiatedByMapping = GetMappingWithOptions(permission.initiatedByMapping, permission.usesInitiatedByMapping);
    const amountTrackerIdMapping = GetMappingWithOptions(permission.amountTrackerIdMapping, permission.usesAmountTrackerIdMapping);
    const challengeTrackerIdMapping = GetMappingWithOptions(permission.challengeTrackerIdMapping, permission.usesChallengeTrackerIdMapping);


    for (const badgeId of badgeIds) {
      for (const timelineTime of timelineTimes) {
        for (const transferTime of transferTimes) {
          for (const ownershipTime of ownershipTimes) {
            const brokenDown: UniversalPermissionDetails[] = [{
              badgeId: badgeId,
              timelineTime: timelineTime,
              transferTime: transferTime,
              ownershipTime: ownershipTime,
              toMapping: toMapping,
              fromMapping: fromMapping,
              initiatedByMapping: initiatedByMapping,
              amountTrackerIdMapping: amountTrackerIdMapping,
              challengeTrackerIdMapping: challengeTrackerIdMapping,

              permittedTimes: permittedTimes,
              forbiddenTimes: forbiddenTimes,

              arbitraryValue,
            }];

            const [, remainingAfterHandledIsRemoved] = getOverlapsAndNonOverlaps(brokenDown, handled);
            for (const remaining of remainingAfterHandledIsRemoved) {
              handled.push({
                timelineTime: remaining.timelineTime,
                badgeId: remaining.badgeId,
                transferTime: remaining.transferTime,
                ownershipTime: remaining.ownershipTime,
                toMapping: remaining.toMapping,
                fromMapping: remaining.fromMapping,
                initiatedByMapping: remaining.initiatedByMapping,
                amountTrackerIdMapping: remaining.amountTrackerIdMapping,
                challengeTrackerIdMapping: remaining.challengeTrackerIdMapping,
                permittedTimes: permittedTimes,
                forbiddenTimes: forbiddenTimes,
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
  toMapping: AddressMapping;
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;

  amountTrackerIdMapping: AddressMapping;
  challengeTrackerIdMapping: AddressMapping;

  permittedTimes: UintRange<bigint>[];
  forbiddenTimes: UintRange<bigint>[];

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
      toMapping: permission.toMapping,
      fromMapping: permission.fromMapping,
      initiatedByMapping: permission.initiatedByMapping,
      amountTrackerIdMapping: permission.amountTrackerIdMapping,
      challengeTrackerIdMapping: permission.challengeTrackerIdMapping,

      permittedTimes: permission.permittedTimes,
      forbiddenTimes: permission.forbiddenTimes,

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
        const toMappingsAreSame = first.toMapping.includeAddresses === second.toMapping.includeAddresses && JSON.stringify(first.toMapping.addresses) === JSON.stringify(second.toMapping.addresses);
        const fromMappingsAreSame = first.fromMapping.includeAddresses === second.fromMapping.includeAddresses && JSON.stringify(first.fromMapping.addresses) === JSON.stringify(second.fromMapping.addresses);
        const initiatedByMappingsAreSame = first.initiatedByMapping.includeAddresses === second.initiatedByMapping.includeAddresses && JSON.stringify(first.initiatedByMapping.addresses) === JSON.stringify(second.initiatedByMapping.addresses);
        const amountTrackerIdMappingsAreSame = first.amountTrackerIdMapping.includeAddresses === second.amountTrackerIdMapping.includeAddresses && JSON.stringify(first.amountTrackerIdMapping.addresses) === JSON.stringify(second.amountTrackerIdMapping.addresses);
        const challengeTrackerIdMappingsAreSame = first.challengeTrackerIdMapping.includeAddresses === second.challengeTrackerIdMapping.includeAddresses && JSON.stringify(first.challengeTrackerIdMapping.addresses) === JSON.stringify(second.challengeTrackerIdMapping.addresses);



        const permittedTimesAreSame = JSON.stringify(first.permittedTimes) === JSON.stringify(second.permittedTimes);
        const forbiddenTimesAreSame = JSON.stringify(first.forbiddenTimes) === JSON.stringify(second.forbiddenTimes);
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
        if (toMappingsAreSame) addressSameCount++;
        if (fromMappingsAreSame) addressSameCount++;
        if (initiatedByMappingsAreSame) addressSameCount++;
        if (amountTrackerIdMappingsAreSame) addressSameCount++;
        if (challengeTrackerIdMappingsAreSame) addressSameCount++;

        if (sameCount === 3 && toMappingsAreSame && fromMappingsAreSame && initiatedByMappingsAreSame && permittedTimesAreSame && forbiddenTimesAreSame && arbitraryValuesAreSame) {
          merged.push({
            badgeIds: newBadgeIds,
            timelineTimes: newTimelineTimes,
            transferTimes: newTransferTimes,
            ownershipTimes: newOwnershipTimes,
            toMapping: first.toMapping,
            fromMapping: first.fromMapping,
            initiatedByMapping: first.initiatedByMapping,
            amountTrackerIdMapping: first.amountTrackerIdMapping,
            challengeTrackerIdMapping: first.challengeTrackerIdMapping,
            permittedTimes: first.permittedTimes,
            forbiddenTimes: first.forbiddenTimes,
            arbitraryValue: first.arbitraryValue,
          });

          merged = merged.filter((_, idx) => idx !== i && idx !== j);

          unhandledLeft = true;
          i = Number.MAX_SAFE_INTEGER;
          j = Number.MAX_SAFE_INTEGER;
        } else if (sameCount === 4 && addressSameCount == 4 && permittedTimesAreSame && forbiddenTimesAreSame && arbitraryValuesAreSame) {
          //TODO: Merge address mappings if includeAddresses is not the same
          merged.push({
            badgeIds: newBadgeIds,
            timelineTimes: newTimelineTimes,
            transferTimes: newTransferTimes,
            ownershipTimes: newOwnershipTimes,
            toMapping: !toMappingsAreSame && first.toMapping.includeAddresses === second.toMapping.includeAddresses ? {
              ...first.toMapping,
              addresses: [...new Set([...first.toMapping.addresses, ...second.toMapping.addresses])]
            } : first.toMapping,
            fromMapping: !fromMappingsAreSame && first.fromMapping.includeAddresses === second.fromMapping.includeAddresses ? {
              ...first.fromMapping,
              addresses: [...new Set([...first.fromMapping.addresses, ...second.fromMapping.addresses])]
            } : first.fromMapping,
            initiatedByMapping: !initiatedByMappingsAreSame && first.initiatedByMapping.includeAddresses === second.initiatedByMapping.includeAddresses ? {
              ...first.initiatedByMapping,
              addresses: [...new Set([...first.initiatedByMapping.addresses, ...second.initiatedByMapping.addresses])]
            } : first.initiatedByMapping,
            amountTrackerIdMapping: !amountTrackerIdMappingsAreSame && first.amountTrackerIdMapping.includeAddresses === second.amountTrackerIdMapping.includeAddresses ? {
              ...first.amountTrackerIdMapping,
              addresses: [...new Set([...first.amountTrackerIdMapping.addresses, ...second.amountTrackerIdMapping.addresses])]
            } : first.amountTrackerIdMapping,
            challengeTrackerIdMapping: !challengeTrackerIdMappingsAreSame && first.challengeTrackerIdMapping.includeAddresses === second.challengeTrackerIdMapping.includeAddresses ? {
              ...first.challengeTrackerIdMapping,
              addresses: [...new Set([...first.challengeTrackerIdMapping.addresses, ...second.challengeTrackerIdMapping.addresses])]
            } : first.challengeTrackerIdMapping,
            permittedTimes: first.permittedTimes,
            forbiddenTimes: first.forbiddenTimes,
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

  if (permission.toMapping !== null) {
    str += "toMapping: ";
    if (!permission.toMapping.includeAddresses) {
      str += permission.toMapping.addresses.length.toString() + " addresses ";
    } else {
      str += "all except " + permission.toMapping.addresses.length.toString() + " addresses ";
    }

    if (permission.toMapping.addresses.length > 0 && permission.toMapping.addresses.length <= 5) {
      str += "(";
      for (const address of permission.toMapping.addresses) {
        str += address + " ";
      }
      str += ")";
    }
  }

  if (permission.fromMapping !== null) {
    str += "fromMapping: ";
    if (!permission.fromMapping.includeAddresses) {
      str += permission.fromMapping.addresses.length.toString() + " addresses ";
    } else {
      str += "all except " + permission.fromMapping.addresses.length.toString() + " addresses ";
    }

    if (permission.fromMapping.addresses.length > 0 && permission.fromMapping.addresses.length <= 5) {
      str += "(";
      for (const address of permission.fromMapping.addresses) {
        str += address + " ";
      }
      str += ")";
    }
  }

  if (permission.initiatedByMapping !== null) {
    str += "initiatedByMapping: ";
    if (!permission.initiatedByMapping.includeAddresses) {
      str += permission.initiatedByMapping.addresses.length.toString() + " addresses ";
    } else {
      str += "all except " + permission.initiatedByMapping.addresses.length.toString() + " addresses ";
    }

    if (permission.initiatedByMapping.addresses.length > 0 && permission.initiatedByMapping.addresses.length <= 5) {
      str += "(";
      for (const address of permission.initiatedByMapping.addresses) {
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

    const [leftoverPermittedTimes, _x] = removeUintRangeFromUintRange(newPermission.permittedTimes, oldPermission.permittedTimes);
    const [leftoverForbiddenTimes, _y] = removeUintRangeFromUintRange(newPermission.forbiddenTimes, oldPermission.forbiddenTimes);

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
