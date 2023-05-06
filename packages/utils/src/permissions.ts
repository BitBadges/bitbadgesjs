import { Permissions } from "./types/permissions";

export const NUM_PERMISSIONS = 6;

export const CanDeleteDigit = 6
export const CanUpdateBytesDigit = 5
export const CanManagerBeTransferredDigit = 4
export const CanUpdateUrisDigit = 3
export const CanCreateMoreBadgesDigit = 2
export const CanUpdateDisallowedDigit = 1

/**
 * Returns the uint value for the permissions.
 *
 * On the blockchain, permissions are mapped to a uint64 where each bit
 * represents a permission. This function returns the uint64 value for the
 * given permissions.
 */
export function GetPermissionNumberValue(permissions: Permissions) {
  let permissionNumber = 0;
  for (let i = 0; i <= NUM_PERMISSIONS; i++) {
    let permissionDigit = i + 1;
    let permissionValue = false;
    switch (permissionDigit) {
      case CanUpdateBytesDigit:
        permissionValue = permissions.CanUpdateBytes;
        break;
      case CanManagerBeTransferredDigit:
        permissionValue = permissions.CanManagerBeTransferred;
        break;
      case CanUpdateUrisDigit:
        permissionValue = permissions.CanUpdateUris;
        break;
      case CanCreateMoreBadgesDigit:
        permissionValue = permissions.CanCreateMoreBadges;
        break;
      case CanUpdateDisallowedDigit:
        permissionValue = permissions.CanUpdateDisallowed;
        break;
      case CanDeleteDigit:
        permissionValue = permissions.CanDelete;
        break;
      default:
        break;
    }
    if (permissionValue) {
      permissionNumber += 2 ** (permissionDigit - 1);
    }
  }
  return permissionNumber;
}

/**
 * Validates the permissions leading zeroes are correct.
 */
export function ValidatePermissionsLeadingZeroes(permissions: number) {
  let tempPermissions = permissions >> NUM_PERMISSIONS;
  if (tempPermissions != 0) {
    throw 'Invalid permissions: Leading Zeroes';
  }
}

/**
 * Returns if the new permissions are valid.
 *
 * The new permissions are valid if leading zeroes are correct
 * and any permission that was previously locked is not being turned back on.
 */
export function ValidatePermissionsUpdate(oldPermissions: number, newPermissions: number) {
  try {
    ValidatePermissionsLeadingZeroes(oldPermissions);
    ValidatePermissionsLeadingZeroes(newPermissions);
  } catch (error) {
    throw error;
  }

  const oldFlags = GetPermissions(oldPermissions);
  const newFlags = GetPermissions(newPermissions);

  if (!oldFlags.CanUpdateBytes && newFlags.CanUpdateBytes) {
    throw 'Invalid permissions: Updating CanUpdateBytes is locked';
  }

  if (!oldFlags.CanUpdateUris && newFlags.CanUpdateUris) {
    throw 'Invalid permissions: Updating CanUpdateUris is locked';
  }

  if (!oldFlags.CanUpdateDisallowed && newFlags.CanUpdateDisallowed) {
    throw 'Invalid permissions: Updating CanUpdateDisallowed is locked';
  }

  if (!oldFlags.CanCreateMoreBadges && newFlags.CanCreateMoreBadges) {
    throw 'Invalid permissions: Updating CanCreateMoreBadges is locked';
  }

  if (!oldFlags.CanManagerBeTransferred && newFlags.CanManagerBeTransferred) {
    throw 'Invalid permissions: Updating CanManagerBeTransferred is locked';
  }

  if (!oldFlags.CanDelete && newFlags.CanDelete) {
    throw 'Invalid permissions: Updating CanDelete is locked';
  }
}

/**
 * Sets the permissions digit to the given value.
 *
 * Note there are no validity checks done here.
 *
 * We recommend first checking your action is a valid update via ValidatePermissionsUpdate
 * before calling this function.
 *
 * e.g. UpdatePermissions(0, CanUpdateBytesDigit, true) => 16
 */
export function UpdatePermissions(currPermissions: number, permissionDigit: number, value: boolean) {
  if (permissionDigit > NUM_PERMISSIONS || permissionDigit <= 0) {
    throw 'Invalid permission digit';
  }

  let mask = 1 << (permissionDigit - 1);
  let masked_n = currPermissions & mask;
  let bit = masked_n >> (permissionDigit - 1);
  let bit_as_bool = bit == 1;

  if (value != bit_as_bool) {
    if (bit_as_bool) {
      currPermissions -= 2 ** (permissionDigit - 1);
    } else {
      currPermissions += 2 ** (permissionDigit - 1);
    }
  }

  return currPermissions;
}

/**
 * Gets the permissions struct from the corresponding uint number value.
 *
 * Note it assumes the permissions number provided is valid
 */
export function GetPermissions(permissions: number) {
  let permissionFlags: any = {};
  for (let i = 0; i <= NUM_PERMISSIONS; i++) {
    let mask = 1 << i;
    let masked_n = permissions & mask;
    let bit = masked_n >> i;
    let bit_as_bool = bit == 1;
    switch (i + 1) {
      case CanUpdateBytesDigit:
        permissionFlags.CanUpdateBytes = bit_as_bool;
        break;
      case CanManagerBeTransferredDigit:
        permissionFlags.CanManagerBeTransferred = bit_as_bool;
        break;
      case CanUpdateUrisDigit:
        permissionFlags.CanUpdateUris = bit_as_bool;
        break;
      case CanCreateMoreBadgesDigit:
        permissionFlags.CanCreateMoreBadges = bit_as_bool;
        break;
      case CanUpdateDisallowedDigit:
        permissionFlags.CanUpdateDisallowed = bit_as_bool;
        break;
      case CanDeleteDigit:
        permissionFlags.CanDelete = bit_as_bool;
        break;
      default:
        break;
    }
  }
  return permissionFlags as Permissions
}
