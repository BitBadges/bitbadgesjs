//TODO: This file should probably be refactored a lot, but it currently works.
//			It is also not user-facing or dev-facing, so I am okay with how it is now

import { AddressMapping, UintRange, ValueOptions } from "bitbadgesjs-proto";
import { removeAddressMappingFromAddressMapping, isAddressMappingEmpty } from "./addressMappings";
import { invertUintRanges, removeUintRangeFromUintRange, removeUintsFromUintRange } from "./uintRanges";
import { deepCopy } from "./types/utils";

//For permissions, we have many types of permissions that are all very similar to each other
//Here, we abstract all those permissions to a UniversalPermission struct in order to reuse code.
//When casting to a UniversalPermission, we use fake dummy values for the unused values to avoid messing up the logic
//
//This file implements certain logic using UniversalPermissions such as overlaps and getting first match only
//This is used in many places around the codebase

//TODO: This file was created with AI from the Go equivalent in github.com/bitbadges/bitbadgeschain. It should be cleaned up to be more idiomatic TypeScript.

export interface UniversalCombination {
  timelineTimesOptions: ValueOptions;

  fromMappingOptions: ValueOptions;
  toMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;

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
  ownedTimes: UintRange<bigint>[];
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
  usesOwnedTimes: boolean;

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


function universalRemoveOverlaps(handled: UniversalPermissionDetails, valueToCheck: UniversalPermissionDetails): [UniversalPermissionDetails[], UniversalPermissionDetails[]] {
  let [timelineTimesAfterRemoval, removedTimelineTimes] = removeUintsFromUintRange(handled.timelineTime, valueToCheck.timelineTime);
  let [badgesAfterRemoval, removedBadges] = removeUintsFromUintRange(handled.badgeId, valueToCheck.badgeId);
  let [transferTimesAfterRemoval, removedTransferTimes] = removeUintsFromUintRange(handled.transferTime, valueToCheck.transferTime);
  let [ownedTimesAfterRemoval, removedOwnedTimes] = removeUintsFromUintRange(handled.ownershipTime, valueToCheck.ownershipTime);
  let [toMappingAfterRemoval, removedToMapping] = removeAddressMappingFromAddressMapping(handled.toMapping, valueToCheck.toMapping);
  let [fromMappingAfterRemoval, removedFromMapping] = removeAddressMappingFromAddressMapping(handled.fromMapping, valueToCheck.fromMapping);
  let [initiatedByMappingAfterRemoval, removedInitiatedByMapping] = removeAddressMappingFromAddressMapping(handled.initiatedByMapping, valueToCheck.initiatedByMapping);

  let toMappingRemoved = !isAddressMappingEmpty(removedToMapping);
  let fromMappingRemoved = !isAddressMappingEmpty(removedFromMapping);
  let initiatedByMappingRemoved = !isAddressMappingEmpty(removedInitiatedByMapping);

  const remaining: UniversalPermissionDetails[] = [];
  if (removedTimelineTimes.length === 0 || removedBadges.length === 0 || removedTransferTimes.length === 0 || removedOwnedTimes.length === 0 || !toMappingRemoved || !fromMappingRemoved || !initiatedByMappingRemoved) {
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

  for (let ownedTimeAfterRemoval of ownedTimesAfterRemoval) {
    remaining.push({
      timelineTime: removedTimelineTimes[0],
      badgeId: removedBadges[0],
      transferTime: removedTransferTimes[0],
      ownershipTime: ownedTimeAfterRemoval,
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
      ownershipTime: removedOwnedTimes[0],
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
      ownershipTime: removedOwnedTimes[0],
      toMapping: toMappingAfterRemoval,
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
      ownershipTime: removedOwnedTimes[0],
      toMapping: toMappingAfterRemoval,
      fromMapping: fromMappingAfterRemoval,
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
        for (let removedOwnedTime of removedOwnedTimes) {
          removed.push({
            timelineTime: removedTimelineTime,
            badgeId: removedBadge,
            transferTime: removedTransferTime,
            ownershipTime: removedOwnedTime,
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

export function GetMappingWithOptions(mapping: AddressMapping, options: ValueOptions | null, uses: boolean): AddressMapping {
  if (!uses) {
    mapping.addresses = []
    mapping.includeAddresses = false;
  }

  if (options === null) {
    return mapping;
  }

  if (options.allValues) {
    mapping.addresses = []
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

export function GetFirstMatchOnly(permissions: UniversalPermission[]): UniversalPermissionDetails[] {
  const handled: UniversalPermissionDetails[] = [];

  for (const permission of permissions) {
    for (const combination of permission.combinations) {
      const badgeIds = GetUintRangesWithOptions(permission.defaultValues.badgeIds, combination.badgeIdsOptions, permission.defaultValues.usesBadgeIds);
      const timelineTimes = GetUintRangesWithOptions(permission.defaultValues.timelineTimes, combination.timelineTimesOptions, permission.defaultValues.usesTimelineTimes);
      const transferTimes = GetUintRangesWithOptions(permission.defaultValues.transferTimes, combination.transferTimesOptions, permission.defaultValues.usesTransferTimes);
      const ownedTimes = GetUintRangesWithOptions(permission.defaultValues.ownedTimes, combination.ownedTimesOptions, permission.defaultValues.usesOwnedTimes);
      const permittedTimes = GetUintRangesWithOptions(permission.defaultValues.permittedTimes, combination.permittedTimesOptions, true);
      const forbiddenTimes = GetUintRangesWithOptions(permission.defaultValues.forbiddenTimes, combination.forbiddenTimesOptions, true);
      const arbitraryValue = permission.defaultValues.arbitraryValue;

      const toMapping = GetMappingWithOptions(permission.defaultValues.toMapping, combination.toMappingOptions, permission.defaultValues.usesToMapping);
      const fromMapping = GetMappingWithOptions(permission.defaultValues.fromMapping, combination.fromMappingOptions, permission.defaultValues.usesFromMapping);
      const initiatedByMapping = GetMappingWithOptions(permission.defaultValues.initiatedByMapping, combination.initiatedByMappingOptions, permission.defaultValues.usesInitiatedByMapping);

      for (const badgeId of badgeIds) {
        for (const timelineTime of timelineTimes) {
          for (const transferTime of transferTimes) {
            for (const ownershipTime of ownedTimes) {
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
        errMsg += ") which are now set to disallowed";
      }
      if (leftoverForbiddenTimes.length > 0 && leftoverPermittedTimes.length > 0) {
        errMsg += " and";
      }
      if (leftoverForbiddenTimes.length > 0) {
        errMsg += " previously explicitly disallowed the times ( ";
        for (const oldForbiddenTime of leftoverForbiddenTimes) {
          errMsg += oldForbiddenTime.start.toString() + "-" + oldForbiddenTime.end.toString() + " ";
        }
        errMsg += ") which are now set to allowed.";
      }

      return new Error(errMsg);
    }
  }

  // Note we do not care about inNewButNotOld because it is fine to add new permissions that were not explicitly allowed/disallowed before

  return null;
}
