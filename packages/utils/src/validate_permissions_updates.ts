import { ActionPermission, BalancesActionPermission, TimedUpdatePermission, TimedUpdateWithBadgeIdsPermission, deepCopy } from "bitbadgesjs-proto";
import { GetFirstMatchOnly, UniversalPermission, UniversalPermissionDetails, getOverlapsAndNonOverlaps } from "./overlaps";
import { castActionPermissionToUniversalPermission, castBalancesActionPermissionToUniversalPermission, castCollectionApprovalPermissionToUniversalPermission, castTimedUpdatePermissionToUniversalPermission, castTimedUpdateWithBadgeIdsPermissionToUniversalPermission } from "./permissions";
import { CollectionApprovalPermissionWithDetails, CollectionPermissionsWithDetails } from "./types/collections";
import { removeUintRangesFromUintRanges } from "./uintRanges";
//TODO: Add validate basic logic

/**
 * Validate if a balance permission update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *
 * @category Validate Updates
 */
export function validateBalancesActionPermissionUpdate(
  oldPermissions: BalancesActionPermission<bigint>[],
  newPermissions: BalancesActionPermission<bigint>[]
): Error | null {

  // const errorOldPermissions = validateBalancesActionPermission(oldPermissions);
  // if (errorOldPermissions) {
  //   return new Error(`Error validating old permissions: ${errorOldPermissions}`);
  // }

  // const errorNewPermissions = validateBalancesActionPermission(newPermissions);
  // if (errorNewPermissions) {
  //   return new Error(`Error validating new permissions: ${errorNewPermissions}`);
  // }

  const castedOldPermissions: UniversalPermission[] = castBalancesActionPermissionToUniversalPermission(oldPermissions);
  const castedNewPermissions: UniversalPermission[] = castBalancesActionPermissionToUniversalPermission(newPermissions);

  const err = validateUniversalPermissionUpdate(
    GetFirstMatchOnly(castedOldPermissions),
    GetFirstMatchOnly(castedNewPermissions)
  );
  if (err) {
    return new Error(`Error validating update in permissions: ${err}`);
  }

  return null;
}

/**
 *
 * Validate if a timed update permission update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *
 * @category Validate Updates
 */
export function validateTimedUpdatePermissionUpdate(
  oldPermissions: TimedUpdatePermission<bigint>[],
  newPermissions: TimedUpdatePermission<bigint>[]
): Error | null {

  // const errorOldPermissions = validateTimedUpdatePermission(oldPermissions);
  // if (errorOldPermissions) {
  //   return new Error(`Error validating old permissions: ${errorOldPermissions}`);
  // }

  // const errorNewPermissions = validateTimedUpdatePermission(newPermissions);
  // if (errorNewPermissions) {
  //   return new Error(`Error validating new permissions: ${errorNewPermissions}`);
  // }

  const castedOldPermissions: UniversalPermission[] = castTimedUpdatePermissionToUniversalPermission(oldPermissions);
  const castedNewPermissions: UniversalPermission[] = castTimedUpdatePermissionToUniversalPermission(newPermissions);

  const err = validateUniversalPermissionUpdate(
    GetFirstMatchOnly(castedOldPermissions),
    GetFirstMatchOnly(castedNewPermissions)
  );
  if (err) {
    return new Error(`Error validating update in permissions: ${err}`);
  }

  return null;
}

/**
 * Validate if a timed update with badge ids permission update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *
 * @category Validate Updates
 */
export function validateTimedUpdateWithBadgeIdsPermissionUpdate(
  oldPermissions: TimedUpdateWithBadgeIdsPermission<bigint>[],
  newPermissions: TimedUpdateWithBadgeIdsPermission<bigint>[]
): Error | null {

  // const errorOldPermissions = validateTimedUpdateWithBadgeIdsPermission(oldPermissions);
  // if (errorOldPermissions) {
  //   return new Error(`Error validating old permissions: ${errorOldPermissions}`);
  // }

  // const errorNewPermissions = validateTimedUpdateWithBadgeIdsPermission(newPermissions);
  // if (errorNewPermissions) {
  //   return new Error(`Error validating new permissions: ${errorNewPermissions}`);
  // }

  const castedOldPermissions: UniversalPermission[] =
    deepCopy(
      castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(oldPermissions)
    );
  const castedNewPermissions: UniversalPermission[] =
    deepCopy(
      castTimedUpdateWithBadgeIdsPermissionToUniversalPermission(newPermissions)
    );
  const err = validateUniversalPermissionUpdate(
    GetFirstMatchOnly(castedOldPermissions),
    GetFirstMatchOnly(castedNewPermissions)
  );
  if (err) {
    return new Error(`Error validating update in permissions: ${err}`);
  }

  return null;
}

/**
 *
 *
 * Validate if a collection approval permission update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *
 * @category Validate Updates
 */
export function validateCollectionApprovalPermissionsUpdate(
  oldPermissions: CollectionApprovalPermissionWithDetails<bigint>[],
  newPermissions: CollectionApprovalPermissionWithDetails<bigint>[],
): Error | null {

  // const errorOldPermissions = validateCollectionApprovalPermissions(oldPermissions);
  // if (errorOldPermissions) {
  //   return new Error(`Error validating old permissions: ${errorOldPermissions}`);
  // }

  // const errorNewPermissions = validateCollectionApprovalPermissions(newPermissions);
  // if (errorNewPermissions) {
  //   return new Error(`Error validating new permissions: ${errorNewPermissions}`);
  // }

  const castedOldPermissions: UniversalPermission[] = castCollectionApprovalPermissionToUniversalPermission(oldPermissions);
  const castedNewPermissions: UniversalPermission[] = castCollectionApprovalPermissionToUniversalPermission(newPermissions);

  const err = validateUniversalPermissionUpdate(
    GetFirstMatchOnly(castedOldPermissions),
    GetFirstMatchOnly(castedNewPermissions)
  );
  if (err) {
    return new Error(`Error validating update in permissions: ${err}`);
  }

  return null;
}

/**
 * Validate if an action permission update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *
 * @category Validate Updates
 */
export function validateActionPermissionUpdate(
  oldPermissions: ActionPermission<bigint>[],
  newPermissions: ActionPermission<bigint>[]
): Error | null {

  // const errorOldPermissions = validateActionPermission(oldPermissions);
  // if (errorOldPermissions) {
  //   return new Error(`Error validating old permissions: ${errorOldPermissions}`);
  // }

  // const errorNewPermissions = validateActionPermission(newPermissions);
  // if (errorNewPermissions) {
  //   return new Error(`Error validating new permissions: ${errorNewPermissions}`);
  // }

  const castedOldPermissions: UniversalPermission[] = castActionPermissionToUniversalPermission(oldPermissions);
  const castedNewPermissions: UniversalPermission[] = castActionPermissionToUniversalPermission(newPermissions);

  const err = validateUniversalPermissionUpdate(
    GetFirstMatchOnly(castedOldPermissions),
    GetFirstMatchOnly(castedNewPermissions)
  );
  if (err) {
    return new Error(`Error validating update in permissions: ${err}`);
  }

  return null;
}

/**
 * Validate if a collection permissions update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *
 * @category Validate Updates
 */
export function validatePermissionsUpdate(
  oldPermissions: CollectionPermissionsWithDetails<bigint>,
  newPermissions: CollectionPermissionsWithDetails<bigint>
): Error | null {

  // const errorOldPermissions = validatePermissions(oldPermissions);
  // if (errorOldPermissions) {
  //   return new Error(`Error validating old permissions: ${errorOldPermissions}`);
  // }

  // const errorNewPermissions = validatePermissions(newPermissions);
  // if (errorNewPermissions) {
  //   return new Error(`Error validating new permissions: ${errorNewPermissions}`);
  // }

  // Can Delete Collection
  if (newPermissions.canDeleteCollection !== null) {
    const error = validateActionPermissionUpdate(oldPermissions.canDeleteCollection, newPermissions.canDeleteCollection);
    if (error) {
      return new Error(`Error validating update in canDeleteCollection permissions: ${error}`);
    }
  }

  // Can Update Manager
  if (newPermissions.canUpdateManager !== null) {
    const error = validateTimedUpdatePermissionUpdate(oldPermissions.canUpdateManager, newPermissions.canUpdateManager);
    if (error) {
      return new Error(`Error validating update in canUpdateManager permissions: ${error}`);
    }
  }

  // Can Update Custom Data
  if (newPermissions.canUpdateCustomData !== null) {
    const error = validateTimedUpdatePermissionUpdate(oldPermissions.canUpdateCustomData, newPermissions.canUpdateCustomData);
    if (error) {
      return new Error(`Error validating update in canUpdateCustomData permissions: ${error}`);
    }
  }

  // Can Update Standards
  if (newPermissions.canUpdateStandards !== null) {
    const error = validateTimedUpdatePermissionUpdate(oldPermissions.canUpdateStandards, newPermissions.canUpdateStandards);
    if (error) {
      return new Error(`Error validating update in canUpdateStandards permissions: ${error}`);
    }
  }

  // Can Archive Collection
  if (newPermissions.canArchiveCollection !== null) {
    const error = validateTimedUpdatePermissionUpdate(oldPermissions.canArchiveCollection, newPermissions.canArchiveCollection);
    if (error) {
      return new Error(`Error validating update in canArchiveCollection permissions: ${error}`);
    }
  }

  // Can Update OffChain Balances Metadata
  if (newPermissions.canUpdateOffChainBalancesMetadata !== null) {
    const error = validateTimedUpdatePermissionUpdate(oldPermissions.canUpdateOffChainBalancesMetadata, newPermissions.canUpdateOffChainBalancesMetadata);
    if (error) {
      return new Error(`Error validating update in canUpdateOffChainBalancesMetadata permissions: ${error}`);
    }
  }

  // Can Update Collection Metadata
  if (newPermissions.canUpdateCollectionMetadata !== null) {
    const error = validateTimedUpdatePermissionUpdate(oldPermissions.canUpdateCollectionMetadata, newPermissions.canUpdateCollectionMetadata);
    if (error) {
      return new Error(`Error validating update in canUpdateCollectionMetadata permissions: ${error}`);
    }
  }

  // Can Create More Badges
  if (newPermissions.canCreateMoreBadges !== null) {
    const error = validateBalancesActionPermissionUpdate(oldPermissions.canCreateMoreBadges, newPermissions.canCreateMoreBadges);
    if (error) {
      return new Error(`Error validating update in canCreateMoreBadges permissions: ${error}`);
    }
  }

  // Can Update Badge Metadata
  if (newPermissions.canUpdateBadgeMetadata !== null) {
    const error = validateTimedUpdateWithBadgeIdsPermissionUpdate(oldPermissions.canUpdateBadgeMetadata, newPermissions.canUpdateBadgeMetadata);
    if (error) {
      return new Error(`Error validating update in canUpdateBadgeMetadata permissions: ${error}`);
    }
  }

  // Can Update Collection Approved Transfers
  if (newPermissions.canUpdateCollectionApprovals !== null) {
    const error = validateCollectionApprovalPermissionsUpdate(oldPermissions.canUpdateCollectionApprovals, newPermissions.canUpdateCollectionApprovals);
    if (error) {
      return new Error(`Error validating update in canUpdateCollectionApprovals permissions: ${error}`);
    }
  }

  return null;
}

/**
 *
 *
 * Validate if a universal permission update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *  @category Validate Updates
 */
export function validateUniversalPermissionUpdate(
  oldPermissions: UniversalPermissionDetails[],
  newPermissions: UniversalPermissionDetails[]
): Error | null {
  const [allOverlaps, inOldButNotNew] = getOverlapsAndNonOverlaps(oldPermissions, newPermissions);

  if (inOldButNotNew.length > 0) {
    let errMsg = `Permission ${getPermissionString(inOldButNotNew[0])} found in old permissions but not in new permissions`;
    if (inOldButNotNew.length > 1) {
      errMsg += ` (along with ${inOldButNotNew.length - 1} more)`;
    }
    return new Error(errMsg);
  }

  for (const overlapObj of allOverlaps) {
    const oldPermission = overlapObj.firstDetails;
    const newPermission = overlapObj.secondDetails;

    const [leftoverPermittedTimes] = removeUintRangesFromUintRanges(newPermission.permanentlyPermittedTimes, oldPermission.permanentlyPermittedTimes);
    const [leftoverForbiddenTimes] = removeUintRangesFromUintRanges(newPermission.permanentlyForbiddenTimes, oldPermission.permanentlyForbiddenTimes);

    if (leftoverPermittedTimes.length > 0 || leftoverForbiddenTimes.length > 0) {
      let errMsg = `Permission ${getPermissionString(oldPermission)} found in both new and old permissions but `;
      if (leftoverPermittedTimes.length > 0) {
        errMsg += 'previously explicitly allowed the times ( ';
        for (const oldPermittedTime of leftoverPermittedTimes) {
          errMsg += `${oldPermittedTime.start}-${oldPermittedTime.end} `;
        }
        errMsg += ') which are now set to disApproved';
      }
      if (leftoverForbiddenTimes.length > 0 && leftoverPermittedTimes.length > 0) {
        errMsg += ' and';
      }
      if (leftoverForbiddenTimes.length > 0) {
        errMsg += ' previously explicitly disApproved the times ( ';
        for (const oldForbiddenTime of leftoverForbiddenTimes) {
          errMsg += `${oldForbiddenTime.start}-${oldForbiddenTime.end} `;
        }
        errMsg += ') which are now set to allowed.';
      }
      return new Error(errMsg);
    }
  }

  return null;
}

function getPermissionString(permission: UniversalPermissionDetails): string {
  let str = "(";

  const maxUint64 = 18446744073709551615n; // Max Uint64 value in BigInt format

  if (permission.badgeId.start === maxUint64 || permission.badgeId.end === maxUint64) {
    str += `badgeId: ${permission.badgeId.start} `;
  }

  if (permission.timelineTime.start === maxUint64 || permission.timelineTime.end === maxUint64) {
    str += `timelineTime: ${permission.timelineTime.start} `;
  }

  if (permission.transferTime.start === maxUint64 || permission.transferTime.end === maxUint64) {
    str += `transferTime: ${permission.transferTime.start} `;
  }

  if (permission.ownershipTime.start === maxUint64 || permission.ownershipTime.end === maxUint64) {
    str += `ownershipTime: ${permission.ownershipTime.start} `;
  }

  if (permission.toList) {
    str += "toList: ";
    if (!permission.toList.whitelist) {
      str += `${permission.toList.addresses.length} addresses `;
    } else {
      str += `all except ${permission.toList.addresses.length} addresses `;
    }

    if (permission.toList.addresses.length > 0 && permission.toList.addresses.length <= 5) {
      str += "(";
      for (const address of permission.toList.addresses) {
        str += address + " ";
      }
      str += ")";
    }
  }

  if (permission.fromList) {
    str += "fromList: ";
    if (!permission.fromList.whitelist) {
      str += `${permission.fromList.addresses.length} addresses `;
    } else {
      str += `all except ${permission.fromList.addresses.length} addresses `;
    }

    if (permission.fromList.addresses.length > 0 && permission.fromList.addresses.length <= 5) {
      str += "(";
      for (const address of permission.fromList.addresses) {
        str += address + " ";
      }
      str += ")";
    }
  }

  if (permission.initiatedByList) {
    str += "initiatedByList: ";
    if (!permission.initiatedByList.whitelist) {
      str += `${permission.initiatedByList.addresses.length} addresses `;
    } else {
      str += `all except ${permission.initiatedByList.addresses.length} addresses `;
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
