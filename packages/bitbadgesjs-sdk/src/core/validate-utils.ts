import { AddressList } from './addressLists';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps';
import { GetFirstMatchOnly, getOverlapsAndNonOverlaps } from './overlaps';
import { UintRangeArray } from './uintRanges';

/**
 * @category Validate Updates
 */
export function getPotentialUpdatesForTimelineValues(times: UintRangeArray<bigint>[], values: any[]): UniversalPermissionDetails[] {
  const castedPermissions: UniversalPermission[] = [];
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

      permanentlyPermittedTimes: UintRangeArray.From([]),
      permanentlyForbiddenTimes: UintRangeArray.From([]),

      badgeIds: UintRangeArray.From([]),
      ownershipTimes: UintRangeArray.From([]),
      transferTimes: UintRangeArray.From([]),
      toList: AddressList.AllAddresses(),
      fromList: AddressList.AllAddresses(),
      initiatedByList: AddressList.AllAddresses(),
      approvalIdList: AddressList.AllAddresses(),
      amountTrackerIdList: AddressList.AllAddresses(),
      challengeTrackerIdList: AddressList.AllAddresses(),
      usesAmountTrackerIdList: false,
      usesChallengeTrackerIdList: false
    });
  }

  const firstMatches = GetFirstMatchOnly(castedPermissions);

  return firstMatches;
}

interface CompareAndGetUpdateCombosToCheckFn {
  (oldValue: unknown, newValue: unknown): UniversalPermissionDetails[];
}

export function getUpdateCombinationsToCheck(
  firstMatchesForOld: UniversalPermissionDetails[],
  firstMatchesForNew: UniversalPermissionDetails[],
  emptyValue: unknown,
  compareAndGetUpdateCombosToCheck: CompareAndGetUpdateCombosToCheckFn
): UniversalPermissionDetails[] {
  const detailsToCheck: UniversalPermissionDetails[] = [];

  const [overlapObjects, inOldButNotNew, inNewButNotOld] = getOverlapsAndNonOverlaps(firstMatchesForOld, firstMatchesForNew);

  // Handle all old combinations that are not in the new (by comparing to empty value)
  for (const detail of inOldButNotNew) {
    const detailsToAdd = compareAndGetUpdateCombosToCheck(detail.arbitraryValue, emptyValue);
    for (const detailToAdd of detailsToAdd) {
      detailsToCheck.push({
        timelineTime: detail.timelineTime,
        badgeId: detailToAdd.badgeId,
        transferTime: detailToAdd.transferTime,
        toList: detailToAdd.toList,
        fromList: detailToAdd.fromList,
        initiatedByList: detailToAdd.initiatedByList,
        ownershipTime: detailToAdd.ownershipTime,
        approvalIdList: detailToAdd.approvalIdList,
        amountTrackerIdList: detailToAdd.amountTrackerIdList,
        challengeTrackerIdList: detailToAdd.challengeTrackerIdList,

        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: undefined
      });
    }
  }

  // Handle all new combinations that are not in the old (by comparing to empty value)
  for (const detail of inNewButNotOld) {
    const detailsToAdd = compareAndGetUpdateCombosToCheck(detail.arbitraryValue, emptyValue);
    for (const detailToAdd of detailsToAdd) {
      detailsToCheck.push({
        timelineTime: detail.timelineTime,
        badgeId: detailToAdd.badgeId,
        transferTime: detailToAdd.transferTime,
        toList: detailToAdd.toList,
        fromList: detailToAdd.fromList,
        initiatedByList: detailToAdd.initiatedByList,
        approvalIdList: detailToAdd.approvalIdList,
        amountTrackerIdList: detailToAdd.amountTrackerIdList,
        challengeTrackerIdList: detailToAdd.challengeTrackerIdList,

        ownershipTime: detailToAdd.ownershipTime,
        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: undefined
      });
    }
  }

  // Handle all overlaps (by comparing old and new values directly)
  for (const overlapObj of overlapObjects) {
    const overlap = overlapObj.overlap;
    const oldDetails = overlapObj.firstDetails;
    const newDetails = overlapObj.secondDetails;
    const detailsToAdd = compareAndGetUpdateCombosToCheck(oldDetails.arbitraryValue, newDetails.arbitraryValue);

    for (const detailToAdd of detailsToAdd) {
      detailsToCheck.push({
        timelineTime: overlap.timelineTime,
        badgeId: detailToAdd.badgeId,
        transferTime: detailToAdd.transferTime,
        toList: detailToAdd.toList,
        fromList: detailToAdd.fromList,
        initiatedByList: detailToAdd.initiatedByList,
        approvalIdList: detailToAdd.approvalIdList,
        amountTrackerIdList: detailToAdd.amountTrackerIdList,
        challengeTrackerIdList: detailToAdd.challengeTrackerIdList,
        ownershipTime: detailToAdd.ownershipTime,

        permanentlyPermittedTimes: UintRangeArray.From([]),
        permanentlyForbiddenTimes: UintRangeArray.From([]),
        arbitraryValue: undefined
      });
    }
  }

  return detailsToCheck;
}

export const AllDefaultValues: UniversalPermission = {
  permanentlyPermittedTimes: UintRangeArray.From<bigint>([]),
  permanentlyForbiddenTimes: UintRangeArray.From<bigint>([]),
  badgeIds: UintRangeArray.From<bigint>([]),
  timelineTimes: UintRangeArray.From<bigint>([]),
  transferTimes: UintRangeArray.From<bigint>([]),
  ownershipTimes: UintRangeArray.From<bigint>([]),
  fromList: AddressList.AllAddresses(),
  toList: AddressList.AllAddresses(),
  initiatedByList: AddressList.AllAddresses(),
  approvalIdList: AddressList.AllAddresses(),
  amountTrackerIdList: AddressList.AllAddresses(),
  challengeTrackerIdList: AddressList.AllAddresses(),
  usesAmountTrackerIdList: false,
  usesChallengeTrackerIdList: false,
  usesApprovalIdList: false,
  usesBadgeIds: false,
  usesTimelineTimes: false,
  usesTransferTimes: false, // Replace this with the actual usesTransferTimes property from actionPermission
  usesToList: false, // Replace this with the actual usesToList property from actionPermission
  usesFromList: false, // Replace this with the actual usesFromList property from actionPermission
  usesInitiatedByList: false, // Replace this with the actual usesInitiatedByList property from actionPermission
  usesOwnershipTimes: false, // Replace this with the actual usesOwnershipTimes property from actionPermission
  arbitraryValue: undefined // Replace this with the actual arbitraryValue property from actionPermission
};
