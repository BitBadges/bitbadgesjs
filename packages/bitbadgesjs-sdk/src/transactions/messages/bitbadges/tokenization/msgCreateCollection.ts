import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import { CollectionApproval } from '@/core/approvals.js';
import { CollectionMetadata, TokenMetadata } from '@/core/misc.js';
import { CollectionPermissions } from '@/core/permissions.js';
import { UintRange, UintRangeArray } from '@/core/uintRanges.js';
import { UserBalanceStore } from '@/core/userBalances.js';
import * as prototokenization from '@/proto/tokenization/tx_pb.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgCreateCollection } from './interfaces.js';
import { normalizeMessagesIfNecessary } from '../../utils.js';
import { CosmosCoin } from '@/core/coin.js';
import { AliasPathAddObject, CosmosCoinWrapperPathAddObject, InvariantsAddObject } from '@/core/ibc-wrappers.js';
import type { iCollectionMetadata } from '@/interfaces/types/core.js';

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
  defaultBalances?: UserBalanceStore<T>;
  validTokenIds?: UintRangeArray<T>;
  collectionPermissions?: CollectionPermissions<T>;
  manager?: BitBadgesAddress;
  collectionMetadata?: CollectionMetadata;
  tokenMetadata?: TokenMetadata<T>[];
  customData?: string;
  collectionApprovals?: CollectionApproval<T>[];
  standards?: string[];
  isArchived?: boolean;
  mintEscrowCoinsToTransfer?: CosmosCoin<T>[];
  cosmosCoinWrapperPathsToAdd?: CosmosCoinWrapperPathAddObject<T>[];
  aliasPathsToAdd?: AliasPathAddObject<T>[];
  invariants?: InvariantsAddObject<T>;

  constructor(msg: iMsgCreateCollection<T>) {
    super();
    this.creator = msg.creator;
    this.defaultBalances = msg.defaultBalances ? new UserBalanceStore(msg.defaultBalances) : undefined;
    this.validTokenIds = msg.validTokenIds ? UintRangeArray.From(msg.validTokenIds) : undefined;
    this.collectionPermissions = msg.collectionPermissions ? new CollectionPermissions(msg.collectionPermissions) : undefined;
    this.manager = msg.manager;
    this.collectionMetadata = msg.collectionMetadata ? new CollectionMetadata(msg.collectionMetadata) : undefined;
    this.tokenMetadata = msg.tokenMetadata?.map((x) => new TokenMetadata(x));
    this.customData = msg.customData;
    this.collectionApprovals = msg.collectionApprovals?.map((x) => new CollectionApproval(x));
    this.standards = msg.standards;
    this.isArchived = msg.isArchived;
    this.mintEscrowCoinsToTransfer = msg.mintEscrowCoinsToTransfer ? msg.mintEscrowCoinsToTransfer.map((x) => new CosmosCoin(x)) : undefined;
    this.cosmosCoinWrapperPathsToAdd = msg.cosmosCoinWrapperPathsToAdd?.map((x) => new CosmosCoinWrapperPathAddObject(x));
    this.aliasPathsToAdd = msg.aliasPathsToAdd?.map((x) => new AliasPathAddObject(x));
    this.invariants = msg.invariants ? new InvariantsAddObject(msg.invariants) : undefined;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgCreateCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgCreateCollection<U>;
  }

  toProto(): prototokenization.MsgCreateCollection {
    return new prototokenization.MsgCreateCollection(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateCollection<U> {
    return MsgCreateCollection.fromProto(prototokenization.MsgCreateCollection.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgCreateCollection<U> {
    return MsgCreateCollection.fromProto(prototokenization.MsgCreateCollection.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: prototokenization.MsgCreateCollection,
    convertFunction: (item: NumberType) => U
  ): MsgCreateCollection<U> {
    return new MsgCreateCollection({
      creator: protoMsg.creator,
      defaultBalances: protoMsg.defaultBalances ? UserBalanceStore.fromProto(protoMsg.defaultBalances, convertFunction) : undefined,
      validTokenIds: protoMsg.validTokenIds?.map((x) => UintRange.fromProto(x, convertFunction)),
      collectionPermissions: protoMsg.collectionPermissions
        ? CollectionPermissions.fromProto(protoMsg.collectionPermissions, convertFunction)
        : undefined,
      manager: protoMsg.manager || undefined,
      collectionMetadata: protoMsg.collectionMetadata ? CollectionMetadata.fromProto(protoMsg.collectionMetadata) : undefined,
      tokenMetadata: protoMsg.tokenMetadata.length > 0 ? protoMsg.tokenMetadata.map((tm) => TokenMetadata.fromProto(tm, convertFunction)) : undefined,
      customData: protoMsg.customData || undefined,
      collectionApprovals: protoMsg.collectionApprovals?.map((x) => CollectionApproval.fromProto(x, convertFunction)),
      standards: protoMsg.standards.length > 0 ? protoMsg.standards : undefined,
      isArchived: protoMsg.isArchived,
      mintEscrowCoinsToTransfer: protoMsg.mintEscrowCoinsToTransfer?.map((x) => CosmosCoin.fromProto(x, convertFunction)),
      cosmosCoinWrapperPathsToAdd: protoMsg.cosmosCoinWrapperPathsToAdd?.map((x) => CosmosCoinWrapperPathAddObject.fromProto(x, convertFunction)),
      aliasPathsToAdd: protoMsg.aliasPathsToAdd?.map((x) => AliasPathAddObject.fromProto(x, convertFunction)),
      invariants: protoMsg.invariants ? InvariantsAddObject.fromProto(protoMsg.invariants, convertFunction) : undefined
    });
  }

  toBech32Addresses(prefix: string): MsgCreateCollection<T> {
    return new MsgCreateCollection<T>({
      ...this,
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      defaultBalances: this.defaultBalances?.toBech32Addresses(prefix),
      collectionPermissions: this.collectionPermissions?.toBech32Addresses(prefix),
      manager: this.manager ? getConvertFunctionFromPrefix(prefix)(this.manager) : undefined,
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
