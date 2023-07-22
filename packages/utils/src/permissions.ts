import { ActionPermission, UintRange } from "bitbadgesjs-proto";
import { searchUintRangesForId } from "./uintRanges";

/**
 * Returns if the new permissions are valid.
 *
 * The new permissions are valid if any permission that was previously
 * explicitly permitted / forbidden is being changed. First-match only.
 *
 * @param {bigint} oldPermissions - The old permissions
 * @param {bigint} newPermissions - The new permissions
 */
export function ValidatePermissionsUpdate(oldPermissions: bigint, newPermissions: bigint) {
  throw new Error('Not implemented');
  //TODO:
}

/**
 * Simply checks if Date.now() is in the forbiddenTimes provided. If this returns false, the permission is permitted. Else, it is explicitly forbidden.
 *
 * @param {UintRange<bigint>[]} forbiddenTimes - The forbidden times to check.
 */
export function isCurrentTimeForbidden(forbiddenTimes: UintRange<bigint>[]) {
  const currentTime = BigInt(Date.now());

  const [_, found] = searchUintRangesForId(currentTime, forbiddenTimes);
  return found;
}


export function isActionPermissionPermitted(permissions: ActionPermission<bigint>[]) {
  //TODO:
  // for (const permission of permissions) {
  //   const defaultPermittedTimes = permission.defaultValues.permittedTimes;
  //   const defaultForbiddenTimes = permission.defaultValues.forbiddenTimes;

  //   for (const combination of permission.combinations) {
  //     //First, we manipulate the defaults

  //   }
  // }
}
