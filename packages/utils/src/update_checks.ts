import { BadgeMetadata, BadgeMetadataTimeline, CollectionApprovedTransfer, CollectionMetadata, CollectionMetadataTimeline, ContractAddressTimeline, CustomDataTimeline, IsArchivedTimeline, ManagerTimeline, OffChainBalancesMetadata, OffChainBalancesMetadataTimeline, StandardsTimeline, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange } from "bitbadgesjs-proto";
import { GetFirstMatchOnly, UniversalPermission, UniversalPermissionDetails, getOverlapsAndNonOverlaps } from "./overlaps";
import { checkCollectionApprovedTransferPermission, checkTimedUpdatePermission, checkTimedUpdateWithBadgeIdsPermission, getUpdateCombinationsToCheck } from "./permission_checks";
import { castBadgeMetadataToUniversalPermission, castCollectionApprovedTransferToUniversalPermission } from "./permissions";
import { getBadgeMetadataTimesAndValues, getCollectionApprovedTransferTimesAndValues, getCollectionMetadataTimesAndValues, getContractAddressTimesAndValues, getCustomDataTimesAndValues, getIsArchivedTimesAndValues, getManagerTimesAndValues, getOffChainBalancesMetadataTimesAndValues, getStandardsTimesAndValues } from "./timeline_helpers";
import { CollectionApprovedTransferPermissionWithDetails, CollectionApprovedTransferTimelineWithDetails, CollectionApprovedTransferWithDetails } from "./types/collections";

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

        permittedTimes: [],
        forbiddenTimes: [],

        badgeIds: [],
        ownershipTimes: [],
        transferTimes: [],
        toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
        initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: "", customData: "", createdBy: "" },
      },
      combinations: [{

      }],
    });
  }

  let firstMatches = GetFirstMatchOnly(castedPermissions);

  return firstMatches;
}

/**
 * @category Validate Updates
 */
export function validateCollectionApprovedTransfersUpdate(
  oldApprovedTransfers: CollectionApprovedTransferTimelineWithDetails<bigint>[],
  newApprovedTransfers: CollectionApprovedTransferTimelineWithDetails<bigint>[],
  canUpdateCollectionApprovedTransfers: CollectionApprovedTransferPermissionWithDetails<bigint>[]
): Error | null {
  let { times: oldTimes, values: oldValues } = getCollectionApprovedTransferTimesAndValues(oldApprovedTransfers);
  let oldTimelineFirstMatches = getPotentialUpdatesForTimelineValues(oldTimes, oldValues);

  let { times: newTimes, values: newValues } = getCollectionApprovedTransferTimesAndValues(newApprovedTransfers);
  let newTimelineFirstMatches = getPotentialUpdatesForTimelineValues(newTimes, newValues);

  let detailsToCheck = getUpdateCombinationsToCheck(oldTimelineFirstMatches, newTimelineFirstMatches, [], function (oldValue: any, newValue: any) {

    let oldApprovedTransfers = castCollectionApprovedTransferToUniversalPermission(oldValue as CollectionApprovedTransferWithDetails<bigint>[]);
    if (!oldApprovedTransfers) {
      throw new Error("InvalidOldValue");
    }
    let firstMatchesForOld = GetFirstMatchOnly(oldApprovedTransfers);

    let newApprovedTransfers = castCollectionApprovedTransferToUniversalPermission(newValue as CollectionApprovedTransferWithDetails<bigint>[]);
    if (!newApprovedTransfers) {
      throw new Error("InvalidNewValue");
    }
    let firstMatchesForNew = GetFirstMatchOnly(newApprovedTransfers);

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
        let oldVal = oldDetails.arbitraryValue as CollectionApprovedTransfer<bigint>;
        let newVal = newDetails.arbitraryValue as CollectionApprovedTransfer<bigint>;

        if (oldVal.approvalDetails.length !== newVal.approvalDetails.length) {
          different = true;
        } else {
          for (let i = 0; i < oldVal.approvalDetails.length; i++) {
            if (JSON.stringify(oldVal.approvalDetails[i]) !== JSON.stringify(newVal.approvalDetails[i])) {
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
