/**
 * @category Interfaces
 */
export interface iPermissionCriteria {
  /** List of approved addresses that can execute this permission. */
  approvedAddresses: string[];
}

/**
 * @category Interfaces
 */
export interface iManagerSplitterPermissions {
  /** Permissions related to deleting the collection. */
  canDeleteCollection?: iPermissionCriteria;
  /** Permissions related to archiving the collection. */
  canArchiveCollection?: iPermissionCriteria;
  /** Permissions related to updating standards for the collection. */
  canUpdateStandards?: iPermissionCriteria;
  /** Permissions related to updating custom data for the collection. */
  canUpdateCustomData?: iPermissionCriteria;
  /** Permissions related to updating the collection's manager. */
  canUpdateManager?: iPermissionCriteria;
  /** Permissions related to updating the metadata of the collection. */
  canUpdateCollectionMetadata?: iPermissionCriteria;
  /** Permissions related to creating more tokens for the collection. */
  canUpdateValidTokenIds?: iPermissionCriteria;
  /** Permissions related to updating token metadata for specific tokens. */
  canUpdateTokenMetadata?: iPermissionCriteria;
  /** Permissions related to updating collection approvals. */
  canUpdateCollectionApprovals?: iPermissionCriteria;
}
