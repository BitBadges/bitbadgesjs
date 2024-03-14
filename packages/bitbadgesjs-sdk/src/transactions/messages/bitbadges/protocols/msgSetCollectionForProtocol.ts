import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import type { iMsgSetCollectionForProtocol } from './interfaces';
import * as protocols from '@/proto/protocols/tx_pb';
import { BaseNumberTypeClass, convertClassPropertiesAndMaintainNumberTypes } from '@/common/base';
import type { NumberType } from '@/common/string-numbers';
import { Stringify } from '@/common/string-numbers';

/**
 * For a user, sets the default collection for a protocol. For example, set collection 14 as my follow protocol collection.
 *
 * @category Transactions
 */
export class MsgSetCollectionForProtocol<T extends NumberType> extends BaseNumberTypeClass<MsgSetCollectionForProtocol<T>> {
  creator: string;
  name: string;
  collectionId: T;

  constructor(msg: iMsgSetCollectionForProtocol<T>) {
    super();
    this.creator = msg.creator;
    this.name = msg.name;
    this.collectionId = msg.collectionId;
  }

  getNumberFieldNames(): string[] {
    return ['collectionId'];
  }

  convert<U extends NumberType>(convertFunction: (item: NumberType) => U): MsgSetCollectionForProtocol<U> {
    return convertClassPropertiesAndMaintainNumberTypes(this, convertFunction) as MsgSetCollectionForProtocol<U>;
  }

  toProto(): protocols.MsgSetCollectionForProtocol {
    return new protocols.MsgSetCollectionForProtocol(this.convert(Stringify));
  }

  static fromJson<U extends NumberType>(
    jsonValue: JsonValue,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSetCollectionForProtocol<U> {
    return MsgSetCollectionForProtocol.fromProto(protocols.MsgSetCollectionForProtocol.fromJson(jsonValue, options), convertFunction);
  }

  static fromJsonString<U extends NumberType>(
    jsonString: string,
    convertFunction: (item: NumberType) => U,
    options?: Partial<JsonReadOptions>
  ): MsgSetCollectionForProtocol<U> {
    return MsgSetCollectionForProtocol.fromProto(protocols.MsgSetCollectionForProtocol.fromJsonString(jsonString, options), convertFunction);
  }

  static fromProto<U extends NumberType>(
    protoMsg: protocols.MsgSetCollectionForProtocol,
    convertFunction: (item: NumberType) => U
  ): MsgSetCollectionForProtocol<U> {
    return new MsgSetCollectionForProtocol<U>({
      creator: protoMsg.creator,
      name: protoMsg.name,
      collectionId: convertFunction(protoMsg.collectionId)
    });
  }
}
