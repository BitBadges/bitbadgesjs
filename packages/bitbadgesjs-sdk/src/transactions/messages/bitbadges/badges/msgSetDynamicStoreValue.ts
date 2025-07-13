import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgSetDynamicStoreValue } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgSetDynamicStoreValue is used to set a 0/1 flag for a specific address in a dynamic store.
 *
 * @category Transactions
 */
export class MsgSetDynamicStoreValue<T extends NumberType>
  extends CustomTypeClass<MsgSetDynamicStoreValue<T>>
  implements iMsgSetDynamicStoreValue<T>
{
  creator: BitBadgesAddress;
  storeId: T;
  address: BitBadgesAddress;
  value: boolean;

  constructor(msg: iMsgSetDynamicStoreValue<T>) {
    super();
    this.creator = msg.creator;
    this.storeId = msg.storeId;
    this.address = msg.address;
    this.value = msg.value;
  }

  toProto(): badges.MsgSetDynamicStoreValue {
    return new badges.MsgSetDynamicStoreValue({
      creator: this.creator,
      storeId: this.storeId.toString(),
      address: this.address,
      value: this.value
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgSetDynamicStoreValue<NumberType> {
    return MsgSetDynamicStoreValue.fromProto(badges.MsgSetDynamicStoreValue.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgSetDynamicStoreValue<NumberType> {
    return MsgSetDynamicStoreValue.fromProto(badges.MsgSetDynamicStoreValue.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgSetDynamicStoreValue): MsgSetDynamicStoreValue<NumberType> {
    return new MsgSetDynamicStoreValue({
      creator: protoMsg.creator,
      storeId: protoMsg.storeId,
      address: protoMsg.address,
      value: protoMsg.value
    });
  }

  toBech32Addresses(prefix: string): MsgSetDynamicStoreValue<T> {
    return new MsgSetDynamicStoreValue({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      storeId: this.storeId,
      address: getConvertFunctionFromPrefix(prefix)(this.address),
      value: this.value
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"setDynamicStoreValueMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
