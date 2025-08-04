import * as badges from '@/proto/badges/tx_pb.js';

import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
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
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';

import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import { CosmosCoin } from '@/core/coin.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { UserBalanceStore } from '@/core/userBalances.js';
import { CollectionId } from '@/interfaces/index.js';
import { normalizeMessagesIfNecessary } from '../../base.js';
import type { iMsgUniversalUpdateCollection } from './interfaces.js';
import { CosmosCoinWrapperPathAddObject } from '@/core/ibc-wrappers.js';
import { CollectionInvariants } from '@/core/misc.js';
/**
 * MsgUniversalUpdateCollection is a universal transaction that can be used to create / update any collection. It is only executable by the manager.
 * MsgCreateCollection and MsgUpdateCollection are special cases of this message.
 *
 * Upon initial creation, you can set the default approved outgoing transfers, default approved incoming transfers, default user permissions, and balances type.
 * However, after that, they are final and ignored in subsequent MsgUniversalUpdateCollection calls.
 *
 * For a new collection, specify collectionId == "0".
 *
 * Note that you must have the necessary privileges to update specific fields. If you do not have the necessary privileges, it will throw an error.
 * We update any CollectionPermissions at the end, so the permissions checked for the current execution are the permissions BEFORE the update.
 * In the case of the first MsgUniversalUpdateCollection, the previous permissions are by default all permitted.
 *
 * To specify you would like to update a field, the corresponding update field must be set to true. If it is set to false, we ignore it.
 *
 * @category Transactions
 */
export class MsgUniversalUpdateCollection<T extends NumberType>
  extends BaseNumberTypeClass<MsgUniversalUpdateCollection<T>>
  implements iMsgUniversalUpdateCollection<T>
{
  creator: BitBadgesAddress;
  collectionId: CollectionId;
  balancesType?: string;
  defaultBalances?: UserBalanceStore<T>;
  updateValidBadgeIds?: boolean;
  validBadgeIds?: UintRangeArray<T>;
  updateCollectionPermissions?: boolean;
  collectionPermissions?: CollectionPermissions<T>;
  updateManagerTimeline?: boolean;
  managerTimeline?: ManagerTimeline<T>[];
  updateCollectionMetadataTimeline?: boolean;
  collectionMetadataTimeline?: CollectionMetadataTimeline<T>[];
  updateBadgeMetadataTimeline?: boolean;
  badgeMetadataTimeline?: BadgeMetadataTimeline<T>[];
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
  invariants?: CollectionInvariants;

  constructor(msg: iMsgUniversalUpdateCollection<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.balancesType = msg.balancesType;
    this.defaultBalances = msg.defaultBalances ? new UserBalanceStore(msg.defaultBalances) : undefined;
    this.updateValidBadgeIds = msg.updateValidBadgeIds;
    this.validBadgeIds = msg.validBadgeIds ? UintRangeArray.From(msg.validBadgeIds) : undefined;
    this.updateCollectionPermissions = msg.updateCollectionPermissions;
    this.collectionPermissions = msg.collectionPermissions ? new CollectionPermissions(msg.collectionPermissions) : undefined;
    this.updateManagerTimeline = msg.updateManagerTimeline;
    this.managerTimeline = msg.managerTimeline?.map((x) => new ManagerTimeline(x));
    this.updateCollectionMetadataTimeline = msg.updateCollectionMetadataTimeline;
    this.collectionMetadataTimeline = msg.collectionMetadataTimeline?.map((x) => new CollectionMetadataTimeline(x));
    this.updateBadgeMetadataTimeline = msg.updateBadgeMetadataTimeline;
    this.badgeMetadataTimeline = msg.badgeMetadataTimeline?.map((x) => new BadgeMetadataTimeline(x));
    this.updateOffChainBalancesMetadataTimeline = msg.updateOffChainBalancesMetadataTimeline;
    this.offChainBalancesMetadataTimeline = msg.offChainBalancesMetadataTimeline?.map((x) => new OffChainBalancesMetadataTimeline(x));
    this.updateCustomDataTimeline = msg.updateCustomDataTimeline;
    this.customDataTimeline = msg.customDataTimeline?.map((x) => new CustomDataTimeline(x));
    this.updateCollectionApprovals = msg.updateCollectionApprovals;
    this.collectionApprovals = msg.collectionApprovals?.map((x) => new CollectionApproval(x));
    this.updateStandardsTimeline = msg.updateStandardsTimeline;
    this.standardsTimeline = msg.standardsTimeline?.map((x) => new StandardsTimeline(x));
    this.updateIsArchivedTimeline = msg.updateIsArchivedTimeline;
    this.isArchivedTimeline = msg.isArchivedTimeline?.map((x) => new IsArchivedTimeline(x));
    this.mintEscrowCoinsToTransfer = msg.mintEscrowCoinsToTransfer ? msg.mintEscrowCoinsToTransfer.map((x) => new CosmosCoin(x)) : undefined;
    this.cosmosCoinWrapperPathsToAdd = msg.cosmosCoinWrapperPathsToAdd
      ? msg.cosmosCoinWrapperPathsToAdd.map((x) => new CosmosCoinWrapperPathAddObject(x))
      : undefined;
    this.invariants = msg.invariants ? new CollectionInvariants(msg.invariants) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgUniversalUpdateCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgUniversalUpdateCollection<U>;
  }

  toProto(): badges.MsgUniversalUpdateCollection {
    return new badges.MsgUniversalUpdateCollection(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUniversalUpdateCollection<U> {
    return MsgUniversalUpdateCollection.fromProto(badges.MsgUniversalUpdateCollection.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUniversalUpdateCollection<U> {
    return MsgUniversalUpdateCollection.fromProto(badges.MsgUniversalUpdateCollection.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: badges.MsgUniversalUpdateCollection,
    convertFunction: (item: NumberType) => U
  ): MsgUniversalUpdateCollection<U> {
    return new MsgUniversalUpdateCollection({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      balancesType: protoMsg.balancesType,
      defaultBalances: protoMsg.defaultBalances ? UserBalanceStore.fromProto(protoMsg.defaultBalances, convertFunction) : undefined,
      validBadgeIds: protoMsg.validBadgeIds ? protoMsg.validBadgeIds.map((x) => UintRange.fromProto(x, convertFunction)) : undefined,
      updateValidBadgeIds: protoMsg.updateValidBadgeIds,
      updateCollectionPermissions: protoMsg.updateCollectionPermissions,
      collectionPermissions: protoMsg.collectionPermissions
        ? CollectionPermissions.fromProto(protoMsg.collectionPermissions, convertFunction)
        : undefined,
      updateManagerTimeline: protoMsg.updateManagerTimeline,
      managerTimeline: protoMsg.managerTimeline ? protoMsg.managerTimeline.map((x) => ManagerTimeline.fromProto(x, convertFunction)) : undefined,
      updateCollectionMetadataTimeline: protoMsg.updateCollectionMetadataTimeline,
      collectionMetadataTimeline: protoMsg.collectionMetadataTimeline
        ? protoMsg.collectionMetadataTimeline.map((x) => CollectionMetadataTimeline.fromProto(x, convertFunction))
        : undefined,
      updateBadgeMetadataTimeline: protoMsg.updateBadgeMetadataTimeline,
      badgeMetadataTimeline: protoMsg.badgeMetadataTimeline
        ? protoMsg.badgeMetadataTimeline.map((x) => BadgeMetadataTimeline.fromProto(x, convertFunction))
        : undefined,
      updateOffChainBalancesMetadataTimeline: protoMsg.updateOffChainBalancesMetadataTimeline,
      offChainBalancesMetadataTimeline: protoMsg.offChainBalancesMetadataTimeline
        ? protoMsg.offChainBalancesMetadataTimeline.map((x) => OffChainBalancesMetadataTimeline.fromProto(x, convertFunction))
        : undefined,
      updateCustomDataTimeline: protoMsg.updateCustomDataTimeline,
      customDataTimeline: protoMsg.customDataTimeline
        ? protoMsg.customDataTimeline.map((x) => CustomDataTimeline.fromProto(x, convertFunction))
        : undefined,
      updateCollectionApprovals: protoMsg.updateCollectionApprovals,
      collectionApprovals: protoMsg.collectionApprovals
        ? protoMsg.collectionApprovals.map((x) => CollectionApproval.fromProto(x, convertFunction))
        : undefined,
      updateStandardsTimeline: protoMsg.updateStandardsTimeline,
      standardsTimeline: protoMsg.standardsTimeline
        ? protoMsg.standardsTimeline.map((x) => StandardsTimeline.fromProto(x, convertFunction))
        : undefined,
      updateIsArchivedTimeline: protoMsg.updateIsArchivedTimeline,
      isArchivedTimeline: protoMsg.isArchivedTimeline
        ? protoMsg.isArchivedTimeline.map((x) => IsArchivedTimeline.fromProto(x, convertFunction))
        : undefined,
      mintEscrowCoinsToTransfer: protoMsg.mintEscrowCoinsToTransfer?.map((x) => CosmosCoin.fromProto(x, convertFunction)),
      cosmosCoinWrapperPathsToAdd: protoMsg.cosmosCoinWrapperPathsToAdd?.map((x) => CosmosCoinWrapperPathAddObject.fromProto(x, convertFunction)),
      invariants: protoMsg.invariants ? CollectionInvariants.fromProto(protoMsg.invariants) : undefined
    });
  }

  toBech32Addresses(prefix: string): MsgUniversalUpdateCollection<T> {
    return new MsgUniversalUpdateCollection<T>({
      ...this,
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      defaultBalances: this.defaultBalances?.toBech32Addresses(prefix),
      collectionPermissions: this.collectionPermissions?.toBech32Addresses(prefix),
      managerTimeline: this.managerTimeline?.map((x) => x.toBech32Addresses(prefix)),
      collectionApprovals: this.collectionApprovals?.map((x) => x.toBech32Addresses(prefix))
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"universalUpdateCollectionMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
