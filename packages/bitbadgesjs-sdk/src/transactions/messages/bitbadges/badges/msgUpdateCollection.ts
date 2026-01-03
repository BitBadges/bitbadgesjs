import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { CollectionApproval } from '@/core/approvals.js';
import { CosmosCoin } from '@/core/coin.js';
import { AliasPathAddObject, CosmosCoinWrapperPathAddObject, InvariantsAddObject } from '@/core/ibc-wrappers.js';
import { TokenMetadata, CollectionMetadata } from '@/core/misc.js';
import type { iCollectionMetadata } from '@/interfaces/types/core.js';
import { CollectionPermissions } from '@/core/permissions.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { CollectionId } from '@/interfaces/index.js';
import { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { normalizeMessagesIfNecessary } from '../../base.js';
import type { iMsgUpdateCollection } from './interfaces.js';
/**
 * MsgUpdateCollection is a transaction that can be used to update any collection. It is only executable by the manager.
 *
 * Note that you must have the necessary privileges to update specific fields. If you do not have the necessary privileges, it will throw an error.
 * We update any CollectionPermissions at the end, so the permissions checked for the current execution are the permissions BEFORE the update.
 * In the case of the first MsgUpdateCollection, the previous permissions are by default all permitted.
 *
 * To specify you would like to update a field, the corresponding update field must be set to true. If it is set to false, we ignore it.
 *
 * @category Transactions
 */
export class MsgUpdateCollection<T extends NumberType> extends BaseNumberTypeClass<MsgUpdateCollection<T>> implements iMsgUpdateCollection<T> {
  creator: BitBadgesAddress;
  collectionId: CollectionId;
  updateValidTokenIds?: boolean;
  validTokenIds?: UintRangeArray<T>;
  updateCollectionPermissions?: boolean;
  collectionPermissions?: CollectionPermissions<T>;
  updateManager?: boolean;
  manager?: BitBadgesAddress;
  updateCollectionMetadata?: boolean;
  collectionMetadata?: CollectionMetadata;
  updateTokenMetadata?: boolean;
  tokenMetadata?: TokenMetadata<T>[];
  updateCustomData?: boolean;
  customData?: string;
  updateCollectionApprovals?: boolean;
  collectionApprovals?: CollectionApproval<T>[];
  updateStandards?: boolean;
  standards?: string[];
  updateIsArchived?: boolean;
  isArchived?: boolean;
  mintEscrowCoinsToTransfer?: CosmosCoin<T>[];
  cosmosCoinWrapperPathsToAdd?: CosmosCoinWrapperPathAddObject<T>[];
  aliasPathsToAdd?: AliasPathAddObject<T>[];
  invariants?: InvariantsAddObject<T>;

  constructor(msg: iMsgUpdateCollection<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.updateValidTokenIds = msg.updateValidTokenIds;
    this.validTokenIds = msg.validTokenIds ? UintRangeArray.From(msg.validTokenIds) : undefined;
    this.updateCollectionPermissions = msg.updateCollectionPermissions;
    this.collectionPermissions = msg.collectionPermissions ? new CollectionPermissions(msg.collectionPermissions) : undefined;
    this.updateManager = msg.updateManager;
    this.manager = msg.manager;
    this.updateCollectionMetadata = msg.updateCollectionMetadata;
    this.collectionMetadata = msg.collectionMetadata ? new CollectionMetadata(msg.collectionMetadata) : undefined;
    this.updateTokenMetadata = msg.updateTokenMetadata;
    this.tokenMetadata = msg.tokenMetadata?.map((x) => new TokenMetadata(x));
    this.updateCustomData = msg.updateCustomData;
    this.customData = msg.customData;
    this.updateCollectionApprovals = msg.updateCollectionApprovals;
    this.collectionApprovals = msg.collectionApprovals ? msg.collectionApprovals.map((x) => new CollectionApproval(x)) : undefined;
    this.updateStandards = msg.updateStandards;
    this.standards = msg.standards;
    this.updateIsArchived = msg.updateIsArchived;
    this.isArchived = msg.isArchived;
    this.mintEscrowCoinsToTransfer = msg.mintEscrowCoinsToTransfer ? msg.mintEscrowCoinsToTransfer.map((x) => new CosmosCoin(x)) : undefined;
    this.cosmosCoinWrapperPathsToAdd = msg.cosmosCoinWrapperPathsToAdd
      ? msg.cosmosCoinWrapperPathsToAdd.map((x) => new CosmosCoinWrapperPathAddObject(x))
      : undefined;
    this.aliasPathsToAdd = msg.aliasPathsToAdd ? msg.aliasPathsToAdd.map((x) => new AliasPathAddObject(x)) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgUpdateCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgUpdateCollection<U>;
  }

  toProto(): protobadges.MsgUpdateCollection {
    return new protobadges.MsgUpdateCollection(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUpdateCollection<U> {
    return MsgUpdateCollection.fromProto(protobadges.MsgUpdateCollection.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUpdateCollection<U> {
    return MsgUpdateCollection.fromProto(protobadges.MsgUpdateCollection.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.MsgUpdateCollection,
    convertFunction: (item: NumberType) => U
  ): MsgUpdateCollection<U> {
    return new MsgUpdateCollection({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      updateValidTokenIds: protoMsg.updateValidTokenIds,
      validTokenIds: protoMsg.validTokenIds?.map((x) => UintRange.fromProto(x, convertFunction)),
      updateCollectionPermissions: protoMsg.updateCollectionPermissions,
      collectionPermissions: protoMsg.collectionPermissions
        ? CollectionPermissions.fromProto(protoMsg.collectionPermissions, convertFunction)
        : undefined,
      updateManager: protoMsg.updateManager,
      manager: protoMsg.manager || undefined,
      updateCollectionMetadata: protoMsg.updateCollectionMetadata,
      collectionMetadata: protoMsg.collectionMetadata ? CollectionMetadata.fromProto(protoMsg.collectionMetadata) : undefined,
      updateTokenMetadata: protoMsg.updateTokenMetadata,
      tokenMetadata: protoMsg.tokenMetadata.length > 0 ? protoMsg.tokenMetadata.map((tm) => TokenMetadata.fromProto(tm, convertFunction)) : undefined,
      updateCustomData: protoMsg.updateCustomData,
      customData: protoMsg.customData || undefined,
      updateCollectionApprovals: protoMsg.updateCollectionApprovals,
      collectionApprovals: protoMsg.collectionApprovals?.map((x) => CollectionApproval.fromProto(x, convertFunction)),
      updateStandards: protoMsg.updateStandards,
      standards: protoMsg.standards.length > 0 ? protoMsg.standards : undefined,
      updateIsArchived: protoMsg.updateIsArchived,
      isArchived: protoMsg.isArchived,
      mintEscrowCoinsToTransfer: protoMsg.mintEscrowCoinsToTransfer?.map((x) => CosmosCoin.fromProto(x, convertFunction)),
      cosmosCoinWrapperPathsToAdd: protoMsg.cosmosCoinWrapperPathsToAdd?.map((x) => CosmosCoinWrapperPathAddObject.fromProto(x, convertFunction)),
      aliasPathsToAdd: protoMsg.aliasPathsToAdd?.map((x) => AliasPathAddObject.fromProto(x, convertFunction)),
      invariants: protoMsg.invariants ? InvariantsAddObject.fromProto(protoMsg.invariants, convertFunction) : undefined
    });
  }

  toBech32Addresses(prefix: string): MsgUpdateCollection<T> {
    return new MsgUpdateCollection<T>({
      ...this,
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      collectionPermissions: this.collectionPermissions?.toBech32Addresses(prefix),
      manager: this.manager ? getConvertFunctionFromPrefix(prefix)(this.manager) : undefined,
      collectionApprovals: this.collectionApprovals?.map((x) => x.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"updateCollectionMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
