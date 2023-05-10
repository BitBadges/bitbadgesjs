/**
 * Permissions represents the privileges the manager of a collection has.
 *
 * @typedef {Object} Permissions
 * @property {boolean} CanUpdateBytes - Whether the manager can update the bytes of the collection.
 * @property {boolean} CanManagerBeTransferred - Whether the manager can be transferred.
 * @property {boolean} CanUpdateMetadataUris - Whether the manager can update the metadata URIs (collectionUri and badgeUris).
 * @property {boolean} CanCreateMoreBadges - Whether the manager can create and add more badges to the collection.
 * @property {boolean} CanUpdateAllowed - Whether the manager can update the allowed transfer list.
 * @property {boolean} CanDelete - Whether the manager can delete the collection.
 * @property {boolean} CanUpdateBalancesUri - Whether the manager can update the balances URI (balancesUri).
 */
export type Permissions = {
  CanUpdateBytes: boolean
  CanManagerBeTransferred: boolean
  CanUpdateMetadataUris: boolean
  CanCreateMoreBadges: boolean
  CanUpdateAllowed: boolean
  CanDelete: boolean
  CanUpdateBalancesUri: boolean
}
