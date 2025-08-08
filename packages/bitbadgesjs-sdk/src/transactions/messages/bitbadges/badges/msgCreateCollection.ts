import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import { CollectionApproval } from '@/core/approvals.js';
import {
  BadgeMetadataTimeline,
  CollectionMetadataTimeline,
  CustomDataTimeline,
  IsArchivedTimeline,
  ManagerTimeline,
  OffChainBalancesMetadataTimeline,
  StandardsTimeline
} from '@/core/misc.js';
import { CollectionPermissions } from '@/core/permissions.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { UserBalanceStore } from '@/core/userBalances.js';
import * as protobadges from '@/proto/badges/tx_pb.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgCreateCollection } from './interfaces.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import { CosmosCoin } from '@/core/coin.js';
import { CosmosCoinWrapperPathAddObject } from '@/core/ibc-wrappers.js';
import { CollectionInvariants } from '@/core/misc.js';

/**
 * MsgCreateCollection is a transaction that can be used to create a collection.
 *
 * Upon initial creation, you can set the default approved outgoing transfers, default approved incoming transfers, default user permissions, and balances type.
 * However, after that, they are final and ignored in subsequent MsgCreateCollection calls.
 *
 * @category Transactions
 */
export class MsgCreateCollection<T extends NumberType> extends BaseNumberTypeClass<MsgCreateCollection<T>> implements iMsgCreateCollection<T> {
  creator: BitBadgesAddress;
  balancesType?: string;
  defaultBalances?: UserBalanceStore<T>;
  validBadgeIds?: UintRangeArray<T>;
  collectionPermissions?: CollectionPermissions<T>;
  managerTimeline?: ManagerTimeline<T>[];
  collectionMetadataTimeline?: CollectionMetadataTimeline<T>[];
  badgeMetadataTimeline?: BadgeMetadataTimeline<T>[];
  offChainBalancesMetadataTimeline?: OffChainBalancesMetadataTimeline<T>[];
  customDataTimeline?: CustomDataTimeline<T>[];
  collectionApprovals?: CollectionApproval<T>[];
  standardsTimeline?: StandardsTimeline<T>[];
  isArchivedTimeline?: IsArchivedTimeline<T>[];
  mintEscrowCoinsToTransfer?: CosmosCoin<T>[];
  cosmosCoinWrapperPathsToAdd?: CosmosCoinWrapperPathAddObject<T>[];
  invariants?: CollectionInvariants;

  constructor(msg: iMsgCreateCollection<T>) {
    super();
    this.creator = msg.creator;
    this.balancesType = msg.balancesType;
    this.defaultBalances = msg.defaultBalances ? new UserBalanceStore(msg.defaultBalances) : undefined;
    this.validBadgeIds = msg.validBadgeIds ? UintRangeArray.From(msg.validBadgeIds) : undefined;
    this.collectionPermissions = msg.collectionPermissions ? new CollectionPermissions(msg.collectionPermissions) : undefined;
    this.managerTimeline = msg.managerTimeline?.map((x) => new ManagerTimeline(x));
    this.collectionMetadataTimeline = msg.collectionMetadataTimeline?.map((x) => new CollectionMetadataTimeline(x));
    this.badgeMetadataTimeline = msg.badgeMetadataTimeline?.map((x) => new BadgeMetadataTimeline(x));
    this.offChainBalancesMetadataTimeline = msg.offChainBalancesMetadataTimeline?.map((x) => new OffChainBalancesMetadataTimeline(x));
    this.customDataTimeline = msg.customDataTimeline?.map((x) => new CustomDataTimeline(x));
    this.collectionApprovals = msg.collectionApprovals?.map((x) => new CollectionApproval(x));
    this.standardsTimeline = msg.standardsTimeline?.map((x) => new StandardsTimeline(x));
    this.isArchivedTimeline = msg.isArchivedTimeline?.map((x) => new IsArchivedTimeline(x));
    this.mintEscrowCoinsToTransfer = msg.mintEscrowCoinsToTransfer ? msg.mintEscrowCoinsToTransfer.map((x) => new CosmosCoin(x)) : undefined;
    this.cosmosCoinWrapperPathsToAdd = msg.cosmosCoinWrapperPathsToAdd?.map((x) => new CosmosCoinWrapperPathAddObject(x));
    this.invariants = msg.invariants ? new CollectionInvariants(msg.invariants) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgCreateCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateCollection<U>;
  }

  toProto(): protobadges.MsgCreateCollection {
    return new protobadges.MsgCreateCollection(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateCollection<U> {
    return MsgCreateCollection.fromProto(protobadges.MsgCreateCollection.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateCollection<U> {
    return MsgCreateCollection.fromProto(protobadges.MsgCreateCollection.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protobadges.MsgCreateCollection,
    convertFunction: (item: NumberType) => U
  ): MsgCreateCollection<U> {
    return new MsgCreateCollection({
      creator: protoMsg.creator,
      balancesType: protoMsg.balancesType,
      defaultBalances: protoMsg.defaultBalances ? UserBalanceStore.fromProto(protoMsg.defaultBalances, convertFunction) : undefined,
      validBadgeIds: protoMsg.validBadgeIds?.map((x) => UintRange.fromProto(x, convertFunction)),
      collectionPermissions: protoMsg.collectionPermissions
        ? CollectionPermissions.fromProto(protoMsg.collectionPermissions, convertFunction)
        : undefined,
      managerTimeline: protoMsg.managerTimeline?.map((x) => ManagerTimeline.fromProto(x, convertFunction)),
      collectionMetadataTimeline: protoMsg.collectionMetadataTimeline?.map((x) => CollectionMetadataTimeline.fromProto(x, convertFunction)),
      badgeMetadataTimeline: protoMsg.badgeMetadataTimeline?.map((x) => BadgeMetadataTimeline.fromProto(x, convertFunction)),
      offChainBalancesMetadataTimeline: protoMsg.offChainBalancesMetadataTimeline?.map((x) =>
        OffChainBalancesMetadataTimeline.fromProto(x, convertFunction)
      ),
      customDataTimeline: protoMsg.customDataTimeline?.map((x) => CustomDataTimeline.fromProto(x, convertFunction)),
      collectionApprovals: protoMsg.collectionApprovals?.map((x) => CollectionApproval.fromProto(x, convertFunction)),
      standardsTimeline: protoMsg.standardsTimeline?.map((x) => StandardsTimeline.fromProto(x, convertFunction)),
      isArchivedTimeline: protoMsg.isArchivedTimeline?.map((x) => IsArchivedTimeline.fromProto(x, convertFunction)),
      mintEscrowCoinsToTransfer: protoMsg.mintEscrowCoinsToTransfer?.map((x) => CosmosCoin.fromProto(x, convertFunction)),
      cosmosCoinWrapperPathsToAdd: protoMsg.cosmosCoinWrapperPathsToAdd?.map((x) => CosmosCoinWrapperPathAddObject.fromProto(x, convertFunction)),
      invariants: protoMsg.invariants ? CollectionInvariants.fromProto(protoMsg.invariants) : undefined
    });
  }

  toBech32Addresses(prefix: string): MsgCreateCollection<T> {
    return new MsgCreateCollection<T>({
      ...this,
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      defaultBalances: this.defaultBalances?.toBech32Addresses(prefix),
      collectionPermissions: this.collectionPermissions?.toBech32Addresses(prefix),
      managerTimeline: this.managerTimeline?.map((x) => x.toBech32Addresses(prefix)),
      collectionApprovals: this.collectionApprovals?.map((x) => x.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"createCollectionMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
