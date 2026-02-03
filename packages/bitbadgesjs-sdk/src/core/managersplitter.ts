import type { ConvertOptions } from '@/common/base.js';
import { BaseNumberTypeClass, deepCopyPrimitives } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import type { iPermissionCriteria, iManagerSplitterPermissions } from '@/interfaces/types/managersplitter.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as protomanagersplitter from '../proto/managersplitter/permissions_pb.js';

/**
 * PermissionCriteria defines the criteria for executing a permission.
 * Currently supports approved addresses (whitelist).
 *
 * @category Managersplitter
 */
export class PermissionCriteria extends BaseNumberTypeClass<PermissionCriteria> implements iPermissionCriteria {
  approvedAddresses: string[];

  constructor(data: iPermissionCriteria) {
    super();
    this.approvedAddresses = data.approvedAddresses || [];
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): PermissionCriteria {
    return deepCopyPrimitives(this) as PermissionCriteria;
  }

  toProto(): protomanagersplitter.PermissionCriteria {
    return new protomanagersplitter.PermissionCriteria({
      approvedAddresses: this.approvedAddresses
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): PermissionCriteria {
    return PermissionCriteria.fromProto(protomanagersplitter.PermissionCriteria.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): PermissionCriteria {
    return PermissionCriteria.fromProto(protomanagersplitter.PermissionCriteria.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protomanagersplitter.PermissionCriteria): PermissionCriteria {
    return new PermissionCriteria({
      approvedAddresses: protoMsg.approvedAddresses
    });
  }
}

/**
 * ManagerSplitterPermissions mirrors the CollectionPermissions structure
 * but maps each permission to criteria for execution.
 *
 * @category Managersplitter
 */
export class ManagerSplitterPermissions extends BaseNumberTypeClass<ManagerSplitterPermissions> implements iManagerSplitterPermissions {
  canDeleteCollection?: PermissionCriteria;
  canArchiveCollection?: PermissionCriteria;
  canUpdateStandards?: PermissionCriteria;
  canUpdateCustomData?: PermissionCriteria;
  canUpdateManager?: PermissionCriteria;
  canUpdateCollectionMetadata?: PermissionCriteria;
  canUpdateValidTokenIds?: PermissionCriteria;
  canUpdateTokenMetadata?: PermissionCriteria;
  canUpdateCollectionApprovals?: PermissionCriteria;

  constructor(data: iManagerSplitterPermissions) {
    super();
    this.canDeleteCollection = data.canDeleteCollection ? new PermissionCriteria(data.canDeleteCollection) : undefined;
    this.canArchiveCollection = data.canArchiveCollection ? new PermissionCriteria(data.canArchiveCollection) : undefined;
    this.canUpdateStandards = data.canUpdateStandards ? new PermissionCriteria(data.canUpdateStandards) : undefined;
    this.canUpdateCustomData = data.canUpdateCustomData ? new PermissionCriteria(data.canUpdateCustomData) : undefined;
    this.canUpdateManager = data.canUpdateManager ? new PermissionCriteria(data.canUpdateManager) : undefined;
    this.canUpdateCollectionMetadata = data.canUpdateCollectionMetadata ? new PermissionCriteria(data.canUpdateCollectionMetadata) : undefined;
    this.canUpdateValidTokenIds = data.canUpdateValidTokenIds ? new PermissionCriteria(data.canUpdateValidTokenIds) : undefined;
    this.canUpdateTokenMetadata = data.canUpdateTokenMetadata ? new PermissionCriteria(data.canUpdateTokenMetadata) : undefined;
    this.canUpdateCollectionApprovals = data.canUpdateCollectionApprovals ? new PermissionCriteria(data.canUpdateCollectionApprovals) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): ManagerSplitterPermissions {
    return deepCopyPrimitives(this) as ManagerSplitterPermissions;
  }

  toProto(): protomanagersplitter.ManagerSplitterPermissions {
    return new protomanagersplitter.ManagerSplitterPermissions({
      canDeleteCollection: this.canDeleteCollection?.toProto(),
      canArchiveCollection: this.canArchiveCollection?.toProto(),
      canUpdateStandards: this.canUpdateStandards?.toProto(),
      canUpdateCustomData: this.canUpdateCustomData?.toProto(),
      canUpdateManager: this.canUpdateManager?.toProto(),
      canUpdateCollectionMetadata: this.canUpdateCollectionMetadata?.toProto(),
      canUpdateValidTokenIds: this.canUpdateValidTokenIds?.toProto(),
      canUpdateTokenMetadata: this.canUpdateTokenMetadata?.toProto(),
      canUpdateCollectionApprovals: this.canUpdateCollectionApprovals?.toProto()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): ManagerSplitterPermissions {
    return ManagerSplitterPermissions.fromProto(protomanagersplitter.ManagerSplitterPermissions.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): ManagerSplitterPermissions {
    return ManagerSplitterPermissions.fromProto(protomanagersplitter.ManagerSplitterPermissions.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protomanagersplitter.ManagerSplitterPermissions): ManagerSplitterPermissions {
    return new ManagerSplitterPermissions({
      canDeleteCollection: protoMsg.canDeleteCollection ? PermissionCriteria.fromProto(protoMsg.canDeleteCollection) : undefined,
      canArchiveCollection: protoMsg.canArchiveCollection ? PermissionCriteria.fromProto(protoMsg.canArchiveCollection) : undefined,
      canUpdateStandards: protoMsg.canUpdateStandards ? PermissionCriteria.fromProto(protoMsg.canUpdateStandards) : undefined,
      canUpdateCustomData: protoMsg.canUpdateCustomData ? PermissionCriteria.fromProto(protoMsg.canUpdateCustomData) : undefined,
      canUpdateManager: protoMsg.canUpdateManager ? PermissionCriteria.fromProto(protoMsg.canUpdateManager) : undefined,
      canUpdateCollectionMetadata: protoMsg.canUpdateCollectionMetadata ? PermissionCriteria.fromProto(protoMsg.canUpdateCollectionMetadata) : undefined,
      canUpdateValidTokenIds: protoMsg.canUpdateValidTokenIds ? PermissionCriteria.fromProto(protoMsg.canUpdateValidTokenIds) : undefined,
      canUpdateTokenMetadata: protoMsg.canUpdateTokenMetadata ? PermissionCriteria.fromProto(protoMsg.canUpdateTokenMetadata) : undefined,
      canUpdateCollectionApprovals: protoMsg.canUpdateCollectionApprovals ? PermissionCriteria.fromProto(protoMsg.canUpdateCollectionApprovals) : undefined
    });
  }
}
