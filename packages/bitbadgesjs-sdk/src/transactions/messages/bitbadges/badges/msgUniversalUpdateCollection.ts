import * as badges from '@/proto/badges/tx_pb';

import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import { CollectionApproval } from '@/core/approvals';
import {
  BadgeMetadataTimeline,
  CollectionMetadataTimeline,
  CustomDataTimeline,
  IsArchivedTimeline,
  ManagerTimeline,
  OffChainBalancesMetadataTimeline,
  StandardsTimeline
} from '@/core/misc';
import { CollectionPermissions } from '@/core/permissions';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';

import type { iMsgUniversalUpdateCollection } from './interfaces';
import type { NumberType } from '@/common/string-numbers';
import { Stringify } from '@/common/string-numbers';
import { Balance, BalanceArray } from '@/core/balances';
import { UserBalanceStore } from '@/core/userBalances';
import { CosmosAddress } from '@/api-indexer';

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
  creator: CosmosAddress;
  collectionId: T;
  balancesType?: string;
  defaultBalances?: UserBalanceStore<T>;
  badgesToCreate?: BalanceArray<T>;
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

  constructor(msg: iMsgUniversalUpdateCollection<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.balancesType = msg.balancesType;
    this.defaultBalances = msg.defaultBalances ? new UserBalanceStore(msg.defaultBalances) : undefined;
    this.badgesToCreate = msg.badgesToCreate ? BalanceArray.From(msg.badgesToCreate) : undefined;
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
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): MsgUniversalUpdateCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MsgUniversalUpdateCollection<U>;
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
      collectionId: convertFunction(protoMsg.collectionId),
      balancesType: protoMsg.balancesType,
      defaultBalances: protoMsg.defaultBalances ? UserBalanceStore.fromProto(protoMsg.defaultBalances, convertFunction) : undefined,
      badgesToCreate: protoMsg.badgesToCreate ? protoMsg.badgesToCreate.map((x) => Balance.fromProto(x, convertFunction)) : undefined,
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
        : undefined
    });
  }
}
