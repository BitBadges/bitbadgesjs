import * as prototokenization from '@/proto/tokenization/tx_pb.js';

import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import { CollectionApproval } from '@/core/approvals.js';
import { TokenMetadata, CollectionMetadata } from '@/core/misc.js';
import type { iCollectionMetadata } from '@/interfaces/types/core.js';
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
import { AliasPathAddObject, CosmosCoinWrapperPathAddObject, InvariantsAddObject } from '@/core/ibc-wrappers.js';
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
  defaultBalances?: UserBalanceStore<T>;
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

  constructor(msg: iMsgUniversalUpdateCollection<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
    this.defaultBalances = msg.defaultBalances ? new UserBalanceStore(msg.defaultBalances) : undefined;
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
    this.collectionApprovals = msg.collectionApprovals?.map((x) => new CollectionApproval(x));
    this.updateStandards = msg.updateStandards;
    this.standards = msg.standards;
    this.updateIsArchived = msg.updateIsArchived;
    this.isArchived = msg.isArchived;
    this.mintEscrowCoinsToTransfer = msg.mintEscrowCoinsToTransfer ? msg.mintEscrowCoinsToTransfer.map((x) => new CosmosCoin(x)) : undefined;
    this.cosmosCoinWrapperPathsToAdd = msg.cosmosCoinWrapperPathsToAdd
      ? msg.cosmosCoinWrapperPathsToAdd.map((x) => new CosmosCoinWrapperPathAddObject(x))
      : undefined;
    this.aliasPathsToAdd = msg.aliasPathsToAdd ? msg.aliasPathsToAdd.map((x) => new AliasPathAddObject(x)) : undefined;
    this.invariants = msg.invariants ? new InvariantsAddObject(msg.invariants) : undefined;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgUniversalUpdateCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgUniversalUpdateCollection<U>;
  }

  toProto(): prototokenization.MsgUniversalUpdateCollection {
    return new prototokenization.MsgUniversalUpdateCollection(this.convert(Stringify));
  }
  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUniversalUpdateCollection<U> {
    return MsgUniversalUpdateCollection.fromProto(prototokenization.MsgUniversalUpdateCollection.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgUniversalUpdateCollection<U> {
    return MsgUniversalUpdateCollection.fromProto(prototokenization.MsgUniversalUpdateCollection.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: prototokenization.MsgUniversalUpdateCollection,
    convertFunction: (item: NumberType) => U
  ): MsgUniversalUpdateCollection<U> {
    return new MsgUniversalUpdateCollection({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId,
      defaultBalances: protoMsg.defaultBalances ? UserBalanceStore.fromProto(protoMsg.defaultBalances, convertFunction) : undefined,
      validTokenIds: protoMsg.validTokenIds ? protoMsg.validTokenIds.map((x) => UintRange.fromProto(x, convertFunction)) : undefined,
      updateValidTokenIds: protoMsg.updateValidTokenIds,
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
      collectionApprovals: protoMsg.collectionApprovals
        ? protoMsg.collectionApprovals.map((x) => CollectionApproval.fromProto(x, convertFunction))
        : undefined,
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

  toBech32Addresses(prefix: string): MsgUniversalUpdateCollection<T> {
    return new MsgUniversalUpdateCollection<T>({
      ...this,
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      defaultBalances: this.defaultBalances?.toBech32Addresses(prefix),
      collectionPermissions: this.collectionPermissions?.toBech32Addresses(prefix),
      manager: this.manager ? getConvertFunctionFromPrefix(prefix)(this.manager) : undefined,
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
