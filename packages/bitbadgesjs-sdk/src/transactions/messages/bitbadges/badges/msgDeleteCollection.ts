import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes, ConvertOptions } from '@/common/base.js';
import type { NumberType } from '@/common/string-numbers.js';
import { Stringify } from '@/common/string-numbers.js';
import * as badges from '@/proto/badges/tx_pb.js';
import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgDeleteCollection } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';

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
  collectionId: T;

  constructor(msg: iMsgDeleteCollection<T>) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U, options?: ConvertOptions): MsgDeleteCollection<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgDeleteCollection<U>;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  toProto(): badges.MsgDeleteCollection {
    return new badges.MsgDeleteCollection(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgDeleteCollection<U> {
    return MsgDeleteCollection.fromProto(badges.MsgDeleteCollection.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgDeleteCollection<U> {
    return MsgDeleteCollection.fromProto(badges.MsgDeleteCollection.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(protoMsg: badges.MsgDeleteCollection, convertFunction: (item: NumberType) => U): MsgDeleteCollection<U> {
    return new MsgDeleteCollection({
      creator: protoMsg.creator,
      collectionId: convertFunction(protoMsg.collectionId)
    });
  }
}
