import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import * as protobadges from '@/proto/badges/tx_pb.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgDeleteCollection } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { CollectionId } from '@/interfaces/index.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgDeleteCollection represents the message for deleting a collection. Once deleted, the collection cannot be recovered.
 * Note that the collection can be archived instead of deleted, which will prevent any transactions but not delete the collection from the storage.
 *
 * Only executable by the manager. Must have adequate permissions.
 *
 * @category Transactions
 */
export class MsgDeleteCollection<T extends NumberType> extends BaseNumberTypeClass<MsgDeleteCollection<T>> implements iMsgDeleteCollection<T> {
  creator: BitBadgesAddress;
  collectionId: CollectionId;

  constructor(msg: iMsgDeleteCollection<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgDeleteCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgDeleteCollection<U>;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  toProto(): protobadges.MsgDeleteCollection {
    return new protobadges.MsgDeleteCollection(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgDeleteCollection<U> {
    return MsgDeleteCollection.fromProto(protobadges.MsgDeleteCollection.fromJson(jsonValue, options));
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgDeleteCollection<U> {
    return MsgDeleteCollection.fromProto(protobadges.MsgDeleteCollection.fromJsonString(jsonString, options));
  }

  static fromProto<U extends NumberType>(protoMsg: protobadges.MsgDeleteCollection): MsgDeleteCollection<U> {
    return new MsgDeleteCollection({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId
    });
  }

  toBech32Addresses(prefix: string): MsgDeleteCollection<T> {
    return new MsgDeleteCollection({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      collectionId: this.collectionId
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"deleteCollectionMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
