import { Permissions } from "./types/permissions";

export const NUM_PERMISSIONS = 7;

export const CanUpdateBalancesUriDigit = 7
export const CanDeleteDigit = 6
export const CanUpdateBytesDigit = 5
export const CanManagerBeTransferredDigit = 4
export const CanUpdateMetadataUrisDigit = 3
export const CanCreateMoreBadgesDigit = 2
export const CanUpdateAllowedDigit = 1

/**
 * Returns the uint value for the permissions.
 *
 * On the blockchain, permissions are mapped to a uint where each bit
 * represents a permission. This function returns the uint value for the
 * given permissions as a bigint.
 *
 * @param {Permissions} permissions - The permissions to convert to a number value
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
      case CanUpdateMetadataUrisDigit:
        permissionValue = permissions.CanUpdateMetadataUris;
        break;
      case CanCreateMoreBadgesDigit:
        permissionValue = permissions.CanCreateMoreBadges;
        break;
      case CanUpdateAllowedDigit:
        permissionValue = permissions.CanUpdateAllowed;
        break;
      case CanDeleteDigit:
        permissionValue = permissions.CanDelete;
        break;
      case CanUpdateBalancesUriDigit:
        permissionValue = permissions.CanUpdateBalancesUri;
        break;
      default:
        break;
    }
    if (permissionValue) {
      permissionNumber += 2 ** (permissionDigit - 1);
    }
  }
  return BigInt(permissionNumber);
}

/**
 * Validates the permissions leading zeroes are correct.
 *
 * All non-important bits not corresponding to a permission should be 0.
 *
 * @param {bigint} permissions - The permissions to validate
 */
export function ValidatePermissionsLeadingZeroes(permissions: bigint) {
  let tempPermissions = permissions >> BigInt(NUM_PERMISSIONS);
  if (tempPermissions != 0n) {
    throw 'Invalid permissions: Leading Zeroes';
  }
}

/**
 * Returns if the new permissions are valid.
 *
 * The new permissions are valid if leading zeroes are correct
 * and any permission that was previously locked is not being turned back on.
 *
 * @param {bigint} oldPermissions - The old permissions
 * @param {bigint} newPermissions - The new permissions
 */
export function ValidatePermissionsUpdate(oldPermissions: bigint, newPermissions: bigint) {
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

  if (!oldFlags.CanUpdateMetadataUris && newFlags.CanUpdateMetadataUris) {
    throw 'Invalid permissions: Updating CanUpdateMetadataUris is locked';
  }

  if (!oldFlags.CanUpdateAllowed && newFlags.CanUpdateAllowed) {
    throw 'Invalid permissions: Updating CanUpdateAllowed is locked';
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

  if (!oldFlags.CanUpdateBalancesUri && newFlags.CanUpdateBalancesUri) {
    throw 'Invalid permissions: Updating CanUpdateBalancesUri is locked';
  }
}

/**
 * Sets the permissions digit to the given value.
 *
 * Note there are no validity checks done here. We recommend first checking your action is a valid update via ValidatePermissionsUpdate
 * before calling this function.
 *
 * @example
 * UpdatePermissions(0, CanUpdateBytesDigit, true) => 16
 *
 * @param {bigint} _currPermissions - The current permissions
 * @param {bigint | string | number} _permissionDigit - The permission digit to update (use the constants exported such as CanUpdateBytesDigit, etc)
 * @param {boolean} value - The value to set the permission digit to
 */
export function UpdatePermissions(_currPermissions: bigint | string | number, _permissionDigit: bigint | string | number, value: boolean) {
  let currPermissions = BigInt(_currPermissions);
  const permissionDigit = Number(_permissionDigit);

  if (permissionDigit > NUM_PERMISSIONS || permissionDigit <= 0) {
    throw 'Invalid permission digit';
  }

  let mask = 1 << (permissionDigit - 1);
  let masked_n = currPermissions & BigInt(mask);
  let bit = masked_n >> BigInt(permissionDigit - 1);
  let bit_as_bool = bit == 1n;

  if (value != bit_as_bool) {
    if (bit_as_bool) {
      currPermissions -= BigInt(2 ** (permissionDigit - 1));
    } else {
      currPermissions += BigInt(2 ** (permissionDigit - 1));
    }
  }

  return currPermissions;
}

/**
 * Gets the permissions struct from the corresponding uint number value.
 *
 * @param {bigint} permissions - The permissions to convert to a struct
 */
export function GetPermissions(permissions: bigint) {
  let permissionFlags: any = {};
  for (let i = 0; i <= NUM_PERMISSIONS; i++) {
    let mask = 1 << i;
    let masked_n = permissions & BigInt(mask);
    let bit = masked_n >> BigInt(i);
    let bit_as_bool = bit == 1n;
    switch (i + 1) {
      case CanUpdateBytesDigit:
        permissionFlags.CanUpdateBytes = bit_as_bool;
        break;
      case CanManagerBeTransferredDigit:
        permissionFlags.CanManagerBeTransferred = bit_as_bool;
        break;
      case CanUpdateMetadataUrisDigit:
        permissionFlags.CanUpdateMetadataUris = bit_as_bool;
        break;
      case CanCreateMoreBadgesDigit:
        permissionFlags.CanCreateMoreBadges = bit_as_bool;
        break;
      case CanUpdateAllowedDigit:
        permissionFlags.CanUpdateAllowed = bit_as_bool;
        break;
      case CanDeleteDigit:
        permissionFlags.CanDelete = bit_as_bool;
        break;
      case CanUpdateBalancesUriDigit:
        permissionFlags.CanUpdateBalancesUri = bit_as_bool;
        break;
      default:
        break;
    }
  }
  return permissionFlags as Permissions
}
