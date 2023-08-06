//TODO: This file should probably be refactored a lot, but it currently works.
//			It is also not user-facing or dev-facing, so I am okay with how it is now

import { AddressMapping, UintRange, ValueOptions } from "bitbadgesjs-proto";
import { isAddressMappingEmpty, removeAddressMappingFromAddressMapping } from "./addressMappings";
import { deepCopy } from "./types/utils";
import { invertUintRanges, removeUintRangeFromUintRange, removeUintsFromUintRange, sortUintRangesAndMergeIfNecessary } from "./uintRanges";

//For permissions, we have many types of permissions that are all very similar to each other
//Here, we abstract all those permissions to a UniversalPermission struct in order to reuse code.
//When casting to a UniversalPermission, we use fake dummy values for the unused values to avoid messing up the logic
//
//This file implements certain logic using UniversalPermissions such as overlaps and getting first match only
//This is used in many places around the codebase

//TODO: This file was created with AI from the Go equivalent in github.com/bitbadges/bitbadgeschain. It should be cleaned up to be more idiomatic TypeScript.

export interface UniversalCombination {
  timelineTimesOptions: ValueOptions; // The times of the timeline. Used in the timeline.
  fromMappingOptions: ValueOptions; // The times that the from mapping is allowed to be used. Used in the timeline.
  toMappingOptions: ValueOptions; // The times that the to mapping is allowed to be used. Used in the timeline.
  initiatedByMappingOptions: ValueOptions; // The times that the initiated by mapping is allowed to be used. Used in the timeline.
  transferTimesOptions: ValueOptions; // The times that the transfer mapping is allowed to be used. Used in the timeline.
  badgeIdsOptions: ValueOptions; // The times that the badge ids are allowed to be used. Used in the timeline.
  ownershipTimesOptions: ValueOptions; // The times that the owned times are allowed to be used. Used in the timeline.

  permittedTimesOptions: ValueOptions; // The times that are permitted to be used.
  forbiddenTimesOptions: ValueOptions; // The times that are forbidden to be used.
}

export interface UniversalCombination {
  timelineTimesOptions: ValueOptions;

  fromMappingOptions: ValueOptions;
  toMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownershipTimesOptions: ValueOptions;

  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface UniversalPermission {
  defaultValues: UniversalDefaultValues;
  combinations: UniversalCombination[];
}

export interface UniversalDefaultValues {
  badgeIds: UintRange<bigint>[];
  timelineTimes: UintRange<bigint>[];
  transferTimes: UintRange<bigint>[];
  ownershipTimes: UintRange<bigint>[];
  toMapping: AddressMapping;
  fromMapping: AddressMapping;
  initiatedByMapping: AddressMapping;

  permittedTimes: UintRange<bigint>[];
  forbiddenTimes: UintRange<bigint>[];

  usesBadgeIds: boolean;
  usesTimelineTimes: boolean;
  usesTransferTimes: boolean;
  usesToMapping: boolean;
  usesFromMapping: boolean;
  usesInitiatedByMapping: boolean;
  usesOwnershipTimes: boolean;

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

  let removedToMappingIsEmpty = isAddressMappingEmpty(removedToMapping);
  let removedFromMappingIsEmpty = isAddressMappingEmpty(removedFromMapping);
  let removedInitiatedByMappingIsEmpty = isAddressMappingEmpty(removedInitiatedByMapping);

  const remaining: UniversalPermissionDetails[] = [];
  //If we didn't remove anything at all
  if (removedTimelineTimes.length === 0 || removedBadges.length === 0 || removedTransferTimes.length === 0 || removedOwnershipTimes.length === 0 || removedToMappingIsEmpty || removedFromMappingIsEmpty || removedInitiatedByMappingIsEmpty) {
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

export function GetUintRangesWithOptions(ranges: UintRange<bigint>[], options: ValueOptions, uses: boolean): UintRange<bigint>[] {
  if (!uses) {
    ranges = [{ start: BigInt(1), end: BigInt(1) }]; // dummy range
    return ranges;
  }

  if (options === null) {
    return ranges;
  }

  if (options.allValues) {
    ranges = [{ start: 1n, end: BigInt("18446744073709551615") }];
  }

  if (options.invertDefault) {
    ranges = invertUintRanges(ranges, 1n, BigInt("18446744073709551615"));
  }

  if (options.noValues) {
    ranges = [];
  }

  return ranges;
}

export function GetMappingIdWithOptions(mappingId: string, options: ValueOptions, uses: boolean): string {
  if (!uses) {
    mappingId = "All";
  }

  if (options === null) {
    return mappingId;
  }

  if (options.allValues) {
    mappingId = "All";
  }

  if (options.invertDefault) {
    mappingId = "!" + mappingId;
  }

  if (options.noValues) {
    mappingId = "None";
  }

  return mappingId;
}

export function GetMappingWithOptions(_mapping: AddressMapping, options: ValueOptions | null, uses: boolean): AddressMapping {
  const mapping = deepCopy(_mapping);


  if (!uses) {
    mapping.addresses = []
    mapping.includeAddresses = false;
  }

  if (options === null) {
    return mapping;
  }

  if (options.allValues) {
    mapping.addresses = [] //Note NO "Mint" address (so it is included)
    mapping.includeAddresses = false;
  }

  if (options.invertDefault) {
    mapping.includeAddresses = !mapping.includeAddresses
  }

  if (options.noValues) {
    mapping.addresses = []
    mapping.includeAddresses = true;
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
}

export const ActionPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: false,
}

export const TimedUpdatePermissionUsedFlags: UsedFlags = {
  usesBadgeIds: false,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: false,
}

export const TimedUpdateWithBadgeIdsPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: true,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: false,
}


export const BalancesActionPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: false,
  usesTransferTimes: false,
  usesToMapping: false,
  usesFromMapping: false,
  usesInitiatedByMapping: false,
  usesOwnershipTimes: true,
}


export const ApprovedTransferPermissionUsedFlags: UsedFlags = {
  usesBadgeIds: true,
  usesTimelineTimes: true,
  usesTransferTimes: true,
  usesToMapping: true,
  usesFromMapping: true,
  usesInitiatedByMapping: true,
  usesOwnershipTimes: true,
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
      defaultValues: {
        timelineTimes: [],
        fromMapping: { mappingId: '', addresses: [], includeAddresses: false, uri: '', customData: '' },
        toMapping: { mappingId: '', addresses: [], includeAddresses: false, uri: '', customData: '' },
        initiatedByMapping: { mappingId: '', addresses: [], includeAddresses: false, uri: '', customData: '' },
        transferTimes: [],
        badgeIds: [],
        ownershipTimes: [],

        permittedTimes: [],
        forbiddenTimes: [],

        ...usesFlags,

        arbitraryValue: {},
      },
      combinations: [{
        timelineTimesOptions: {
          invertDefault: false,
          allValues: true,
          noValues: false
        },
        fromMappingOptions: {
          invertDefault: false,
          allValues: true,
          noValues: false
        },
        toMappingOptions: {
          invertDefault: false,
          allValues: true,
          noValues: false
        },
        initiatedByMappingOptions: {
          invertDefault: false,
          allValues: true,
          noValues: false
        },
        transferTimesOptions: {
          invertDefault: false,
          allValues: true,
          noValues: false
        },
        badgeIdsOptions: {
          invertDefault: false,
          allValues: true,
          noValues: false
        },
        ownershipTimesOptions: {
          invertDefault: false,
          allValues: true,
          noValues: false
        },
        permittedTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: true
        },
        forbiddenTimesOptions: {
          invertDefault: false,
          allValues: false,
          noValues: true
        },
      }]
    })
  }


  for (const permission of permissions) {
    for (const combination of permission.combinations) {
      const badgeIds = GetUintRangesWithOptions(permission.defaultValues.badgeIds, combination.badgeIdsOptions, permission.defaultValues.usesBadgeIds);
      const timelineTimes = GetUintRangesWithOptions(permission.defaultValues.timelineTimes, combination.timelineTimesOptions, permission.defaultValues.usesTimelineTimes);
      const transferTimes = GetUintRangesWithOptions(permission.defaultValues.transferTimes, combination.transferTimesOptions, permission.defaultValues.usesTransferTimes);
      const ownershipTimes = GetUintRangesWithOptions(permission.defaultValues.ownershipTimes, combination.ownershipTimesOptions, permission.defaultValues.usesOwnershipTimes);
      const permittedTimes = GetUintRangesWithOptions(permission.defaultValues.permittedTimes, combination.permittedTimesOptions, true);
      const forbiddenTimes = GetUintRangesWithOptions(permission.defaultValues.forbiddenTimes, combination.forbiddenTimesOptions, true);
      const arbitraryValue = permission.defaultValues.arbitraryValue;

      const toMapping = GetMappingWithOptions(permission.defaultValues.toMapping, combination.toMappingOptions, permission.defaultValues.usesToMapping);
      const fromMapping = GetMappingWithOptions(permission.defaultValues.fromMapping, combination.fromMappingOptions, permission.defaultValues.usesFromMapping);
      const initiatedByMapping = GetMappingWithOptions(permission.defaultValues.initiatedByMapping, combination.initiatedByMappingOptions, permission.defaultValues.usesInitiatedByMapping);

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

  permittedTimes: UintRange<bigint>[];
  forbiddenTimes: UintRange<bigint>[];

  arbitraryValue: any;
}

export function MergeUniversalPermissionDetails(permissions: UniversalPermissionDetails[]) {
  //We can merge two values if N - 1 fields are the same (note currently we only merge uint ranges)
  const merged: MergedUniversalPermissionDetails[] = permissions.map((permission) => {
    return {
      badgeIds: [permission.badgeId],
      timelineTimes: [permission.timelineTime],
      transferTimes: [permission.transferTime],
      ownershipTimes: [permission.ownershipTime],
      toMapping: permission.toMapping,
      fromMapping: permission.fromMapping,
      initiatedByMapping: permission.initiatedByMapping,

      permittedTimes: permission.permittedTimes,
      forbiddenTimes: permission.forbiddenTimes,

      arbitraryValue: permission.arbitraryValue,
    };
  });

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
        const toMappingsAreSame = first.toMapping.mappingId === second.toMapping.mappingId && first.toMapping.includeAddresses === second.toMapping.includeAddresses && first.toMapping.addresses === second.toMapping.addresses;
        const fromMappingsAreSame = first.fromMapping.mappingId === second.fromMapping.mappingId && first.fromMapping.includeAddresses === second.fromMapping.includeAddresses && first.fromMapping.addresses === second.fromMapping.addresses;
        const initiatedByMappingsAreSame = first.initiatedByMapping.mappingId === second.initiatedByMapping.mappingId && first.initiatedByMapping.includeAddresses === second.initiatedByMapping.includeAddresses && first.initiatedByMapping.addresses === second.initiatedByMapping.addresses;

        const permittedTimesAreSame = JSON.stringify(first.permittedTimes) === JSON.stringify(second.permittedTimes);
        const forbiddenTimesAreSame = JSON.stringify(first.forbiddenTimes) === JSON.stringify(second.forbiddenTimes);
        const arbitraryValuesAreSame = JSON.stringify(first.arbitraryValue) === JSON.stringify(second.arbitraryValue);

        const newBadgeIds = badgeIdsAreSame ? first.badgeIds : sortUintRangesAndMergeIfNecessary(deepCopy([...first.badgeIds, ...second.badgeIds]));
        const newTimelineTimes = timelineTimesAreSame ? first.timelineTimes : sortUintRangesAndMergeIfNecessary(deepCopy([...first.timelineTimes, ...second.timelineTimes]));
        const newTransferTimes = transferTimesAreSame ? first.transferTimes : sortUintRangesAndMergeIfNecessary(deepCopy([...first.transferTimes, ...second.transferTimes]));
        const newOwnershipTimes = ownershipTimesAreSame ? first.ownershipTimes : sortUintRangesAndMergeIfNecessary(deepCopy([...first.ownershipTimes, ...second.ownershipTimes]));

        let sameCount = 0;
        if (badgeIdsAreSame) sameCount++;
        if (timelineTimesAreSame) sameCount++;
        if (transferTimesAreSame) sameCount++;
        if (ownershipTimesAreSame) sameCount++;

        if (sameCount === 3 && toMappingsAreSame && fromMappingsAreSame && initiatedByMappingsAreSame && permittedTimesAreSame && forbiddenTimesAreSame && arbitraryValuesAreSame) {
          merged.push({
            badgeIds: newBadgeIds,
            timelineTimes: newTimelineTimes,
            transferTimes: newTransferTimes,
            ownershipTimes: newOwnershipTimes,
            toMapping: first.toMapping,
            fromMapping: first.fromMapping,
            initiatedByMapping: first.initiatedByMapping,
            permittedTimes: first.permittedTimes,
            forbiddenTimes: first.forbiddenTimes,
            arbitraryValue: first.arbitraryValue,
          });

          merged.splice(i, 1);
          merged.splice(j, 1);

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
