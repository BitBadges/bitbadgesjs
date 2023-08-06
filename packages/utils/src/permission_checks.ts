import { ActionPermission, AddressMapping, Balance, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, UintRange } from "bitbadgesjs-proto";
import { GetFirstMatchOnly, UniversalPermissionDetails, getOverlapsAndNonOverlaps, universalRemoveOverlaps } from "./overlaps";
import { castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovedTransferPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from "./permissions";
import { CollectionApprovedTransferPermissionWithDetails } from "./types/collections";
import { searchUintRangesForId } from "./uintRanges";

interface CompareAndGetUpdateCombosToCheckFn {
  (
    oldValue: unknown,
    newValue: unknown,
  ): UniversalPermissionDetails[];
}

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
        toMapping: detailToAdd.toMapping,
        fromMapping: detailToAdd.fromMapping,
        initiatedByMapping: detailToAdd.initiatedByMapping,
        ownershipTime: detailToAdd.ownershipTime,

        permittedTimes: [],
        forbiddenTimes: [],
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
        toMapping: detailToAdd.toMapping,
        fromMapping: detailToAdd.fromMapping,
        initiatedByMapping: detailToAdd.initiatedByMapping,

        ownershipTime: detailToAdd.ownershipTime,
        permittedTimes: [],
        forbiddenTimes: [],
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
        toMapping: detailToAdd.toMapping,
        fromMapping: detailToAdd.fromMapping,
        initiatedByMapping: detailToAdd.initiatedByMapping,

        ownershipTime: detailToAdd.ownershipTime,

        permittedTimes: [],
        forbiddenTimes: [],
        arbitraryValue: undefined
      });
    }
  }

  return detailsToCheck;
}


function checkNotForbidden(permission: UniversalPermissionDetails): Error | null {
  // Throw if current block time is a forbidden time
  const blockTime = BigInt(Date.now());
  const found = searchUintRangesForId(blockTime, permission.forbiddenTimes);
  if (found) {
    return new Error(
      `permission is forbidden from being executed at current time ${new Date(Number(blockTime)).toLocaleDateString() + ' ' + new Date(Number(blockTime)).toLocaleTimeString()}`
    );
  }

  return null;
}

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
      toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
      fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
      initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
      permittedTimes: [],
      forbiddenTimes: [],
      arbitraryValue: undefined
    });
  }


  const castedPermissions = castTimedUpdatePermissionToUniversalPermission(permissions);
  const permissionDetails = GetFirstMatchOnly(castedPermissions);

  return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck);
}

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
          toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
          fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
          initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
          permittedTimes: [],
          forbiddenTimes: [],
          arbitraryValue: undefined
        });
      }
    }
  }

  const castedPermissions = castBalancesActionPermissionToUniversalPermission(permissions);
  const permissionDetails = GetFirstMatchOnly(castedPermissions);

  return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck);
}

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
          toMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
          fromMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
          initiatedByMapping: { mappingId: 'AllWithMint', addresses: [], includeAddresses: false, uri: '', customData: '' },
          permittedTimes: [],
          forbiddenTimes: [],
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

export function checkCollectionApprovedTransferPermission(
  details: {
    timelineTimes: UintRange<bigint>[],
    badgeIds: UintRange<bigint>[],
    ownershipTimes: UintRange<bigint>[],
    transferTimes: UintRange<bigint>[],
    toMapping: AddressMapping,
    fromMapping: AddressMapping,
    initiatedByMapping: AddressMapping,
  }[],
  permissions: CollectionApprovedTransferPermissionWithDetails<bigint>[]
): Error | null {
  const castedPermissions = castCollectionApprovedTransferPermissionToUniversalPermission(
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
              toMapping: detail.toMapping,
              fromMapping: detail.fromMapping,
              initiatedByMapping: detail.initiatedByMapping,
              permittedTimes: [],
              forbiddenTimes: [],
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

// export function checkUserApprovedOutgoingTransferPermission(
//   detailsToCheck: UniversalPermissionDetails[],
//   permissions: UserApprovedOutgoingTransferPermission<bigint>[],
//   managerAddress: string
// ): Error | null {
//   const castedPermissions = castUserApprovedOutgoingTransferPermissionToUniversalPermission(
//     managerAddress,
//     permissions
//   );
//   const permissionDetails = GetFirstMatchOnly(castedPermissions);

//   return checkNotForbiddenForAllOverlaps(
//     permissionDetails,
//     detailsToCheck
//   );
// }

// export function checkUserApprovedIncomingTransferPermission(
//   detailsToCheck: UniversalPermissionDetails[],
//   permissions: UserApprovedIncomingTransferPermission<bigint>[],
//   managerAddress: string
// ): Error | null {
//   const castedPermissions = castUserApprovedIncomingTransferPermissionToUniversalPermission(
//     managerAddress,
//     permissions
//   );
//   const permissionDetails = GetFirstMatchOnly(castedPermissions);

//   return checkNotForbiddenForAllOverlaps(
//     permissionDetails,
//     detailsToCheck
//   );
// }

export function checkNotForbiddenForAllOverlaps(
  permissionDetails: UniversalPermissionDetails[],
  detailsToCheck: UniversalPermissionDetails[],
  usesMappings?: boolean
): Error | null {
  let usesBadgeIds = true;
  let usesTimelineTimes = true;
  let usesTransferTimes = true;
  let usesOwnershipTimes = true;
  let usesToMappings = true;
  let usesFromMappings = true;
  let usesInitiatedByMappings = true;

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

    if (!usesMappings) {
      usesToMappings = false;
      detailToCheck.toMapping = { mappingId: '', addresses: [], includeAddresses: false, uri: '', customData: '' }
    }

    if (!usesMappings) {
      usesFromMappings = false;
      detailToCheck.fromMapping = { mappingId: '', addresses: [], includeAddresses: false, uri: '', customData: '' }
    }

    if (!usesMappings) {
      usesInitiatedByMappings = false;
      detailToCheck.initiatedByMapping = { mappingId: '', addresses: [], includeAddresses: false, uri: '', customData: '' }
    }
  }

  // Validate that for each updated timeline time, the current time is permitted
  // We iterate through all explicitly defined permissions (permissionDetails)
  // If we find a match for some timeline time, we check that the current time is not forbidden
  for (const permissionDetail of permissionDetails) {
    for (const detailToCheck of detailsToCheck) {
      const [, overlap] = universalRemoveOverlaps(permissionDetail, detailToCheck);

      if (overlap.length > 0) {
        const err = checkNotForbidden(permissionDetail); // forbiddenTimes and permittedTimes are stored in here
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

          if (usesToMappings) {
            errStr += ` for the to mappings ${permissionDetail.toMapping.mappingId}`;
          }

          if (usesFromMappings) {
            errStr += ` for the from mappings ${permissionDetail.fromMapping.mappingId}`;
          }

          if (usesInitiatedByMappings) {
            errStr += ` for the initiated by mappings ${permissionDetail.initiatedByMapping.mappingId}`;
          }

          return new Error(errStr);
        }
      }
    }
  }

  return null;
}
