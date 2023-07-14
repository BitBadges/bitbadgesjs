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
