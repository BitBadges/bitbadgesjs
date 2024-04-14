import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type {
  iActionPermission,
  iBalancesActionPermission,
  iCollectionApprovalPermission,
  iCollectionApprovalPermissionWithDetails,
  iCollectionPermissions,
  iCollectionPermissionsWithDetails,
  iTimedUpdatePermission,
  iTimedUpdateWithBadgeIdsPermission,
  iUserIncomingApprovalPermission,
  iUserIncomingApprovalPermissionWithDetails,
  iUserOutgoingApprovalPermission,
  iUserOutgoingApprovalPermissionWithDetails,
  iUserPermissions,
  iUserPermissionsWithDetails
} from '@/interfaces/badges/permissions';
import type { CustomType } from '@/common/base';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives } from '@/common/base';
import { badges } from '@/proto';
import { AddressList } from './addressLists';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps';
import { GetFirstMatchOnly, getOverlapsAndNonOverlaps, universalRemoveOverlaps } from './overlaps';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers';
import { UintRange, UintRangeArray } from './uintRanges';
import { AllDefaultValues } from './validate-utils';

/**
 * UserPermissions represents the permissions of a user and what they can update about their approvals.
 *
 * @category Permissions
 */
export class UserPermissions<T extends NumberType> extends BaseNumberTypeClass<UserPermissions<T>> implements iUserPermissions<T> {
  canUpdateOutgoingApprovals: UserOutgoingApprovalPermission<T>[];
  canUpdateIncomingApprovals: UserIncomingApprovalPermission<T>[];
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: ActionPermission<T>[];
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: ActionPermission<T>[];

  constructor(msg: iUserPermissions<T>) {
    super();
    this.canUpdateOutgoingApprovals = msg.canUpdateOutgoingApprovals.map((x) => new UserOutgoingApprovalPermission(x));
    this.canUpdateIncomingApprovals = msg.canUpdateIncomingApprovals.map((x) => new UserIncomingApprovalPermission(x));
    this.canUpdateAutoApproveSelfInitiatedOutgoingTransfers = msg.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.map(
      (x) => new ActionPermission(x)
    );
    this.canUpdateAutoApproveSelfInitiatedIncomingTransfers = msg.canUpdateAutoApproveSelfInitiatedIncomingTransfers.map(
      (x) => new ActionPermission(x)
    );
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserPermissions<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserPermissions<U>;
  }

  toProto(): badges.UserPermissions {
    return new badges.UserPermissions(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserPermissions<U> {
    return UserPermissions.fromProto(badges.UserPermissions.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserPermissions<U> {
    return UserPermissions.fromProto(badges.UserPermissions.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: badges.UserPermissions, convertFunction: (item: NumberType) => U): UserPermissions<U> {
    return new UserPermissions({
      canUpdateOutgoingApprovals: protoMsg.canUpdateOutgoingApprovals.map((x) => UserOutgoingApprovalPermission.fromProto(x, convertFunction)),
      canUpdateIncomingApprovals: protoMsg.canUpdateIncomingApprovals.map((x) => UserIncomingApprovalPermission.fromProto(x, convertFunction)),
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: protoMsg.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.map((x) =>
        ActionPermission.fromProto(x, convertFunction)
      ),
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: protoMsg.canUpdateAutoApproveSelfInitiatedIncomingTransfers.map((x) =>
        ActionPermission.fromProto(x, convertFunction)
      )
    });
  }

  /**
   * Validates the update of the user permissions from old to new.
   */
  static validateUpdate<U extends NumberType>(
    oldPermissions: UserPermissionsWithDetails<U>,
    newPermissions: UserPermissionsWithDetails<U>
  ): Error | null {
    const responses = [
      UserOutgoingApprovalPermission.validateUpdate(oldPermissions.canUpdateOutgoingApprovals, newPermissions.canUpdateOutgoingApprovals),
      UserIncomingApprovalPermission.validateUpdate(oldPermissions.canUpdateIncomingApprovals, newPermissions.canUpdateIncomingApprovals),
      ActionPermission.validateUpdate(
        oldPermissions.canUpdateAutoApproveSelfInitiatedOutgoingTransfers,
        newPermissions.canUpdateAutoApproveSelfInitiatedOutgoingTransfers
      ),
      ActionPermission.validateUpdate(
        oldPermissions.canUpdateAutoApproveSelfInitiatedIncomingTransfers,
        newPermissions.canUpdateAutoApproveSelfInitiatedIncomingTransfers
      )
    ];

    return responses.find((x) => x !== null) ?? null;
  }

  static InitEmpty(): UserPermissions<bigint> {
    return new UserPermissions({
      canUpdateOutgoingApprovals: [],
      canUpdateIncomingApprovals: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: []
    });
  }
}

/**
 * UserOutgoingApprovalPermission represents the permissions of a user and whether they can update their approved outgoing transfers.
 *
 * @category Permissions
 */
export class UserOutgoingApprovalPermission<T extends NumberType>
  extends BaseNumberTypeClass<UserOutgoingApprovalPermission<T>>
  implements iUserOutgoingApprovalPermission<T>
{
  toListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  approvalId: string;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iUserOutgoingApprovalPermission<T>) {
    super();
    this.toListId = msg.toListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserOutgoingApprovalPermission<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserOutgoingApprovalPermission<U>;
  }

  toProto(): badges.UserOutgoingApprovalPermission {
    return new badges.UserOutgoingApprovalPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApprovalPermission<U> {
    return UserOutgoingApprovalPermission.fromProto(badges.UserOutgoingApprovalPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApprovalPermission<U> {
    return UserOutgoingApprovalPermission.fromProto(badges.UserOutgoingApprovalPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.UserOutgoingApprovalPermission,
    convertFunction: (item: NumberType) => U
  ): UserOutgoingApprovalPermission<U> {
    return new UserOutgoingApprovalPermission({
      toListId: protoMsg.toListId,
      initiatedByListId: protoMsg.initiatedByListId,
      transferTimes: protoMsg.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: protoMsg.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: protoMsg.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: protoMsg.approvalId,
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  castToCollectionApprovalPermission(address: string): CollectionApprovalPermission<T> {
    return new CollectionApprovalPermission({
      ...this,
      fromList: getReservedAddressList(address) as AddressList,
      fromListId: address
    });
  }

  /**
   * Validates the update of the user outgoing approval permissions from old to new. No permanently frozen times can be edited.
   */
  static validateUpdate<U extends NumberType>(
    permissions: UserOutgoingApprovalPermissionWithDetails<U>[],
    newPermission: UserOutgoingApprovalPermissionWithDetails<U>[]
  ): Error | null {
    const dummyAddress = '0x';
    const castedPermissions: UniversalPermission[] = permissions.map((x) =>
      x.castToCollectionApprovalPermission(dummyAddress).castToUniversalPermission()
    );
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) =>
      x.castToCollectionApprovalPermission(dummyAddress).castToUniversalPermission()
    );
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  /**
   * Checks if a certain approvals can be updated based on the permissions.
   */
  static check<U extends NumberType>(
    details: {
      badgeIds: UintRangeArray<U>;
      ownershipTimes: UintRangeArray<U>;
      transferTimes: UintRangeArray<U>;
      toList: AddressList;
      fromList: AddressList;
      initiatedByList: AddressList;
      approvalIdList: AddressList;
      amountTrackerIdList: AddressList;
      challengeTrackerIdList: AddressList;
    }[],
    permissions: UserOutgoingApprovalPermissionWithDetails<U>[],
    time?: U
  ): Error | null {
    const dummyAddress = '0x'; //For compatibility
    return CollectionApprovalPermission.check(
      details,
      permissions.map((x) => x.castToCollectionApprovalPermission(dummyAddress)),
      time
    );
  }
}

/**
 * UserIncomingApprovalPermission represents the permissions of a user and whether they can update their approved incoming transfers.
 *
 * @category Permissions
 */
export class UserIncomingApprovalPermission<T extends NumberType>
  extends BaseNumberTypeClass<UserIncomingApprovalPermission<T>>
  implements iUserIncomingApprovalPermission<T>
{
  fromListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  approvalId: string;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iUserIncomingApprovalPermission<T>) {
    super();
    this.fromListId = msg.fromListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.approvalId = msg.approvalId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserIncomingApprovalPermission<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserIncomingApprovalPermission<U>;
  }

  toProto(): badges.UserIncomingApprovalPermission {
    return new badges.UserIncomingApprovalPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApprovalPermission<U> {
    return UserIncomingApprovalPermission.fromProto(badges.UserIncomingApprovalPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApprovalPermission<U> {
    return UserIncomingApprovalPermission.fromProto(badges.UserIncomingApprovalPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.UserIncomingApprovalPermission,
    convertFunction: (item: NumberType) => U
  ): UserIncomingApprovalPermission<U> {
    return new UserIncomingApprovalPermission({
      fromListId: protoMsg.fromListId,
      initiatedByListId: protoMsg.initiatedByListId,
      transferTimes: protoMsg.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: protoMsg.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: protoMsg.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: protoMsg.approvalId,
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  castToCollectionApprovalPermission(address: string): CollectionApprovalPermission<T> {
    return new CollectionApprovalPermission({
      ...this,
      toList: getReservedAddressList(address) as AddressList,
      toListId: address
    });
  }

  static validateUpdate<U extends NumberType>(
    permissions: UserIncomingApprovalPermissionWithDetails<U>[],
    newPermission: UserIncomingApprovalPermissionWithDetails<U>[]
  ): Error | null {
    const dummyAddress = '0x';
    const castedPermissions: UniversalPermission[] = permissions.map((x) =>
      x.castToCollectionApprovalPermission(dummyAddress).castToUniversalPermission()
    );
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) =>
      x.castToCollectionApprovalPermission(dummyAddress).castToUniversalPermission()
    );
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  static check<U extends NumberType>(
    details: {
      badgeIds: UintRangeArray<U>;
      ownershipTimes: UintRangeArray<U>;
      transferTimes: UintRangeArray<U>;
      toList: AddressList;
      fromList: AddressList;
      initiatedByList: AddressList;
      approvalIdList: AddressList;
      amountTrackerIdList: AddressList;
      challengeTrackerIdList: AddressList;
    }[],
    permissions: UserIncomingApprovalPermissionWithDetails<U>[],
    time?: U
  ): Error | null {
    const dummyAddress = '0x';
    return CollectionApprovalPermission.check(
      details,
      permissions.map((x) => x.castToCollectionApprovalPermission(dummyAddress)),
      time
    );
  }
}

/**
 * CollectionPermissions represents the permissions of a collection.
 *
 * @category Permissions
 */
export class CollectionPermissions<T extends NumberType> extends BaseNumberTypeClass<CollectionPermissions<T>> implements iCollectionPermissions<T> {
  canDeleteCollection: ActionPermission<T>[];
  canArchiveCollection: TimedUpdatePermission<T>[];
  canUpdateOffChainBalancesMetadata: TimedUpdatePermission<T>[];
  canUpdateStandards: TimedUpdatePermission<T>[];
  canUpdateCustomData: TimedUpdatePermission<T>[];
  canUpdateManager: TimedUpdatePermission<T>[];
  canUpdateCollectionMetadata: TimedUpdatePermission<T>[];
  canCreateMoreBadges: BalancesActionPermission<T>[];
  canUpdateBadgeMetadata: TimedUpdateWithBadgeIdsPermission<T>[];
  canUpdateCollectionApprovals: CollectionApprovalPermission<T>[];

  constructor(msg: iCollectionPermissions<T>) {
    super();
    this.canDeleteCollection = msg.canDeleteCollection.map((x) => new ActionPermission(x));
    this.canArchiveCollection = msg.canArchiveCollection.map((x) => new TimedUpdatePermission(x));
    this.canUpdateOffChainBalancesMetadata = msg.canUpdateOffChainBalancesMetadata.map((x) => new TimedUpdatePermission(x));
    this.canUpdateStandards = msg.canUpdateStandards.map((x) => new TimedUpdatePermission(x));
    this.canUpdateCustomData = msg.canUpdateCustomData.map((x) => new TimedUpdatePermission(x));
    this.canUpdateManager = msg.canUpdateManager.map((x) => new TimedUpdatePermission(x));
    this.canUpdateCollectionMetadata = msg.canUpdateCollectionMetadata.map((x) => new TimedUpdatePermission(x));
    this.canCreateMoreBadges = msg.canCreateMoreBadges.map((x) => new BalancesActionPermission(x));
    this.canUpdateBadgeMetadata = msg.canUpdateBadgeMetadata.map((x) => new TimedUpdateWithBadgeIdsPermission(x));
    this.canUpdateCollectionApprovals = msg.canUpdateCollectionApprovals.map((x) => new CollectionApprovalPermission(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CollectionPermissions<U> {
    return new CollectionPermissions(
      deepCopyPrimitives({
        canDeleteCollection: this.canDeleteCollection.map((x) => x.convert(convertFunction)),
        canArchiveCollection: this.canArchiveCollection.map((x) => x.convert(convertFunction)),
        canUpdateOffChainBalancesMetadata: this.canUpdateOffChainBalancesMetadata.map((x) => x.convert(convertFunction)),
        canUpdateStandards: this.canUpdateStandards.map((x) => x.convert(convertFunction)),
        canUpdateCustomData: this.canUpdateCustomData.map((x) => x.convert(convertFunction)),
        canUpdateManager: this.canUpdateManager.map((x) => x.convert(convertFunction)),
        canUpdateCollectionMetadata: this.canUpdateCollectionMetadata.map((x) => x.convert(convertFunction)),
        canCreateMoreBadges: this.canCreateMoreBadges.map((x) => x.convert(convertFunction)),
        canUpdateBadgeMetadata: this.canUpdateBadgeMetadata.map((x) => x.convert(convertFunction)),
        canUpdateCollectionApprovals: this.canUpdateCollectionApprovals.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.CollectionPermissions {
    return new badges.CollectionPermissions(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionPermissions<U> {
    return CollectionPermissions.fromProto(badges.CollectionPermissions.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionPermissions<U> {
    return CollectionPermissions.fromProto(badges.CollectionPermissions.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: badges.CollectionPermissions, convertFunction: (item: NumberType) => U): CollectionPermissions<U> {
    return new CollectionPermissions({
      canDeleteCollection: protoMsg.canDeleteCollection.map((x) => ActionPermission.fromProto(x, convertFunction)),
      canArchiveCollection: protoMsg.canArchiveCollection.map((x) => TimedUpdatePermission.fromProto(x, convertFunction)),
      canUpdateOffChainBalancesMetadata: protoMsg.canUpdateOffChainBalancesMetadata.map((x) => TimedUpdatePermission.fromProto(x, convertFunction)),
      canUpdateStandards: protoMsg.canUpdateStandards.map((x) => TimedUpdatePermission.fromProto(x, convertFunction)),
      canUpdateCustomData: protoMsg.canUpdateCustomData.map((x) => TimedUpdatePermission.fromProto(x, convertFunction)),
      canUpdateManager: protoMsg.canUpdateManager.map((x) => TimedUpdatePermission.fromProto(x, convertFunction)),
      canUpdateCollectionMetadata: protoMsg.canUpdateCollectionMetadata.map((x) => TimedUpdatePermission.fromProto(x, convertFunction)),
      canCreateMoreBadges: protoMsg.canCreateMoreBadges.map((x) => BalancesActionPermission.fromProto(x, convertFunction)),
      canUpdateBadgeMetadata: protoMsg.canUpdateBadgeMetadata.map((x) => TimedUpdateWithBadgeIdsPermission.fromProto(x, convertFunction)),
      canUpdateCollectionApprovals: protoMsg.canUpdateCollectionApprovals.map((x) => CollectionApprovalPermission.fromProto(x, convertFunction))
    });
  }

  static validateUpdate<U extends NumberType>(
    oldPermissions: CollectionPermissionsWithDetails<U>,
    newPermissions: CollectionPermissionsWithDetails<U>
  ): Error | null {
    const responses = [
      ActionPermission.validateUpdate(oldPermissions.canDeleteCollection, newPermissions.canDeleteCollection),
      TimedUpdatePermission.validateUpdate(oldPermissions.canUpdateManager, newPermissions.canUpdateManager),
      TimedUpdatePermission.validateUpdate(oldPermissions.canUpdateCustomData, newPermissions.canUpdateCustomData),
      TimedUpdatePermission.validateUpdate(oldPermissions.canUpdateStandards, newPermissions.canUpdateStandards),
      TimedUpdatePermission.validateUpdate(oldPermissions.canArchiveCollection, newPermissions.canArchiveCollection),
      TimedUpdatePermission.validateUpdate(oldPermissions.canUpdateOffChainBalancesMetadata, newPermissions.canUpdateOffChainBalancesMetadata),
      TimedUpdatePermission.validateUpdate(oldPermissions.canUpdateCollectionMetadata, newPermissions.canUpdateCollectionMetadata),
      BalancesActionPermission.validateUpdate(oldPermissions.canCreateMoreBadges, newPermissions.canCreateMoreBadges),
      TimedUpdateWithBadgeIdsPermission.validateUpdate(oldPermissions.canUpdateBadgeMetadata, newPermissions.canUpdateBadgeMetadata),
      CollectionApprovalPermission.validateUpdate(oldPermissions.canUpdateCollectionApprovals, newPermissions.canUpdateCollectionApprovals)
    ];

    return responses.find((x) => x !== null) ?? null;
  }

  static InitEmpty(): CollectionPermissions<bigint> {
    return new CollectionPermissions({
      canDeleteCollection: [],
      canArchiveCollection: [],
      canUpdateOffChainBalancesMetadata: [],
      canUpdateStandards: [],
      canUpdateCustomData: [],
      canUpdateManager: [],
      canUpdateCollectionMetadata: [],
      canCreateMoreBadges: [],
      canUpdateBadgeMetadata: [],
      canUpdateCollectionApprovals: []
    });
  }
}

/**
 * ActionPermission represents a standard permission with no extra criteria.
 *
 * @category Permissions
 */
export class ActionPermission<T extends NumberType> extends BaseNumberTypeClass<ActionPermission<T>> implements iActionPermission<T> {
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iActionPermission<T>) {
    super();
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): ActionPermission<U> {
    return new ActionPermission(
      deepCopyPrimitives({
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.ActionPermission {
    return new badges.ActionPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ActionPermission<U> {
    return ActionPermission.fromProto(badges.ActionPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ActionPermission<U> {
    return ActionPermission.fromProto(badges.ActionPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: badges.ActionPermission, convertFunction: (item: NumberType) => U): ActionPermission<U> {
    return new ActionPermission({
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      permanentlyPermittedTimes: this.permanentlyPermittedTimes.convert(BigIntify),
      permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.convert(BigIntify)
    };
  }

  static validateUpdate<U extends NumberType>(permissions: ActionPermission<U>[], newPermission: ActionPermission<U>[]): Error | null {
    const castedPermissions: UniversalPermission[] = permissions.map((x) => x.castToUniversalPermission());
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) => x.castToUniversalPermission());
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  static check<T extends NumberType>(permissions: ActionPermission<T>[], time?: T): Error | null {
    const castedPermissions = permissions.map((x) => x.castToUniversalPermission());
    return checkUniversalPermissionPermits(castedPermissions, time);
  }
}

function checkUniversalPermissionPermits<T extends NumberType>(permissions: UniversalPermission[], time?: T): Error | null {
  const permissionDetails = GetFirstMatchOnly(permissions);
  for (const permissionDetail of permissionDetails) {
    const err = checkNotForbidden(permissionDetail, time ? BigInt(time) : undefined);
    if (err) {
      return err;
    }
  }
  return null;
}

/**
 * TimedUpdatePermission represents a permission that allows updating a timeline-based value time. For example, updating the collection metadata.
 * This permission allows you to define when the value can be updated, and what times the value can be updated for.
 *
 * @category Permissions
 */
export class TimedUpdatePermission<T extends NumberType> extends BaseNumberTypeClass<TimedUpdatePermission<T>> implements iTimedUpdatePermission<T> {
  timelineTimes: UintRangeArray<T>;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iTimedUpdatePermission<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(msg.timelineTimes);
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): TimedUpdatePermission<U> {
    return new TimedUpdatePermission(
      deepCopyPrimitives({
        timelineTimes: this.timelineTimes.map((x) => x.convert(convertFunction)),
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.TimedUpdatePermission {
    return new badges.TimedUpdatePermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TimedUpdatePermission<U> {
    return TimedUpdatePermission.fromProto(badges.TimedUpdatePermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TimedUpdatePermission<U> {
    return TimedUpdatePermission.fromProto(badges.TimedUpdatePermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: badges.TimedUpdatePermission, convertFunction: (item: NumberType) => U): TimedUpdatePermission<U> {
    return new TimedUpdatePermission({
      timelineTimes: protoMsg.timelineTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      timelineTimes: this.timelineTimes.convert(BigIntify),
      permanentlyPermittedTimes: this.permanentlyPermittedTimes.convert(BigIntify),
      permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.convert(BigIntify),
      usesTimelineTimes: true
    };
  }

  static validateUpdate<U extends NumberType>(permissions: TimedUpdatePermission<U>[], newPermission: TimedUpdatePermission<U>[]): Error | null {
    const castedPermissions: UniversalPermission[] = permissions.map((x) => x.castToUniversalPermission());
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) => x.castToUniversalPermission());
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  static check<U extends NumberType>(timelineTimes: UintRangeArray<U>, permissions: TimedUpdatePermission<U>[], time?: U): Error | null {
    const detailsToCheck: UniversalPermissionDetails[] = [];
    for (const timelineTime of timelineTimes) {
      detailsToCheck.push({
        ...AllDefaultDetailsValues,
        timelineTime: timelineTime.convert(BigIntify)
      });
    }

    const castedPermissions = permissions.map((x) => x.castToUniversalPermission());
    const permissionDetails = GetFirstMatchOnly(castedPermissions);
    return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck, time ? BigInt(time) : undefined);
  }
}

const AllDefaultDetailsValues: UniversalPermissionDetails = {
  timelineTime: new UintRange({ start: -1n, end: -1n }),
  badgeId: new UintRange({ start: -1n, end: -1n }),
  ownershipTime: new UintRange({ start: -1n, end: -1n }),
  transferTime: new UintRange({ start: -1n, end: -1n }),
  toList: new AddressList({ listId: 'All', addresses: [], whitelist: false, uri: '', customData: '', createdBy: '' }),
  fromList: new AddressList({ listId: 'All', addresses: [], whitelist: false, uri: '', customData: '', createdBy: '' }),
  initiatedByList: new AddressList({
    listId: 'All',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: '',
    createdBy: ''
  }),
  approvalIdList: new AddressList({
    listId: 'All',
    addresses: [],
    whitelist: false,
    uri: '',
    customData: '',
    createdBy: ''
  }),
  permanentlyPermittedTimes: UintRangeArray.From([]),
  permanentlyForbiddenTimes: UintRangeArray.From([]),
  arbitraryValue: undefined
};

/**
 * BalancesActionPermission represents a permission that allows updating a balances action.
 *
 * @category Permissions
 */
export class BalancesActionPermission<T extends NumberType>
  extends BaseNumberTypeClass<BalancesActionPermission<T>>
  implements iBalancesActionPermission<T>
{
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iBalancesActionPermission<T>) {
    super();
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): BalancesActionPermission<U> {
    return new BalancesActionPermission(
      deepCopyPrimitives({
        badgeIds: this.badgeIds.map((x) => x.convert(convertFunction)),
        ownershipTimes: this.ownershipTimes.map((x) => x.convert(convertFunction)),
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.BalancesActionPermission {
    return new badges.BalancesActionPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): BalancesActionPermission<U> {
    return BalancesActionPermission.fromProto(badges.BalancesActionPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): BalancesActionPermission<U> {
    return BalancesActionPermission.fromProto(badges.BalancesActionPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.BalancesActionPermission,
    convertFunction: (item: NumberType) => U
  ): BalancesActionPermission<U> {
    return new BalancesActionPermission({
      badgeIds: protoMsg.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: protoMsg.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      badgeIds: this.badgeIds.convert(BigIntify),
      ownershipTimes: this.ownershipTimes.convert(BigIntify),
      permanentlyPermittedTimes: this.permanentlyPermittedTimes.convert(BigIntify),
      permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.convert(BigIntify),
      usesBadgeIds: true,
      usesOwnershipTimes: true
    };
  }

  static validateUpdate<U extends NumberType>(
    permissions: BalancesActionPermission<U>[],
    newPermission: BalancesActionPermission<U>[]
  ): Error | null {
    const castedPermissions: UniversalPermission[] = permissions.map((x) => x.castToUniversalPermission());
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) => x.castToUniversalPermission());
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  static check<U extends NumberType>(
    details: {
      ownershipTimes: UintRangeArray<U>;
      badgeIds: UintRangeArray<U>;
    }[],
    permissions: BalancesActionPermission<U>[],
    time?: U
  ): Error | null {
    const detailsToCheck: UniversalPermissionDetails[] = [];
    for (const detail of details) {
      for (const ownershipTime of detail.ownershipTimes) {
        for (const badgeId of detail.badgeIds) {
          detailsToCheck.push({
            ...AllDefaultDetailsValues,
            ownershipTime: ownershipTime.convert(BigIntify),
            badgeId: badgeId.convert(BigIntify)
          });
        }
      }
    }

    const castedPermissions = permissions.map((x) => x.castToUniversalPermission());
    const permissionDetails = GetFirstMatchOnly(castedPermissions);
    return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck, time ? BigInt(time) : undefined);
  }
}

/**
 * TimedUpdateWithBadgeIdsPermission represents a permission that allows updating a timeline-based value time with bagde IDS. For example, updating the badge metadata.
 *
 * This permission allows you to define when the value can be updated, and what times the value can be updated for, and for what badges the value can be updated for. Or any combination of these.
 *
 * @category Permissions
 */
export class TimedUpdateWithBadgeIdsPermission<T extends NumberType>
  extends BaseNumberTypeClass<TimedUpdateWithBadgeIdsPermission<T>>
  implements iTimedUpdateWithBadgeIdsPermission<T>
{
  timelineTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iTimedUpdateWithBadgeIdsPermission<T>) {
    super();
    this.timelineTimes = UintRangeArray.From(msg.timelineTimes);
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): TimedUpdateWithBadgeIdsPermission<U> {
    return new TimedUpdateWithBadgeIdsPermission(
      deepCopyPrimitives({
        timelineTimes: this.timelineTimes.map((x) => x.convert(convertFunction)),
        badgeIds: this.badgeIds.map((x) => x.convert(convertFunction)),
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.TimedUpdateWithBadgeIdsPermission {
    return new badges.TimedUpdateWithBadgeIdsPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TimedUpdateWithBadgeIdsPermission<U> {
    return TimedUpdateWithBadgeIdsPermission.fromProto(badges.TimedUpdateWithBadgeIdsPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TimedUpdateWithBadgeIdsPermission<U> {
    return TimedUpdateWithBadgeIdsPermission.fromProto(badges.TimedUpdateWithBadgeIdsPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.TimedUpdateWithBadgeIdsPermission,
    convertFunction: (item: NumberType) => U
  ): TimedUpdateWithBadgeIdsPermission<U> {
    return new TimedUpdateWithBadgeIdsPermission({
      timelineTimes: protoMsg.timelineTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: protoMsg.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      timelineTimes: this.timelineTimes.convert(BigIntify),
      badgeIds: this.badgeIds.convert(BigIntify),
      permanentlyPermittedTimes: this.permanentlyPermittedTimes.convert(BigIntify),
      permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.convert(BigIntify),
      usesTimelineTimes: true,
      usesBadgeIds: true
    };
  }

  static validateUpdate<U extends NumberType>(
    permissions: TimedUpdateWithBadgeIdsPermission<U>[],
    newPermission: TimedUpdateWithBadgeIdsPermission<U>[]
  ): Error | null {
    const castedPermissions: UniversalPermission[] = permissions.map((x) => x.castToUniversalPermission());
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) => x.castToUniversalPermission());
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  static check<U extends NumberType>(
    details: {
      timelineTimes: UintRangeArray<U>;
      badgeIds: UintRangeArray<U>;
    }[],
    permissions: TimedUpdateWithBadgeIdsPermission<U>[],
    time?: U
  ): Error | null {
    const detailsToCheck: UniversalPermissionDetails[] = [];
    for (const detail of details) {
      for (const timelineTime of detail.timelineTimes) {
        for (const badgeId of detail.badgeIds) {
          detailsToCheck.push({
            ...AllDefaultDetailsValues,
            timelineTime: timelineTime.convert(BigIntify),
            badgeId: badgeId.convert(BigIntify)
          });
        }
      }
    }

    const castedPermissions = permissions.map((x) => x.castToUniversalPermission());
    const permissionDetails = GetFirstMatchOnly(castedPermissions);
    return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck, time ? BigInt(time) : undefined);
  }
}

/**
 * CollectionApprovalPermission represents a permission that allows updating the collection approved transfers.
 *
 * This permission allows you to define when the approved transfers can be updated and which combinations of (from, to, initiatedBy, transferTimes, badgeIds, ownershipTimes, permanentlyPermittedTimes, permanentlyForbiddenTimes) can be updated.
 *
 * @category Permissions
 */
export class CollectionApprovalPermission<T extends NumberType>
  extends BaseNumberTypeClass<CollectionApprovalPermission<T>>
  implements iCollectionApprovalPermission<T>
{
  fromListId: string;
  toListId: string;
  initiatedByListId: string;
  transferTimes: UintRangeArray<T>;
  badgeIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  approvalId: string;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iCollectionApprovalPermission<T>) {
    super();
    this.fromListId = msg.fromListId;
    this.toListId = msg.toListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.badgeIds = UintRangeArray.From(msg.badgeIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CollectionApprovalPermission<U> {
    return new CollectionApprovalPermission(
      deepCopyPrimitives({
        fromListId: this.fromListId,
        toListId: this.toListId,
        initiatedByListId: this.initiatedByListId,
        transferTimes: this.transferTimes.map((x) => x.convert(convertFunction)),
        badgeIds: this.badgeIds.map((x) => x.convert(convertFunction)),
        ownershipTimes: this.ownershipTimes.map((x) => x.convert(convertFunction)),
        approvalId: this.approvalId,
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): badges.CollectionApprovalPermission {
    return new badges.CollectionApprovalPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApprovalPermission<U> {
    return CollectionApprovalPermission.fromProto(badges.CollectionApprovalPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApprovalPermission<U> {
    return CollectionApprovalPermission.fromProto(badges.CollectionApprovalPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.CollectionApprovalPermission,
    convertFunction: (item: NumberType) => U
  ): CollectionApprovalPermission<U> {
    return new CollectionApprovalPermission({
      fromListId: protoMsg.fromListId,
      toListId: protoMsg.toListId,
      initiatedByListId: protoMsg.initiatedByListId,
      transferTimes: protoMsg.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      badgeIds: protoMsg.badgeIds.map((x) => UintRange.fromProto(x, convertFunction)),
      ownershipTimes: protoMsg.ownershipTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      approvalId: protoMsg.approvalId,
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  static validateUpdate<U extends NumberType>(
    permissions: CollectionApprovalPermissionWithDetails<U>[],
    newPermission: CollectionApprovalPermissionWithDetails<U>[]
  ): Error | null {
    const castedPermissions: UniversalPermission[] = permissions.map((x) => x.castToUniversalPermission());
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) => x.castToUniversalPermission());
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  static check<U extends NumberType>(
    details: {
      badgeIds: UintRangeArray<U>;
      ownershipTimes: UintRangeArray<U>;
      transferTimes: UintRangeArray<U>;
      toList: AddressList;
      fromList: AddressList;
      initiatedByList: AddressList;
      approvalIdList: AddressList;
    }[],
    permissions: CollectionApprovalPermissionWithDetails<U>[],
    time?: U
  ): Error | null {
    const detailsToCheck: UniversalPermissionDetails[] = [];
    for (const detail of details) {
      for (const transferTime of detail.transferTimes) {
        for (const badgeId of detail.badgeIds) {
          for (const ownershipTime of detail.ownershipTimes) {
            detailsToCheck.push({
              ...AllDefaultDetailsValues,
              transferTime: transferTime.convert(BigIntify),
              badgeId: badgeId.convert(BigIntify),
              ownershipTime: ownershipTime.convert(BigIntify),
              toList: detail.toList,
              fromList: detail.fromList,
              initiatedByList: detail.initiatedByList,
              approvalIdList: detail.approvalIdList,
            });
          }
        }
      }
    }

    const castedPermissions = permissions.map((x) => x.castToUniversalPermission());
    const permissionDetails = GetFirstMatchOnly(castedPermissions);
    return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck, time ? BigInt(time) : undefined, true);
  }
}

const { getReservedAddressList, getReservedTrackerList } = AddressList;

/**
 * @category Permissions
 */
export class CollectionApprovalPermissionWithDetails<T extends NumberType>
  extends CollectionApprovalPermission<T>
  implements iCollectionApprovalPermissionWithDetails<T>, CustomType<CollectionApprovalPermissionWithDetails<T>>
{
  toList: AddressList;
  fromList: AddressList;
  initiatedByList: AddressList;

  constructor(data: iCollectionApprovalPermissionWithDetails<T>) {
    super(data);
    this.toList = new AddressList(data.toList);
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
  }

  clone(): CollectionApprovalPermissionWithDetails<T> {
    return super.clone() as CollectionApprovalPermissionWithDetails<T>;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CollectionApprovalPermissionWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CollectionApprovalPermissionWithDetails<U>;
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      toList: this.toList,
      fromList: this.fromList,
      initiatedByList: this.initiatedByList,
      transferTimes: this.transferTimes.convert(BigIntify),
      badgeIds: this.badgeIds.convert(BigIntify),
      ownershipTimes: this.ownershipTimes.convert(BigIntify),
      approvalIdList: getReservedTrackerList(this.approvalId),
      usesApprovalIdList: true,
      usesBadgeIds: true,
      usesTransferTimes: true,
      usesOwnershipTimes: true,
      usesToList: true,
      usesFromList: true,
      usesInitiatedByList: true,
      permanentlyPermittedTimes: this.permanentlyPermittedTimes.convert(BigIntify),
      permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.convert(BigIntify)
    };
  }
}

/**
 * @category Permissions
 */
export class UserIncomingApprovalPermissionWithDetails<T extends NumberType>
  extends UserIncomingApprovalPermission<T>
  implements iUserIncomingApprovalPermissionWithDetails<T>, CustomType<UserIncomingApprovalPermissionWithDetails<T>>
{
  fromList: AddressList;
  initiatedByList: AddressList;

  constructor(data: iUserIncomingApprovalPermissionWithDetails<T>) {
    super(data);
    this.fromList = new AddressList(data.fromList);
    this.initiatedByList = new AddressList(data.initiatedByList);
  }

  clone(): UserIncomingApprovalPermissionWithDetails<T> {
    return super.clone() as UserIncomingApprovalPermissionWithDetails<T>;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserIncomingApprovalPermissionWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserIncomingApprovalPermissionWithDetails<U>;
  }

  castToCollectionApprovalPermission(address: string): CollectionApprovalPermissionWithDetails<T> {
    return new CollectionApprovalPermissionWithDetails({
      ...this,
      toList: getReservedAddressList(address) as AddressList,
      toListId: address
    });
  }
}

/**
 * @category Permissions
 */
export class UserOutgoingApprovalPermissionWithDetails<T extends NumberType>
  extends UserOutgoingApprovalPermission<T>
  implements iUserOutgoingApprovalPermissionWithDetails<T>, CustomType<UserOutgoingApprovalPermissionWithDetails<T>>
{
  toList: AddressList;
  initiatedByList: AddressList;

  constructor(data: iUserOutgoingApprovalPermissionWithDetails<T>) {
    super(data);
    this.toList = new AddressList(data.toList);
    this.initiatedByList = new AddressList(data.initiatedByList);
  }

  clone(): UserOutgoingApprovalPermissionWithDetails<T> {
    return super.clone() as UserOutgoingApprovalPermissionWithDetails<T>;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserOutgoingApprovalPermissionWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserOutgoingApprovalPermissionWithDetails<U>;
  }

  castToCollectionApprovalPermission(address: string): CollectionApprovalPermissionWithDetails<T> {
    return new CollectionApprovalPermissionWithDetails({
      ...this,
      fromList: getReservedAddressList(address) as AddressList,
      fromListId: address
    });
  }
}

/**
 * @category Permissions
 */
export class CollectionPermissionsWithDetails<T extends NumberType>
  extends CollectionPermissions<T>
  implements iCollectionPermissionsWithDetails<T>, CustomType<CollectionPermissionsWithDetails<T>>
{
  canUpdateCollectionApprovals: CollectionApprovalPermissionWithDetails<T>[];

  constructor(data: iCollectionPermissionsWithDetails<T>) {
    super(data);
    this.canUpdateCollectionApprovals = data.canUpdateCollectionApprovals.map(
      (canUpdateCollectionApproval) => new CollectionApprovalPermissionWithDetails(canUpdateCollectionApproval)
    );
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): CollectionPermissionsWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as CollectionPermissionsWithDetails<U>;
  }

  clone<U extends NumberType>(): CollectionPermissionsWithDetails<U> {
    return super.clone() as any as CollectionPermissionsWithDetails<U>;
  }

  static validateUpdate<U extends NumberType>(
    oldPermissions: CollectionPermissionsWithDetails<U>,
    newPermissions: CollectionPermissionsWithDetails<U>
  ): Error | null {
    return CollectionPermissions.validateUpdate(oldPermissions, newPermissions);
  }
}

/**
 * @category Permissions
 */
export class UserPermissionsWithDetails<T extends NumberType> extends UserPermissions<T> implements iUserPermissionsWithDetails<T> {
  canUpdateIncomingApprovals: UserIncomingApprovalPermissionWithDetails<T>[];
  canUpdateOutgoingApprovals: UserOutgoingApprovalPermissionWithDetails<T>[];
  canUpdateAutoApproveSelfInitiatedOutgoingTransfers: ActionPermission<T>[];
  canUpdateAutoApproveSelfInitiatedIncomingTransfers: ActionPermission<T>[];

  constructor(data: iUserPermissionsWithDetails<T>) {
    super(data);
    this.canUpdateIncomingApprovals = data.canUpdateIncomingApprovals.map(
      (canUpdateUserIncomingApproval) => new UserIncomingApprovalPermissionWithDetails(canUpdateUserIncomingApproval)
    );
    this.canUpdateOutgoingApprovals = data.canUpdateOutgoingApprovals.map(
      (canUpdateUserOutgoingApproval) => new UserOutgoingApprovalPermissionWithDetails(canUpdateUserOutgoingApproval)
    );
    this.canUpdateAutoApproveSelfInitiatedOutgoingTransfers = data.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.map(
      (actionPermission) => new ActionPermission(actionPermission)
    );
    this.canUpdateAutoApproveSelfInitiatedIncomingTransfers = data.canUpdateAutoApproveSelfInitiatedIncomingTransfers.map(
      (actionPermission) => new ActionPermission(actionPermission)
    );
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): UserPermissionsWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as UserPermissionsWithDetails<U>;
  }
}

function checkNotForbidden(permission: UniversalPermissionDetails, time?: bigint): Error | null {
  // Throw if current block time is a forbidden time
  const blockTime = time ?? BigInt(Date.now());
  const [, found] = permission.permanentlyForbiddenTimes.search(blockTime);
  if (found) {
    return new Error(
      `permission is forbidden from being executed at current time ${new Date(Number(blockTime)).toLocaleDateString() + ' ' + new Date(Number(blockTime)).toLocaleTimeString()}`
    );
  }

  return null;
}

function checkNotForbiddenForAllOverlaps(
  permissionDetails: UniversalPermissionDetails[],
  detailsToCheck: UniversalPermissionDetails[],
  time: bigint | undefined = undefined,
  usesLists?: boolean
): Error | null {
  let usesBadgeIds = true;
  let usesTimelineTimes = true;
  let usesTransferTimes = true;
  let usesOwnershipTimes = true;
  let usesToLists = true;
  let usesFromLists = true;
  let usesInitiatedByLists = true;
  let usesApprovalIdLists = true;
  let usesAmountTrackerIdList = true;
  let usesChallengeTrackerIdList = true;

  // Apply dummy ranges to all detailsToCheck
  for (const detailToCheck of detailsToCheck) {
    if (detailToCheck.badgeId.start === -1n) {
      usesBadgeIds = false;
      detailToCheck.badgeId = new UintRange({ start: BigInt(1n), end: BigInt(1n) }); // Dummy range
    }

    if (detailToCheck.timelineTime.start === -1n) {
      usesTimelineTimes = false;
      detailToCheck.timelineTime = new UintRange({ start: BigInt(1n), end: BigInt(1n) }); // Dummy range
    }

    if (detailToCheck.transferTime.start === -1n) {
      usesTransferTimes = false;
      detailToCheck.transferTime = new UintRange({ start: BigInt(1n), end: BigInt(1n) }); // Dummy range
    }

    if (detailToCheck.ownershipTime.start === -1n) {
      usesOwnershipTimes = false;
      detailToCheck.ownershipTime = new UintRange({ start: BigInt(1n), end: BigInt(1n) }); // Dummy range
    }

    if (!usesLists) {
      usesToLists = false;
      detailToCheck.toList = AddressList.AllAddresses();
    }

    if (!usesLists) {
      usesFromLists = false;
      detailToCheck.fromList = AddressList.AllAddresses();
    }

    if (!usesLists) {
      usesInitiatedByLists = false;
      detailToCheck.initiatedByList = AddressList.AllAddresses();
    }

    if (!usesLists) {
      usesApprovalIdLists = false;
      detailToCheck.approvalIdList = AddressList.AllAddresses();
    }
  }

  // Validate that for each updated timeline time, the current time is permitted
  // We iterate through all explicitly defined permissions (permissionDetails)
  // If we find a match for some timeline time, we check that the current time is not forbidden
  for (const permissionDetail of permissionDetails) {
    for (const detailToCheck of detailsToCheck) {
      const [, overlap] = universalRemoveOverlaps(permissionDetail, detailToCheck);

      if (overlap.length > 0) {
        const err = checkNotForbidden(permissionDetail, time); // permanentlyForbiddenTimes and permanentlyPermittedTimes are stored in here
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

          if (usesToLists) {
            errStr += ` for the to lists ${permissionDetail.toList.listId}`;
          }

          if (usesFromLists) {
            errStr += ` for the from lists ${permissionDetail.fromList.listId}`;
          }

          if (usesInitiatedByLists) {
            errStr += ` for the initiated by lists ${permissionDetail.initiatedByList.listId}`;
          }

          //TODO: this won't be right
          if (usesApprovalIdLists) {
            errStr += ` for the approval id ${permissionDetail.approvalIdList.listId}`;
          }

          return new Error(errStr);
        }
      }
    }
  }

  return null;
}

/**
 * Validate if a universal permission update (old -> new) is valid (i.e. no permanently permitted or forbidden times are changed)
 *
 * @category Permissions
 */
function validateUniversalPermissionUpdate(oldPermissions: UniversalPermissionDetails[], newPermissions: UniversalPermissionDetails[]): Error | null {
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

    const [leftoverPermittedTimes] = oldPermission.permanentlyPermittedTimes.getOverlapDetails(newPermission.permanentlyPermittedTimes);
    const [leftoverForbiddenTimes] = oldPermission.permanentlyForbiddenTimes.getOverlapDetails(newPermission.permanentlyForbiddenTimes);

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
  let str = '(';

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
    str += 'toList: ';
    if (!permission.toList.whitelist) {
      str += `${permission.toList.addresses.length} addresses `;
    } else {
      str += `all except ${permission.toList.addresses.length} addresses `;
    }

    if (permission.toList.addresses.length > 0 && permission.toList.addresses.length <= 5) {
      str += '(';
      for (const address of permission.toList.addresses) {
        str += address + ' ';
      }
      str += ')';
    }
  }

  if (permission.fromList) {
    str += 'fromList: ';
    if (!permission.fromList.whitelist) {
      str += `${permission.fromList.addresses.length} addresses `;
    } else {
      str += `all except ${permission.fromList.addresses.length} addresses `;
    }

    if (permission.fromList.addresses.length > 0 && permission.fromList.addresses.length <= 5) {
      str += '(';
      for (const address of permission.fromList.addresses) {
        str += address + ' ';
      }
      str += ')';
    }
  }

  if (permission.initiatedByList) {
    str += 'initiatedByList: ';
    if (!permission.initiatedByList.whitelist) {
      str += `${permission.initiatedByList.addresses.length} addresses `;
    } else {
      str += `all except ${permission.initiatedByList.addresses.length} addresses `;
    }

    if (permission.initiatedByList.addresses.length > 0 && permission.initiatedByList.addresses.length <= 5) {
      str += '(';
      for (const address of permission.initiatedByList.addresses) {
        str += address + ' ';
      }
      str += ')';
    }
  }

  str += ') ';

  return str;
}
