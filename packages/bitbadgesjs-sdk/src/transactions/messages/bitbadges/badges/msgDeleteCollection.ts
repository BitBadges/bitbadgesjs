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
export class MsgDeleteCollection extends BaseNumberTypeClass<MsgDeleteCollection> implements iMsgDeleteCollection {
  creator: BitBadgesAddress;
  collectionId: CollectionId;

  constructor(msg: iMsgDeleteCollection) {
    super();
    this.creator = msg.creator;
    this.collectionId = msg.collectionId;
  }

  convert(convertFunction: (item: string | number) => U, options?: ConvertOptions): MsgDeleteCollection {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction, options) as MsgDeleteCollection;
  }

  getNumberFieldNames(): string[] {
    return [];
  }

  toProto(): protobadges.MsgDeleteCollection {
    return new protobadges.MsgDeleteCollection(this.convert(Stringify));
  }

  static fromJson(jsonValue: JsonValue, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgDeleteCollection {
    return MsgDeleteCollection.fromProto(protobadges.MsgDeleteCollection.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, convertFunction: (item: string | number) => U, options?: Partial<JsonReadOptions>): MsgDeleteCollection {
    return MsgDeleteCollection.fromProto(protobadges.MsgDeleteCollection.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: protobadges.MsgDeleteCollection): MsgDeleteCollection {
    return new MsgDeleteCollection({
      creator: protoMsg.creator,
      collectionId: protoMsg.collectionId
    });
  }

  toBech32Addresses(prefix: string): MsgDeleteCollection {
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
