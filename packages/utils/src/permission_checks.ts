import { ActionPermission, AddressList, Balance, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange } from "bitbadgesjs-proto";
import { getReservedAddressList } from "./addressLists";
import { GetFirstMatchOnly, UniversalPermissionDetails, getOverlapsAndNonOverlaps, universalRemoveOverlaps } from "./overlaps";
import { castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission, castUserIncomingApprovalPermissionToCollectionApprovalPermission, castUserOutgoingApprovalPermissionToCollectionApprovalPermission } from "./permissions";
import { CollectionApprovalPermissionWithDetails, UserIncomingApprovalPermissionWithDetails, UserOutgoingApprovalPermissionWithDetails } from "./types/collections";
import { searchUintRangesForId } from "./uintRanges";

interface CompareAndGetUpdateCombosToCheckFn {
  (
    oldValue: unknown,
    newValue: unknown,
  ): UniversalPermissionDetails[];
}

/**
 * @category Validate Permissions
 */
export function getUpdateCombinationsToCheck(
  firstMatchesForOld: UniversalPermissionDetails[],
  firstMatchesForNew: UniversalPermissionDetails[],
  emptyValue: unknown,
  compareAndGetUpdateCombosToCheck: CompareAndGetUpdateCombosToCheckFn
): UniversalPermissionDetails[] {
  const detailsToCheck: UniversalPermissionDetails[] = [];

  const [
    overlapObjects,
    inOldButNotNew,
    inNewButNotOld,
  ] = getOverlapsAndNonOverlaps(firstMatchesForOld, firstMatchesForNew);

  // Handle all old combinations that are not in the new (by comparing to empty value)
  for (const detail of inOldButNotNew) {
    const detailsToAdd = compareAndGetUpdateCombosToCheck(
      detail.arbitraryValue,
      emptyValue,
    );
    for (const detailToAdd of detailsToAdd) {
      detailsToCheck.push({
        timelineTime: detail.timelineTime,
        badgeId: detailToAdd.badgeId,
        transferTime: detailToAdd.transferTime,
        toList: detailToAdd.toList,
        fromList: detailToAdd.fromList,
        initiatedByList: detailToAdd.initiatedByList,
        ownershipTime: detailToAdd.ownershipTime,
        amountTrackerIdList: detailToAdd.amountTrackerIdList,
        challengeTrackerIdList: detailToAdd.challengeTrackerIdList,

        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: [],
        arbitraryValue: undefined
      });
    }
  }

  // Handle all new combinations that are not in the old (by comparing to empty value)
  for (const detail of inNewButNotOld) {
    const detailsToAdd = compareAndGetUpdateCombosToCheck(
      detail.arbitraryValue,
      emptyValue,
    );
    for (const detailToAdd of detailsToAdd) {
      detailsToCheck.push({
        timelineTime: detail.timelineTime,
        badgeId: detailToAdd.badgeId,
        transferTime: detailToAdd.transferTime,
        toList: detailToAdd.toList,
        fromList: detailToAdd.fromList,
        initiatedByList: detailToAdd.initiatedByList,
        amountTrackerIdList: detailToAdd.amountTrackerIdList,
        challengeTrackerIdList: detailToAdd.challengeTrackerIdList,


        ownershipTime: detailToAdd.ownershipTime,
        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: [],
        arbitraryValue: undefined
      });
    }
  }

  // Handle all overlaps (by comparing old and new values directly)
  for (const overlapObj of overlapObjects) {
    const overlap = overlapObj.overlap;
    const oldDetails = overlapObj.firstDetails;
    const newDetails = overlapObj.secondDetails;
    const detailsToAdd = compareAndGetUpdateCombosToCheck(
      oldDetails.arbitraryValue,
      newDetails.arbitraryValue
    );

    for (const detailToAdd of detailsToAdd) {
      detailsToCheck.push({
        timelineTime: overlap.timelineTime,
        badgeId: detailToAdd.badgeId,
        transferTime: detailToAdd.transferTime,
        toList: detailToAdd.toList,
        fromList: detailToAdd.fromList,
        initiatedByList: detailToAdd.initiatedByList,
        amountTrackerIdList: detailToAdd.amountTrackerIdList,
        challengeTrackerIdList: detailToAdd.challengeTrackerIdList,
        ownershipTime: detailToAdd.ownershipTime,

        permanentlyPermittedTimes: [],
        permanentlyForbiddenTimes: [],
        arbitraryValue: undefined
      });
    }
  }

  return detailsToCheck;
}


function checkNotForbidden(permission: UniversalPermissionDetails): Error | null {
  // Throw if current block time is a forbidden time
  const blockTime = BigInt(Date.now());
  const [, found] = searchUintRangesForId(blockTime, permission.permanentlyForbiddenTimes);
  if (found) {
    return new Error(
      `permission is forbidden from being executed at current time ${new Date(Number(blockTime)).toLocaleDateString() + ' ' + new Date(Number(blockTime)).toLocaleTimeString()}`
    );
  }

  return null;
}

/**
 *
 *
 * Checks an ActionPermission to see if it is currently valid and not forbidden for the current time
 *
 *  @category Validate Permissions
 */
export function checkActionPermission(permissions: ActionPermission<bigint>[]): Error | null {
  const castedPermissions = castActionPermissionToUniversalPermission(permissions);
  const permissionDetails = GetFirstMatchOnly(castedPermissions);

  // In this case we only care about the first match since we have no extra criteria
  for (const permissionDetail of permissionDetails) {
    const err = checkNotForbidden(permissionDetail);
    if (err) {
      return err;
    }
  }

  return null;
}

/**
 *
 * Checks a TimedUpdatePermission to see if it is currently valid and not forbidden for the current time and provided timeline times
 * @category Validate Permissions
 *
 */
export function checkTimedUpdatePermission(
  timelineTimes: UintRange<bigint>[],
  permissions: TimedUpdatePermission<bigint>[]
): Error | null {
  let detailsToCheck: UniversalPermissionDetails[] = [];
  for (const timelineTime of timelineTimes) {
    detailsToCheck.push({
      timelineTime,

      badgeId: { start: -1n, end: -1n },
      ownershipTime: { start: -1n, end: -1n },
      transferTime: { start: -1n, end: -1n },
      toList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
      fromList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
      initiatedByList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
      amountTrackerIdList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
      challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
      permanentlyPermittedTimes: [],
      permanentlyForbiddenTimes: [],
      arbitraryValue: undefined
    });
  }


  const castedPermissions = castTimedUpdatePermissionToUniversalPermission(permissions);
  const permissionDetails = GetFirstMatchOnly(castedPermissions);

  return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck);
}

/**
 * Checks a BalancesActionPermission to see if it is currently valid and not forbidden for the current time and provided balances
 *
 * @category Validate Permissions
 */
export function checkBalancesActionPermission(
  balances: Balance<bigint>[],
  permissions: BalancesActionPermission<bigint>[]
): Error | null {
  let detailsToCheck: UniversalPermissionDetails[] = [];
  for (const badgeToCreate of balances) {
    for (const badgeIdRange of badgeToCreate.badgeIds) {
      for (const ownershipTime of badgeToCreate.ownershipTimes) {

        detailsToCheck.push({
          badgeId: badgeIdRange,
          ownershipTime: ownershipTime,

          timelineTime: { start: -1n, end: -1n },

          transferTime: { start: -1n, end: -1n },
          toList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          fromList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          initiatedByList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          amountTrackerIdList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [],
          arbitraryValue: undefined
        });
      }
    }
  }

  const castedPermissions = castBalancesActionPermissionToUniversalPermission(permissions);
  const permissionDetails = GetFirstMatchOnly(castedPermissions);

  return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck);
}

/**
 *
 * Checks a TimedUpdateWithBadgeIdsPermission to see if it is currently valid and not forbidden for the current time and provided timeline times and badge ids
 * @category Validate Permissions
*/
export function checkTimedUpdateWithBadgeIdsPermission(
  details: {
    timelineTimes: UintRange<bigint>[],
    badgeIds: UintRange<bigint>[],
  }[],
  permissions: TimedUpdateWithBadgeIdsPermission<bigint>[]
): Error | null {
  let detailsToCheck: UniversalPermissionDetails[] = [];
  for (const detail of details) {
    for (const timelineTime of detail.timelineTimes) {
      for (const badgeId of detail.badgeIds) {
        detailsToCheck.push({
          timelineTime,
          badgeId,

          ownershipTime: { start: -1n, end: -1n },
          transferTime: { start: -1n, end: -1n },
          toList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          fromList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          initiatedByList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          amountTrackerIdList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          challengeTrackerIdList: { listId: 'AllWithMint', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" },
          permanentlyPermittedTimes: [],
          permanentlyForbiddenTimes: [],
          arbitraryValue: undefined
        });
      }
    }
  }


  const castedPermissions = castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(
    permissions
  );
  const permissionDetails = GetFirstMatchOnly(castedPermissions);

  return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck);
}

/**
 * Checks a CollectionApprovalPermission to see if it is currently valid and not forbidden for the current time and provided transfer details.
 *
 * @category Validate Permissions
 */
export function checkCollectionApprovalPermission(
  details: {
    timelineTimes: UintRange<bigint>[],
    badgeIds: UintRange<bigint>[],
    ownershipTimes: UintRange<bigint>[],
    transferTimes: UintRange<bigint>[],
    toList: AddressList,
    fromList: AddressList,
    initiatedByList: AddressList,
    amountTrackerIdList: AddressList,
    challengeTrackerIdList: AddressList,
  }[],
  permissions: CollectionApprovalPermissionWithDetails<bigint>[]
): Error | null {
  const castedPermissions = castCollectionApprovalPermissionToUniversalPermission(
    permissions
  );
  const permissionDetails = GetFirstMatchOnly(castedPermissions);

  let detailsToCheck: UniversalPermissionDetails[] = [];
  for (const detail of details) {
    for (const timelineTime of detail.timelineTimes) {
      for (const badgeId of detail.badgeIds) {
        for (const ownershipTime of detail.ownershipTimes) {
          for (const transferTime of detail.transferTimes) {
            detailsToCheck.push({
              timelineTime,
              badgeId,
              ownershipTime: ownershipTime,
              transferTime,
              toList: detail.toList,
              fromList: detail.fromList,
              initiatedByList: detail.initiatedByList,
              amountTrackerIdList: detail.amountTrackerIdList,
              challengeTrackerIdList: detail.challengeTrackerIdList,
              permanentlyPermittedTimes: [],
              permanentlyForbiddenTimes: [],
              arbitraryValue: undefined
            });
          }
        }
      }
    }
  }

  return checkNotForbiddenForAllOverlaps(
    permissionDetails,
    detailsToCheck,
    true
  );
}

/**
 * Checks a UserOutgoingApprovalPermission to see if it is currently valid and not forbidden for the current time and provided transfer details.
 *
 * @category Validate Permissions
 *
 */
export function checkUserOutgoingApprovalPermission(
  detailsToCheck: {
    timelineTimes: UintRange<bigint>[],
    badgeIds: UintRange<bigint>[],
    ownershipTimes: UintRange<bigint>[],
    transferTimes: UintRange<bigint>[],
    toList: AddressList,
    initiatedByList: AddressList,
    amountTrackerIdList: AddressList,
    challengeTrackerIdList: AddressList,
  }[],
  permissions: UserOutgoingApprovalPermissionWithDetails<bigint>[],
  userAddress: string
): Error | null {
  const newDetails = detailsToCheck.map(x => {
    return {
      ...x,
      fromList: getReservedAddressList(userAddress),
    }
  })

  const castedPermissions = castUserOutgoingApprovalPermissionToCollectionApprovalPermission(
    permissions,
    userAddress
  );
  return checkCollectionApprovalPermission(newDetails, castedPermissions);
}

/**
 * Checks a UserIncomingApprovalPermission to see if it is currently valid and not forbidden for the current time and provided transfer details.
 * @category Validate Permissions
 */
export function checkUserIncomingApprovalPermission(
  detailsToCheck: {
    timelineTimes: UintRange<bigint>[],
    badgeIds: UintRange<bigint>[],
    ownershipTimes: UintRange<bigint>[],
    transferTimes: UintRange<bigint>[],
    fromList: AddressList,
    initiatedByList: AddressList,
    amountTrackerIdList: AddressList,
    challengeTrackerIdList: AddressList,
  }[],
  permissions: UserIncomingApprovalPermissionWithDetails<bigint>[],
  userAddress: string
): Error | null {
  const newDetails = detailsToCheck.map(x => {
    return {
      ...x,
      toList: getReservedAddressList(userAddress),
    }
  })

  const castedPermissions = castUserIncomingApprovalPermissionToCollectionApprovalPermission(
    permissions,
    userAddress
  );
  return checkCollectionApprovalPermission(newDetails, castedPermissions);
}

/**
 * @category Validate Permissions
 */
export function checkNotForbiddenForAllOverlaps(
  permissionDetails: UniversalPermissionDetails[],
  detailsToCheck: UniversalPermissionDetails[],
  usesLists?: boolean
): Error | null {
  let usesBadgeIds = true;
  let usesTimelineTimes = true;
  let usesTransferTimes = true;
  let usesOwnershipTimes = true;
  let usesToLists = true;
  let usesFromLists = true;
  let usesInitiatedByLists = true;
  let usesAmountTrackerIdLists = true;
  let usesChallengeTrackerIdLists = true;

  // Apply dummy ranges to all detailsToCheck
  for (const detailToCheck of detailsToCheck) {
    if (detailToCheck.badgeId.start === -1n) {
      usesBadgeIds = false;
      detailToCheck.badgeId = { start: BigInt(1n), end: BigInt(1n) }; // Dummy range
    }

    if (detailToCheck.timelineTime.start === -1n) {
      usesTimelineTimes = false;
      detailToCheck.timelineTime = { start: BigInt(1n), end: BigInt(1n) }; // Dummy range
    }

    if (detailToCheck.transferTime.start === -1n) {
      usesTransferTimes = false;
      detailToCheck.transferTime = { start: BigInt(1n), end: BigInt(1n) }; // Dummy range
    }

    if (detailToCheck.ownershipTime.start === -1n) {
      usesOwnershipTimes = false;
      detailToCheck.ownershipTime = { start: BigInt(1n), end: BigInt(1n) }; // Dummy range
    }

    if (!usesLists) {
      usesToLists = false;
      detailToCheck.toList = { listId: '', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" }
    }

    if (!usesLists) {
      usesFromLists = false;
      detailToCheck.fromList = { listId: '', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" }
    }

    if (!usesLists) {
      usesInitiatedByLists = false;
      detailToCheck.initiatedByList = { listId: '', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" }
    }

    if (!usesLists) {
      usesAmountTrackerIdLists = false;
      detailToCheck.amountTrackerIdList = { listId: '', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" }
    }

    if (!usesLists) {
      usesChallengeTrackerIdLists = false;
      detailToCheck.challengeTrackerIdList = { listId: '', addresses: [], allowlist: false, uri: "", customData: "", createdBy: "" }
    }
  }

  // Validate that for each updated timeline time, the current time is permitted
  // We iterate through all explicitly defined permissions (permissionDetails)
  // If we find a match for some timeline time, we check that the current time is not forbidden
  for (const permissionDetail of permissionDetails) {
    for (const detailToCheck of detailsToCheck) {
      const [, overlap] = universalRemoveOverlaps(permissionDetail, detailToCheck);

      if (overlap.length > 0) {
        const err = checkNotForbidden(permissionDetail); // permanentlyForbiddenTimes and permanentlyPermittedTimes are stored in here
        if (err) {
          let errStr = err.message;
          if (usesTimelineTimes) {
            errStr += ` for the timeline times ${new Date(Number(permissionDetail.timelineTime.start)).toLocaleDateString() + ' ' + new Date(Number(permissionDetail.timelineTime.start)).toLocaleTimeString()} to ${new Date(Number(permissionDetail.timelineTime.end)).toLocaleDateString() + ' ' + new Date(Number(permissionDetail.timelineTime.end)).toLocaleTimeString()}`;
          }

          if (usesTransferTimes) {
            errStr += ` for the transfer times ${new Date(Number(permissionDetail.transferTime.start)).toLocaleDateString() + ' ' + new Date(Number(permissionDetail.transferTime.start)).toLocaleTimeString()} to ${new Date(Number(permissionDetail.transferTime.end)).toLocaleDateString() + ' ' + new Date(Number(permissionDetail.transferTime.end)).toLocaleTimeString()}`;
          }

          if (usesBadgeIds) {
            errStr += ` for the badge ids ${permissionDetail.badgeId.start} to ${permissionDetail.badgeId.end}`;
          }

          if (usesOwnershipTimes) {
            errStr += ` for the ownership times ${new Date(Number(permissionDetail.ownershipTime.start)).toLocaleDateString() + ' ' + new Date(Number(permissionDetail.ownershipTime.start)).toLocaleTimeString()} to ${new Date(Number(permissionDetail.ownershipTime.end)).toLocaleDateString() + ' ' + new Date(Number(permissionDetail.ownershipTime.end)).toLocaleTimeString()}`;
          }

          if (usesToLists) {
            errStr += ` for the to lists ${permissionDetail.toList.listId}`;
          }

          if (usesFromLists) {
            errStr += ` for the from lists ${permissionDetail.fromList.listId}`;
          }

          if (usesInitiatedByLists) {
            errStr += ` for the initiated by lists ${permissionDetail.initiatedByList.listId}`;
          }

          //TODO: this won't be right
          if (usesAmountTrackerIdLists) {
            errStr += ` for the approval tracker id ${permissionDetail.amountTrackerIdList.listId}`;
          }

          if (usesChallengeTrackerIdLists) {
            errStr += ` for the challenge tracker id ${permissionDetail.challengeTrackerIdList.listId}`;
          }

          return new Error(errStr);
        }
      }
    }
  }

  return null;
}
