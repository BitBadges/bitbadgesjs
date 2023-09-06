import { NumberType } from "../string-numbers";
import { UintRange, convertUintRange, deepCopy } from "./typeUtils";

/**
 * UserPermissions represents the permissions of a user and whether they can update their approved outgoing and incoming transfers.
 *
 * @typedef {Object} UserPermissions
 * @property {UserApprovedOutgoingTransferPermission[]} canUpdateApprovedOutgoingTransfers - The list of permissions for updating approved outgoing transfers.
 * @property {UserApprovedIncomingTransferPermission[]} canUpdateApprovedIncomingTransfers - The list of permissions for updating approved incoming transfers.
 */
export interface UserPermissions<T extends NumberType> {
  canUpdateApprovedOutgoingTransfers: UserApprovedOutgoingTransferPermission<T>[];
  canUpdateApprovedIncomingTransfers: UserApprovedIncomingTransferPermission<T>[];
}

export function convertUserPermissions<T extends NumberType, U extends NumberType>(permissions: UserPermissions<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserPermissions<U> {
  return deepCopy({
    ...permissions,
    canUpdateApprovedOutgoingTransfers: permissions.canUpdateApprovedOutgoingTransfers.map((b) => convertUserApprovedOutgoingTransferPermission(b, convertFunction, populateOptionalFields)),
    canUpdateApprovedIncomingTransfers: permissions.canUpdateApprovedIncomingTransfers.map((b) => convertUserApprovedIncomingTransferPermission(b, convertFunction, populateOptionalFields))
  })
}

/**
 * UserApprovedOutgoingTransferPermission represents the permissions of a user and whether they can update their approved outgoing transfers.
 *
 * @typedef {Object} UserApprovedOutgoingTransferPermission
 * @property {UserApprovedOutgoingTransferDefaultValues} defaultValues - The default values for the permission.
 * @property {UserApprovedOutgoingTransferCombination[]} combinations - The list of combinations of values for the permission. Here, you can manipulate the default values to allow / disallow certain combinations of values.
 */
export interface UserApprovedOutgoingTransferPermission<T extends NumberType> {
  defaultValues: UserApprovedOutgoingTransferDefaultValues<T>;
  combinations: UserApprovedOutgoingTransferCombination[];
}

const PermissionCombinationDefaultValues = {
  timelineTimesOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  toMappingOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  fromMappingOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  initiatedByMappingOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  transferTimesOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  badgeIdsOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  ownershipTimesOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  permittedTimesOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
  forbiddenTimesOptions: {
    invertDefault: false,
    noValues: false,
    allValues: false
  },
}

export function convertUserApprovedOutgoingTransferPermission<T extends NumberType, U extends NumberType>(permission: UserApprovedOutgoingTransferPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserApprovedOutgoingTransferPermission<U> {
  return deepCopy({
    ...permission,
    defaultValues: convertUserApprovedOutgoingTransferDefaultValues(permission.defaultValues, convertFunction,),
    combinations: populateOptionalFields ? permission.combinations.map((b) => {
      return {
        ...PermissionCombinationDefaultValues,
        ...b,
        fromMappingOptions: undefined,
      } as Required<UserApprovedOutgoingTransferCombination>
    }) : permission.combinations
  })
}

/**
 * UserApprovedOutgoingTransferDefaultValues represents the default values for a UserApprovedOutgoingTransferPermission.
 *
 * @typedef {Object} UserApprovedOutgoingTransferDefaultValues
 * @property {UintRange[]} timelineTimes - The timeline times that the permission applies to.
 * @property {string} toMappingId - The mapping ID of the to addresses of the approved outgoing transfers.
 * @property {string} initiatedByMappingId - The mapping ID of the initiatedBy addresses of the approved outgoing transfers.
 * @property {UintRange[]} transferTimes - The transfer times of the approved outgoing transfers.
 * @property {UintRange[]} badgeIds - The badge IDs of the approved outgoing transfers.
 * @property {UintRange[]} ownershipTimes - The owned times of the approved outgoing transfers.
 * @property {UintRange[]} permittedTimes - The permitted times of the approved outgoing transfers.
 * @property {UintRange[]} forbiddenTimes - The forbidden times of the approved outgoing transfers.
 */
export interface UserApprovedOutgoingTransferDefaultValues<T extends NumberType> {
  timelineTimes: UintRange<T>[];
  toMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  permittedTimes: UintRange<T>[];
  forbiddenTimes: UintRange<T>[];
}

export function convertUserApprovedOutgoingTransferDefaultValues<T extends NumberType, U extends NumberType>(values: UserApprovedOutgoingTransferDefaultValues<T>, convertFunction: (item: T) => U): UserApprovedOutgoingTransferDefaultValues<U> {
  return deepCopy({
    ...values,
    timelineTimes: values.timelineTimes.map((b) => convertUintRange(b, convertFunction)),
    transferTimes: values.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: values.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: values.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permittedTimes: values.permittedTimes.map((b) => convertUintRange(b, convertFunction)),
    forbiddenTimes: values.forbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * UserApprovedOutgoingTransferCombination represents a combination of values for a UserApprovedOutgoingTransferPermission.
 * Here, you can manipulate (invert / all / none) the default values (in the defaultValues property) to allow / disallow certain combinations of values.
 *
 * @typedef {Object} UserApprovedOutgoingTransferCombination
 */
export interface UserApprovedOutgoingTransferCombination {
  timelineTimesOptions?: ValueOptions;
  toMappingOptions?: ValueOptions;
  initiatedByMappingOptions?: ValueOptions;
  transferTimesOptions?: ValueOptions;
  badgeIdsOptions?: ValueOptions;
  ownershipTimesOptions?: ValueOptions;
  permittedTimesOptions?: ValueOptions;
  forbiddenTimesOptions?: ValueOptions;
}

// export function convertUserApprovedOutgoingTransferCombination<T extends NumberType, U extends NumberType>(combination: UserApprovedOutgoingTransferCombination<T>, _convertFunction: (item: T) => U): UserApprovedOutgoingTransferCombination<U> {
//   return deepCopy({
//     ...combination,
//     // timelineTimesOptions: convertValueOptions(combination.timelineTimesOptions),
//     // toMappingOptions: convertValueOptions(combination.toMappingOptions),
//     // initiatedByMappingOptions: convertValueOptions(combination.initiatedByMappingOptions),
//     // transferTimesOptions: convertValueOptions(combination.transferTimesOptions),
//     // badgeIdsOptions: convertValueOptions(combination.badgeIdsOptions),
//     // ownershipTimesOptions: convertValueOptions(combination.ownershipTimesOptions),
//     // permittedTimesOptions: convertValueOptions(combination.permittedTimesOptions),
//     // forbiddenTimesOptions: convertValueOptions(combination.forbiddenTimesOptions)
//   })
// }

/**
 * ValueOptions represents the options for manipulating a value.
 *
 * @typedef {Object} ValueOptions
 * @property {boolean} invertDefault - Whether to invert the default value.
 * @property {boolean} allValues - Whether to override the default value with all values.
 * @property {boolean} noValues - Whether to override the default value with no values.
 */
export interface ValueOptions {
  invertDefault?: boolean;
  allValues?: boolean;
  noValues?: boolean;
}

// export function convertValueOptions<T extends NumberType, U extends NumberType>(options?: ValueOptions<T>): ValueOptions<U> {
//   return deepCopy({
//     ...options
//   })
// }

/**
 * UserApprovedIncomingTransferPermission represents the permissions of a user and whether they can update their approved incoming transfers.
 *
 * @typedef {Object} UserApprovedIncomingTransferPermission
 * @property {UserApprovedIncomingTransferDefaultValues} defaultValues - The default values for the permission.
 * @property {UserApprovedIncomingTransferCombination[]} combinations - The list of combinations of values for the permission. Here, you can manipulate the default values to allow / disallow certain combinations of values.
 */
export interface UserApprovedIncomingTransferPermission<T extends NumberType> {
  defaultValues: UserApprovedIncomingTransferDefaultValues<T>;
  combinations: UserApprovedIncomingTransferCombination[];
}

export function convertUserApprovedIncomingTransferPermission<T extends NumberType, U extends NumberType>(permission: UserApprovedIncomingTransferPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): UserApprovedIncomingTransferPermission<U> {
  return deepCopy({
    ...permission,
    defaultValues: convertUserApprovedIncomingTransferDefaultValues(permission.defaultValues, convertFunction),
    combinations: populateOptionalFields ? permission.combinations.map((b) => {
      return {
        ...PermissionCombinationDefaultValues,
        ...b,
        toMappingOptions: undefined,
      } as Required<UserApprovedIncomingTransferCombination>
    }) : permission.combinations
  })
}

/**
 * UserApprovedIncomingTransferDefaultValues represents the default values for a UserApprovedIncomingTransferPermission.
 *
 * @typedef {Object} UserApprovedIncomingTransferDefaultValues
 * @property {UintRange[]} timelineTimes - The timeline times that the permission applies to.
 * @property {string} fromMappingId - The mapping ID of the from addresses of the approved incoming transfers.
 * @property {string} initiatedByMappingId - The mapping ID of the initiatedBy addresses of the approved incoming transfers.
 * @property {UintRange[]} transferTimes - The transfer times of the approved incoming transfers.
 * @property {UintRange[]} badgeIds - The badge IDs of the approved incoming transfers.
 * @property {UintRange[]} ownershipTimes - The owned times of the approved incoming transfers.
 * @property {UintRange[]} permittedTimes - The permitted times of the approved incoming transfers.
 * @property {UintRange[]} forbiddenTimes - The forbidden times of the approved incoming transfers.
 */
export interface UserApprovedIncomingTransferDefaultValues<T extends NumberType> {
  timelineTimes: UintRange<T>[];
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  permittedTimes: UintRange<T>[];
  forbiddenTimes: UintRange<T>[];
}

export function convertUserApprovedIncomingTransferDefaultValues<T extends NumberType, U extends NumberType>(values: UserApprovedIncomingTransferDefaultValues<T>, convertFunction: (item: T) => U): UserApprovedIncomingTransferDefaultValues<U> {
  return deepCopy({
    ...values,
    timelineTimes: values.timelineTimes.map((b) => convertUintRange(b, convertFunction)),
    transferTimes: values.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: values.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: values.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permittedTimes: values.permittedTimes.map((b) => convertUintRange(b, convertFunction)),
    forbiddenTimes: values.forbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * UserApprovedIncomingTransferCombination represents a combination of values for a UserApprovedIncomingTransferPermission.
 * Here, you can manipulate (invert / all / none) the default values (in the defaultValues property) to allow / disallow certain combinations of values.
 *
 * @typedef {Object} UserApprovedIncomingTransferCombination
 * @property {ValueOptions} timelineTimesOptions - The options for manipulating the timeline times.
 * @property {ValueOptions} fromMappingOptions - The options for manipulating the from mapping ID.
 * @property {ValueOptions} initiatedByMappingOptions - The options for manipulating the initiatedBy mapping ID.
 * @property {ValueOptions} transferTimesOptions - The options for manipulating the transfer times.
 * @property {ValueOptions} badgeIdsOptions - The options for manipulating the badge IDs.
 * @property {ValueOptions} ownershipTimesOptions - The options for manipulating the owned times.
 * @property {ValueOptions} permittedTimesOptions - The options for manipulating the permitted times.
 * @property {ValueOptions} forbiddenTimesOptions - The options for manipulating the forbidden times.
 */
export interface UserApprovedIncomingTransferCombination {
  timelineTimesOptions?: ValueOptions;
  fromMappingOptions?: ValueOptions;
  initiatedByMappingOptions?: ValueOptions;
  transferTimesOptions?: ValueOptions;
  badgeIdsOptions?: ValueOptions;
  ownershipTimesOptions?: ValueOptions;
  permittedTimesOptions?: ValueOptions;
  forbiddenTimesOptions?: ValueOptions;
}

// export function convertUserApprovedIncomingTransferCombination<T extends NumberType, U extends NumberType>(combination: UserApprovedIncomingTransferCombination<T>, _convertFunction: (item: T) => U): UserApprovedIncomingTransferCombination<U> {
//   return deepCopy({
//     ...combination,
//     timelineTimesOptions: convertValueOptions(combination.timelineTimesOptions),
//     fromMappingOptions: convertValueOptions(combination.fromMappingOptions),
//     initiatedByMappingOptions: convertValueOptions(combination.initiatedByMappingOptions),
//     transferTimesOptions: convertValueOptions(combination.transferTimesOptions),
//     badgeIdsOptions: convertValueOptions(combination.badgeIdsOptions),
//     ownershipTimesOptions: convertValueOptions(combination.ownershipTimesOptions),
//     permittedTimesOptions: convertValueOptions(combination.permittedTimesOptions),
//     forbiddenTimesOptions: convertValueOptions(combination.forbiddenTimesOptions)
//   })
// }

/**
 * CollectionPermissions represents the permissions of a collection and whether it can be deleted, archived, or have its contract address, off-chain balances metadata, standards, custom data, manager, or metadata updated.
 *
 * @typedef {Object} CollectionPermissions
 * @property {ActionPermission[]} canDeleteCollection - The list of permissions for deleting the collection.
 * @property {TimedUpdatePermission[]} canArchiveCollection - The list of permissions for archiving the collection.
 * @property {TimedUpdatePermission[]} canUpdateContractAddress - The list of permissions for updating the contract address.
 * @property {TimedUpdatePermission[]} canUpdateOffChainBalancesMetadata - The list of permissions for updating the off-chain balances metadata.
 * @property {TimedUpdatePermission[]} canUpdateStandards - The list of permissions for updating the standards.
 * @property {TimedUpdatePermission[]} canUpdateCustomData - The list of permissions for updating the custom data.
 * @property {TimedUpdatePermission[]} canUpdateManager - The list of permissions for updating the manager.
 * @property {TimedUpdatePermission[]} canUpdateCollectionMetadata - The list of permissions for updating the collection metadata.
 * @property {BalancesActionPermission[]} canCreateMoreBadges - The list of permissions for creating more badges.
 * @property {TimedUpdateWithBadgeIdsPermission[]} canUpdateBadgeMetadata - The list of permissions for updating the badge metadata.
 * @property {TimedUpdateWithBadgeIdsPermission[]} canUpdateInheritedBalances - The list of permissions for updating the inherited balances.
 * @property {CollectionApprovedTransferPermission[]} canUpdateCollectionApprovedTransfers - The list of permissions for updating the collection approved transfers.
 */
export interface CollectionPermissions<T extends NumberType> {
  canDeleteCollection: ActionPermission<T>[];
  canArchiveCollection: TimedUpdatePermission<T>[];
  canUpdateContractAddress: TimedUpdatePermission<T>[];
  canUpdateOffChainBalancesMetadata: TimedUpdatePermission<T>[];
  canUpdateStandards: TimedUpdatePermission<T>[];
  canUpdateCustomData: TimedUpdatePermission<T>[];
  canUpdateManager: TimedUpdatePermission<T>[];
  canUpdateCollectionMetadata: TimedUpdatePermission<T>[];
  canCreateMoreBadges: BalancesActionPermission<T>[];
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission<T>[];
  canUpdateInheritedBalances: TimedUpdateWithBadgeIdsPermission<T>[];
  canUpdateCollectionApprovedTransfers: CollectionApprovedTransferPermission<T>[];
}

export function convertCollectionPermissions<T extends NumberType, U extends NumberType>(permissions: CollectionPermissions<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): CollectionPermissions<U> {
  return deepCopy({
    ...permissions,
    canDeleteCollection: permissions.canDeleteCollection.map((b) => convertActionPermission(b, convertFunction, populateOptionalFields)),
    canArchiveCollection: permissions.canArchiveCollection.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateContractAddress: permissions.canUpdateContractAddress.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateOffChainBalancesMetadata: permissions.canUpdateOffChainBalancesMetadata.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateStandards: permissions.canUpdateStandards.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateCustomData: permissions.canUpdateCustomData.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateManager: permissions.canUpdateManager.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canUpdateCollectionMetadata: permissions.canUpdateCollectionMetadata.map((b) => convertTimedUpdatePermission(b, convertFunction, populateOptionalFields)),
    canCreateMoreBadges: permissions.canCreateMoreBadges.map((b) => convertBalancesActionPermission(b, convertFunction, populateOptionalFields)),
    canUpdateBadgeMetadata: permissions.canUpdateBadgeMetadata.map((b) => convertTimedUpdateWithBadgeIdsPermission(b, convertFunction, populateOptionalFields)),
    canUpdateInheritedBalances: permissions.canUpdateInheritedBalances.map((b) => convertTimedUpdateWithBadgeIdsPermission(b, convertFunction, populateOptionalFields)),
    canUpdateCollectionApprovedTransfers: permissions.canUpdateCollectionApprovedTransfers.map((b) => convertCollectionApprovedTransferPermission(b, convertFunction, populateOptionalFields))
  })
}

/**
 * ActionPermission represents a standard permission with no extra criteria.
 */
export interface ActionPermission<T extends NumberType> {
  defaultValues: ActionPermissionDefaultValues<T>;
  combinations: ActionPermissionCombination[];
}

export function convertActionPermission<T extends NumberType, U extends NumberType>(permission: ActionPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): ActionPermission<U> {
  return deepCopy({
    ...permission,
    defaultValues: convertActionPermissionDefaultValues(permission.defaultValues, convertFunction),
    combinations: populateOptionalFields ? permission.combinations.map((b) => {
      return {
        permittedTimesOptions: PermissionCombinationDefaultValues.permittedTimesOptions,
        forbiddenTimesOptions: PermissionCombinationDefaultValues.forbiddenTimesOptions,
        ...b,
      } as Required<ActionPermissionCombination>
    }) : permission.combinations
  })
}

/**
 * ActionPermissionDefaultValues represents the default values for an ActionPermission.
 *
 * @typedef {Object} ActionPermissionDefaultValues
 * @property {UintRange[]} permittedTimes - The permitted times of the permission.
 * @property {UintRange[]} forbiddenTimes - The forbidden times of the permission.
 */
export interface ActionPermissionDefaultValues<T extends NumberType> {
  permittedTimes: UintRange<T>[];
  forbiddenTimes: UintRange<T>[];
}

export function convertActionPermissionDefaultValues<T extends NumberType, U extends NumberType>(values: ActionPermissionDefaultValues<T>, convertFunction: (item: T) => U): ActionPermissionDefaultValues<U> {
  return deepCopy({
    ...values,
    permittedTimes: values.permittedTimes.map((b) => convertUintRange(b, convertFunction)),
    forbiddenTimes: values.forbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * ActionPermissionCombination represents a combination of values for an ActionPermission.
 * Here, you can manipulate (invert / all / none) the default values (in the defaultValues property) to allow / disallow certain combinations of values.
 *
 * @typedef {Object} ActionPermissionCombination
 * @property {ValueOptions} permittedTimesOptions - The options for manipulating the permitted times.
 * @property {ValueOptions} forbiddenTimesOptions - The options for manipulating the forbidden times.
 */
export interface ActionPermissionCombination {
  permittedTimesOptions?: ValueOptions;
  forbiddenTimesOptions?: ValueOptions;
}

// export function convertActionPermissionCombination<T extends NumberType, U extends NumberType>(combination: ActionPermissionCombination<T>, _convertFunction: (item: T) => U): ActionPermissionCombination<U> {
//   return deepCopy({
//     ...combination,
//     permittedTimesOptions: convertValueOptions(combination.permittedTimesOptions),
//     forbiddenTimesOptions: convertValueOptions(combination.forbiddenTimesOptions)
//   })
// }

/**
 * TimedUpdatePermission represents a permission that allows updating a timeline-based value time. For example, updating the collection metadata.
 * This permission allows you to define when the value can be updated, and what times the value can be updated for.
 *
 * @typedef {Object} TimedUpdatePermission
 * @property {TimedUpdatePermissionDefaultValues} defaultValues - The default values for the permission.
 * @property {TimedUpdatePermissionCombination[]} combinations - The list of combinations of values for the permission. Here, you can manipulate the default values to allow / disallow certain combinations of values.
 */
export interface TimedUpdatePermission<T extends NumberType> {
  defaultValues: TimedUpdatePermissionDefaultValues<T>;
  combinations: TimedUpdatePermissionCombination[];
}

export function convertTimedUpdatePermission<T extends NumberType, U extends NumberType>(permission: TimedUpdatePermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): TimedUpdatePermission<U> {
  return deepCopy({
    ...permission,
    defaultValues: convertTimedUpdatePermissionDefaultValues(permission.defaultValues, convertFunction),
    combinations: populateOptionalFields ? permission.combinations.map((b) => {
      return {
        timelineTimesOptions: PermissionCombinationDefaultValues.timelineTimesOptions,
        permittedTimesOptions: PermissionCombinationDefaultValues.permittedTimesOptions,
        forbiddenTimesOptions: PermissionCombinationDefaultValues.forbiddenTimesOptions,
        ...b,
      } as Required<TimedUpdatePermissionCombination>
    }) : permission.combinations
  })
}


/**
 * TimedUpdatePermissionDefaultValues represents the default values for a TimedUpdatePermission.
 *
 * @typedef {Object} TimedUpdatePermissionDefaultValues
 * @property {UintRange[]} timelineTimes - The timeline times that the permission applies to.
 * @property {UintRange[]} permittedTimes - The permitted times of the permission.
 * @property {UintRange[]} forbiddenTimes - The forbidden times of the permission.
 */
export interface TimedUpdatePermissionDefaultValues<T extends NumberType> {
  timelineTimes: UintRange<T>[];
  permittedTimes: UintRange<T>[];
  forbiddenTimes: UintRange<T>[];
}
export function convertTimedUpdatePermissionDefaultValues<T extends NumberType, U extends NumberType>(values: TimedUpdatePermissionDefaultValues<T>, convertFunction: (item: T) => U): TimedUpdatePermissionDefaultValues<U> {
  return deepCopy({
    ...values,
    timelineTimes: values.timelineTimes.map((b) => convertUintRange(b, convertFunction)),
    permittedTimes: values.permittedTimes.map((b) => convertUintRange(b, convertFunction)),
    forbiddenTimes: values.forbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * TimedUpdatePermissionCombination represents a combination of values for a TimedUpdatePermission.
 *
 * Here, you can manipulate (invert / all / none) the default values (in the defaultValues property) to allow / disallow certain combinations of values.
 *
 * @typedef {Object} TimedUpdatePermissionCombination
 * @property {ValueOptions} timelineTimesOptions - The options for manipulating the timeline times.
 * @property {ValueOptions} permittedTimesOptions - The options for manipulating the permitted times.
 * @property {ValueOptions} forbiddenTimesOptions - The options for manipulating the forbidden times.
 */
export interface TimedUpdatePermissionCombination {
  timelineTimesOptions?: ValueOptions;
  permittedTimesOptions?: ValueOptions;
  forbiddenTimesOptions?: ValueOptions;
}

// export function convertTimedUpdatePermissionCombination<T extends NumberType, U extends NumberType>(combination: TimedUpdatePermissionCombination<T>, _convertFunction: (item: T) => U): TimedUpdatePermissionCombination<U> {
//   return deepCopy({
//     ...combination,
//     timelineTimesOptions: convertValueOptions(combination.timelineTimesOptions),
//     permittedTimesOptions: convertValueOptions(combination.permittedTimesOptions),
//     forbiddenTimesOptions: convertValueOptions(combination.forbiddenTimesOptions)
//   })
// }

/**
 * TimedUpdateWithBadgeIdsPermission represents a permission that allows updating a timeline-based value time with bagde IDS. For example, updating the badge metadata.
 *
 * This permission allows you to define when the value can be updated, and what times the value can be updated for, and for what badges the value can be updated for. Or any combination of these.
 *
 * @typedef {Object} TimedUpdateWithBadgeIdsPermission
 * @property {TimedUpdateWithBadgeIdsPermissionDefaultValues} defaultValues - The default values for the permission.
 * @property {TimedUpdateWithBadgeIdsPermissionCombination[]} combinations - The list of combinations of values for the permission. Here, you can manipulate the default values to allow / disallow certain combinations of values.
 */
export interface TimedUpdateWithBadgeIdsPermission<T extends NumberType> {
  defaultValues: TimedUpdateWithBadgeIdsPermissionDefaultValues<T>;
  combinations: TimedUpdateWithBadgeIdsPermissionCombination[];
}
export function convertTimedUpdateWithBadgeIdsPermission<T extends NumberType, U extends NumberType>(permission: TimedUpdateWithBadgeIdsPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): TimedUpdateWithBadgeIdsPermission<U> {
  return deepCopy({
    ...permission,
    defaultValues: convertTimedUpdateWithBadgeIdsPermissionDefaultValues(permission.defaultValues, convertFunction),
    combinations: populateOptionalFields ? permission.combinations.map((b) => {
      return {
        timelineTimesOptions: PermissionCombinationDefaultValues.timelineTimesOptions,
        badgeIdsOptions: PermissionCombinationDefaultValues.badgeIdsOptions,
        permittedTimesOptions: PermissionCombinationDefaultValues.permittedTimesOptions,
        forbiddenTimesOptions: PermissionCombinationDefaultValues.forbiddenTimesOptions,
        ...b,
      } as Required<TimedUpdateWithBadgeIdsPermissionCombination>
    }) : permission.combinations
  })
}

/**
 * TimedUpdateWithBadgeIdsPermissionDefaultValues represents the default values for a TimedUpdateWithBadgeIdsPermission.
 *
 * @typedef {Object} TimedUpdateWithBadgeIdsPermissionDefaultValues
 * @property {UintRange[]} timelineTimes - The timeline times that the permission applies to.
 * @property {UintRange[]} badgeIds - The badge IDs that the permission applies to.
 * @property {UintRange[]} permittedTimes - The permitted times of the permission.
 * @property {UintRange[]} forbiddenTimes - The forbidden times of the permission.
  */
export interface TimedUpdateWithBadgeIdsPermissionDefaultValues<T extends NumberType> {
  timelineTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  permittedTimes: UintRange<T>[];
  forbiddenTimes: UintRange<T>[];
}

export function convertTimedUpdateWithBadgeIdsPermissionDefaultValues<T extends NumberType, U extends NumberType>(values: TimedUpdateWithBadgeIdsPermissionDefaultValues<T>, convertFunction: (item: T) => U): TimedUpdateWithBadgeIdsPermissionDefaultValues<U> {
  return deepCopy({
    ...values,
    timelineTimes: values.timelineTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: values.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    permittedTimes: values.permittedTimes.map((b) => convertUintRange(b, convertFunction)),
    forbiddenTimes: values.forbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * TimedUpdateWithBadgeIdsPermissionCombination represents a combination of values for a TimedUpdateWithBadgeIdsPermission.
 *
 * Here, you can manipulate (invert / all / none) the default values (in the defaultValues property) to allow / disallow certain combinations of values.
 *
 * @typedef {Object} TimedUpdateWithBadgeIdsPermissionCombination
 * @property {ValueOptions} timelineTimesOptions - The options for manipulating the timeline times.
 * @property {ValueOptions} badgeIdsOptions - The options for manipulating the badge IDs.
 * @property {ValueOptions} permittedTimesOptions - The options for manipulating the permitted times.
 * @property {ValueOptions} forbiddenTimesOptions - The options for manipulating the forbidden times.
 */
export interface TimedUpdateWithBadgeIdsPermissionCombination {
  timelineTimesOptions?: ValueOptions;
  badgeIdsOptions?: ValueOptions;
  permittedTimesOptions?: ValueOptions;
  forbiddenTimesOptions?: ValueOptions;
}

// export function convertTimedUpdateWithBadgeIdsPermissionCombination<T extends NumberType, U extends NumberType>(combination: TimedUpdateWithBadgeIdsPermissionCombination<T>, _convertFunction: (item: T) => U): TimedUpdateWithBadgeIdsPermissionCombination<U> {
//   return deepCopy({
//     ...combination,
//     timelineTimesOptions: convertValueOptions(combination.timelineTimesOptions),
//     badgeIdsOptions: convertValueOptions(combination.badgeIdsOptions),
//     permittedTimesOptions: convertValueOptions(combination.permittedTimesOptions),
//     forbiddenTimesOptions: convertValueOptions(combination.forbiddenTimesOptions)
//   })
// }

/**
 * BalancesActionPermission represents a permission that allows creating more badges.
 *
 * This permission allows you to define when the permission can be executed and for what badgeIds and ownershipTimes the permission can be executed for. Or any combination of these.
 *
 * @typedef {Object} BalancesActionPermission
 * @property {BalancesActionPermissionDefaultValues} defaultValues - The default values for the permission.
 * @property {BalancesActionPermissionCombination[]} combinations - The list of combinations of values for the permission. Here, you can manipulate the default values to allow / disallow certain combinations of values.
 */
export interface BalancesActionPermission<T extends NumberType> {
  defaultValues: BalancesActionPermissionDefaultValues<T>;
  combinations: BalancesActionPermissionCombination[];
}

export function convertBalancesActionPermission<T extends NumberType, U extends NumberType>(permission: BalancesActionPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): BalancesActionPermission<U> {
  return deepCopy({
    ...permission,
    defaultValues: convertBalancesActionPermissionDefaultValues(permission.defaultValues, convertFunction),
    combinations: populateOptionalFields ? permission.combinations.map((b) => {
      return {
        badgeIdsOptions: PermissionCombinationDefaultValues.badgeIdsOptions,
        ownershipTimesOptions: PermissionCombinationDefaultValues.ownershipTimesOptions,
        permittedTimesOptions: PermissionCombinationDefaultValues.permittedTimesOptions,
        forbiddenTimesOptions: PermissionCombinationDefaultValues.forbiddenTimesOptions,
        ...b,
      } as Required<BalancesActionPermissionCombination>
    }) : permission.combinations
  })
}

/**
 * BalancesActionPermissionDefaultValues represents the default values for a BalancesActionPermission.
 *
 * @typedef {Object} BalancesActionPermissionDefaultValues
 * @property {UintRange[]} badgeIds - The badge IDs that the permission applies to.
 * @property {UintRange[]} ownershipTimes - The owned times that the permission applies to.
 * @property {UintRange[]} permittedTimes - The permitted times of the permission.
 * @property {UintRange[]} forbiddenTimes - The forbidden times of the permission.
 */
export interface BalancesActionPermissionDefaultValues<T extends NumberType> {
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  permittedTimes: UintRange<T>[];
  forbiddenTimes: UintRange<T>[];
}

export function convertBalancesActionPermissionDefaultValues<T extends NumberType, U extends NumberType>(values: BalancesActionPermissionDefaultValues<T>, convertFunction: (item: T) => U): BalancesActionPermissionDefaultValues<U> {
  return deepCopy({
    ...values,
    badgeIds: values.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: values.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permittedTimes: values.permittedTimes.map((b) => convertUintRange(b, convertFunction)),
    forbiddenTimes: values.forbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * BalancesActionPermissionCombination represents a combination of values for a BalancesActionPermission.
 *
 * Here, you can manipulate (invert / all / none) the default values (in the defaultValues property) to allow / disallow certain combinations of values.
 *
 * @typedef {Object} BalancesActionPermissionCombination
 * @property {ValueOptions} badgeIdsOptions - The options for manipulating the badge IDs.
 * @property {ValueOptions} ownershipTimesOptions - The options for manipulating the owned times.
 * @property {ValueOptions} permittedTimesOptions - The options for manipulating the permitted times.
 * @property {ValueOptions} forbiddenTimesOptions - The options for manipulating the forbidden times.
 */
export interface BalancesActionPermissionCombination {
  badgeIdsOptions?: ValueOptions;
  ownershipTimesOptions?: ValueOptions;
  permittedTimesOptions?: ValueOptions;
  forbiddenTimesOptions?: ValueOptions;
}

// export function convertBalancesActionPermissionCombination<T extends NumberType, U extends NumberType>(combination: BalancesActionPermissionCombination<T>, _convertFunction: (item: T) => U): BalancesActionPermissionCombination<U> {
//   return deepCopy({
//     ...combination,
//     badgeIdsOptions: convertValueOptions(combination.badgeIdsOptions),
//     ownershipTimesOptions: convertValueOptions(combination.ownershipTimesOptions),
//     permittedTimesOptions: convertValueOptions(combination.permittedTimesOptions),
//     forbiddenTimesOptions: convertValueOptions(combination.forbiddenTimesOptions)
//   })
// }

/**
 * CollectionApprovedTransferPermission represents a permission that allows updating the collection approved transfers.
 *
 * This permission allows you to define when the approved transfers can be updated and which combinations of (from, to, initiatedBy, transferTimes, badgeIds, ownershipTimes, permittedTimes, forbiddenTimes) can be updated.
 *
 * @typedef {Object} CollectionApprovedTransferPermission
 * @property {CollectionApprovedTransferPermissionDefaultValues} defaultValues - The default values for the permission.
 * @property {CollectionApprovedTransferPermissionCombination[]} combinations - The list of combinations of values for the permission. Here, you can manipulate the default values to allow / disallow certain combinations of values.
 */
export interface CollectionApprovedTransferPermission<T extends NumberType> {
  defaultValues: CollectionApprovedTransferPermissionDefaultValues<T>;
  combinations: CollectionApprovedTransferPermissionCombination[];
}

export function convertCollectionApprovedTransferPermission<T extends NumberType, U extends NumberType>(permission: CollectionApprovedTransferPermission<T>, convertFunction: (item: T) => U, populateOptionalFields?: boolean): CollectionApprovedTransferPermission<U> {
  return deepCopy({
    ...permission,
    defaultValues: convertCollectionApprovedTransferPermissionDefaultValues(permission.defaultValues, convertFunction),
    combinations: populateOptionalFields ? permission.combinations.map((b) => {
      return {
        timelineTimesOptions: PermissionCombinationDefaultValues.timelineTimesOptions,
        fromMappingOptions: PermissionCombinationDefaultValues.fromMappingOptions,
        toMappingOptions: PermissionCombinationDefaultValues.toMappingOptions,
        initiatedByMappingOptions: PermissionCombinationDefaultValues.initiatedByMappingOptions,
        transferTimesOptions: PermissionCombinationDefaultValues.transferTimesOptions,
        badgeIdsOptions: PermissionCombinationDefaultValues.badgeIdsOptions,
        ownershipTimesOptions: PermissionCombinationDefaultValues.ownershipTimesOptions,
        permittedTimesOptions: PermissionCombinationDefaultValues.permittedTimesOptions,
        forbiddenTimesOptions: PermissionCombinationDefaultValues.forbiddenTimesOptions,
        ...b,
      } as Required<CollectionApprovedTransferPermissionCombination>
    }) : permission.combinations
  })
}

/**
 * CollectionApprovedTransferPermissionDefaultValues represents the default values for a CollectionApprovedTransferPermission.
 *
 * @typedef {Object} CollectionApprovedTransferPermissionDefaultValues
 * @property {UintRange[]} timelineTimes - The timeline times that the permission applies to.
 * @property {string} fromMappingId - The mapping ID of the from addresses of the approved transfers.
 * @property {string} toMappingId - The mapping ID of the to addresses of the approved transfers.
 * @property {string} initiatedByMappingId - The mapping ID of the initiatedBy addresses of the approved transfers.
 * @property {UintRange[]} transferTimes - The transfer times of the approved transfers.
 * @property {UintRange[]} badgeIds - The badge IDs of the approved transfers.
 * @property {UintRange[]} ownershipTimes - The owned times of the approved transfers.
 * @property {UintRange[]} permittedTimes - The permitted times of this permission.
 * @property {UintRange[]} forbiddenTimes - The forbidden times of this permission.
 */
export interface CollectionApprovedTransferPermissionDefaultValues<T extends NumberType> {
  timelineTimes: UintRange<T>[];
  fromMappingId: string;
  toMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRange<T>[];
  badgeIds: UintRange<T>[];
  ownershipTimes: UintRange<T>[];
  permittedTimes: UintRange<T>[];
  forbiddenTimes: UintRange<T>[];
}

export function convertCollectionApprovedTransferPermissionDefaultValues<T extends NumberType, U extends NumberType>(values: CollectionApprovedTransferPermissionDefaultValues<T>, convertFunction: (item: T) => U): CollectionApprovedTransferPermissionDefaultValues<U> {
  return deepCopy({
    ...values,
    timelineTimes: values.timelineTimes.map((b) => convertUintRange(b, convertFunction)),
    transferTimes: values.transferTimes.map((b) => convertUintRange(b, convertFunction)),
    badgeIds: values.badgeIds.map((b) => convertUintRange(b, convertFunction)),
    ownershipTimes: values.ownershipTimes.map((b) => convertUintRange(b, convertFunction)),
    permittedTimes: values.permittedTimes.map((b) => convertUintRange(b, convertFunction)),
    forbiddenTimes: values.forbiddenTimes.map((b) => convertUintRange(b, convertFunction))
  })
}

/**
 * CollectionApprovedTransferPermissionCombination represents a combination of values for a CollectionApprovedTransferPermission.
 *
 * Here, you can manipulate (invert / all / none) the default values (in the defaultValues property) to allow / disallow certain combinations of values.
 *
 * @typedef {Object} CollectionApprovedTransferPermissionCombination
 * @property {ValueOptions} timelineTimesOptions - The options for manipulating the timeline times.
 * @property {ValueOptions} fromMappingOptions - The options for manipulating the from mapping ID.
 * @property {ValueOptions} toMappingOptions - The options for manipulating the to mapping ID.
 * @property {ValueOptions} initiatedByMappingOptions - The options for manipulating the initiatedBy mapping ID.
 * @property {ValueOptions} transferTimesOptions - The options for manipulating the transfer times.
 * @property {ValueOptions} badgeIdsOptions - The options for manipulating the badge IDs.
 * @property {ValueOptions} ownershipTimesOptions - The options for manipulating the owned times.
 * @property {ValueOptions} permittedTimesOptions - The options for manipulating the permitted times.
 * @property {ValueOptions} forbiddenTimesOptions - The options for manipulating the forbidden times.
 */
export interface CollectionApprovedTransferPermissionCombination {
  timelineTimesOptions?: ValueOptions;
  fromMappingOptions?: ValueOptions;
  toMappingOptions?: ValueOptions;
  initiatedByMappingOptions?: ValueOptions;
  transferTimesOptions?: ValueOptions;
  badgeIdsOptions?: ValueOptions;
  ownershipTimesOptions?: ValueOptions;
  permittedTimesOptions?: ValueOptions;
  forbiddenTimesOptions?: ValueOptions;
}

// export function convertCollectionApprovedTransferPermissionCombination<T extends NumberType, U extends NumberType>(combination: CollectionApprovedTransferPermissionCombination<T>, _convertFunction: (item: T) => U): CollectionApprovedTransferPermissionCombination<U> {
//   return deepCopy({
//     ...combination,
//     timelineTimesOptions: convertValueOptions(combination.timelineTimesOptions),
//     fromMappingOptions: convertValueOptions(combination.fromMappingOptions),
//     toMappingOptions: convertValueOptions(combination.toMappingOptions),
//     initiatedByMappingOptions: convertValueOptions(combination.initiatedByMappingOptions),
//     transferTimesOptions: convertValueOptions(combination.transferTimesOptions),
//     badgeIdsOptions: convertValueOptions(combination.badgeIdsOptions),
//     ownershipTimesOptions: convertValueOptions(combination.ownershipTimesOptions),
//     permittedTimesOptions: convertValueOptions(combination.permittedTimesOptions),
//     forbiddenTimesOptions: convertValueOptions(combination.forbiddenTimesOptions)
//   })
// }
