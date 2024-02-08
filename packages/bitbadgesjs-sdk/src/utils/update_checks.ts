import { ApprovalCriteria, BadgeMetadata, BadgeMetadataTimeline, CollectionMetadata, CollectionMetadataTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadata, OffChainBalancesMetadataTimeline, StandardsTimeline, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange, deepCopy } from "..";
import { GetFirstMatchOnly, GetUintRangesWithOptions, UniversalPermission, UniversalPermissionDetails, getOverlapsAndNonOverlaps } from "./overlaps";
import { checkIfCollectionApprovalPermissionPermits, checkIfTimedUpdatePermissionPermits, checkIfTimedUpdateWithBadgeIdsPermissionPermits, getUpdateCombinationsToCheck } from "./permission_checks";
import { castBadgeMetadataToUniversalPermission, castCollectionApprovalToUniversalPermission } from "./permissions";
import { getBadgeMetadataTimesAndValues, getCollectionMetadataTimesAndValues, getCustomDataTimesAndValues, getIsArchivedTimesAndValues, getManagerTimesAndValues, getOffChainBalancesMetadataTimesAndValues, getStandardsTimesAndValues } from "./timeline_helpers";
import { CollectionApprovalPermissionWithDetails, CollectionApprovalWithDetails } from "./types/collections";
import { expandCollectionApprovals } from "./userApprovals";

/**
 * @category Validate Updates
 */
export function getPotentialUpdatesForTimelineValues(times: UintRange<bigint>[][], values: any[]): UniversalPermissionDetails[] {
  let castedPermissions: UniversalPermission[] = [];
  for (let idx = 0; idx < times.length; idx++) {
    castedPermissions.push({
      timelineTimes: times[idx],
      arbitraryValue: values[idx],
      usesTimelineTimes: true,
      usesBadgeIds: false,
      usesOwnershipTimes: false,
      usesTransferTimes: false,
      usesToList: false,
      usesFromList: false,
      usesInitiatedByList: false,
      usesApprovalIdList: false,

      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],

      badgeIds: [],
      ownershipTimes: [],
      transferTimes: [],
      toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      usesAmountTrackerIdList: false,
      usesChallengeTrackerIdList: false,
    });
  }

  let firstMatches = GetFirstMatchOnly(castedPermissions);

  return firstMatches;
}

interface ApprovalCriteriaWithIsApproved {
  isApproved: boolean;
  approvalCriteria: (ApprovalCriteria<bigint> | null)[];
}

function getFirstMatchOnlyWithApprovalCriteria(permissions: UniversalPermission[]): UniversalPermissionDetails[] {
  const handled: UniversalPermissionDetails[] = [];

  for (const permission of permissions) {

    const badgeIds = GetUintRangesWithOptions(permission.badgeIds, permission.usesBadgeIds);
    const timelineTimes = GetUintRangesWithOptions(permission.timelineTimes, permission.usesTimelineTimes);
    const transferTimes = GetUintRangesWithOptions(permission.transferTimes, permission.usesTransferTimes);
    const ownershipTimes = GetUintRangesWithOptions(permission.ownershipTimes, permission.usesOwnershipTimes);
    const permanentlyPermittedTimes = GetUintRangesWithOptions(permission.permanentlyPermittedTimes, true);
    const permanentlyForbiddenTimes = GetUintRangesWithOptions(permission.permanentlyForbiddenTimes, true);

    for (const badgeId of badgeIds) {
      for (const timelineTime of timelineTimes) {
        for (const transferTime of transferTimes) {
          for (const ownershipTime of ownershipTimes) {
            const approvalCriteria: ApprovalCriteria<bigint>[] = [
              permission.arbitraryValue.approvalCriteria ?? null,
            ];
            const isApproved: boolean = permission.arbitraryValue.isApproved;
            const arbValue: ApprovalCriteriaWithIsApproved = {
              isApproved: isApproved,
              approvalCriteria: approvalCriteria,
            };

            const brokenDown: UniversalPermissionDetails[] = [
              {
                badgeId: badgeId,
                timelineTime: timelineTime,
                transferTime: transferTime,
                ownershipTime: ownershipTime,
                toList: permission.toList,
                fromList: permission.fromList,
                initiatedByList: permission.initiatedByList,
                approvalIdList: permission.approvalIdList,
                amountTrackerIdList: permission.amountTrackerIdList,
                challengeTrackerIdList: permission.challengeTrackerIdList,
                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,
                arbitraryValue: arbValue,
              },
            ];

            const [overlaps, inBrokenDownButNotHandled, inHandledButNotBrokenDown] = getOverlapsAndNonOverlaps(brokenDown, handled);
            handled.length = 0;

            handled.push(...inHandledButNotBrokenDown);
            handled.push(...inBrokenDownButNotHandled);

            for (const overlap of overlaps) {
              const mergedApprovalCriteria: (ApprovalCriteria<bigint> | null)[] = overlap.secondDetails.arbitraryValue.approvalCriteria.concat(overlap.firstDetails.arbitraryValue.approvalCriteria);

              const isApprovedFirst: boolean = overlap.firstDetails.arbitraryValue.isApproved;
              const isApprovedSecond: boolean = overlap.secondDetails.arbitraryValue.isApproved;
              const isApproved: boolean = isApprovedFirst && isApprovedSecond;

              const newArbValue: ApprovalCriteriaWithIsApproved = {
                isApproved: isApproved,
                approvalCriteria: mergedApprovalCriteria,
              };

              handled.push({
                timelineTime: overlap.overlap.timelineTime,
                badgeId: overlap.overlap.badgeId,
                transferTime: overlap.overlap.transferTime,
                ownershipTime: overlap.overlap.ownershipTime,
                toList: overlap.overlap.toList,
                fromList: overlap.overlap.fromList,
                initiatedByList: overlap.overlap.initiatedByList,
                approvalIdList: overlap.overlap.approvalIdList,
                amountTrackerIdList: overlap.overlap.amountTrackerIdList,
                challengeTrackerIdList: overlap.overlap.challengeTrackerIdList,
                permanentlyPermittedTimes: permanentlyPermittedTimes,
                permanentlyForbiddenTimes: permanentlyForbiddenTimes,
                arbitraryValue: newArbValue,
              });
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
 * Validates if an update of collection approvals (old -> new) is valid according to the permissions
 *
 * @category Validate Updates
 */
export function validateCollectionApprovalsUpdate(
  oldApprovals: CollectionApprovalWithDetails<bigint>[],
  newApprovals: CollectionApprovalWithDetails<bigint>[],
  canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails<bigint>[]
): Error | null {
  const dummyRanges = [[{ start: 1n, end: 1n }]]
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(deepCopy(dummyRanges), [deepCopy(oldApprovals)]);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(deepCopy(dummyRanges), [deepCopy(newApprovals)]);

  let detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any) {
    let expandedOldApprovals = expandCollectionApprovals(oldValue as CollectionApprovalWithDetails<bigint>[]);
    let expandedNewApprovals = expandCollectionApprovals(newValue as CollectionApprovalWithDetails<bigint>[]);

    let oldApprovals = castCollectionApprovalToUniversalPermission(expandedOldApprovals);
    if (!oldApprovals) {
      throw new Error("InvalidOldValue");
    }
    let newApprovals = castCollectionApprovalToUniversalPermission(expandedNewApprovals);
    if (!newApprovals) {
      throw new Error("InvalidNewValue");
    }

    let firstMatchesForOld = getFirstMatchOnlyWithApprovalCriteria(oldApprovals);
    let firstMatchesForNew = getFirstMatchOnlyWithApprovalCriteria(newApprovals);



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
        const oldArbVal: ApprovalCriteriaWithIsApproved = oldDetails.arbitraryValue as ApprovalCriteriaWithIsApproved;
        const newArbVal: ApprovalCriteriaWithIsApproved = newDetails.arbitraryValue as ApprovalCriteriaWithIsApproved;

        const oldVal = oldArbVal.approvalCriteria;
        const newVal = newArbVal.approvalCriteria;

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
      toList: x.toList,
      fromList: x.fromList,
      initiatedByList: x.initiatedByList,
      approvalIdList: x.approvalIdList,
      amountTrackerIdList: x.amountTrackerIdList,
      challengeTrackerIdList: x.challengeTrackerIdList,
    }
    return result;
  });

  let err = checkIfCollectionApprovalPermissionPermits(details, canUpdateCollectionApprovals);
  if (err) {
    return err;
  }

  return null;
}


/**
 * Validates if an update of badge approvals (old -> new) is valid according to the permissions
 *
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
      toList: x.toList,
      fromList: x.fromList,
      initiatedByList: x.initiatedByList,
    }
    return result;
  });

  let err = checkIfTimedUpdateWithBadgeIdsPermissionPermits(details, canUpdateBadgeMetadata);
  if (err) {
    return err;
  }

  return null;
}

/**
 * Validates if an update of collection approvals (old -> new) is valid according to the permissions
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
        toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
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
          toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },

          amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
        });
      }
    }
    return detailsToCheck;
  });

  let details = detailsToCheck.map(x => {
    return [x.timelineTime];
  }).flat();

  let err = checkIfTimedUpdatePermissionPermits(details, canUpdateCollectionMetadata);
  if (err) {
    return err;
  }

  return null;
}

/**
 *
 * Validates if an update of off-chain balances metadata (old -> new) is valid according to the permissions
 *
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
        toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },

        amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
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
          toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },

          amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
          permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
        });
      }
    }
    return detailsToCheck;
  });

  let details = detailsToCheck.map(x => x.timelineTime);

  let err = checkIfTimedUpdatePermissionPermits(details, canUpdateOffChainBalancesMetadata);
  if (err) {
    return err;
  }

  return null;
}

/**
 * Validates if an update of standards (old -> new) is valid according to the permissions
 *
 * @category Validate Updates
 *
 *
 */
export function getUpdatedStringCombinations(oldValue: any, newValue: any): UniversalPermissionDetails[] {
  let x: UniversalPermissionDetails[] = [];
  if ((oldValue === null && newValue !== null) || (oldValue !== null && newValue === null) || oldValue !== newValue) {
    x.push({
      timelineTime: { start: 1n, end: 1n },
      badgeId: { start: 1n, end: 1n },
      ownershipTime: { start: 1n, end: 1n },
      transferTime: { start: 1n, end: 1n },
      toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },

      amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
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
      toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },

      amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
      permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
    }];
  }
  return [];
}

/**
 * Validates if an update of manager (old -> new) is valid according to the permissions
 *
 *  @category Validate Updates
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

  let err = checkIfTimedUpdatePermissionPermits(details, canUpdateManager);
  if (err) {
    return err;
  }

  return null;
}


/**
 * Validates if an update of custom data (old -> new) is valid according to the permissions
 *
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

  let err = checkIfTimedUpdatePermissionPermits(details, canUpdateCustomData);
  if (err) {
    return err;
  }

  return null;
}


/**
 * Validates if an update of standards (old -> new) is valid according to the permissions
 *
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
        toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },

        amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
      }];
    } else if (oldValue.length != newValue.length) {
      return [{
        timelineTime: { start: 1n, end: 1n },
        badgeId: { start: 1n, end: 1n },
        ownershipTime: { start: 1n, end: 1n },
        transferTime: { start: 1n, end: 1n },
        toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },

        amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
        permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
      }];
    } else {
      for (let i = 0; i < oldValue.length; i++) {
        if (oldValue[i] != newValue[i]) {
          return [{
            timelineTime: { start: 1n, end: 1n },
            badgeId: { start: 1n, end: 1n },
            ownershipTime: { start: 1n, end: 1n },
            transferTime: { start: 1n, end: 1n },
            toList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
            fromList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
            initiatedByList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
            approvalIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
            amountTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
            challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], whitelist: false, uri: "", customData: "", createdBy: "" },
            permanentlyPermittedTimes: [], permanentlyForbiddenTimes: [], arbitraryValue: undefined
          }];
        }
      }
    }

    return [];
  });

  let details = updatedTimelineTimes.map(x => x.timelineTime);

  let err = checkIfTimedUpdatePermissionPermits(details, canUpdateStandards);
  if (err) {
    return err;
  }

  return null;
}

/**
 *
 *
 * Validates if an update of isArchived (old -> new) is valid according to the permissions
 *
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

  let err = checkIfTimedUpdatePermissionPermits(details, canUpdateIsArchived);
  if (err) {
    return err;
  }

  return null;
}
