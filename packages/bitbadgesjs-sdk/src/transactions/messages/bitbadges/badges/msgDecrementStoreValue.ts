import type { JsonReadOptions, JsonValue } from '@bufbuild/protobuf';
import * as badges from '@/proto/badges/tx_pb.js';

import { CustomTypeClass } from '@/common/base.js';
import type { iMsgDecrementStoreValue } from './interfaces.js';
import type { BitBadgesAddress } from '@/api-indexer/docs-types/interfaces.js';
import type { NumberType } from '@/common/string-numbers.js';
import { getConvertFunctionFromPrefix } from '@/address-converter/converter.js';
import { normalizeMessagesIfNecessary } from '../../base.js';

/**
 * MsgDecrementStoreValue is used to decrement a usage count for a specific address in a dynamic store.
 *
 * @category Transactions
 */
export class MsgDecrementStoreValue<T extends NumberType> extends CustomTypeClass<MsgDecrementStoreValue<T>> implements iMsgDecrementStoreValue<T> {
  creator: BitBadgesAddress;
  storeId: T;
  address: BitBadgesAddress;
  amount: T;

  constructor(msg: iMsgDecrementStoreValue<T>) {
    super();
    this.creator = msg.creator;
    this.storeId = msg.storeId;
    this.address = msg.address;
    this.amount = msg.amount;
  }

  toProto(): badges.MsgDecrementStoreValue {
    return new badges.MsgDecrementStoreValue({
      creator: this.creator,
      storeId: this.storeId.toString(),
      address: this.address,
      amount: this.amount.toString()
    });
  }

  static fromJson(jsonValue: JsonValue, options?: Partial<JsonReadOptions>): MsgDecrementStoreValue<NumberType> {
    return MsgDecrementStoreValue.fromProto(badges.MsgDecrementStoreValue.fromJson(jsonValue, options));
  }

  static fromJsonString(jsonString: string, options?: Partial<JsonReadOptions>): MsgDecrementStoreValue<NumberType> {
    return MsgDecrementStoreValue.fromProto(badges.MsgDecrementStoreValue.fromJsonString(jsonString, options));
  }

  static fromProto(protoMsg: badges.MsgDecrementStoreValue): MsgDecrementStoreValue<NumberType> {
    return new MsgDecrementStoreValue({
      creator: protoMsg.creator,
      storeId: protoMsg.storeId,
      address: protoMsg.address,
      amount: protoMsg.amount
    });
  }

  toBech32Addresses(prefix: string): MsgDecrementStoreValue<T> {
    return new MsgDecrementStoreValue({
      creator: getConvertFunctionFromPrefix(prefix)(this.creator),
      storeId: this.storeId,
      address: getConvertFunctionFromPrefix(prefix)(this.address),
      amount: this.amount
    });
  }

  toCosmWasmPayloadString(): string {
    return `{"decrementStoreValueMsg":${normalizeMessagesIfNecessary([
      {
        message: this.toProto(),
        path: this.toProto().getType().typeName
      }
    ])[0].message.toJsonString({ emitDefaultValues: true })} }`;
  }
}
