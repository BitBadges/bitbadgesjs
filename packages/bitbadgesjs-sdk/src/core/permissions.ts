import type { ConvertOptions, CustomType } from '@/common/base.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, deepCopyPrimitives } from '@/common/base.js';
import type {
  iActionPermission,
  iTokenIdsActionPermission,
  iCollectionApprovalPermission,
  iCollectionApprovalPermissionWithDetails,
  iCollectionPermissions,
  iCollectionPermissionsWithDetails,
  iUserIncomingApprovalPermission,
  iUserIncomingApprovalPermissionWithDetails,
  iUserOutgoingApprovalPermission,
  iUserOutgoingApprovalPermissionWithDetails,
  iUserPermissions,
  iUserPermissionsWithDetails
} from '@/interfaces/types/permissions.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { BigIntify, Stringify, type NumberType } from '../common/string-numbers.js';
import * as protobadges from '../proto/badges/permissions_pb.js';
import { AddressList, convertListIdToBech32 } from './addressLists.js';
import type { UniversalPermission, UniversalPermissionDetails } from './overlaps.js';
import { GetFirstMatchOnly, getOverlapsAndNonOverlaps, universalRemoveOverlaps } from './overlaps.js';
import { UintRange, UintRangeArray } from './uintRanges.js';
import { AllDefaultValues } from './validate-utils.js';

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
  canUpdateAutoApproveAllIncomingTransfers: ActionPermission<T>[];

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
    this.canUpdateAutoApproveAllIncomingTransfers = msg.canUpdateAutoApproveAllIncomingTransfers.map((x) => new ActionPermission(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserPermissions<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserPermissions<U>;
  }

  toProto(): protobadges.UserPermissions {
    return new protobadges.UserPermissions(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserPermissions<U> {
    return UserPermissions.fromProto(protobadges.UserPermissions.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserPermissions<U> {
    return UserPermissions.fromProto(protobadges.UserPermissions.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: protobadges.UserPermissions, convertFunction: (item: NumberType) => U): UserPermissions<U> {
    return new UserPermissions({
      canUpdateOutgoingApprovals: protoMsg.canUpdateOutgoingApprovals.map((x) => UserOutgoingApprovalPermission.fromProto(x, convertFunction)),
      canUpdateIncomingApprovals: protoMsg.canUpdateIncomingApprovals.map((x) => UserIncomingApprovalPermission.fromProto(x, convertFunction)),
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: protoMsg.canUpdateAutoApproveSelfInitiatedOutgoingTransfers.map((x) =>
        ActionPermission.fromProto(x, convertFunction)
      ),
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: protoMsg.canUpdateAutoApproveSelfInitiatedIncomingTransfers.map((x) =>
        ActionPermission.fromProto(x, convertFunction)
      ),
      canUpdateAutoApproveAllIncomingTransfers: protoMsg.canUpdateAutoApproveAllIncomingTransfers.map((x) =>
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
      ),
      ActionPermission.validateUpdate(
        oldPermissions.canUpdateAutoApproveAllIncomingTransfers,
        newPermissions.canUpdateAutoApproveAllIncomingTransfers
      )
    ];

    return responses.find((x) => x !== null) ?? null;
  }

  static InitEmpty(): UserPermissions<bigint> {
    return new UserPermissions({
      canUpdateOutgoingApprovals: [],
      canUpdateIncomingApprovals: [],
      canUpdateAutoApproveSelfInitiatedOutgoingTransfers: [],
      canUpdateAutoApproveSelfInitiatedIncomingTransfers: [],
      canUpdateAutoApproveAllIncomingTransfers: []
    });
  }

  toBech32Addresses(prefix: string): UserPermissions<T> {
    return new UserPermissions({
      ...this,
      canUpdateOutgoingApprovals: this.canUpdateOutgoingApprovals.map((x) => x.toBech32Addresses(prefix)),
      canUpdateIncomingApprovals: this.canUpdateIncomingApprovals.map((x) => x.toBech32Addresses(prefix))
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
  tokenIds: UintRangeArray<T>;
  ownershipTimes: UintRangeArray<T>;
  approvalId: string;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iUserOutgoingApprovalPermission<T>) {
    super();
    this.toListId = msg.toListId;
    this.initiatedByListId = msg.initiatedByListId;
    this.transferTimes = UintRangeArray.From(msg.transferTimes);
    this.tokenIds = UintRangeArray.From(msg.tokenIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserOutgoingApprovalPermission<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserOutgoingApprovalPermission<U>;
  }

  toProto(): protobadges.UserOutgoingApprovalPermission {
    return new protobadges.UserOutgoingApprovalPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApprovalPermission<U> {
    return UserOutgoingApprovalPermission.fromProto(protobadges.UserOutgoingApprovalPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserOutgoingApprovalPermission<U> {
    return UserOutgoingApprovalPermission.fromProto(protobadges.UserOutgoingApprovalPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.UserOutgoingApprovalPermission,
    convertFunction: (item: NumberType) => U
  ): UserOutgoingApprovalPermission<U> {
    return new UserOutgoingApprovalPermission({
      toListId: protoMsg.toListId,
      initiatedByListId: protoMsg.initiatedByListId,
      transferTimes: protoMsg.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      tokenIds: protoMsg.tokenIds.map((x) => UintRange.fromProto(x, convertFunction)),
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
      tokenIds: UintRangeArray<U>;
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

  toBech32Addresses(prefix: string): UserOutgoingApprovalPermission<T> {
    return new UserOutgoingApprovalPermission({
      ...this,
      toListId: convertListIdToBech32(this.toListId, prefix),
      initiatedByListId: convertListIdToBech32(this.initiatedByListId, prefix)
    });
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
  tokenIds: UintRangeArray<T>;
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
    this.tokenIds = UintRangeArray.From(msg.tokenIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserIncomingApprovalPermission<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserIncomingApprovalPermission<U>;
  }

  toProto(): protobadges.UserIncomingApprovalPermission {
    return new protobadges.UserIncomingApprovalPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApprovalPermission<U> {
    return UserIncomingApprovalPermission.fromProto(protobadges.UserIncomingApprovalPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): UserIncomingApprovalPermission<U> {
    return UserIncomingApprovalPermission.fromProto(protobadges.UserIncomingApprovalPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.UserIncomingApprovalPermission,
    convertFunction: (item: NumberType) => U
  ): UserIncomingApprovalPermission<U> {
    return new UserIncomingApprovalPermission({
      fromListId: protoMsg.fromListId,
      initiatedByListId: protoMsg.initiatedByListId,
      transferTimes: protoMsg.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      tokenIds: protoMsg.tokenIds.map((x) => UintRange.fromProto(x, convertFunction)),
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
      tokenIds: UintRangeArray<U>;
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

  toBech32Addresses(prefix: string): UserIncomingApprovalPermission<T> {
    return new UserIncomingApprovalPermission({
      ...this,
      fromListId: convertListIdToBech32(this.fromListId, prefix),
      initiatedByListId: convertListIdToBech32(this.initiatedByListId, prefix)
    });
  }
}

/**
 * CollectionPermissions represents the permissions of a collection.
 *
 * @category Permissions
 */
export class CollectionPermissions<T extends NumberType> extends BaseNumberTypeClass<CollectionPermissions<T>> implements iCollectionPermissions<T> {
  canDeleteCollection: ActionPermission<T>[];
  canArchiveCollection: ActionPermission<T>[];
  canUpdateStandards: ActionPermission<T>[];
  canUpdateCustomData: ActionPermission<T>[];
  canUpdateManager: ActionPermission<T>[];
  canUpdateCollectionMetadata: ActionPermission<T>[];
  canUpdateValidTokenIds: TokenIdsActionPermission<T>[];
  canUpdateTokenMetadata: TokenIdsActionPermission<T>[];
  canUpdateCollectionApprovals: CollectionApprovalPermission<T>[];

  constructor(msg: iCollectionPermissions<T>) {
    super();
    this.canDeleteCollection = msg.canDeleteCollection.map((x) => new ActionPermission(x));
    this.canArchiveCollection = msg.canArchiveCollection.map((x) => new ActionPermission(x));
    this.canUpdateStandards = msg.canUpdateStandards.map((x) => new ActionPermission(x));
    this.canUpdateCustomData = msg.canUpdateCustomData.map((x) => new ActionPermission(x));
    this.canUpdateManager = msg.canUpdateManager.map((x) => new ActionPermission(x));
    this.canUpdateCollectionMetadata = msg.canUpdateCollectionMetadata.map((x) => new ActionPermission(x));
    this.canUpdateValidTokenIds = msg.canUpdateValidTokenIds.map((x) => new TokenIdsActionPermission(x));
    this.canUpdateTokenMetadata = msg.canUpdateTokenMetadata.map((x) => new TokenIdsActionPermission(x));
    this.canUpdateCollectionApprovals = msg.canUpdateCollectionApprovals.map((x) => new CollectionApprovalPermission(x));
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionPermissions<U> {
    return new CollectionPermissions(
      deepCopyPrimitives({
        canDeleteCollection: this.canDeleteCollection.map((x) => x.convert(convertFunction)),
        canArchiveCollection: this.canArchiveCollection.map((x) => x.convert(convertFunction)),
        canUpdateStandards: this.canUpdateStandards.map((x) => x.convert(convertFunction)),
        canUpdateCustomData: this.canUpdateCustomData.map((x) => x.convert(convertFunction)),
        canUpdateManager: this.canUpdateManager.map((x) => x.convert(convertFunction)),
        canUpdateCollectionMetadata: this.canUpdateCollectionMetadata.map((x) => x.convert(convertFunction)),
        canUpdateValidTokenIds: this.canUpdateValidTokenIds.map((x) => x.convert(convertFunction)),
        canUpdateTokenMetadata: this.canUpdateTokenMetadata.map((x) => x.convert(convertFunction)),
        canUpdateCollectionApprovals: this.canUpdateCollectionApprovals.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.CollectionPermissions {
    return new protobadges.CollectionPermissions(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionPermissions<U> {
    return CollectionPermissions.fromProto(protobadges.CollectionPermissions.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionPermissions<U> {
    return CollectionPermissions.fromProto(protobadges.CollectionPermissions.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.CollectionPermissions,
    convertFunction: (item: NumberType) => U
  ): CollectionPermissions<U> {
    return new CollectionPermissions({
      canDeleteCollection: protoMsg.canDeleteCollection.map((x) => ActionPermission.fromProto(x, convertFunction)),
      canArchiveCollection: protoMsg.canArchiveCollection.map((x) => ActionPermission.fromProto(x, convertFunction)),
      canUpdateStandards: protoMsg.canUpdateStandards.map((x) => ActionPermission.fromProto(x, convertFunction)),
      canUpdateCustomData: protoMsg.canUpdateCustomData.map((x) => ActionPermission.fromProto(x, convertFunction)),
      canUpdateManager: protoMsg.canUpdateManager.map((x) => ActionPermission.fromProto(x, convertFunction)),
      canUpdateCollectionMetadata: protoMsg.canUpdateCollectionMetadata.map((x) => ActionPermission.fromProto(x, convertFunction)),
      canUpdateValidTokenIds: protoMsg.canUpdateValidTokenIds.map((x) => TokenIdsActionPermission.fromProto(x, convertFunction)),
      canUpdateTokenMetadata: protoMsg.canUpdateTokenMetadata.map((x) => TokenIdsActionPermission.fromProto(x, convertFunction)),
      canUpdateCollectionApprovals: protoMsg.canUpdateCollectionApprovals.map((x) => CollectionApprovalPermission.fromProto(x, convertFunction))
    });
  }

  static validateUpdate<U extends NumberType>(
    oldPermissions: CollectionPermissionsWithDetails<U>,
    newPermissions: CollectionPermissionsWithDetails<U>
  ): Error | null {
    const responses = [
      ActionPermission.validateUpdate(oldPermissions.canDeleteCollection, newPermissions.canDeleteCollection),
      ActionPermission.validateUpdate(oldPermissions.canUpdateManager, newPermissions.canUpdateManager),
      ActionPermission.validateUpdate(oldPermissions.canUpdateCustomData, newPermissions.canUpdateCustomData),
      ActionPermission.validateUpdate(oldPermissions.canUpdateStandards, newPermissions.canUpdateStandards),
      ActionPermission.validateUpdate(oldPermissions.canArchiveCollection, newPermissions.canArchiveCollection),
      ActionPermission.validateUpdate(oldPermissions.canUpdateCollectionMetadata, newPermissions.canUpdateCollectionMetadata),
      TokenIdsActionPermission.validateUpdate(oldPermissions.canUpdateValidTokenIds, newPermissions.canUpdateValidTokenIds),
      TokenIdsActionPermission.validateUpdate(oldPermissions.canUpdateTokenMetadata, newPermissions.canUpdateTokenMetadata),
      CollectionApprovalPermission.validateUpdate(oldPermissions.canUpdateCollectionApprovals, newPermissions.canUpdateCollectionApprovals)
    ];

    return responses.find((x) => x !== null) ?? null;
  }

  static InitEmpty(): CollectionPermissions<bigint> {
    return new CollectionPermissions({
      canDeleteCollection: [],
      canArchiveCollection: [],
      canUpdateStandards: [],
      canUpdateCustomData: [],
      canUpdateManager: [],
      canUpdateCollectionMetadata: [],
      canUpdateValidTokenIds: [],
      canUpdateTokenMetadata: [],
      canUpdateCollectionApprovals: []
    });
  }

  toBech32Addresses(prefix: string): CollectionPermissions<T> {
    return new CollectionPermissions({
      ...this,
      canUpdateCollectionApprovals: this.canUpdateCollectionApprovals.map((x) => x.toBech32Addresses(prefix))
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): ActionPermission<U> {
    return new ActionPermission(
      deepCopyPrimitives({
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.ActionPermission {
    return new protobadges.ActionPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ActionPermission<U> {
    return ActionPermission.fromProto(protobadges.ActionPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): ActionPermission<U> {
    return ActionPermission.fromProto(protobadges.ActionPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: protobadges.ActionPermission, convertFunction: (item: NumberType) => U): ActionPermission<U> {
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


const AllDefaultDetailsValues: UniversalPermissionDetails = {
  timelineTime: new UintRange({ start: -1n, end: -1n }),
  tokenId: new UintRange({ start: -1n, end: -1n }),
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
 * TokenIdsActionPermission represents a permission that allows updating a balances action.
 *
 * @category Permissions
 */
export class TokenIdsActionPermission<T extends NumberType>
  extends BaseNumberTypeClass<TokenIdsActionPermission<T>>
  implements iTokenIdsActionPermission<T>
{
  tokenIds: UintRangeArray<T>;
  permanentlyPermittedTimes: UintRangeArray<T>;
  permanentlyForbiddenTimes: UintRangeArray<T>;

  constructor(msg: iTokenIdsActionPermission<T>) {
    super();
    this.tokenIds = UintRangeArray.From(msg.tokenIds);
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): TokenIdsActionPermission<U> {
    return new TokenIdsActionPermission(
      deepCopyPrimitives({
        tokenIds: this.tokenIds.map((x) => x.convert(convertFunction)),
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.TokenIdsActionPermission {
    return new protobadges.TokenIdsActionPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TokenIdsActionPermission<U> {
    return TokenIdsActionPermission.fromProto(protobadges.TokenIdsActionPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): TokenIdsActionPermission<U> {
    return TokenIdsActionPermission.fromProto(protobadges.TokenIdsActionPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.TokenIdsActionPermission,
    convertFunction: (item: NumberType) => U
  ): TokenIdsActionPermission<U> {
    return new TokenIdsActionPermission({
      tokenIds: protoMsg.tokenIds.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyPermittedTimes: protoMsg.permanentlyPermittedTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      permanentlyForbiddenTimes: protoMsg.permanentlyForbiddenTimes.map((x) => UintRange.fromProto(x, convertFunction))
    });
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      tokenIds: this.tokenIds.convert(BigIntify),
      permanentlyPermittedTimes: this.permanentlyPermittedTimes.convert(BigIntify),
      permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.convert(BigIntify),
      usesTokenIds: true
    };
  }
  static validateUpdate<U extends NumberType>(
    permissions: TokenIdsActionPermission<U>[],
    newPermission: TokenIdsActionPermission<U>[]
  ): Error | null {
    const castedPermissions: UniversalPermission[] = permissions.map((x) => x.castToUniversalPermission());
    const castedNewPermissions: UniversalPermission[] = newPermission.map((x) => x.castToUniversalPermission());
    return validateUniversalPermissionUpdate(GetFirstMatchOnly(castedPermissions), GetFirstMatchOnly(castedNewPermissions));
  }

  static check<U extends NumberType>(
    details: {
      tokenIds: UintRangeArray<U>;
    }[],
    permissions: TokenIdsActionPermission<U>[],
    time?: U
  ): Error | null {
    const detailsToCheck: UniversalPermissionDetails[] = [];
    for (const detail of details) {
      for (const tokenId of detail.tokenIds) {
        detailsToCheck.push({
          ...AllDefaultDetailsValues,
          tokenId: tokenId.convert(BigIntify)
        });
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
 * This permission allows you to define when the approved transfers can be updated and which combinations of (from, to, initiatedBy, transferTimes, tokenIds, ownershipTimes, permanentlyPermittedTimes, permanentlyForbiddenTimes) can be updated.
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
  tokenIds: UintRangeArray<T>;
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
    this.tokenIds = UintRangeArray.From(msg.tokenIds);
    this.ownershipTimes = UintRangeArray.From(msg.ownershipTimes);
    this.approvalId = msg.approvalId;
    this.permanentlyPermittedTimes = UintRangeArray.From(msg.permanentlyPermittedTimes);
    this.permanentlyForbiddenTimes = UintRangeArray.From(msg.permanentlyForbiddenTimes);
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionApprovalPermission<U> {
    return new CollectionApprovalPermission(
      deepCopyPrimitives({
        fromListId: this.fromListId,
        toListId: this.toListId,
        initiatedByListId: this.initiatedByListId,
        transferTimes: this.transferTimes.map((x) => x.convert(convertFunction)),
        tokenIds: this.tokenIds.map((x) => x.convert(convertFunction)),
        ownershipTimes: this.ownershipTimes.map((x) => x.convert(convertFunction)),
        approvalId: this.approvalId,
        permanentlyPermittedTimes: this.permanentlyPermittedTimes.map((x) => x.convert(convertFunction)),
        permanentlyForbiddenTimes: this.permanentlyForbiddenTimes.map((x) => x.convert(convertFunction))
      })
    );
  }

  toProto(): protobadges.CollectionApprovalPermission {
    return new protobadges.CollectionApprovalPermission(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApprovalPermission<U> {
    return CollectionApprovalPermission.fromProto(protobadges.CollectionApprovalPermission.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): CollectionApprovalPermission<U> {
    return CollectionApprovalPermission.fromProto(protobadges.CollectionApprovalPermission.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.CollectionApprovalPermission,
    convertFunction: (item: NumberType) => U
  ): CollectionApprovalPermission<U> {
    return new CollectionApprovalPermission({
      fromListId: protoMsg.fromListId,
      toListId: protoMsg.toListId,
      initiatedByListId: protoMsg.initiatedByListId,
      transferTimes: protoMsg.transferTimes.map((x) => UintRange.fromProto(x, convertFunction)),
      tokenIds: protoMsg.tokenIds.map((x) => UintRange.fromProto(x, convertFunction)),
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
      tokenIds: UintRangeArray<U>;
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
        for (const tokenId of detail.tokenIds) {
          for (const ownershipTime of detail.ownershipTimes) {
            detailsToCheck.push({
              ...AllDefaultDetailsValues,
              transferTime: transferTime.convert(BigIntify),
              tokenId: tokenId.convert(BigIntify),
              ownershipTime: ownershipTime.convert(BigIntify),
              toList: detail.toList,
              fromList: detail.fromList,
              initiatedByList: detail.initiatedByList,
              approvalIdList: detail.approvalIdList
            });
          }
        }
      }
    }

    const castedPermissions = permissions.map((x) => x.castToUniversalPermission());
    const permissionDetails = GetFirstMatchOnly(castedPermissions);
    return checkNotForbiddenForAllOverlaps(permissionDetails, detailsToCheck, time ? BigInt(time) : undefined, true);
  }

  toBech32Addresses(prefix: string): CollectionApprovalPermission<T> {
    return new CollectionApprovalPermission({
      ...this,
      fromListId: convertListIdToBech32(this.fromListId, prefix),
      toListId: convertListIdToBech32(this.toListId, prefix),
      initiatedByListId: convertListIdToBech32(this.initiatedByListId, prefix)
    });
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionApprovalPermissionWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionApprovalPermissionWithDetails<U>;
  }

  castToUniversalPermission(): UniversalPermission {
    return {
      ...AllDefaultValues,
      toList: this.toList,
      fromList: this.fromList,
      initiatedByList: this.initiatedByList,
      transferTimes: this.transferTimes.convert(BigIntify),
      tokenIds: this.tokenIds.convert(BigIntify),
      ownershipTimes: this.ownershipTimes.convert(BigIntify),
      approvalIdList: getReservedTrackerList(this.approvalId),
      usesApprovalIdList: true,
      usesTokenIds: true,
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserIncomingApprovalPermissionWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserIncomingApprovalPermissionWithDetails<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserOutgoingApprovalPermissionWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserOutgoingApprovalPermissionWithDetails<U>;
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

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): CollectionPermissionsWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as CollectionPermissionsWithDetails<U>;
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
  canUpdateAutoApproveAllIncomingTransfers: ActionPermission<T>[];

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
    this.canUpdateAutoApproveAllIncomingTransfers = data.canUpdateAutoApproveAllIncomingTransfers.map(
      (actionPermission) => new ActionPermission(actionPermission)
    );
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): UserPermissionsWithDetails<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as UserPermissionsWithDetails<U>;
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
  let usesTokenIds = true;
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
    if (detailToCheck.tokenId.start === -1n) {
      usesTokenIds = false;
      detailToCheck.tokenId = new UintRange({ start: BigInt(1n), end: BigInt(1n) }); // Dummy range
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

          if (usesTokenIds) {
            errStr += ` for the token ids ${permissionDetail.tokenId.start} to ${permissionDetail.tokenId.end}`;
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

  if (permission.tokenId.start === maxUint64 || permission.tokenId.end === maxUint64) {
    str += `tokenId: ${permission.tokenId.start} `;
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
