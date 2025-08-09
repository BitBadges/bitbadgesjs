import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import * as protobadges from '@/proto/badges/tx_pb.js';

import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { CollectionApproval } from '@/core/approvals.js';
import { CosmosCoin } from '@/core/coin.js';
import { CosmosCoinWrapperPathAddObject } from '@/core/ibc-wrappers.js';
import {
  TokenMetadataTimeline,
  CollectionMetadataTimeline,
  CustomDataTimeline,
  IsArchivedTimeline,
  ManagerTimeline,
  OffChainBalancesMetadataTimeline,
  StandardsTimeline
} from '@/core/misc.js';
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
  updateManagerTimeline?: boolean;
  managerTimeline?: ManagerTimeline<T>[];
  updateCollectionMetadataTimeline?: boolean;
  collectionMetadataTimeline?: CollectionMetadataTimeline<T>[];
  updateTokenMetadataTimeline?: boolean;
  tokenMetadataTimeline?: TokenMetadataTimeline<T>[];
  updateOffChainBalancesMetadataTimeline?: boolean;
  offChainBalancesMetadataTimeline?: OffChainBalancesMetadataTimeline<T>[];
  updateCustomDataTimeline?: boolean;
  customDataTimeline?: CustomDataTimeline<T>[];
  updateCollectionApprovals?: boolean;
  collectionApprovals?: CollectionApproval<T>[];
  updateStandardsTimeline?: boolean;
  standardsTimeline?: StandardsTimeline<T>[];
  updateIsArchivedTimeline?: boolean;
  isArchivedTimeline?: IsArchivedTimeline<T>[];
  mintEscrowCoinsToTransfer?: CosmosCoin<T>[];
  cosmosCoinWrapperPathsToAdd?: CosmosCoinWrapperPathAddObject<T>[];

  constructor(msg: iMsgUpdateCollection<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.updateValidTokenIds = msg.updateValidTokenIds;
    this.validTokenIds = msg.validTokenIds ? UintRangeArray.From(msg.validTokenIds) : undefined;
    this.updateCollectionPermissions = msg.updateCollectionPermissions;
    this.collectionPermissions = msg.collectionPermissions ? new CollectionPermissions(msg.collectionPermissions) : undefined;
    this.updateManagerTimeline = msg.updateManagerTimeline;
    this.managerTimeline = msg.managerTimeline ? msg.managerTimeline.map((x) => new ManagerTimeline(x)) : undefined;
    this.updateCollectionMetadataTimeline = msg.updateCollectionMetadataTimeline;
    this.collectionMetadataTimeline = msg.collectionMetadataTimeline
      ? msg.collectionMetadataTimeline.map((x) => new CollectionMetadataTimeline(x))
      : undefined;
    this.updateTokenMetadataTimeline = msg.updateTokenMetadataTimeline;
    this.tokenMetadataTimeline = msg.tokenMetadataTimeline ? msg.tokenMetadataTimeline.map((x) => new TokenMetadataTimeline(x)) : undefined;
    this.updateOffChainBalancesMetadataTimeline = msg.updateOffChainBalancesMetadataTimeline;
    this.offChainBalancesMetadataTimeline = msg.offChainBalancesMetadataTimeline
      ? msg.offChainBalancesMetadataTimeline.map((x) => new OffChainBalancesMetadataTimeline(x))
      : undefined;
    this.updateCustomDataTimeline = msg.updateCustomDataTimeline;
    this.customDataTimeline = msg.customDataTimeline ? msg.customDataTimeline.map((x) => new CustomDataTimeline(x)) : undefined;
    this.updateCollectionApprovals = msg.updateCollectionApprovals;
    this.collectionApprovals = msg.collectionApprovals ? msg.collectionApprovals.map((x) => new CollectionApproval(x)) : undefined;
    this.updateStandardsTimeline = msg.updateStandardsTimeline;
    this.standardsTimeline = msg.standardsTimeline ? msg.standardsTimeline.map((x) => new StandardsTimeline(x)) : undefined;
    this.updateIsArchivedTimeline = msg.updateIsArchivedTimeline;
    this.isArchivedTimeline = msg.isArchivedTimeline ? msg.isArchivedTimeline.map((x) => new IsArchivedTimeline(x)) : undefined;
    this.mintEscrowCoinsToTransfer = msg.mintEscrowCoinsToTransfer ? msg.mintEscrowCoinsToTransfer.map((x) => new CosmosCoin(x)) : undefined;
    this.cosmosCoinWrapperPathsToAdd = msg.cosmosCoinWrapperPathsToAdd
      ? msg.cosmosCoinWrapperPathsToAdd.map((x) => new CosmosCoinWrapperPathAddObject(x))
      : undefined;
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
      updateManagerTimeline: protoMsg.updateManagerTimeline,
      managerTimeline: protoMsg.managerTimeline?.map((x) => ManagerTimeline.fromProto(x, convertFunction)),
      updateCollectionMetadataTimeline: protoMsg.updateCollectionMetadataTimeline,
      collectionMetadataTimeline: protoMsg.collectionMetadataTimeline?.map((x) => CollectionMetadataTimeline.fromProto(x, convertFunction)),
      updateTokenMetadataTimeline: protoMsg.updateTokenMetadataTimeline,
      tokenMetadataTimeline: protoMsg.tokenMetadataTimeline?.map((x) => TokenMetadataTimeline.fromProto(x, convertFunction)),
      updateOffChainBalancesMetadataTimeline: protoMsg.updateOffChainBalancesMetadataTimeline,
      offChainBalancesMetadataTimeline: protoMsg.offChainBalancesMetadataTimeline?.map((x) =>
        OffChainBalancesMetadataTimeline.fromProto(x, convertFunction)
      ),
      updateCustomDataTimeline: protoMsg.updateCustomDataTimeline,
      customDataTimeline: protoMsg.customDataTimeline?.map((x) => CustomDataTimeline.fromProto(x, convertFunction)),
      updateCollectionApprovals: protoMsg.updateCollectionApprovals,
      collectionApprovals: protoMsg.collectionApprovals?.map((x) => CollectionApproval.fromProto(x, convertFunction)),
      updateStandardsTimeline: protoMsg.updateStandardsTimeline,
      standardsTimeline: protoMsg.standardsTimeline?.map((x) => StandardsTimeline.fromProto(x, convertFunction)),
      updateIsArchivedTimeline: protoMsg.updateIsArchivedTimeline,
      isArchivedTimeline: protoMsg.isArchivedTimeline?.map((x) => IsArchivedTimeline.fromProto(x, convertFunction)),
      mintEscrowCoinsToTransfer: protoMsg.mintEscrowCoinsToTransfer?.map((x) => CosmosCoin.fromProto(x, convertFunction)),
      cosmosCoinWrapperPathsToAdd: protoMsg.cosmosCoinWrapperPathsToAdd?.map((x) => CosmosCoinWrapperPathAddObject.fromProto(x, convertFunction))
    });
  }

  toBech32Addresses(prefix: string): MsgUpdateCollection<T> {
    return new MsgUpdateCollection<T>({
      ...this,
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId,
      collectionPermissions: this.collectionPermissions?.toBech32Addresses(prefix),
      managerTimeline: this.managerTimeline?.map((x) => x.toBech32Addresses(prefix)),
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
