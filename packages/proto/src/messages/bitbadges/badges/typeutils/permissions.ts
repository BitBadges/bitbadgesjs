import { UintRangeBase, UintRange, s_UintRange, convertToUintRange, convertFromUintRange } from "./typeUtils";

export interface UserPermissionsBase {
  canUpdateApprovedOutgoingTransfers: UserApprovedOutgoingTransferPermissionBase[];
  canUpdateApprovedIncomingTransfers: UserApprovedIncomingTransferPermissionBase[];
}

export interface UserPermissions extends UserPermissionsBase {
  canUpdateApprovedOutgoingTransfers: UserApprovedOutgoingTransferPermission[];
  canUpdateApprovedIncomingTransfers: UserApprovedIncomingTransferPermission[];
}

export interface s_UserPermissions extends UserPermissionsBase {
  canUpdateApprovedOutgoingTransfers: s_UserApprovedOutgoingTransferPermission[];
  canUpdateApprovedIncomingTransfers: s_UserApprovedIncomingTransferPermission[];
}

export function convertToUserPermissions(s_permissions: s_UserPermissions): UserPermissions {
  return {
    ...s_permissions,
    canUpdateApprovedOutgoingTransfers: s_permissions.canUpdateApprovedOutgoingTransfers.map(convertToUserApprovedOutgoingTransferPermission),
    canUpdateApprovedIncomingTransfers: s_permissions.canUpdateApprovedIncomingTransfers.map(convertToUserApprovedIncomingTransferPermission)
  };
}

export function convertFromUserPermissions(permissions: UserPermissions): s_UserPermissions {
  return {
    ...permissions,
    canUpdateApprovedOutgoingTransfers: permissions.canUpdateApprovedOutgoingTransfers.map(convertFromUserApprovedOutgoingTransferPermission),
    canUpdateApprovedIncomingTransfers: permissions.canUpdateApprovedIncomingTransfers.map(convertFromUserApprovedIncomingTransferPermission)
  };
}

export interface UserApprovedOutgoingTransferPermissionBase {
  defaultValues: UserApprovedOutgoingTransferDefaultValuesBase;
  combinations: UserApprovedOutgoingTransferCombinationBase[];
}

export interface UserApprovedOutgoingTransferPermission extends UserApprovedOutgoingTransferPermissionBase {
  defaultValues: UserApprovedOutgoingTransferDefaultValues;
  combinations: UserApprovedOutgoingTransferCombination[];
}

export interface s_UserApprovedOutgoingTransferPermission extends UserApprovedOutgoingTransferPermissionBase {
  defaultValues: s_UserApprovedOutgoingTransferDefaultValues;
  combinations: s_UserApprovedOutgoingTransferCombination[];
}

export function convertToUserApprovedOutgoingTransferPermission(s_permission: s_UserApprovedOutgoingTransferPermission): UserApprovedOutgoingTransferPermission {
  return {
    ...s_permission,
    defaultValues: convertToUserApprovedOutgoingTransferDefaultValues(s_permission.defaultValues),
    combinations: s_permission.combinations.map(convertToUserApprovedOutgoingTransferCombination)
  };
}

export function convertFromUserApprovedOutgoingTransferPermission(permission: UserApprovedOutgoingTransferPermission): s_UserApprovedOutgoingTransferPermission {
  return {
    ...permission,
    defaultValues: convertFromUserApprovedOutgoingTransferDefaultValues(permission.defaultValues),
    combinations: permission.combinations.map(convertFromUserApprovedOutgoingTransferCombination)
  };
}

export interface UserApprovedOutgoingTransferDefaultValuesBase {
  timelineTimes: UintRangeBase[];
  toMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
  ownedTimes: UintRangeBase[];
  permittedTimes: UintRangeBase[];
  forbiddenTimes: UintRangeBase[];
}

export interface UserApprovedOutgoingTransferDefaultValues extends UserApprovedOutgoingTransferDefaultValuesBase {
  timelineTimes: UintRange[];
  transferTimes: UintRange[];
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
  permittedTimes: UintRange[];
  forbiddenTimes: UintRange[];
}

export interface s_UserApprovedOutgoingTransferDefaultValues extends UserApprovedOutgoingTransferDefaultValuesBase {
  timelineTimes: s_UintRange[];
  transferTimes: s_UintRange[];
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
  permittedTimes: s_UintRange[];
  forbiddenTimes: s_UintRange[];
}

export function convertToUserApprovedOutgoingTransferDefaultValues(s_values: s_UserApprovedOutgoingTransferDefaultValues): UserApprovedOutgoingTransferDefaultValues {
  return {
    ...s_values,
    timelineTimes: s_values.timelineTimes.map(convertToUintRange),
    transferTimes: s_values.transferTimes.map(convertToUintRange),
    badgeIds: s_values.badgeIds.map(convertToUintRange),
    ownedTimes: s_values.ownedTimes.map(convertToUintRange),
    permittedTimes: s_values.permittedTimes.map(convertToUintRange),
    forbiddenTimes: s_values.forbiddenTimes.map(convertToUintRange)
  };
}

export function convertFromUserApprovedOutgoingTransferDefaultValues(values: UserApprovedOutgoingTransferDefaultValues): s_UserApprovedOutgoingTransferDefaultValues {
  return {
    ...values,
    timelineTimes: values.timelineTimes.map(convertFromUintRange),
    transferTimes: values.transferTimes.map(convertFromUintRange),
    badgeIds: values.badgeIds.map(convertFromUintRange),
    ownedTimes: values.ownedTimes.map(convertFromUintRange),
    permittedTimes: values.permittedTimes.map(convertFromUintRange),
    forbiddenTimes: values.forbiddenTimes.map(convertFromUintRange)
  };
}

export interface UserApprovedOutgoingTransferCombinationBase {
  timelineTimesOptions: ValueOptions;
  toMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface UserApprovedOutgoingTransferCombination extends UserApprovedOutgoingTransferCombinationBase {
  timelineTimesOptions: ValueOptions;
  toMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface s_UserApprovedOutgoingTransferCombination extends UserApprovedOutgoingTransferCombinationBase {
  timelineTimesOptions: s_ValueOptions;
  toMappingOptions: s_ValueOptions;
  initiatedByMappingOptions: s_ValueOptions;
  transferTimesOptions: s_ValueOptions;
  badgeIdsOptions: s_ValueOptions;
  ownedTimesOptions: s_ValueOptions;
  permittedTimesOptions: s_ValueOptions;
  forbiddenTimesOptions: s_ValueOptions;
}

export function convertToUserApprovedOutgoingTransferCombination(s_combination: s_UserApprovedOutgoingTransferCombination): UserApprovedOutgoingTransferCombination {
  return {
    ...s_combination,
    timelineTimesOptions: convertToValueOptions(s_combination.timelineTimesOptions),
    toMappingOptions: convertToValueOptions(s_combination.toMappingOptions),
    initiatedByMappingOptions: convertToValueOptions(s_combination.initiatedByMappingOptions),
    transferTimesOptions: convertToValueOptions(s_combination.transferTimesOptions),
    badgeIdsOptions: convertToValueOptions(s_combination.badgeIdsOptions),
    ownedTimesOptions: convertToValueOptions(s_combination.ownedTimesOptions),
    permittedTimesOptions: convertToValueOptions(s_combination.permittedTimesOptions),
    forbiddenTimesOptions: convertToValueOptions(s_combination.forbiddenTimesOptions)
  };
}

export function convertFromUserApprovedOutgoingTransferCombination(combination: UserApprovedOutgoingTransferCombination): s_UserApprovedOutgoingTransferCombination {
  return {
    ...combination,
    timelineTimesOptions: convertFromValueOptions(combination.timelineTimesOptions),
    toMappingOptions: convertFromValueOptions(combination.toMappingOptions),
    initiatedByMappingOptions: convertFromValueOptions(combination.initiatedByMappingOptions),
    transferTimesOptions: convertFromValueOptions(combination.transferTimesOptions),
    badgeIdsOptions: convertFromValueOptions(combination.badgeIdsOptions),
    ownedTimesOptions: convertFromValueOptions(combination.ownedTimesOptions),
    permittedTimesOptions: convertFromValueOptions(combination.permittedTimesOptions),
    forbiddenTimesOptions: convertFromValueOptions(combination.forbiddenTimesOptions)
  };
}

export interface ValueOptionsBase {
  invertDefault: boolean;
  allValues: boolean;
  noValues: boolean;
}

export interface ValueOptions extends ValueOptionsBase { }

export interface s_ValueOptions extends ValueOptionsBase { }

export function convertToValueOptions(s_options: s_ValueOptions): ValueOptions {
  return {
    ...s_options
  };
}

export function convertFromValueOptions(options: ValueOptions): s_ValueOptions {
  return {
    ...options
  };
}





export interface UserApprovedIncomingTransferPermissionBase {
  defaultValues: UserApprovedIncomingTransferDefaultValuesBase;
  combinations: UserApprovedIncomingTransferCombinationBase[];
}

export interface UserApprovedIncomingTransferPermission extends UserApprovedIncomingTransferPermissionBase {
  defaultValues: UserApprovedIncomingTransferDefaultValues;
  combinations: UserApprovedIncomingTransferCombination[];
}

export interface s_UserApprovedIncomingTransferPermission extends UserApprovedIncomingTransferPermissionBase {
  defaultValues: s_UserApprovedIncomingTransferDefaultValues;
  combinations: s_UserApprovedIncomingTransferCombination[];
}

export function convertToUserApprovedIncomingTransferPermission(s_permission: s_UserApprovedIncomingTransferPermission): UserApprovedIncomingTransferPermission {
  return {
    ...s_permission,
    defaultValues: convertToUserApprovedIncomingTransferDefaultValues(s_permission.defaultValues),
    combinations: s_permission.combinations.map(convertToUserApprovedIncomingTransferCombination)
  };
}

export function convertFromUserApprovedIncomingTransferPermission(permission: UserApprovedIncomingTransferPermission): s_UserApprovedIncomingTransferPermission {
  return {
    ...permission,
    defaultValues: convertFromUserApprovedIncomingTransferDefaultValues(permission.defaultValues),
    combinations: permission.combinations.map(convertFromUserApprovedIncomingTransferCombination)
  };
}

export interface UserApprovedIncomingTransferDefaultValuesBase {
  timelineTimes: UintRangeBase[];
  fromMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
  ownedTimes: UintRangeBase[];
  permittedTimes: UintRangeBase[];
  forbiddenTimes: UintRangeBase[];
}

export interface UserApprovedIncomingTransferDefaultValues extends UserApprovedIncomingTransferDefaultValuesBase {
  timelineTimes: UintRange[];
  transferTimes: UintRange[];
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
  permittedTimes: UintRange[];
  forbiddenTimes: UintRange[];
}

export interface s_UserApprovedIncomingTransferDefaultValues extends UserApprovedIncomingTransferDefaultValuesBase {
  timelineTimes: s_UintRange[];
  transferTimes: s_UintRange[];
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
  permittedTimes: s_UintRange[];
  forbiddenTimes: s_UintRange[];
}

export function convertToUserApprovedIncomingTransferDefaultValues(s_values: s_UserApprovedIncomingTransferDefaultValues): UserApprovedIncomingTransferDefaultValues {
  return {
    ...s_values,
    timelineTimes: s_values.timelineTimes.map(convertToUintRange),
    transferTimes: s_values.transferTimes.map(convertToUintRange),
    badgeIds: s_values.badgeIds.map(convertToUintRange),
    ownedTimes: s_values.ownedTimes.map(convertToUintRange),
    permittedTimes: s_values.permittedTimes.map(convertToUintRange),
    forbiddenTimes: s_values.forbiddenTimes.map(convertToUintRange)
  };
}

export function convertFromUserApprovedIncomingTransferDefaultValues(values: UserApprovedIncomingTransferDefaultValues): s_UserApprovedIncomingTransferDefaultValues {
  return {
    ...values,
    timelineTimes: values.timelineTimes.map(convertFromUintRange),
    transferTimes: values.transferTimes.map(convertFromUintRange),
    badgeIds: values.badgeIds.map(convertFromUintRange),
    ownedTimes: values.ownedTimes.map(convertFromUintRange),
    permittedTimes: values.permittedTimes.map(convertFromUintRange),
    forbiddenTimes: values.forbiddenTimes.map(convertFromUintRange)
  };
}

export interface UserApprovedIncomingTransferCombinationBase {
  timelineTimesOptions: ValueOptions;
  fromMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface UserApprovedIncomingTransferCombination extends UserApprovedIncomingTransferCombinationBase {
  timelineTimesOptions: ValueOptions;
  fromMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface s_UserApprovedIncomingTransferCombination extends UserApprovedIncomingTransferCombinationBase {
  timelineTimesOptions: s_ValueOptions;
  fromMappingOptions: s_ValueOptions;
  initiatedByMappingOptions: s_ValueOptions;
  transferTimesOptions: s_ValueOptions;
  badgeIdsOptions: s_ValueOptions;
  ownedTimesOptions: s_ValueOptions;
  permittedTimesOptions: s_ValueOptions;
  forbiddenTimesOptions: s_ValueOptions;
}

export function convertToUserApprovedIncomingTransferCombination(s_combination: s_UserApprovedIncomingTransferCombination): UserApprovedIncomingTransferCombination {
  return {
    ...s_combination,
    timelineTimesOptions: convertToValueOptions(s_combination.timelineTimesOptions),
    fromMappingOptions: convertToValueOptions(s_combination.fromMappingOptions),
    initiatedByMappingOptions: convertToValueOptions(s_combination.initiatedByMappingOptions),
    transferTimesOptions: convertToValueOptions(s_combination.transferTimesOptions),
    badgeIdsOptions: convertToValueOptions(s_combination.badgeIdsOptions),
    ownedTimesOptions: convertToValueOptions(s_combination.ownedTimesOptions),
    permittedTimesOptions: convertToValueOptions(s_combination.permittedTimesOptions),
    forbiddenTimesOptions: convertToValueOptions(s_combination.forbiddenTimesOptions)
  };
}

export function convertFromUserApprovedIncomingTransferCombination(combination: UserApprovedIncomingTransferCombination): s_UserApprovedIncomingTransferCombination {
  return {
    ...combination,
    timelineTimesOptions: convertFromValueOptions(combination.timelineTimesOptions),
    fromMappingOptions: convertFromValueOptions(combination.fromMappingOptions),
    initiatedByMappingOptions: convertFromValueOptions(combination.initiatedByMappingOptions),
    transferTimesOptions: convertFromValueOptions(combination.transferTimesOptions),
    badgeIdsOptions: convertFromValueOptions(combination.badgeIdsOptions),
    ownedTimesOptions: convertFromValueOptions(combination.ownedTimesOptions),
    permittedTimesOptions: convertFromValueOptions(combination.permittedTimesOptions),
    forbiddenTimesOptions: convertFromValueOptions(combination.forbiddenTimesOptions)
  };
}




export interface CollectionPermissionsBase {
  canDeleteCollection: ActionPermissionBase[];
  canArchiveCollection: TimedUpdatePermissionBase[];
  canUpdateContractAddress: TimedUpdatePermissionBase[];
  canUpdateOffChainBalancesMetadata: TimedUpdatePermissionBase[];
  canUpdateStandards: TimedUpdatePermissionBase[];
  canUpdateCustomData: TimedUpdatePermissionBase[];
  canUpdateManager: TimedUpdatePermissionBase[];
  canUpdateCollectionMetadata: TimedUpdatePermissionBase[];
  canCreateMoreBadges: BalancesActionPermissionBase[];
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermissionBase[];
  canUpdateInheritedBalances: TimedUpdateWithBadgeIdsPermissionBase[];
  canUpdateCollectionApprovedTransfers: CollectionApprovedTransferPermissionBase[];
}

export interface CollectionPermissions extends CollectionPermissionsBase {
  canDeleteCollection: ActionPermission[];
  canArchiveCollection: TimedUpdatePermission[];
  canUpdateContractAddress: TimedUpdatePermission[];
  canUpdateOffChainBalancesMetadata: TimedUpdatePermission[];
  canUpdateStandards: TimedUpdatePermission[];
  canUpdateCustomData: TimedUpdatePermission[];
  canUpdateManager: TimedUpdatePermission[];
  canUpdateCollectionMetadata: TimedUpdatePermission[];
  canCreateMoreBadges: BalancesActionPermission[];
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission[];
  canUpdateInheritedBalances: TimedUpdateWithBadgeIdsPermission[];
  canUpdateCollectionApprovedTransfers: CollectionApprovedTransferPermission[];
}

export interface s_CollectionPermissions extends CollectionPermissionsBase {
  canDeleteCollection: s_ActionPermission[];
  canArchiveCollection: s_TimedUpdatePermission[];
  canUpdateContractAddress: s_TimedUpdatePermission[];
  canUpdateOffChainBalancesMetadata: s_TimedUpdatePermission[];
  canUpdateStandards: s_TimedUpdatePermission[];
  canUpdateCustomData: s_TimedUpdatePermission[];
  canUpdateManager: s_TimedUpdatePermission[];
  canUpdateCollectionMetadata: s_TimedUpdatePermission[];
  canCreateMoreBadges: s_BalancesActionPermission[];
  canUpdateBadgeMetadata: s_TimedUpdateWithBadgeIdsPermission[];
  canUpdateInheritedBalances: s_TimedUpdateWithBadgeIdsPermission[];
  canUpdateCollectionApprovedTransfers: s_CollectionApprovedTransferPermission[];
}

export function convertToCollectionPermissions(s_permissions: s_CollectionPermissions): CollectionPermissions {
  return {
    ...s_permissions,
    canDeleteCollection: s_permissions.canDeleteCollection.map(convertToActionPermission),
    canArchiveCollection: s_permissions.canArchiveCollection.map(convertToTimedUpdatePermission),
    canUpdateContractAddress: s_permissions.canUpdateContractAddress.map(convertToTimedUpdatePermission),
    canUpdateOffChainBalancesMetadata: s_permissions.canUpdateOffChainBalancesMetadata.map(convertToTimedUpdatePermission),
    canUpdateStandards: s_permissions.canUpdateStandards.map(convertToTimedUpdatePermission),
    canUpdateCustomData: s_permissions.canUpdateCustomData.map(convertToTimedUpdatePermission),
    canUpdateManager: s_permissions.canUpdateManager.map(convertToTimedUpdatePermission),
    canUpdateCollectionMetadata: s_permissions.canUpdateCollectionMetadata.map(convertToTimedUpdatePermission),
    canCreateMoreBadges: s_permissions.canCreateMoreBadges.map(convertToBalancesActionPermission),
    canUpdateBadgeMetadata: s_permissions.canUpdateBadgeMetadata.map(convertToTimedUpdateWithBadgeIdsPermission),
    canUpdateInheritedBalances: s_permissions.canUpdateInheritedBalances.map(convertToTimedUpdateWithBadgeIdsPermission),
    canUpdateCollectionApprovedTransfers: s_permissions.canUpdateCollectionApprovedTransfers.map(convertToCollectionApprovedTransferPermission)
  };
}

export function convertFromCollectionPermissions(permissions: CollectionPermissions): s_CollectionPermissions {
  return {
    ...permissions,
    canDeleteCollection: permissions.canDeleteCollection.map(convertFromActionPermission),
    canArchiveCollection: permissions.canArchiveCollection.map(convertFromTimedUpdatePermission),
    canUpdateContractAddress: permissions.canUpdateContractAddress.map(convertFromTimedUpdatePermission),
    canUpdateOffChainBalancesMetadata: permissions.canUpdateOffChainBalancesMetadata.map(convertFromTimedUpdatePermission),
    canUpdateStandards: permissions.canUpdateStandards.map(convertFromTimedUpdatePermission),
    canUpdateCustomData: permissions.canUpdateCustomData.map(convertFromTimedUpdatePermission),
    canUpdateManager: permissions.canUpdateManager.map(convertFromTimedUpdatePermission),
    canUpdateCollectionMetadata: permissions.canUpdateCollectionMetadata.map(convertFromTimedUpdatePermission),
    canCreateMoreBadges: permissions.canCreateMoreBadges.map(convertFromBalancesActionPermission),
    canUpdateBadgeMetadata: permissions.canUpdateBadgeMetadata.map(convertFromTimedUpdateWithBadgeIdsPermission),
    canUpdateInheritedBalances: permissions.canUpdateInheritedBalances.map(convertFromTimedUpdateWithBadgeIdsPermission),
    canUpdateCollectionApprovedTransfers: permissions.canUpdateCollectionApprovedTransfers.map(convertFromCollectionApprovedTransferPermission)
  };
}

export interface ActionPermissionBase {
  defaultValues: ActionPermissionDefaultValuesBase;
  combinations: ActionPermissionCombinationBase[];
}

export interface ActionPermission extends ActionPermissionBase {
  defaultValues: ActionPermissionDefaultValues;
  combinations: ActionPermissionCombination[];
}

export interface s_ActionPermission extends ActionPermissionBase {
  defaultValues: s_ActionPermissionDefaultValues;
  combinations: s_ActionPermissionCombination[];
}

export function convertToActionPermission(s_permission: s_ActionPermission): ActionPermission {
  return {
    ...s_permission,
    defaultValues: convertToActionPermissionDefaultValues(s_permission.defaultValues),
    combinations: s_permission.combinations.map(convertToActionPermissionCombination)
  };
}

export function convertFromActionPermission(permission: ActionPermission): s_ActionPermission {
  return {
    ...permission,
    defaultValues: convertFromActionPermissionDefaultValues(permission.defaultValues),
    combinations: permission.combinations.map(convertFromActionPermissionCombination)
  };
}

export interface ActionPermissionDefaultValuesBase {
  permittedTimes: UintRangeBase[];
  forbiddenTimes: UintRangeBase[];
}

export interface ActionPermissionDefaultValues extends ActionPermissionDefaultValuesBase {
  permittedTimes: UintRange[];
  forbiddenTimes: UintRange[];
}

export interface s_ActionPermissionDefaultValues extends ActionPermissionDefaultValuesBase {
  permittedTimes: s_UintRange[];
  forbiddenTimes: s_UintRange[];
}

export function convertToActionPermissionDefaultValues(s_values: s_ActionPermissionDefaultValues): ActionPermissionDefaultValues {
  return {
    ...s_values,
    permittedTimes: s_values.permittedTimes.map(convertToUintRange),
    forbiddenTimes: s_values.forbiddenTimes.map(convertToUintRange)
  };
}

export function convertFromActionPermissionDefaultValues(values: ActionPermissionDefaultValues): s_ActionPermissionDefaultValues {
  return {
    ...values,
    permittedTimes: values.permittedTimes.map(convertFromUintRange),
    forbiddenTimes: values.forbiddenTimes.map(convertFromUintRange)
  };
}

export interface ActionPermissionCombinationBase {
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface ActionPermissionCombination extends ActionPermissionCombinationBase { }

export interface s_ActionPermissionCombination extends ActionPermissionCombinationBase { }

export function convertToActionPermissionCombination(s_combination: s_ActionPermissionCombination): ActionPermissionCombination {
  return {
    ...s_combination,
  };
}

export function convertFromActionPermissionCombination(combination: ActionPermissionCombination): s_ActionPermissionCombination {
  return {
    ...combination,
  };
}

export interface TimedUpdatePermissionBase {
  defaultValues: TimedUpdatePermissionDefaultValuesBase;
  combinations: TimedUpdatePermissionCombinationBase[];
}

export interface TimedUpdatePermission extends TimedUpdatePermissionBase {
  defaultValues: TimedUpdatePermissionDefaultValues;
  combinations: TimedUpdatePermissionCombination[];
}

export interface s_TimedUpdatePermission extends TimedUpdatePermissionBase {
  defaultValues: s_TimedUpdatePermissionDefaultValues;
  combinations: s_TimedUpdatePermissionCombination[];
}

export function convertToTimedUpdatePermission(s_permission: s_TimedUpdatePermission): TimedUpdatePermission {
  return {
    ...s_permission,
    defaultValues: convertToTimedUpdatePermissionDefaultValues(s_permission.defaultValues),
    combinations: s_permission.combinations.map(convertToTimedUpdatePermissionCombination)
  };
}

export function convertFromTimedUpdatePermission(permission: TimedUpdatePermission): s_TimedUpdatePermission {
  return {
    ...permission,
    defaultValues: convertFromTimedUpdatePermissionDefaultValues(permission.defaultValues),
    combinations: permission.combinations.map(convertFromTimedUpdatePermissionCombination)
  };
}

export interface TimedUpdatePermissionDefaultValuesBase {
  timelineTimes: UintRangeBase[];
  permittedTimes: UintRangeBase[];
  forbiddenTimes: UintRangeBase[];
}

export interface TimedUpdatePermissionDefaultValues extends TimedUpdatePermissionDefaultValuesBase {
  timelineTimes: UintRange[];
  permittedTimes: UintRange[];
  forbiddenTimes: UintRange[];
}

export interface s_TimedUpdatePermissionDefaultValues extends TimedUpdatePermissionDefaultValuesBase {
  timelineTimes: s_UintRange[];
  permittedTimes: s_UintRange[];
  forbiddenTimes: s_UintRange[];
}

export function convertToTimedUpdatePermissionDefaultValues(s_values: s_TimedUpdatePermissionDefaultValues): TimedUpdatePermissionDefaultValues {
  return {
    ...s_values,
    timelineTimes: s_values.timelineTimes.map(convertToUintRange),
    permittedTimes: s_values.permittedTimes.map(convertToUintRange),
    forbiddenTimes: s_values.forbiddenTimes.map(convertToUintRange)
  };
}

export function convertFromTimedUpdatePermissionDefaultValues(values: TimedUpdatePermissionDefaultValues): s_TimedUpdatePermissionDefaultValues {
  return {
    ...values,
    timelineTimes: values.timelineTimes.map(convertFromUintRange),
    permittedTimes: values.permittedTimes.map(convertFromUintRange),
    forbiddenTimes: values.forbiddenTimes.map(convertFromUintRange)
  };
}

export interface TimedUpdatePermissionCombinationBase {
  timelineTimesOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface TimedUpdatePermissionCombination extends TimedUpdatePermissionCombinationBase { }

export interface s_TimedUpdatePermissionCombination extends TimedUpdatePermissionCombinationBase { }

export function convertToTimedUpdatePermissionCombination(s_combination: s_TimedUpdatePermissionCombination): TimedUpdatePermissionCombination {
  return {
    ...s_combination,
  };
}

export function convertFromTimedUpdatePermissionCombination(combination: TimedUpdatePermissionCombination): s_TimedUpdatePermissionCombination {
  return {
    ...combination,
  };
}

export interface TimedUpdateWithBadgeIdsPermissionBase {
  defaultValues: TimedUpdateWithBadgeIdsPermissionDefaultValuesBase;
  combinations: TimedUpdateWithBadgeIdsPermissionCombinationBase[];
}

export interface TimedUpdateWithBadgeIdsPermission extends TimedUpdateWithBadgeIdsPermissionBase {
  defaultValues: TimedUpdateWithBadgeIdsPermissionDefaultValues;
  combinations: TimedUpdateWithBadgeIdsPermissionCombination[];
}

export interface s_TimedUpdateWithBadgeIdsPermission extends TimedUpdateWithBadgeIdsPermissionBase {
  defaultValues: s_TimedUpdateWithBadgeIdsPermissionDefaultValues;
  combinations: s_TimedUpdateWithBadgeIdsPermissionCombination[];
}

export function convertToTimedUpdateWithBadgeIdsPermission(s_permission: s_TimedUpdateWithBadgeIdsPermission): TimedUpdateWithBadgeIdsPermission {
  return {
    ...s_permission,
    defaultValues: convertToTimedUpdateWithBadgeIdsPermissionDefaultValues(s_permission.defaultValues),
    combinations: s_permission.combinations.map(convertToTimedUpdateWithBadgeIdsPermissionCombination)
  };
}

export function convertFromTimedUpdateWithBadgeIdsPermission(permission: TimedUpdateWithBadgeIdsPermission): s_TimedUpdateWithBadgeIdsPermission {
  return {
    ...permission,
    defaultValues: convertFromTimedUpdateWithBadgeIdsPermissionDefaultValues(permission.defaultValues),
    combinations: permission.combinations.map(convertFromTimedUpdateWithBadgeIdsPermissionCombination)
  };
}

export interface TimedUpdateWithBadgeIdsPermissionDefaultValuesBase {
  timelineTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
  permittedTimes: UintRangeBase[];
  forbiddenTimes: UintRangeBase[];
}

export interface TimedUpdateWithBadgeIdsPermissionDefaultValues extends TimedUpdateWithBadgeIdsPermissionDefaultValuesBase {
  timelineTimes: UintRange[];
  badgeIds: UintRange[];
  permittedTimes: UintRange[];
  forbiddenTimes: UintRange[];
}

export interface s_TimedUpdateWithBadgeIdsPermissionDefaultValues extends TimedUpdateWithBadgeIdsPermissionDefaultValuesBase {
  timelineTimes: s_UintRange[];
  badgeIds: s_UintRange[];
  permittedTimes: s_UintRange[];
  forbiddenTimes: s_UintRange[];
}

export function convertToTimedUpdateWithBadgeIdsPermissionDefaultValues(s_values: s_TimedUpdateWithBadgeIdsPermissionDefaultValues): TimedUpdateWithBadgeIdsPermissionDefaultValues {
  return {
    ...s_values,
    timelineTimes: s_values.timelineTimes.map(convertToUintRange),
    badgeIds: s_values.badgeIds.map(convertToUintRange),
    permittedTimes: s_values.permittedTimes.map(convertToUintRange),
    forbiddenTimes: s_values.forbiddenTimes.map(convertToUintRange)
  };
}

export function convertFromTimedUpdateWithBadgeIdsPermissionDefaultValues(values: TimedUpdateWithBadgeIdsPermissionDefaultValues): s_TimedUpdateWithBadgeIdsPermissionDefaultValues {
  return {
    ...values,
    timelineTimes: values.timelineTimes.map(convertFromUintRange),
    badgeIds: values.badgeIds.map(convertFromUintRange),
    permittedTimes: values.permittedTimes.map(convertFromUintRange),
    forbiddenTimes: values.forbiddenTimes.map(convertFromUintRange)
  };
}

export interface TimedUpdateWithBadgeIdsPermissionCombinationBase {
  timelineTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface TimedUpdateWithBadgeIdsPermissionCombination extends TimedUpdateWithBadgeIdsPermissionCombinationBase { }

export interface s_TimedUpdateWithBadgeIdsPermissionCombination extends TimedUpdateWithBadgeIdsPermissionCombinationBase { }

export function convertToTimedUpdateWithBadgeIdsPermissionCombination(s_combination: s_TimedUpdateWithBadgeIdsPermissionCombination): TimedUpdateWithBadgeIdsPermissionCombination {
  return {
    ...s_combination,
  };
}

export function convertFromTimedUpdateWithBadgeIdsPermissionCombination(combination: TimedUpdateWithBadgeIdsPermissionCombination): s_TimedUpdateWithBadgeIdsPermissionCombination {
  return {
    ...combination,
  };
}

export interface BalancesActionPermissionBase {
  defaultValues: BalancesActionPermissionDefaultValuesBase;
  combinations: BalancesActionPermissionCombinationBase[];
}

export interface BalancesActionPermission extends BalancesActionPermissionBase {
  defaultValues: BalancesActionPermissionDefaultValues;
  combinations: BalancesActionPermissionCombination[];
}

export interface s_BalancesActionPermission extends BalancesActionPermissionBase {
  defaultValues: s_BalancesActionPermissionDefaultValues;
  combinations: s_BalancesActionPermissionCombination[];
}

export function convertToBalancesActionPermission(s_permission: s_BalancesActionPermission): BalancesActionPermission {
  return {
    ...s_permission,
    defaultValues: convertToBalancesActionPermissionDefaultValues(s_permission.defaultValues),
    combinations: s_permission.combinations.map(convertToBalancesActionPermissionCombination)
  };
}

export function convertFromBalancesActionPermission(permission: BalancesActionPermission): s_BalancesActionPermission {
  return {
    ...permission,
    defaultValues: convertFromBalancesActionPermissionDefaultValues(permission.defaultValues),
    combinations: permission.combinations.map(convertFromBalancesActionPermissionCombination)
  };
}

export interface BalancesActionPermissionDefaultValuesBase {
  badgeIds: UintRangeBase[];
  ownedTimes: UintRangeBase[];
  permittedTimes: UintRangeBase[];
  forbiddenTimes: UintRangeBase[];
}

export interface BalancesActionPermissionDefaultValues extends BalancesActionPermissionDefaultValuesBase {
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
  permittedTimes: UintRange[];
  forbiddenTimes: UintRange[];
}

export interface s_BalancesActionPermissionDefaultValues extends BalancesActionPermissionDefaultValuesBase {
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
  permittedTimes: s_UintRange[];
  forbiddenTimes: s_UintRange[];
}

export function convertToBalancesActionPermissionDefaultValues(s_values: s_BalancesActionPermissionDefaultValues): BalancesActionPermissionDefaultValues {
  return {
    ...s_values,
    badgeIds: s_values.badgeIds.map(convertToUintRange),
    ownedTimes: s_values.ownedTimes.map(convertToUintRange),
    permittedTimes: s_values.permittedTimes.map(convertToUintRange),
    forbiddenTimes: s_values.forbiddenTimes.map(convertToUintRange)
  };
}

export function convertFromBalancesActionPermissionDefaultValues(values: BalancesActionPermissionDefaultValues): s_BalancesActionPermissionDefaultValues {

  return {
    ...values,
    badgeIds: values.badgeIds.map(convertFromUintRange),
    ownedTimes: values.ownedTimes.map(convertFromUintRange),
    permittedTimes: values.permittedTimes.map(convertFromUintRange),
    forbiddenTimes: values.forbiddenTimes.map(convertFromUintRange)
  };
}

export interface BalancesActionPermissionCombinationBase {
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface BalancesActionPermissionCombination extends BalancesActionPermissionCombinationBase { }

export interface s_BalancesActionPermissionCombination extends BalancesActionPermissionCombinationBase { }

export function convertToBalancesActionPermissionCombination(s_combination: s_BalancesActionPermissionCombination): BalancesActionPermissionCombination {
  return {
    ...s_combination,
  };
}

export function convertFromBalancesActionPermissionCombination(combination: BalancesActionPermissionCombination): s_BalancesActionPermissionCombination {
  return {
    ...combination,
  };
}

export interface CollectionApprovedTransferPermissionBase {
  defaultValues: CollectionApprovedTransferPermissionDefaultValuesBase;
  combinations: CollectionApprovedTransferPermissionCombinationBase[];
}

export interface CollectionApprovedTransferPermission extends CollectionApprovedTransferPermissionBase {
  defaultValues: CollectionApprovedTransferPermissionDefaultValues;
  combinations: CollectionApprovedTransferPermissionCombination[];
}

export interface s_CollectionApprovedTransferPermission extends CollectionApprovedTransferPermissionBase {
  defaultValues: s_CollectionApprovedTransferPermissionDefaultValues;
  combinations: s_CollectionApprovedTransferPermissionCombination[];
}

export function convertToCollectionApprovedTransferPermission(s_permission: s_CollectionApprovedTransferPermission): CollectionApprovedTransferPermission {
  return {
    ...s_permission,
    defaultValues: convertToCollectionApprovedTransferPermissionDefaultValues(s_permission.defaultValues),
    combinations: s_permission.combinations.map(convertToCollectionApprovedTransferPermissionCombination)
  };
}

export function convertFromCollectionApprovedTransferPermission(permission: CollectionApprovedTransferPermission): s_CollectionApprovedTransferPermission {
  return {
    ...permission,
    defaultValues: convertFromCollectionApprovedTransferPermissionDefaultValues(permission.defaultValues),
    combinations: permission.combinations.map(convertFromCollectionApprovedTransferPermissionCombination)
  };
}

export interface CollectionApprovedTransferPermissionDefaultValuesBase {
  timelineTimes: UintRangeBase[];
  fromMappingId: string;
  toMappingId: string;
  initiatedByMappingId: string;
  transferTimes: UintRangeBase[];
  badgeIds: UintRangeBase[];
  ownedTimes: UintRangeBase[];
  permittedTimes: UintRangeBase[];
  forbiddenTimes: UintRangeBase[];
}

export interface CollectionApprovedTransferPermissionDefaultValues extends CollectionApprovedTransferPermissionDefaultValuesBase {
  timelineTimes: UintRange[];
  transferTimes: UintRange[];
  badgeIds: UintRange[];
  ownedTimes: UintRange[];
  permittedTimes: UintRange[];
  forbiddenTimes: UintRange[];
}

export interface s_CollectionApprovedTransferPermissionDefaultValues extends CollectionApprovedTransferPermissionDefaultValuesBase {
  timelineTimes: s_UintRange[];
  transferTimes: s_UintRange[];
  badgeIds: s_UintRange[];
  ownedTimes: s_UintRange[];
  permittedTimes: s_UintRange[];
  forbiddenTimes: s_UintRange[];
}

export function convertToCollectionApprovedTransferPermissionDefaultValues(s_values: s_CollectionApprovedTransferPermissionDefaultValues): CollectionApprovedTransferPermissionDefaultValues {
  return {
    ...s_values,
    timelineTimes: s_values.timelineTimes.map(convertToUintRange),
    transferTimes: s_values.transferTimes.map(convertToUintRange),
    badgeIds: s_values.badgeIds.map(convertToUintRange),
    ownedTimes: s_values.ownedTimes.map(convertToUintRange),
    permittedTimes: s_values.permittedTimes.map(convertToUintRange),
    forbiddenTimes: s_values.forbiddenTimes.map(convertToUintRange)
  };
}

export function convertFromCollectionApprovedTransferPermissionDefaultValues(values: CollectionApprovedTransferPermissionDefaultValues): s_CollectionApprovedTransferPermissionDefaultValues {
  return {
    ...values,
    timelineTimes: values.timelineTimes.map(convertFromUintRange),
    transferTimes: values.transferTimes.map(convertFromUintRange),
    badgeIds: values.badgeIds.map(convertFromUintRange),
    ownedTimes: values.ownedTimes.map(convertFromUintRange),
    permittedTimes: values.permittedTimes.map(convertFromUintRange),
    forbiddenTimes: values.forbiddenTimes.map(convertFromUintRange)
  };
}

export interface CollectionApprovedTransferPermissionCombinationBase {
  timelineTimesOptions: ValueOptions;
  fromMappingOptions: ValueOptions;
  toMappingOptions: ValueOptions;
  initiatedByMappingOptions: ValueOptions;
  transferTimesOptions: ValueOptions;
  badgeIdsOptions: ValueOptions;
  ownedTimesOptions: ValueOptions;
  permittedTimesOptions: ValueOptions;
  forbiddenTimesOptions: ValueOptions;
}

export interface CollectionApprovedTransferPermissionCombination extends CollectionApprovedTransferPermissionCombinationBase { }

export interface s_CollectionApprovedTransferPermissionCombination extends CollectionApprovedTransferPermissionCombinationBase { }

export function convertToCollectionApprovedTransferPermissionCombination(s_combination: s_CollectionApprovedTransferPermissionCombination): CollectionApprovedTransferPermissionCombination {
  return {
    ...s_combination,
  };
}

export function convertFromCollectionApprovedTransferPermissionCombination(combination: CollectionApprovedTransferPermissionCombination): s_CollectionApprovedTransferPermissionCombination {
  return {
    ...combination,
  };
}
