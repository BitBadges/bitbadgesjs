import { ApprovalDetails, BadgeMetadata, BadgeMetadataTimeline, CollectionMetadata, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadata, OffChainBalancesMetadataTimeline, StandardsTimeline, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange, deepCopy } from "bitbadgesjs-proto";
import { GetFirstMatchOnly, GetUintRangesWithOptions, UniversalPermission, UniversalPermissionDetails, getOverlapsAndNonOverlaps } from "./overlaps";
import { checkCollectionApprovedTransferPermission, checkTimedUpdatePermission, checkTimedUpdateWithBadgeIdsPermission, getUpdateCombinationsToCheck } from "./permission_checks";
import { castBadgeMetadataToUniversalPermission, castCollectionApprovedTransferToUniversalPermission } from "./permissions";
import { getBadgeMetadataTimesAndValues, getCollectionMetadataTimesAndValues, getContractAddressTimesAndValues, getCustomDataTimesAndValues, getIsArchivedTimesAndValues, getManagerTimesAndValues, getOffChainBalancesMetadataTimesAndValues, getStandardsTimesAndValues } from "./timeline_helpers";
import { CollectionApprovedTransferPermissionWithDetails, CollectionApprovedTransferWithDetails } from "./types/collections";
import { expandCollectionApprovedTransfers } from "./userApprovedTransfers";

/**
 * @category Validate Updates
 */
export function getPotentialUpdatesForTimelineValues(times: UintRange<bigint>[][], values: any[]): UniversalPermissionDetails[] {
  let castedPermissions: UniversalPermission[] = [];
  for (let idx = 0; idx < times.length; idx++) {
    castedPermissions.push({
      defaultValues: {
        timelineTimes: times[idx],
        arbitraryValue: values[idx],
        usesTimelineTimes: true,
        usesBadgeIds: false,
        usesOwnershipTimes: false,
        usesTransferTimes: false,
        usesToMapping: false,
        usesFromMapping: false,
        usesInitiatedByMapping: false,
        usesApprovalTrackerIdMapping: false,
        usesChallengeTrackerIdMapping: false,

        permittedTimes: [],
        forbiddenTimes: [],

        badgeIds: [],
        ownershipTimes: [],
        transferTimes: [],
        toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      },
      combinations: [{

      }],
    });
  }

  let firstMatches = GetFirstMatchOnly(castedPermissions);

  return firstMatches;
}

interface ApprovalDetailsWithIsApproved {
  isApproved: boolean;
  approvalDetails: (ApprovalDetails<bigint> | null)[];
}

function getFirstMatchOnlyWithApprovalDetails(permissions: UniversalPermission[]): UniversalPermissionDetails[] {
  const handled: UniversalPermissionDetails[] = [];

  for (const permission of permissions) {
    for (const combination of permission.combinations) {
      const badgeIds = GetUintRangesWithOptions(permission.defaultValues.badgeIds, combination.badgeIdsOptions, permission.defaultValues.usesBadgeIds);
      const timelineTimes = GetUintRangesWithOptions(permission.defaultValues.timelineTimes, combination.timelineTimesOptions, permission.defaultValues.usesTimelineTimes);
      const transferTimes = GetUintRangesWithOptions(permission.defaultValues.transferTimes, combination.transferTimesOptions, permission.defaultValues.usesTransferTimes);
      const ownershipTimes = GetUintRangesWithOptions(permission.defaultValues.ownershipTimes, combination.ownershipTimesOptions, permission.defaultValues.usesOwnershipTimes);
      const permittedTimes = GetUintRangesWithOptions(permission.defaultValues.permittedTimes, combination.permittedTimesOptions, true);
      const forbiddenTimes = GetUintRangesWithOptions(permission.defaultValues.forbiddenTimes, combination.forbiddenTimesOptions, true);

      for (const badgeId of badgeIds) {
        for (const timelineTime of timelineTimes) {
          for (const transferTime of transferTimes) {
            for (const ownershipTime of ownershipTimes) {
              const approvalDetails: ApprovalDetails<bigint>[] = [
                permission.defaultValues.arbitraryValue.approvalDetails ?? null,
              ];
              const isApproved: boolean = permission.defaultValues.arbitraryValue.allowedCombinations[0].isApproved;
              const arbValue: ApprovalDetailsWithIsApproved = {
                isApproved: isApproved,
                approvalDetails: approvalDetails,
              };

              const brokenDown: UniversalPermissionDetails[] = [
                {
                  badgeId: badgeId,
                  timelineTime: timelineTime,
                  transferTime: transferTime,
                  ownershipTime: ownershipTime,
                  toMapping: permission.defaultValues.toMapping,
                  fromMapping: permission.defaultValues.fromMapping,
                  initiatedByMapping: permission.defaultValues.initiatedByMapping,
                  approvalTrackerIdMapping: permission.defaultValues.approvalTrackerIdMapping,
                  challengeTrackerIdMapping: permission.defaultValues.challengeTrackerIdMapping,
                  permittedTimes: permittedTimes,
                  forbiddenTimes: forbiddenTimes,
                  arbitraryValue: arbValue,
                },
              ];

              const [overlaps, inBrokenDownButNotHandled, inHandledButNotBrokenDown] = getOverlapsAndNonOverlaps(brokenDown, handled);
              handled.length = 0;

              handled.push(...inHandledButNotBrokenDown);
              handled.push(...inBrokenDownButNotHandled);

              for (const overlap of overlaps) {
                const mergedApprovalDetails: (ApprovalDetails<bigint> | null)[] = overlap.secondDetails.arbitraryValue.approvalDetails.concat(overlap.firstDetails.arbitraryValue.approvalDetails);

                const isApprovedFirst: boolean = overlap.firstDetails.arbitraryValue.isApproved;
                const isApprovedSecond: boolean = overlap.secondDetails.arbitraryValue.isApproved;
                const isApproved: boolean = isApprovedFirst && isApprovedSecond;

                const newArbValue: ApprovalDetailsWithIsApproved = {
                  isApproved: isApproved,
                  approvalDetails: mergedApprovalDetails,
                };

                handled.push({
                  timelineTime: overlap.overlap.timelineTime,
                  badgeId: overlap.overlap.badgeId,
                  transferTime: overlap.overlap.transferTime,
                  ownershipTime: overlap.overlap.ownershipTime,
                  toMapping: overlap.overlap.toMapping,
                  fromMapping: overlap.overlap.fromMapping,
                  initiatedByMapping: overlap.overlap.initiatedByMapping,
                  approvalTrackerIdMapping: overlap.overlap.approvalTrackerIdMapping,
                  challengeTrackerIdMapping: overlap.overlap.challengeTrackerIdMapping,
                  permittedTimes: permittedTimes,
                  forbiddenTimes: forbiddenTimes,
                  arbitraryValue: newArbValue,
                });
              }
            }
          }
        }
      }
    }
  }

  const returnArr: UniversalPermissionDetails[] = [];

  for (const handledItem of handled) {
    let idxToInsert: number = 0;

    while (idxToInsert < returnArr.length && handledItem.badgeId.start > returnArr[idxToInsert].badgeId.start) {
      idxToInsert++;
    }

    returnArr.push(null as any);
    returnArr.copyWithin(idxToInsert + 1, idxToInsert);
    returnArr[idxToInsert] = handledItem;
  }

  return returnArr;
}


/**
 * @category Validate Updates
 */
export function validateCollectionApprovedTransfersUpdate(
  oldApprovedTransfers: CollectionApprovedTransferWithDetails<bigint>[],
  newApprovedTransfers: CollectionApprovedTransferWithDetails<bigint>[],
  canUpdateCollectionApprovedTransfers: CollectionApprovedTransferPermissionWithDetails<bigint>[]
): Error | null {
  const dummyRanges = [[{ start: 1n, end: 1n }]]
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(deepCopy(dummyRanges), [deepCopy(oldApprovedTransfers)]);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(deepCopy(dummyRanges), [deepCopy(newApprovedTransfers)]);

  let detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any) {
    let expandedOldApprovedTransfers = expandCollectionApprovedTransfers(oldValue as CollectionApprovedTransferWithDetails<bigint>[]);
    let expandedNewApprovedTransfers = expandCollectionApprovedTransfers(newValue as CollectionApprovedTransferWithDetails<bigint>[]);

    let oldApprovedTransfers = castCollectionApprovedTransferToUniversalPermission(expandedOldApprovedTransfers);
    if (!oldApprovedTransfers) {
      throw new Error("InvalidOldValue");
    }
    let newApprovedTransfers = castCollectionApprovedTransferToUniversalPermission(expandedNewApprovedTransfers);
    if (!newApprovedTransfers) {
      throw new Error("InvalidNewValue");
    }

    let firstMatchesForOld = getFirstMatchOnlyWithApprovalDetails(oldApprovedTransfers);
    let firstMatchesForNew = getFirstMatchOnlyWithApprovalDetails(newApprovedTransfers);



    let detailsToReturn: UniversalPermissionDetails[] = [];
    let [overlapObjects, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(firstMatchesForOld, firstMatchesForNew);
    for (let overlapObject of overlapObjects) {
      let overlap = overlapObject.overlap;
      let oldDetails = overlapObject.firstDetails;
      let newDetails = overlapObject.secondDetails;
      let different = false;
      if ((oldDetails.arbitraryValue === null && newDetails.arbitraryValue !== null) || (oldDetails.arbitraryValue !== null && newDetails.arbitraryValue === null)) {
        different = true;
      } else {
        const oldArbVal: ApprovalDetailsWithIsApproved = oldDetails.arbitraryValue as ApprovalDetailsWithIsApproved;
        const newArbVal: ApprovalDetailsWithIsApproved = newDetails.arbitraryValue as ApprovalDetailsWithIsApproved;

        const oldVal = oldArbVal.approvalDetails;
        const newVal = newArbVal.approvalDetails;

        if (oldArbVal.isApproved !== newArbVal.isApproved) {
          different = true;
        }

        if (oldVal.length !== newVal.length) {
          different = true;
        } else {
          for (let i = 0; i < oldVal.length; i++) {
            if (JSON.stringify(oldVal[i]) !== JSON.stringify(newVal[i])) {
              different = true;
            }
          }
        }

      }

      if (different) {
        detailsToReturn.push(overlap);
      }
    }

    detailsToReturn.push(...inOldButNotNew);
    detailsToReturn.push(...inNewButNotOld);

    return detailsToReturn;
  });

  let details = detailsToCheck.map(x => {
    const result = {
      timelineTimes: [x.timelineTime],
      badgeIds: [x.badgeId],
      ownershipTimes: [x.ownershipTime],
      transferTimes: [x.transferTime],
      toMapping: x.toMapping,
      fromMapping: x.fromMapping,
      initiatedByMapping: x.initiatedByMapping,
      approvalTrackerIdMapping: x.approvalTrackerIdMapping,
      challengeTrackerIdMapping: x.challengeTrackerIdMapping,
    }
    return result;
  });

  let err = checkCollectionApprovedTransferPermission(details, canUpdateCollectionApprovedTransfers);
  if (err) {
    return err;
  }

  return null;
}


/**
 * @category Validate Updates
 */
export function validateBadgeMetadataUpdate(
  oldBadgeMetadata: BadgeMetadataTimeline<bigint>[],
  newBadgeMetadata: BadgeMetadataTimeline<bigint>[],
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getBadgeMetadataTimesAndValues(oldBadgeMetadata);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getBadgeMetadataTimesAndValues(newBadgeMetadata);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any) {
    let oldBadgeMetadata = oldValue as BadgeMetadata<bigint>[];
    let firstMatchesForOld = GetFirstMatchOnly(castBadgeMetadataToUniversalPermission(oldBadgeMetadata));

    let newBadgeMetadata = newValue as BadgeMetadata<bigint>[];
    let firstMatchesForNew = GetFirstMatchOnly(castBadgeMetadataToUniversalPermission(newBadgeMetadata));

    let detailsToReturn: UniversalPermissionDetails[] = [];
    let [overlapObjects, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(firstMatchesForOld, firstMatchesForNew);
    for (let overlapObject of overlapObjects) {
      let overlap = overlapObject.overlap;
      let oldDetails = overlapObject.firstDetails;
      let newDetails = overlapObject.secondDetails;

      if ((oldDetails.arbitraryValue === null && newDetails.arbitraryValue !== null) || (oldDetails.arbitraryValue !== null && newDetails.arbitraryValue === null)) {
        detailsToReturn.push(overlap);
      } else {
        let oldVal = oldDetails.arbitraryValue as string;
        let newVal = newDetails.arbitraryValue as string;

        if (newVal !== oldVal) {
          detailsToReturn.push(overlap);
        }
      }
    }

    detailsToReturn.push(...inOldButNotNew);
    detailsToReturn.push(...inNewButNotOld);

    return detailsToReturn;

  });

  let details = detailsToCheck.map(x => {
    const result = {
      timelineTimes: [x.timelineTime],
      badgeIds: [x.badgeId],
      ownershipTimes: [x.ownershipTime],
      transferTimes: [x.transferTime],
      toMapping: x.toMapping,
      fromMapping: x.fromMapping,
      initiatedByMapping: x.initiatedByMapping,
    }
    return result;
  });

  let err = checkTimedUpdateWithBadgeIdsPermission(details, canUpdateBadgeMetadata);
  if (err) {
    return err;
  }

  return null;
}

/**
 * @category Validate Updates
 */
export function validateCollectionMetadataUpdate(
  oldCollectionMetadata: CollectionMetadataTimeline<bigint>[],
  newCollectionMetadata: CollectionMetadataTimeline<bigint>[],
  canUpdateCollectionMetadata: TimedUpdatePermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getCollectionMetadataTimesAndValues(oldCollectionMetadata);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getCollectionMetadataTimesAndValues(newCollectionMetadata);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, {}, function (oldValue: any, newValue: any) {
    let detailsToCheck: UniversalPermissionDetails[] = [];
    if (oldValue === null && newValue !== null) {
      detailsToCheck.push({
        timelineTime: { start: 1n, end: 1n },
        badgeId: { start: 1n, end: 1n },
        ownershipTime: { start: 1n, end: 1n },
        transferTime: { start: 1n, end: 1n },
        toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
      });
    } else {
      let oldVal = oldValue as CollectionMetadata;
      let newVal = newValue as CollectionMetadata;

      if (oldVal.uri !== newVal.uri || oldVal.customData !== newVal.customData) {
        detailsToCheck.push({
          timelineTime: { start: 1n, end: 1n },
          badgeId: { start: 1n, end: 1n },
          ownershipTime: { start: 1n, end: 1n },
          transferTime: { start: 1n, end: 1n },
          toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
        });
      }
    }
    return detailsToCheck;
  });

  let details = detailsToCheck.map(x => {
    return [x.timelineTime];
  }).flat();

  let err = checkTimedUpdatePermission(details, canUpdateCollectionMetadata);
  if (err) {
    return err;
  }

  return null;
}

/**
 * @category Validate Updates
 */
export function validateOffChainBalancesMetadataUpdate(
  oldOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<bigint>[],
  newOffChainBalancesMetadata: OffChainBalancesMetadataTimeline<bigint>[],
  canUpdateOffChainBalancesMetadata: TimedUpdatePermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getOffChainBalancesMetadataTimesAndValues(oldOffChainBalancesMetadata);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getOffChainBalancesMetadataTimesAndValues(newOffChainBalancesMetadata);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, {}, function (oldValue: any, newValue: any) {
    let detailsToCheck: UniversalPermissionDetails[] = [];

    if (oldValue === null && newValue !== null) {
      detailsToCheck.push({
        timelineTime: { start: 1n, end: 1n },
        badgeId: { start: 1n, end: 1n },
        ownershipTime: { start: 1n, end: 1n },
        transferTime: { start: 1n, end: 1n },
        toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
      });
    } else {
      let oldVal = oldValue as OffChainBalancesMetadata;
      let newVal = newValue as OffChainBalancesMetadata;

      if (oldVal.uri !== newVal.uri || oldVal.customData !== newVal.customData) {
        detailsToCheck.push({
          timelineTime: { start: 1n, end: 1n },
          badgeId: { start: 1n, end: 1n },
          ownershipTime: { start: 1n, end: 1n },
          transferTime: { start: 1n, end: 1n },
          toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
          permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
        });
      }
    }
    return detailsToCheck;
  });

  let details = detailsToCheck.map(x => x.timelineTime);

  let err = checkTimedUpdatePermission(details, canUpdateOffChainBalancesMetadata);
  if (err) {
    return err;
  }

  return null;
}

/**
 * @category Validate Updates
 */
export function getUpdatedStringCombinations(oldValue: any, newValue: any): UniversalPermissionDetails[] {
  let x: UniversalPermissionDetails[] = [];
  if ((oldValue === null && newValue !== null) || (oldValue !== null && newValue === null) || oldValue !== newValue) {
    x.push({
      timelineTime: { start: 1n, end: 1n },
      badgeId: { start: 1n, end: 1n },
      ownershipTime: { start: 1n, end: 1n },
      transferTime: { start: 1n, end: 1n },
      toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
    });
  }
  return x;
}

/**
 * @category Validate Updates
 */
export function getUpdatedBoolCombinations(oldValue: any, newValue: any): UniversalPermissionDetails[] {
  if ((oldValue === null && newValue !== null) || (oldValue !== null && newValue === null) || oldValue !== newValue) {
    return [{
      timelineTime: { start: 1n, end: 1n },
      badgeId: { start: 1n, end: 1n },
      ownershipTime: { start: 1n, end: 1n },
      transferTime: { start: 1n, end: 1n },
      toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
    }];
  }
  return [];
}

/**
 * @category Validate Updates
 */
export function validateManagerUpdate(
  oldManager: ManagerTimeline<bigint>[],
  newManager: ManagerTimeline<bigint>[],
  canUpdateManager: TimedUpdatePermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getManagerTimesAndValues(oldManager);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getManagerTimesAndValues(newManager);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, "", getUpdatedStringCombinations);

  let details = updatedTimelineTimes.map(x => x.timelineTime);

  let err = checkTimedUpdatePermission(details, canUpdateManager);
  if (err) {
    return err;
  }

  return null;
}


/**
 * @category Validate Updates
 */
export function validateCustomDataUpdate(
  oldCustomData: CustomDataTimeline<bigint>[],
  newCustomData: CustomDataTimeline<bigint>[],
  canUpdateCustomData: TimedUpdatePermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getCustomDataTimesAndValues(oldCustomData);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getCustomDataTimesAndValues(newCustomData);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, "", getUpdatedStringCombinations);

  let details = updatedTimelineTimes.map(x => x.timelineTime);

  let err = checkTimedUpdatePermission(details, canUpdateCustomData);
  if (err) {
    return err;
  }

  return null;
}


/**
 * @category Validate Updates
 */
export function validateStandardsUpdate(
  oldStandards: StandardsTimeline<bigint>[],
  newStandards: StandardsTimeline<bigint>[],
  canUpdateStandards: TimedUpdatePermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getStandardsTimesAndValues(oldStandards);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getStandardsTimesAndValues(newStandards);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any): UniversalPermissionDetails[] {
    if ((oldValue == null && newValue != null) || (oldValue != null && newValue == null)) {
      return [{
        timelineTime: { start: 1n, end: 1n },
        badgeId: { start: 1n, end: 1n },
        ownershipTime: { start: 1n, end: 1n },
        transferTime: { start: 1n, end: 1n },
        toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
      }];
    } else if (oldValue.length != newValue.length) {
      return [{
        timelineTime: { start: 1n, end: 1n },
        badgeId: { start: 1n, end: 1n },
        ownershipTime: { start: 1n, end: 1n },
        transferTime: { start: 1n, end: 1n },
        toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
      }];
    } else {
      for (let i = 0; i < oldValue.length; i++) {
        if (oldValue[i] != newValue[i]) {
          return [{
            timelineTime: { start: 1n, end: 1n },
            badgeId: { start: 1n, end: 1n },
            ownershipTime: { start: 1n, end: 1n },
            transferTime: { start: 1n, end: 1n },
            toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
            fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
            initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
            approvalTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
            challengeTrackerIdMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
            permittedTimes: [], forbiddenTimes: [], arbitraryValue: undefined
          }];
        }
      }
    }

    return [];
  });

  let details = updatedTimelineTimes.map(x => x.timelineTime);

  let err = checkTimedUpdatePermission(details, canUpdateStandards);
  if (err) {
    return err;
  }

  return null;
}

/**
 * @category Validate Updates
 */
export function validateContractAddressUpdate(
  oldContractAddress: ContractAddressTimeline<bigint>[],
  newContractAddress: ContractAddressTimeline<bigint>[],
  canUpdateContractAddress: TimedUpdatePermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getContractAddressTimesAndValues(oldContractAddress);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getContractAddressTimesAndValues(newContractAddress);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, "", getUpdatedStringCombinations);

  let details = updatedTimelineTimes.map(x => x.timelineTime);

  let err = checkTimedUpdatePermission(details, canUpdateContractAddress);
  if (err) {
    return err;
  }

  return null;
}

/**
 * @category Validate Updates
 */
export function validateIsArchivedUpdate(
  oldIsArchived: IsArchivedTimeline<bigint>[],
  newIsArchived: IsArchivedTimeline<bigint>[],
  canUpdateIsArchived: TimedUpdatePermission<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getIsArchivedTimesAndValues(oldIsArchived);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getIsArchivedTimesAndValues(newIsArchived);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let updatedTimelineTimes = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, false, getUpdatedBoolCombinations);

  let details = updatedTimelineTimes.map(x => x.timelineTime);

  let err = checkTimedUpdatePermission(details, canUpdateIsArchived);
  if (err) {
    return err;
  }

  return null;
}
